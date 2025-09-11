const videoPlayer = videojs('video-player', {
  fluid: true,
  autoplay: true,
  controls: true,
  preload: 'auto'
});

let channels = [];
let epgData = null;
let currentChannelId = null;

async function fetchChannels() {
  try {
    const response = await fetch('channels.m3u');
    if (!response.ok) throw new Error('Error cargando canales');
    const m3uText = await response.text();
    channels = parseM3U(m3uText);
    renderChannels();
  } catch (error) {
    alert('No se pudo cargar la lista de canales.');
    console.error(error);
  }
}

function parseM3U(data) {
  const lines = data.split('\n').map(line => line.trim());
  let result = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF:')) {
      const info = lines[i];
      const url = lines[i + 1];
      if (!url || url.startsWith('#')) continue;

      const nameMatch = info.match(/,(.*)$/);
      const logoMatch = info.match(/tvg-logo="([^"]+)"/);

      result.push({
        name: nameMatch ? nameMatch[1].trim() : 'Canal sin nombre',
        url: url.trim(),
        logo: logoMatch ? logoMatch[1] : null
      });
    }
  }
  return result;
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
      card.onclick = () => changeChannel(ch.url, ch.name);

      const img = document.createElement('img');
      img.src = ch.logo || 'https://via.placeholder.com/100x60?text=No+Logo';
      img.alt = ch.name;

      const name = document.createElement('div');
      name.className = 'channel-name';
      name.textContent = ch.name;

      const favBtn = document.createElement('div');
      favBtn.className = 'channel-fav-btn';
      favBtn.innerHTML = '<i class="bi bi-star-fill"></i>';
      favBtn.title = 'Agregar a favoritos';
      favBtn.onclick = (e) => {
        e.stopPropagation();
        addFavorite(ch.name, ch.url, ch.logo);
      };

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(favBtn);

      grid.appendChild(card);
    });

  container.appendChild(grid);
}

function changeChannel(url, name) {
  videoPlayer.src({ type: 'application/x-mpegURL', src: url });
  videoPlayer.play();
  currentChannelId = url;
  document.getElementById('currentChannel').textContent = name;
  updateEPG(name);
}

async function fetchEPG() {
  try {
    const response = await fetch('epg.json');
    if (!response.ok) throw new Error('Error cargando EPG');
    epgData = await response.json();
  } catch (error) {
    console.error('No se pudo cargar EPG:', error);
    epgData = null;
  }
}

function updateEPG(channelName) {
  if (!epgData) {
    clearEPG();
    return;
  }

  const ch = epgData.channels.find(c => c.name.toLowerCase() === channelName.toLowerCase());
  if (!ch) {
    clearEPG();
    return;
  }

  const now = new Date();
  const nowISO = now.toISOString();

  const program = epgData.programmes.find(p =>
    p.channel === ch.id &&
    p.start <= nowISO &&
    p.stop > nowISO
  );

  if (program) {
    document.getElementById('epgTitle').textContent = program.title || 'Sin título';
    document.getElementById('epgTime').textContent = `${formatTime(program.start)} - ${formatTime(program.stop)}`;
    document.getElementById('epgDesc').textContent = program.desc || 'Sin descripción.';
  } else {
    clearEPG();
  }
}

function clearEPG() {
  document.getElementById('epgTitle').textContent = 'No hay información EPG disponible.';
  document.getElementById('epgTime').textContent = '';
  document.getElementById('epgDesc').textContent = '';
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('iptvFavorites')) || [];
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  localStorage.setItem('iptvFavorites', JSON.stringify(favs));
}

function addFavorite(name, url, logo) {
  const favorites = getFavorites();
  if (!favorites.some(fav => fav.url === url)) {
    favorites.push({ name, url, logo });
    saveFavorites(favorites);
    renderFavorites();
  }
}

function removeFavorite(url) {
  let favorites = getFavorites();
  favorites = favorites.filter(fav => fav.url !== url);
  saveFavorites(favorites);
  renderFavorites();
}

function renderFavorites() {
  const container = document.getElementById('favoritesList');
  const favorites = getFavorites();
  container.innerHTML = '';

  favorites.forEach(fav => {
    const card = document.createElement('div');
    card.className = 'favorite-card';
    card.onclick = () => changeChannel(fav.url, fav.name);

    const info = document.createElement('div');
    info.className = 'favorite-info';

    const img = document.createElement('img');
    img.src = fav.logo || 'https://via.placeholder.com/50x30?text=No+Logo';
    img.alt = fav.name;

    const name = document.createElement('div');
    name.className = 'favorite-name';
    name.textContent = fav.name;

    info.appendChild(img);
    info.appendChild(name);

    const delBtn = document.createElement('button');
    delBtn.className = 'favorite-delete-btn';
    delBtn.title = 'Eliminar de favoritos';
    delBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      removeFavorite(fav.url);
    };

    card.appendChild(info);
    card.appendChild(delBtn);

    container.appendChild(card);
  });
}

document.getElementById('search').addEventListener('input', renderChannels);

// Inicio
(async () => {
  await fetchChannels();
  await fetchEPG();

  if (channels.length > 0) {
    changeChannel(channels[0].url, channels[0].name);
  }

  renderFavorites();

  setInterval(() => {
    if (currentChannelId) {
      const ch = channels.find(c => c.url === currentChannelId);
      if (ch) updateEPG(ch.name);
    }
  }, 60 * 1000);
})();
