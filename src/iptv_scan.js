import fs from "fs"
import { pipeline } from "stream/promises"
import Handlebars from "handlebars"
import ky from "ky"
import m3u8Parser from "m3u8-parser"
import http from "http"
import handler from "serve-handler"
import open from "open"
import { rimraf } from "rimraf"

const main = async (prefixUrl, idStart, idEnd) => {
    const resultDir = new URL('result/', import.meta.url)
    const dataDir = new URL('data/', resultDir)

    await rimraf(dataDir.pathname)

    const api = ky.create({ prefixUrl })

    const items = []

    for (let i = idStart; i <= idEnd; i++) {
        try {
            const m3u8 = await api.get(`${i}/index.m3u8`).text()

            const currentDataDir = new URL(`${i}/`, dataDir)
            fs.mkdirSync(currentDataDir, { recursive: true })

            fs.writeFileSync(new URL('index.m3u8', currentDataDir), m3u8)

            const parser = new m3u8Parser.Parser()
            parser.push(m3u8)
            parser.end()

            const videoUri = parser.manifest.segments[0].uri.replace(/\?.+/, '')
            const videoResponse = await api.get(`${i}/${videoUri}`)
            await pipeline(videoResponse.body, fs.createWriteStream(new URL(videoUri, currentDataDir)))

            const rate = Math.ceil(videoResponse.headers.get('content-length') / 1024 / 1024)

            items.push({ id: i, rate })

            console.log(i, rate)
        }
        catch {
            console.log(i, 'error')

        }
    }

    items.sort((a, b) => b.rate - a.rate)

    let template = fs.readFileSync(new URL('template.hbs', import.meta.url), { encoding: 'utf-8' })
    template = Handlebars.compile(template)
    const page = template({ prefixUrl, items })
    fs.writeFileSync(new URL('index.html', resultDir), page)

    http.createServer((request, response) => handler(request, response, { public: resultDir.pathname }))
        .listen(12345, () => open('http://localhost:12345'))
}

export default main
