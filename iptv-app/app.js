document.addEventListener('DOMContentLoaded', () => {
    fetch('channels.m3u')
        .then(response => response.text())
        .then(data => {
            const channels = parseM3U(data);
            renderChannelList(channels);
            if (channels.length > 0) {
                playChannel(channels[0].url);
            }
        });
});

function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            const info = lines[i];
            const url = lines[i + 1];
            const nameMatch = info.match(/,(.*)$/);
            const logoMatch = info.match(/tvg-logo="(.*?)"/);
            channels.push({
                name: nameMatch ? nameMatch[1] : 'Canal',
                logo: logoMatch ? logoMatch[1] : '',
                url: url.trim()
            });
        }
    }
    return channels;
}

function renderChannelList(channels) {
    const list = document.getElementById('channel-list');
    channels.forEach(channel => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex align-items-center channel-item';
        item.innerHTML = `
            <img src="${channel.logo}" class="me-2" style="width: 40px; height: auto;">
            <span>${channel.name}</span>
        `;
        item.addEventListener('click', () => playChannel(channel.url));
        list.appendChild(item);
    });
}

function playChannel(url) {
    const player = videojs('video-player');
    player.src({ type: 'application/x-mpegURL', src: url });
    player.play();
}
