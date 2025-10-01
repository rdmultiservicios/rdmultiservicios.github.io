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

m3uInput.addEventListener('change', e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    channels = parseM3U(reader.result);
    renderChannelList();
  };
  reader.readAsText(file);
});

loadUrlBtn.addEventListener('click', () => {
  fetch(m3uUrl.value)
    .then(res => res.text())
    .then(text => {
      channels = parseM3U(text);
      renderChannelList();
    });
});

epgInput.addEventListener('change', e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    epg = parseXMLTV(reader.result);
  };
  reader.readAsText(file);
});

function renderChannelList() {
  channelList.innerHTML = '';
  channels.forEach((ch, idx) => {
    // Control parental: bloquear grupos +18
    const isAdult = ch.group.toLowerCase().includes('adult');
    const pin = parentalPin.value;

    if (isAdult && pin !== '1234') return;

    const div = document.createElement('div');
    div.className = 'channel-item';
    if (favorites.includes(ch.name)) div.classList.add('fav');
    div.textContent = ch.name;
    div.addEventListener('click', () => playChannel(ch));
    channelList.appendChild(div);
  });
}

function playChannel(channel) {
  currentChannel = channel;
  channelTitle.textContent = channel.name;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    video.src = channel.url;
  }

  favBtn.textContent = favorites.includes(channel.name)
    ? '★ Quitar favorito'
    : '★ Favorito';

  const epgList = epg[channel.name] || [];
  const now = new Date();

  const current = epgList.find(p => {
    const start = new Date(p.start.slice(0, 14).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5'));
    const stop = new Date(p.stop.slice(0, 14).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5'));
    return now >= start && now <= stop;
  });

  epgNow.textContent = current ? current.title : 'Sin información';
}

favBtn.addEventListener('click', () => {
  if (!currentChannel) return;
  const name = currentChannel.name;
  if (favorites.includes(name)) {
    favorites = favorites.filter(f => f !== name);
  } else {
    favorites.push(name);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderChannelList();
  favBtn.textContent = favorites.includes(name)
    ? '★ Quitar favorito'
    : '★ Favorito';
});

// Modo TV: navegación con flechas
let focusedIndex = 0;
channelList.addEventListener('keydown', (e) => {
  const items = [...channelList.querySelectorAll('.channel-item')];
  if (e.key === 'ArrowDown') {
    focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    focusedIndex = Math.max(focusedIndex - 1, 0);
  } else if (e.key === 'Enter') {
    items[focusedIndex]?.click();
  }

  items.forEach(i => i.classList.remove('focused'));
  items[focusedIndex]?.classList.add('focused');
});
