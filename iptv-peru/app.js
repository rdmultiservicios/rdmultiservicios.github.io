const m3uFileInput = document.getElementById('m3uFile');
const urlInput = document.getElementById('urlInput');
const loadUrlBtn = document.getElementById('loadUrlBtn');
const channelListEl = document.getElementById('channelList');
const video = document.getElementById('videoPlayer');
const channelNameEl = document.getElementById('channelName');
const channelCategoryEl = document.getElementById('channelCategory');
const channelUrlEl = document.getElementById('channelUrl');

let channels = [];
let currentChannelIndex = -1;
let hls;

function clearPlayer() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  video.pause();
  video.removeAttribute('src');
  video.load();
}

function playChannel(channel) {
  clearPlayer();

  channelNameEl.textContent = channel.name;
  channelCategoryEl.textContent = `Categoría: ${channel.group}`;
  channelUrlEl.textContent = channel.url;

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play();
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = channel.url;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
  } else {
    alert('Tu navegador no soporta reproducción HLS.');
  }
}

function renderChannels() {
  channelListEl.innerHTML = '';
  channels.forEach((channel, index) => {
    const card = document.createElement('div');
    card.className = 'channel-card';
    if (index === currentChannelIndex) card.classList.add('active');
    card.tabIndex = 0;

    card.innerHTML = `
      <img src="${channel.logo || 'https://via.placeholder.com/50x28?text=No+Logo'}" alt="${channel.name}" />
      <div class="channel-details">
        <div class="channel-name">${channel.name}</div>
        <div class="channel-category">${channel.group}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      currentChannelIndex = index;
      playChannel(channel);
      renderChannels();
    });

    card.addEventListener('keydown', (e) => {
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
  if (!url) return alert('Por favor ingresa una URL válida.');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar la lista.');
    const text = await res.text();
    channels = parseM3U(text);
    currentChannelIndex = 0;
    renderChannels();
    if (channels.length) playChannel(channels[0]);
  } catch (err) {
    alert('No se pudo cargar la lista: ' + err.message);
  }
});
