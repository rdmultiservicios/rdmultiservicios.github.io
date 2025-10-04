// Variables globales
let channels = [];
let epgData = {};
let favorites = new Set(JSON.parse(localStorage.getItem('favorites')) || []);
let currentCategory = 'Todas';

const videoPlayer = document.getElementById('video-player');
const channelList = document.getElementById('channel-list');
const searchInput = document.getElementById('search-input');
const categoryList = document.getElementById('category-list');
const m3uFileInput = document.getElementById('m3u-file');
const epgFileInput = document.getElementById('epg-file');
const toggleThemeBtn = document.getElementById('toggle-theme');

// Función para parsear M3U básico
function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim());
  const parsed = [];
  let currentItem = {};

  lines.forEach(line => {
    if (line.startsWith('#EXTINF')) {
      const info = line.match(/#EXTINF:-1,(.*)/);
      currentItem.name = info ? info[1].trim() : 'Canal';
    } else if (line && !line.startsWith('#')) {
      currentItem.url = line;
      currentItem.category = 'Todas'; // default
      currentItem.logo = ''; // Aquí podrías extraer de EXTINF si lo añades
      parsed.push(currentItem);
      currentItem = {};
    }
  });

  return parsed;
}

// Función para cargar archivo M3U
m3uFileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    channels = parseM3U(ev.target.result);
    renderChannels();
    playFirstChannel();
  };
  reader.readAsText(file);
});

// Función para renderizar canales en el DOM
function renderChannels() {
  let filteredChannels = channels;

  // Filtrar categoría
  if (currentCategory === 'Favorites') {
    filteredChannels = channels.filter(ch => favorites.has(ch.url));
  } else if (currentCategory !== 'Todas') {
    filteredChannels = channels.filter(ch => ch.category === currentCategory);
  }

  // Filtrar búsqueda
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filteredChannels = filteredChannels.filter(ch =>
      ch.name.toLowerCase().includes(searchTerm)
    );
  }

  // Render
  channelList.innerHTML = '';
  if (filteredChannels.length === 0) {
    channelList.innerHTML = '<p class="text-center">No se encontraron canales.</p>';
    return;
  }

  filteredChannels.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'col channel-card';

    card.innerHTML = `
      <div class="card h-100" data-url="${ch.url}">
        <img
          src="${ch.logo || 'https://via.placeholder.com/320x180?text=Logo'}"
          alt="${ch.name}"
          class="card-img-top channel-logo"
          loading="lazy"
        />
        <div class="card-body p-2">
          <h6 class="card-title mb-1">${ch.name}</h6>
          <button class="btn btn-sm btn-outline-primary btn-fav">
            ${favorites.has(ch.url) ? '★' : '☆'}
          </button>
        </div>
      </div>
    `;

    // Click para reproducir
    card.querySelector('.card').addEventListener('click', () => {
      playChannel(ch.url);
    });

    // Favoritos
    card.querySelector('.btn-fav').addEventListener('click', e => {
      e.stopPropagation();
      if (favorites.has(ch.url)) {
        favorites.delete(ch.url);
      } else {
        favorites.add(ch.url);
      }
      localStorage.setItem('favorites', JSON.stringify([...favorites]));
      renderChannels();
    });

    channelList.appendChild(card);
  });
}

// Función para reproducir canal usando HLS.js si es necesario
function playChannel(url) {
  if (Hls.isSupported()) {
    if (window.hls) {
      window.hls.destroy();
    }
    window.hls = new Hls();
    window.hls.loadSource(url);
    window.hls.attachMedia(videoPlayer);
    window.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      videoPlayer.play();
    });
  } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    videoPlayer.src = url;
    videoPlayer.play();
  } else {
    alert('Tu navegador no soporta reproducción HLS.');
  }
}

// Reproducir el primer canal visible
function playFirstChannel() {
  const first = channels[0];
  if (first) playChannel(first.url);
}

// Filtrar canales por categoría
categoryList.addEventListener('click', e => {
  if (!e.target.dataset.category) return;

  currentCategory = e.target.dataset.category;

  // Activar botón categoría
  [...categoryList.querySelectorAll('a')].forEach(a =>
    a.classList.toggle('active', a.dataset.category === currentCategory)
  );

  renderChannels();
});

// Filtrar canales por búsqueda
searchInput.addEventListener('input', renderChannels);

// Cambiar tema
toggleThemeBtn.addEventListener('click', () => {
  if (document.body.classList.contains('dark')) {
    document.body.classList.replace('dark', 'light');
    toggleThemeBtn.textContent = '🌙 Modo oscuro';
  } else {
    document.body.classList.replace('light', 'dark');
    toggleThemeBtn.textContent = '☀️ Modo claro';
  }
});

// Iniciar: cargar una lista de ejemplo si quieres (puedes borrar esto)
window.addEventListener('load', () => {
  // Si quieres, carga aquí una lista M3U demo para probar
  // O solo espera que el usuario cargue su archivo
  // playFirstChannel() se llama luego de cargar lista
});
