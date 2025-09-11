let player;
let channels = [];
let epgData = null; // Datos EPG cargados
let currentURL = '';

window.onload = async function () {
  player = videojs('video-player', {
    controls: true,
    autoplay: true,
    fluid: true
  });

  await loadChannels();
  await loadEPG();

  renderChannels();
  renderFavorites();

  if (channels.length > 0) {
    changeChannel(channels[0].url, channels[0].name);
  }

  document.getElementById('search').addEventListener('input', renderChannels);
};

// Carga archivo M3U
async function loadChannels() {
  try {
    const res = await fetch('channels.m3u');
    const text = await res.text();
    channels = parseM3U(text);
  } catch (error) {
    console.error('Error cargando el archivo M3U:', error);
  }
}

function parseM3U(data) {
  const lines = data.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF')) {
      const name = line.split(',')[1]?.trim() || 'Canal';
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : '';
      const url = lines[i + 1]?.trim();
      if (url && url.startsWith('http')) {
        result.push({ name, logo, url });
      }
    }
  }

  return result;
}

// Carga archivo JSON con datos EPG
async function loadEPG() {
  try {
    const res = await fetch('epg.json');
    epgData = await res.json();
  } catch (error) {
    console.error('Error cargando el archivo EPG:', error);
  }
}

// Cambia canal y actualiza EPG
function changeChannel(url, name) {
  currentURL = url;
  player.src({ src: url, type: 'application/x-mpegURL' });
  player.play().catch(console.error);

  document.getElementById('currentChannel').innerText = name;

  updateEPG(name);
}

// Actualiza la sección EPG según el canal y la hora actual
function updateEPG(channelName) {
  if (!epgData) {
    clearEPG();
    return;
  }

  // Buscar canal en EPG por nombre (case insensitive)
  const channel = epgData.channels.find(c => c.name.toLowerCase() === channelName.toLowerCase());
  if (!channel) {
    clearEPG();
    return;
  }

  const now = new Date();

  // Buscar programa actual (start <= now < stop)
  const currentProgram = epgData.programmes.find(p => {
    return (
      p.channel === channel.id &&
      new Date(p.start) <= now &&
      now < new Date(p.stop)
    );
  });

  if (currentProgram) {
    document.getElementById('epgTitle').innerText = currentProgram.title;
    document.getElementById('epgTime').innerText = `${formatTime(currentProgram.start)} - ${formatTime(currentProgram.stop)}`;
    document.getElementById('epgDesc').innerText = currentProgram.desc;
  } else {
    clearEPG();
  }
}

function clearEPG() {
  document.getElementById('epgTitle').innerText = 'Sin información de EPG';
  document.getElementById('epgTime').innerText = '';
  document.getElementById('epgDesc').innerText = '';
}

function formatTime(dateTime) {
  const date = new Date(dateTime);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

function getFavorites() {
  return JSON.parse(localStorage.getItem('iptv_favorites') || '[]');
}

function saveFavorites(favorites) {
  localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
}

function addFavorite(name, url, logo) {
  let favorites = getFavorites();
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
  container.innerHTML = '';

  const favorites = getFavorites();
  favorites.forEach(fav => {
    const favCard = document.createElement('div');
    favCard.className = 'favorite-card';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'favorite-info';
    infoDiv.onclick = () => changeChannel(fav.url, fav.name);

    const img = document.createElement('img');
    img.src = fav.logo || 'https://via.placeholder.com/50x30?text=No+Logo';
    img.alt = fav.name;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'favorite-name';
    nameDiv.textContent = fav.name;

    infoDiv.appendChild(img);
    infoDiv.appendChild(nameDiv);

    const delBtn = document.createElement('button');
    delBtn.className = 'favorite-delete-btn';
    delBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
    delBtn.title = 'Eliminar de favoritos';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      removeFavorite(fav.url);
    };

    favCard.appendChild(infoDiv);
    favCard.appendChild(delBtn);

    container.appendChild(favCard);
  });
}
