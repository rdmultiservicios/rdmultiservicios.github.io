let player;
let channels = [];
let currentURL = '';

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
      card.appendChild(favBtn
