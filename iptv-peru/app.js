const m3uInput = document.getElementById('m3uInput');
const m3uUrl = document.getElementById('m3uUrl');
const loadUrlBtn = document.getElementById('loadUrlBtn');
const epgInput = document.getElementById('epgInput');
const channelList = document.getElementById('channelList');
const video = document.getElementById('videoPlayer');
const channelTitle = document.getElementById('channelTitle');
const epgNow = document.getElementById('epgNow');
const favBtn = document.getElementById('favBtn');
const parentalPin = document.getElementById('parentalPin');

let channels = [];
let epg = {};
let currentChannel = null;
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// Cargar archivo M3U local
m3uInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    channels = parseM3U(reader.result);
    renderChannelList();
  };
  reader.readAsText(file);
});

// Cargar M3U por URL
loadUrlBtn.addEventListener('click', () => {
  const url = m3uUrl.value.trim();
  if (!url) {
    alert('Ingresa una URL válida');
    return;
  }
  fetch(url)
    .then(res => res.text())
    .then(text => {
      channels = parseM3U(text);
      renderChannelList();
    })
    .catch(err => {
      console.error('Error cargando M3U por URL', err);
      alert('No se pudo cargar la lista desde la URL.');
    });
});

// Cargar EPG local
epgInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    epg = parseXMLTV(reader.result);
  };
  reader.readAsText(file);
});

function renderChannelList() {
  channelList.innerHTML = '';
  channels.forEach(ch => {
    const isAdult = ch.group?.toLowerCase().includes('adult');
    const pin = parentalPin.value;
    if (isAdult && pin !== '1234') {
      return; // Filtrar canales adultos si no hay PIN correcto
    }
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `list-group-item list-group-item-action`;
    if (favorites.includes(ch.name)) {
      item.classList.add('fav');
    }
    item.textContent = ch.name;
    item.addEventListener('click', () => playChannel(ch));
    channelList.appendChild(item);
  });

  setupKeyboardNavigation();
  favBtn.disabled = !currentChannel;
}

function playChannel(channel) {
  currentChannel = channel;
  channelTitle.textContent = channel.name;

  // Reproducir con HLS.js si soportado
  if (Hls.isSupported()) {
    if (window.hls) {
      window.hls.destroy();
    }
    window.hls = new Hls();
    window.hls.loadSource(channel.url);
    window.hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = channel.url;
  } else {
    alert('Tu navegador no soporta HLS.');
  }

  // Actualizar botón favorito
  if (favorites.includes(channel.name)) {
    favBtn.textContent = '★ Quitar favorito';
  } else {
    favBtn.textContent = '★ Favorito';
  }
  favBtn.disabled = false;

  // Mostrar EPG actual
  const epgList = epg[channel.name] || epg[channel.id] || [];
  const now = new Date();
  const currentItem = epgList.find(p => {
    const start = parseXMLTVDate(p.start);
    const stop = parseXMLTVDate(p.stop);
    return now >= start && now <= stop;
  });
  epgNow.textContent = currentItem ? currentItem.title : 'No hay guía de programas.';
  video.play();
}

favBtn.addEventListener('click', () => {
  if (!currentChannel) return;
  const index = favorites.indexOf(currentChannel.name);
  if (index === -1) {
    favorites.push(currentChannel.name);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderChannelList();
  playChannel(currentChannel);
});

// Control parental - recarga lista cuando cambia PIN
parentalPin.addEventListener('input', () => {
  renderChannelList();
});

function setupKeyboardNavigation() {
  let focusedIndex = 0;
  const items = channelList.querySelectorAll('button.list-group-item');

  function focusItem(index) {
    if (items[focusedIndex]) {
      items[focusedIndex].classList.remove('focused');
    }
    focusedIndex = Math.min(Math.max(index, 0), items.length - 1);
    if (items[focusedIndex]) {
      items[focusedIndex].classList.add('focused');
      items[focusedIndex].focus();
    }
  }

  channelList.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusItem(focusedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusItem(focusedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[focusedIndex]) {
        items[focusedIndex].click();
      }
    }
  });

  focusItem(0);
}

