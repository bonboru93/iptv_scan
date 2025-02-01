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

const main = async (prefixUrl, idStart, idEnd) => {
    const resultDir = path.join(import.meta.dirname, 'result')
    const dataDir = path.join(resultDir, 'data')

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

export default main
