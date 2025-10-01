const m3uFileInput = document.getElementById('m3uFile');
const urlInput = document.getElementById('urlInput');
const loadUrlBtn = document.getElementById('loadUrlBtn');
const channelListEl = document.getElementById('channelList');
const video = document.getElementById('videoPlayer');
const channelNameEl = document.getElementById('channelName');
const channelCategoryEl = document.getElementById('channelCategory');
const channelUrlEl = document.getElementById('channelUrl');
const epgNowEl = document.getElementById('epgNow');

let channels = [];
let currentChannelIndex = -1;
let epgData = {};
let hls = null;

function clearPlayer() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  video.pause();
  video.removeAttribute('src');
  video.load();
}

function updateEPGDisplay(channel) {
  // intentar obtener EPG por id, luego por nombre
  let progList = [];
  if (channel.id && epgData[channel.id]) {
    progList = epgData[channel.id];
  } else if (epgData[channel.name]) {
    progList = epgData[channel.name];
  }
  if (!progList || progList.length === 0) {
    epgNowEl.textContent = 'Guía: —';
    return;
  }
  const now = new Date();
  const current = progList.find(p => {
    const st = parseXMLTVDate(p.start);
    const en = parseXMLTVDate(p.stop);
    return now >= st && now <= en;
  });
  epgNowEl.textContent = current ? `Ahora: ${current.title}` : 'Guía: —';
}

function playChannel(channel) {
  clearPlayer();

  channelNameEl.textContent = channel.name;
  channelCategoryEl.textContent = `Categoría: ${channel.group || '—'}`;
  channelUrlEl.textContent = channel.url;

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play();
      updateEPGDisplay(channel);
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = channel.url;
    video.addEventListener('loadedmetadata', () => {
      video.play();
      updateEPGDisplay(channel);
    });
  } else {
    alert('Tu navegador no soporta reproducción HLS.');
  }
}

function renderChannels() {
  channelListEl.innerHTML = '';
  channels.forEach((channel, idx) => {
    const card = document.createElement('div');
    card.className = 'channel-card';
    if (idx === currentChannelIndex) {
      card.classList.add('active');
    }
    card.tabIndex = 0;

    const logoUrl = channel.logo || 'https://via.placeholder.com/60x34?text=Logo';

    card.innerHTML = `
      <img src="${logoUrl}" alt="${channel.name}" />
      <div class="channel-details">
        <div class="channel-name">${channel.name}</div>
        <div class="channel-category">${channel.group}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      currentChannelIndex = idx;
      playChannel(channel);
      renderChannels();
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    channelListEl.appendChild(card);
  });
}

m3uFileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    channels = parseM3U(reader.result);
    currentChannelIndex = 0;
    renderChannels();
    if (channels.length) playChannel(channels[0]);
  };
  reader.readAsText(file);
});

loadUrlBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    alert('Por favor ingresa una URL válida.');
    return;
  }
  try {
    const resp = await fetch(url);
    const text = await resp.text();
    channels = parseM3U(text);
    currentChannelIndex = 0;
    renderChannels();
    if (channels.length) playChannel(channels[0]);
  } catch (err) {
    alert('No se pudo cargar la lista: ' + err.message);
  }
});
