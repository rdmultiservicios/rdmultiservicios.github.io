let player;
let channels = [];
let currentURL = '';
let lastURL = '';

window.onload = async function() {
  player = videojs('video-player', {
    controls: true,
    autoplay: true,
    fluid: true,
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
  let vid = player.tech().el();
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
  const grid = document.createElement('div');
  grid.className = 'channel-grid';

  channels
    .filter(ch => ch.name.toLowerCase().includes(search))
    .forEach(ch => {
      const card = document.createElement('div');
      card.className = 'channel-card';
      card.title = ch.name;
      card.onclick = () => changeChannel(ch.url, ch.name);

      const logo = document.createElement('img');
      logo.src = ch.logo || 'https://via.placeholder.com/80x45?text=No+Logo';
      logo.alt = ch.name;

      const name = document.createElement('div');
      name.className = 'channel-name';
      name.textContent = ch.name;

      const favBtn = document.createElement('div');
      favBtn.className = 'channel-fav-btn';
      favBtn.innerHTML = '<i class="bi bi-star"></i>';
      favBtn.title = 'Agregar a favoritos';
      favBtn.onclick = (e) => {
        e.stopPropagation();
        addFavorite(ch.name, ch.url, ch.logo);
      };

      card.appendChild(logo);
      card.appendChild(name);
      card.appendChild(favBtn);

      grid.appendChild(card);
    });

  container.appendChild(grid);
}

function renderFavorites() {
  let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  const container = document.getElementById('favoritesList');
  container.innerHTML = '';

  if (favs.length === 0) {
    container.innerHTML = '<p>No hay favoritos.</p>';
    return;
  }

  favs.forEach((ch, i) => {
    const card = document.createElement('div');
    card.className = 'favorite-card';

    const info = document.createElement('div');
    info.className = 'favorite-info';
    info.onclick = () => changeChannel(ch.url, ch.name);

    const logo = document.createElement('img');
    logo.src = ch.logo || 'https://via.placeholder.com/80x45?text=No+Logo';
    logo.alt = ch.name;

    const name = document.createElement('div');
    name.className = 'favorite-name';
    name.textContent = ch.name;

    info.appendChild(logo);
    info.appendChild(name);

    const delBtn = document.createElement('button');
    delBtn.className = 'favorite-delete-btn';
    delBtn.title = 'Eliminar favorito';
    delBtn.innerHTML = '<i class="bi bi-trash"></i>';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      removeFavorite(i);
    };

    card.appendChild(info);
    card.appendChild(delBtn);

    container.appendChild(card);
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

function removeFavorite(index) {
  let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  favs.splice(index, 1);
  localStorage.setItem('favorites', JSON.stringify(favs));
  renderFavorites();
}
