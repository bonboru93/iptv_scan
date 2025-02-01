const loadVideo = (videoNode, videoSrc) => {
    if (Hls.isSupported()) {
        const hls = new Hls({ startPosition: 1 })
        hls.loadSource(videoSrc)
        hls.attachMedia(videoNode)
    }
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        videoNode.src = videoSrc
    }
}

for (const v of document.querySelectorAll('video')) {
    loadVideo(v, v.dataset.src)
}

const generate = () => {
    const items = {}
    for (const r of document.querySelectorAll('tbody tr')) {
        const url = r.querySelector('a').href
        const name = r.querySelector('input').value
        if (!name || items[name]) { continue }
        items[name] = url
    }

    const content = Object.keys(items).sort().map(k => `${k},${items[k]}`).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'iptv.txt'
    a.click()
}