let channels = [];
let epgData = {};

// Listeners para cargar listas y EPG
document.getElementById('playlistFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) loadPlaylistFromFile(file);
});

document.getElementById('epgFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) loadEPGFile(file);
});

document.getElementById('loadFromUrl').addEventListener('click', () => {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) return;

  if (url.endsWith('.m3u') || url.endsWith('.m3u8')) {
    loadPlaylistFromUrl(url);
  } else {
    const title = prompt("Nombre del video:", "Video VOD");
    const channel = {
      title: title || "Video VOD",
      url,
      logo: null,
      group: "VOD",
      tvgId: null
    };
    channels.push(channel);
    renderAll();
    playChannel(channel);
  }
});

document.getElementById('searchInput').addEventListener('input', e => {
  renderAll(e.target.value.toLowerCase());
});

// Cargar playlist desde archivo
function loadPlaylistFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => parseM3U(reader.result);
  reader.readAsText(file);
}

// Cargar playlist desde URL
function loadPlaylistFromUrl(url) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(parseM3U)
    .catch(err => alert('Error al cargar URL: ' + err));
}

// Parsear contenido M3U y llenar arreglo channels
function parseM3U(content) {
  const lines = content.split('\n');
  channels = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const info = lines[i];
      const url = lines[i + 1]?.trim();
      const title = info.split(',')[1]?.trim() || 'Canal sin nombre';
      const logo = info.match(/tvg-logo="([^"]+)"/)?.[1] || null;
      const group = info.match(/group-title="([^"]+)"/)?.[1] || null;
      const tvgId = info.match(/tvg-id="([^"]+)"/)?.[1] || null;

      if (url?.startsWith('http')) {
        channels.push({ title, url, logo, group, tvgId });
      }
      i++;
    }
  }
  renderAll();
}

// Renderizar canales en vivo con botón favorito
function renderChannels(list) {
  const container = document.getElementById('channelList');
  container.innerHTML = '';
  list.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'channel d-flex justify-content-between align-items-center';

    const info = document.createElement('div');
    info.className = 'd-flex align-items-center gap-2';

    const img = document.createElement('img');
    img.src = channel.logo || 'https://via.placeholder.com/40?text=TV';
    img.alt = 'logo';

    const title = document.createElement('span');
    title.textContent = channel.title;

    info.appendChild(img);
    info.appendChild(title);

    const star = document.createElement('span');
    star.innerHTML = isFavorite(channel) ? '⭐' : '☆';
    star.style.cursor = 'pointer';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(channel);
      renderAll();
    });

    card.appendChild(info);
    card.appendChild(star);
    card.addEventListener('click', () => playChannel(channel));

    col.appendChild(card);
    container.appendChild(col);
  });
}

// Función principal que renderiza todo: canales, VOD y favoritos
function renderAll(search = '') {
  const live = channels.filter(c => !c.group?.toLowerCase().includes('vod') && c.title.toLowerCase().includes(search));
  const vod = channels.filter(c => c.group?.toLowerCase().includes('vod') && c.title.toLowerCase().includes(search));
  renderChannels(live);
  renderVOD(vod);
  renderFavorites();
}

// Reproduce el canal o VOD seleccionado
function playChannel(channel) {
  const video = document.getElementById('videoPlayer');

  // Detener stream anterior
  if (video.hls) {
    video.hls.destroy();
    video.hls = null;
  }

  const isHls = channel.url.endsWith('.m3u8');
  const isMp4 = channel.url.endsWith('.mp4');

  if (isHls && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
    video.hls = hls;
  } else {
    video.src = channel.url;
  }

  video.play();

  // Mostrar info EPG si está disponible
  if (channel.tvgId && epgData[channel.tvgId]) {
    const now = new Date();
    const current = epgData[channel.tvgId].find(p => now >= p.start && now <= p.stop);
    const epgDiv = document.getElementById('epgInfo');
    if (current) {
      epgDiv.innerHTML = `
        <strong>${current.title}</strong><br>
        ${current.start.toLocaleTimeString()} - ${current.stop.toLocaleTimeString()}<br>
        ${current.desc || ''}
      `;
    } else {
      epgDiv.textContent = 'Sin programación actual.';
    }
  } else {
    document.getElementById('epgInfo').textContent = '';
  }

  // Guardar y recuperar progreso si es VOD
  if (channel.group?.toLowerCase().includes('vod')) {
    video.addEventListener('timeupdate', () => {
      localStorage.setItem('vod-progress-' + channel.url, video.currentTime);
    });

    const lastTime = localStorage.getItem('vod-progress-' + channel.url);
    if (lastTime) {
      video.currentTime = parseFloat(lastTime);
    }
  }
}
