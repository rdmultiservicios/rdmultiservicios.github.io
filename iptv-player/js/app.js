let player;
let channels = [];
let currentURL = '';

// Ejemplo de datos EPG asociados a URLs de canales (ajusta según tus URLs reales)
const epgData = {
  'http://example.com/channel1.m3u8': {
    title: 'Noticiero Central',
    time: '20:00 - 21:00',
    description: 'Resumen de noticias nacionales e internacionales.'
  },
  'http://example.com/channel2.m3u8': {
    title: 'Película: El Viaje',
    time: '21:00 - 23:00',
    description: 'Un hombre emprende una travesía por el país para redescubrirse.'
  },
  // Agrega aquí más objetos con la url del canal como key
};

window.onload = async function () {
  player = videojs('video-player', {
    controls: true,
    autoplay: true,
    fluid: true
  });

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

function changeChannel(url, name) {
  currentURL = url;
  player.src({ src: url, type: 'application/x-mpegURL' });
  player.play().catch(console.error);

  document.getElementById('currentChannel').innerText = name;

  // Mostrar EPG si existe
  const epg = epgData[url];
  if (epg) {
    document.getElementById('epgTitle').innerText = epg.title;
    document.getElementById('epgTime').innerText = epg.time;
    document.getElementById('epgDesc').innerText = epg.description;
  } else {
    document.getElementById('epgTitle').innerText = 'Sin información de EPG';
    document.getElementById('epgTime').innerText = '';
    document.getElementById('epgDesc').innerText = '';
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

function addFavorite(name, url, logo) {
  let favs = JSON.parse(localStorage.getItem('favorites')) || [];
  if (!favs.some(f => f.url === url)) {
    favs.push({ name, url, logo });
    localStorage.setItem('favorites', JSON.stringify(favs));
    renderFavorites();
  }
}

function renderFavorites() {
  const container = document.getElementById('favoritesList');
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  container.innerHTML = '';

  favs.forEach(fav => {
    const card = document.createElement('div');
    card.className = 'favorite-card';

    const info = document.createElement('div');
    info.className = 'favorite-info';
    info.onclick = () => changeChannel(fav.url, fav.name);

    const img = document.createElement('img');
    img.src = fav.logo || 'https://via.placeholder.com/50x30?text=Logo';
    img.alt = fav.name;

    const name = document.createElement('div');
    name.className = 'favorite-name';
    name.textContent = fav.name;

    info.appendChild(img);
    info.appendChild(name);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'favorite-delete-btn';
    deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i>';
    deleteBtn.title = 'Eliminar';
    deleteBtn.onclick = () => {
      removeFavorite(fav.url);
    };

    card.appendChild(info);
    card.appendChild(deleteBtn);
    container.appendChild(card);
  });
}

function removeFavorite(url) {
  let favs = JSON.parse(localStorage.getItem('favorites')) || [];
  favs = favs.filter(f => f.url !== url);
  localStorage.setItem('favorites', JSON.stringify(favs));
  renderFavorites();
}
