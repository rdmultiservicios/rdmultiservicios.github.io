// Ruta a tu lista M3U (puede ser URL o archivo local en el mismo servidor)
const M3U_URL = "tu_lista.m3u";  // Cambia esto por tu archivo M3U

document.addEventListener("DOMContentLoaded", async () => {
  const response = await fetch(M3U_URL);
  const text = await response.text();
  const channels = parseM3U(text);
  renderChannelList(channels);
});

function parseM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let current = {};

  for (let line of lines) {
    line = line.trim();

    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      current = {
        name: nameMatch ? nameMatch[1] : 'Canal',
        logo: logoMatch ? logoMatch[1] : '',
      };
    } else if (line && !line.startsWith('#')) {
      current.url = line;
      channels.push({...current});
    }
  }

  return channels;
}

function renderChannelList(channels) {
  const list = document.getElementById('channelList');
  list.innerHTML = "";

  channels.forEach((channel, index) => {
    const div = document.createElement('div');
    div.className = "channel-button d-flex align-items-center";
    div.innerHTML = `
      ${channel.logo ? `<img src="${channel.logo}" class="channel-logo">` : ''}
      <span>${channel.name}</span>
    `;
    div.onclick = () => playChannel(channel.url);
    list.appendChild(div);
  });

  // Reproducir el primero por defecto
  if (channels.length > 0) playChannel(channels[0].url);
}

function playChannel(url) {
  const video = document.getElementById('videoPlayer');

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
  } else {
    alert("Este navegador no soporta HLS.");
  }
}
