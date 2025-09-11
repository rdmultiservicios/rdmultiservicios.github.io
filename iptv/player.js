let channels = [];
let epgData = {};

document.getElementById('playlistFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) loadPlaylistFromFile(file);
});

document.getElementById('epgFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) loadEPGFile(file);
});

document.getElementById('loadFromUrl').addEventListener('click', () => {
  const url = document.getElementById('urlInput').value;
  if (url) loadPlaylistFromUrl(url);
});

document.getElementById('searchInput').addEventListener('input', e => {
  const query = e.target.value.toLowerCase();
  const filtered = channels.filter(c => c.title.toLowerCase().includes(query));
  renderChannels(filtered);
});

function loadPlaylistFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => parseM3U(reader.result);
  reader.readAsText(file);
}

function loadPlaylistFromUrl(url) {
  fetch(url)
    .then(res => res.text())
    .then(data => parseM3U(data))
    .catch(err => alert('Error al cargar la URL: ' + err));
}

function parseM3U(content) {
  const lines = content.split('\n');
  channels = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const infoLine = lines[i];
      const url = lines[i + 1]?.trim();
      const title = infoLine.split(',')[1]?.trim() || 'Canal sin nombre';
      const logoMatch = infoLine.match(/tvg-logo="([^"]+)"/);
      const groupMatch = infoLine.match(/group-title="([^"]+)"/);
      const tvgIdMatch = infoLine.match(/tvg-id="([^"]+)"/);
      const logo = logoMatch ? logoMatch[1] : null;
      const group = groupMatch ? groupMatch[1] : null;
      const tvgId = tvgIdMatch ? tvgIdMatch[1] : null;

      if (url && url.startsWith('http')) {
        channels.push({ title, url, logo, group, tvgId });
      }
      i++;
    }
  }
  renderChannels(channels);
}

function renderChannels(list) {
  const container = document.getElementById('channelList');
  container.innerHTML = '';
  list.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'channel';

    const img = document.createElement('img');
    img.src = channel.logo || 'https://via.placeholder.com/40?text=TV';
    img.alt = 'logo';

    const title = document.createElement('span');
    title.textContent = channel.title;

    card.appendChild(img);
    card.appendChild(title);
    card.addEventListener('click', () => playChannel(channel));

    col.appendChild(card);
    container.appendChild(col);
  });
}


function playChannel(channel) {
  const video = document.getElementById('videoPlayer');
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }

  if (channel.tvgId && epgData[channel.tvgId]) {
    const now = new Date();
    const current = epgData[channel.tvgId].find(p =>
      now >= p.start && now <= p.stop
    );
    const epgDiv = document.getElementById('epgInfo');
    if (current) {
      epgDiv.innerHTML = `<strong>${current.title}</strong><br>${current.start.toLocaleTimeString()} - ${current.stop.toLocaleTimeString()}<br>${current.desc || ''}`;
    } else {
      epgDiv.textContent = 'Sin programación actual.';
    }
  } else {
    document.getElementById('epgInfo').textContent = '';
  }
}
