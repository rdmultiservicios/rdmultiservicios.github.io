// js/app.js

let player;
let channels = [];
let currentURL = '';
let lastURL = '';

window.onload = async function() {
  player = videojs('video-player', {
    controls: true,
    autoplay: true,
    fluid: true,       // fluido, que se ajuste al contenedor
    controlBar: {
      volumePanel: { inline: false }
    }
  });
  player.addClass('vjs-custom-skin');

  await loadChannels();
  renderChannels();
  renderFavorites();
  if (channels.length > 0) {
    changeChannel(channels[0].url, channels[0].name);
  }

  document.getElementById('search').addEventListener('input', renderChannels);
};

async function loadChannels() {
  try {
    const res = await fetch('channels.m3u');
    const text = await res.text();
    channels = parseM3U(text);
  } catch (err) {
    console.error("Error cargando M3U:", err);
  }
}

function parseM3U(data) {
  const lines = data.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const name = nameMatch ? nameMatch[1].trim() : 'Canal sin nombre';
      const logo = logoMatch ? logoMatch[1] : '';
      const url = (lines[i + 1] || '').trim();
      if (url && url.startsWith('http')) {
        out.push({ name, url, logo });
      }
    }
  }
  return out;
}

function changeChannel(url, name) {
  if (currentURL) lastURL = currentURL;
  currentURL = url;
  // Cambiar fuente en videojs
  player.src({ src: url, type: 'application/x-mpegURL' });
  player.play().catch(e => console.error(e));
  document.getElementById('currentChannel').innerText = name;
}

function goBack() {
  if (lastURL) changeChannel(lastURL, 'Anterior');
}

function reloadChannel() {
  if (currentURL) changeChannel(currentURL, document.getElementById('currentChannel').innerText);
}

function togglePip() {
  let vid = player.tech().el();  // obtener el elemento video real
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(e => console.error(e));
  } else {
    vid.requestPictureInPicture().catch(e => console.error(e));
  }
}

function toggleFullscreen() {
  if (!player.isFullscreen()) {
    player.requestFullscreen();
  } else {
    player.exitFullscreen();
  }
}

function renderChannels() {
  const container = document.getElementById('channelList');
  const search = document.getElementById('search').value.toLowerCase();
  container.innerHTML = '';
  channels
    .filter(ch => ch.name.toLowerCase().includes(search))
    .forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-light channel-item d-flex align-items-center gap-2';
      btn.innerHTML = `
        <img src="${ch.logo || 'https://via.placeholder.com/30'}" width="30" height="30">
        <span class="flex-grow-1">${ch.name}</span>
        <span onclick="event.stopPropagation(); addFavorite('${ch.name}', '${ch.url}', '${ch.logo}')"><i class="bi bi-star"></i></span>
      `;
      btn.onclick = () => changeChannel(ch.url, ch.name);
      container.appendChild(btn);
    });
}

function addFavorite(name, url, logo) {
  let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (!favs.find(f => f.name === name)) {
    favs.push({ name, url, logo });
    localStorage.setItem('favorites', JSON.stringify(favs));
    renderFavorites();
  }
}

function renderFavorites() {
  let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  const container = document.getElementById('favoritesList');
  container.innerHTML = '';
  favs.forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-warning channel-item d-flex align-items-center gap-2';
    btn.innerHTML = `
      <img src="${ch.logo || 'https://via.placeholder.com/30'}" width="30" height="30">
      <span class="flex-grow-1">${ch.name}</span>
    `;
    btn.onclick = () => changeChannel(ch.url, ch.name);
    container.appendChild(btn);
  });
}
