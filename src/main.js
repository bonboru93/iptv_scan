#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { pipeline } from "stream/promises"
import Handlebars from "handlebars"
import ky from "ky"
import m3u8Parser from "m3u8-parser"
import http from "http"
import handler from "serve-handler"
import open from "open"
import { rimraf } from "rimraf"
import minimist from "minimist"
import assert from "assert"

const resultDir = path.join(import.meta.dirname, 'result')
const dataDir = path.join(resultDir, 'data')


const main = async (prefixUrl, idStart, idEnd) => {
    await rimraf(dataDir)

    const api = ky.create({ prefixUrl })

    const items = []

    for (let i = idStart; i <= idEnd; i++) {
        try {
            const m3u8 = await api.get(`${i}/index.m3u8`).text()

            const currentDataDir = path.join(dataDir, String(i))
            fs.mkdirSync(currentDataDir, { recursive: true })

            fs.writeFileSync(path.join(currentDataDir, 'index.m3u8'), m3u8)

            const parser = new m3u8Parser.Parser()
            parser.push(m3u8)
            parser.end()

            const videoUri = parser.manifest.segments[0].uri.replace(/\?.+/, '')
            const videoResponse = await api.get(`${i}/${videoUri}`)
            await pipeline(videoResponse.body, fs.createWriteStream(path.join(currentDataDir, videoUri)))

            const rate = Math.ceil(videoResponse.headers.get('content-length') / 1024 / 1024)

            items.push({ id: i, rate })

            console.log(i, rate)
        }
        catch {
            console.log(i, 'error')
        }
    }

    items.sort((a, b) => b.rate - a.rate)

    let template = fs.readFileSync(path.join(import.meta.dirname, 'template.hbs'), { encoding: 'utf-8' })
    template = Handlebars.compile(template)
    const page = template({ prefixUrl, items })
    fs.writeFileSync(path.join(resultDir, 'index.html'), page)

    http.createServer((request, response) => handler(request, response, { public: resultDir }))
        .listen(12345, () => open('http://localhost:12345'))
}


// === cmd ===
const { p, s, e } = minimist(process.argv.slice(2))
try {
    new URL(p)
    assert.equal(typeof s, 'number')
    assert.equal(typeof e, 'number')

    main(p, s, e)
}
catch {
    console.log('用法：-p <地址前缀> -s <开始ID> -e <结束ID>')
    console.log('示例: -p http://ott.chinamobile.com/PLTV/88888888 -s 3221235000 -e 3221235999')
}

process.on('SIGINT', async () => {
    console.log('\ncleanup...')
    await rimraf(dataDir)
    process.exit(0)
})
