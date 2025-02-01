const loadVideo = videoNode => {
    const videoSrc = videoNode.dataset.src

    if (Hls.isSupported()) {
        const hls = new Hls({ fragLoadingMaxRetry: 0, startPosition: 1 })
        hls.loadSource(videoSrc)
        hls.attachMedia(videoNode)
    }
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        videoNode.src = videoSrc
    }
}

const intersectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    const node = entry.target
    if (!entry.isIntersecting || node.src) { return }
    loadVideo(node)
    intersectionObserver.unobserve(node)
}))
document.querySelectorAll('video').forEach(v => intersectionObserver.observe(v))

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