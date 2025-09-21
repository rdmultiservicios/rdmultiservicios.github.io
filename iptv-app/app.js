// app.js

const CHANNELS_M3U = 'channels.m3u'; // Archivo M3U local o URL
const EPG_XML = 'epg.xml';           // Archivo XMLTV local o URL

const videoPlayer = videojs('video-player');
const channelGroupsContainer = document.getElementById('channel-groups');
const searchInput = document.getElementById('search');
const epgTitle = document.getElementById('epg-title');
const epgDescription = document.getElementById('epg-description');
const epgProgrammes = document.getElementById('epg-programmes');
const fullscreenBtn = document.getElementById('fullscreen-btn');

let channels = []; // Array de canales parseados
let epgData = {};  // Objeto { channelId: [programas] }
let filteredChannels = [];
let favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
let currentChannelId = localStorage.getItem('lastChannelId') || null;

// Utils para parsear fechas XMLTV con offset y convertir a Date local
function parseXMLTVDate(str) {
  const dtPart = str.substring(0, 14);
  const offsetPart = str.substring(15).trim();

  const year = parseInt(dtPart.substring(0, 4));
  const month = parseInt(dtPart.substring(4, 6)) - 1;
  const day = parseInt(dtPart.substring(6, 8));
  const hour = parseInt(dtPart.substring(8, 10));
  const minute = parseInt(dtPart.substring(10, 12));
  const second = parseInt(dtPart.substring(12, 14));

  let date = new Date(Date.UTC(year, month, day, hour, minute, second));

  const sign = offsetPart[0];
  const offsetHours = parseInt(offsetPart.substring(1, 3));
  const offsetMinutes = parseInt(offsetPart.substring(3, 5));
  const offsetTotalMinutes = offsetHours * 60 + offsetMinutes;

  if(sign === '+') {
    date = new Date(date.getTime() - offsetTotalMinutes * 60000);
  } else if(sign === '-') {
    date = new Date(date.getTime() + offsetTotalMinutes * 60000);
  }

  return date;
}

// Parsear M3U en array de objetos
async function parseM3U(url) {
  const res = await fetch(url);
  const text = await res.text();

  const lines = text.split('\n');
  const parsedChannels = [];
  let currentChannel = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF')) {
      const attrRegex = /(\w+)=["']([^"']*)["']/g;
      const attrs = {};
      let match;

      while ((match = attrRegex.exec(line)) !== null) {
        attrs[match[1]] = match[2];
      }
      const name = line.split(',')[1] || attrs['tvg-name'] || 'Sin nombre';

      currentChannel = {
        id: attrs['tvg-id'] || name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        logo: attrs['tvg-logo'] || '',
        group: attrs['group-title'] || 'Otros',
        url: ''
      };
    } else if (currentChannel && !line.startsWith('#')) {
      currentChannel.url = line;
      parsedChannels.push(currentChannel);
      currentChannel = null;
    }
  }

  return parsedChannels;
}

// Parsear EPG XMLTV
async function parseEPG(url) {
  const res = await fetch(url);
  const text = await res.text();

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');

  const programmes = xml.querySelectorAll('programme');
  const epg = {};

  programmes.forEach(p => {
    const channel = p.getAttribute('channel');
    const start = parseXMLTVDate(p.getAttribute('start'));
    const stop = parseXMLTVDate(p.getAttribute('stop'));
    const titleEl = p.querySelector('title');
    const descEl = p.querySelector('desc');

    if (!epg[channel]) epg[channel] = [];

    epg[channel].push({
      start,
      stop,
      title: titleEl ? titleEl.textContent : '',
      desc: descEl ? descEl.textContent : ''
    });
  });

  for (const ch in epg) {
    epg[ch].sort((a,b) => a.start - b.start);
  }

  return epg;
}

// Mostrar canales agrupados en acordeones Bootstrap
function renderChannelList(channelsList) {
  const groups = {};
  channelsList.forEach(ch => {
    if (!groups[ch.group]) groups[ch.group] = [];
    groups[ch.group].push(ch);
  });

  channelGroupsContainer.innerHTML = '';

  let groupIndex = 0;
  for (const group in groups) {
    groupIndex++;
    const groupId = 'group-' + groupIndex;

    const item = document.createElement('div');
    item.className = 'accordion-item bg-black text-white';

    item.innerHTML = `
      <h2 class="accordion-header" id="heading-${groupId}">
        <button class="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${groupId}" aria-expanded="false" aria-controls="collapse-${groupId}">
          ${group}
        </button>
      </h2>
      <div id="collapse-${groupId}" class="accordion-collapse collapse" aria-labelledby="heading-${groupId}" data-bs-parent="#channel-groups">
        <div class="accordion-body p-0" style="max-height: 300px; overflow-y: auto;">
          <ul class="list-group list-group-flush" id="list-${groupId}"></ul>
        </div>
      </div>
    `;

    channelGroupsContainer.appendChild(item);

    const ul = item.querySelector(`#list-${groupId}`);

    groups[group].forEach(ch => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex align-items-center channel-item bg-black text-white';
      if (ch.id === currentChannelId) li.classList.add('active');

      li.dataset.channelId = ch.id;

      li.innerHTML = `
        <img src="${ch.logo}" alt="${ch.name}" style="width: 40px; height: 25px; object-fit: contain; margin-right: 10px;" />
        <div class="flex-grow-1">${ch.name}</div>
        <button class="btn btn-sm btn-outline-warning favorite-btn" title="Favorito">${favorites.has(ch.id) ? '★' : '☆'}</button>
      `;

      li.querySelector('.favorite-btn').onclick = e => {
        e.stopPropagation();
        toggleFavorite(ch.id, e.target);
      };

      li.onclick = () => selectChannel(ch.id);

      ul.appendChild(li);
    });
  }
}

// Cambiar canal seleccionado
function selectChannel(channelId) {
  if (currentChannelId === channelId) return;

  currentChannelId = channelId;
  localStorage.setItem('lastChannelId', currentChannelId);

  document.querySelectorAll('.channel-item').forEach(item => {
    item.classList.toggle('active', item.dataset.channelId === channelId);
  });

  const channel = channels.find(ch => ch.id === channelId);
  if (!channel) return;

  playChannel(channel.url);
  showEPG(channel);
}

// Reproducir canal con Video.js + HLS.js fallback
function playChannel(url) {
  if (videoPlayer.techName_ === 'Html5' && Hls.isSupported()) {
    if (videoPlayer.hls) {
      videoPlayer.hls.destroy();
      videoPlayer.hls = null;
    }
    const hls = new Hls();
    videoPlayer.hls = hls;
    hls.loadSource(url);
    hls.attachMedia(videoPlayer.tech_.el_);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      videoPlayer.play();
    });
  } else {
    videoPlayer.src({ src: url, type: 'application/x-mpegURL' });
    videoPlayer.play();
  }
}

// Mostrar EPG del canal actual
function showEPG(channel) {
  epgTitle.textContent = channel.name;
  epgDescription.textContent = `Grupo: ${channel.group} | ID: ${channel.id}`;

  const now = new Date();
  const programmes = epgData[channel.id] || [];

  // Buscar programa actual y próximos
  const currentPrograms = programmes.filter(p => p.start <= now && p.stop > now);
  const nextPrograms = programmes.filter(p => p.start > now);

  epgProgrammes.innerHTML = '';

  if (currentPrograms.length === 0 && nextPrograms.length === 0) {
    epgProgrammes.textContent = 'No hay información de programación disponible.';
    return;
  }

  currentPrograms.forEach(p => {
    const div = document.createElement('div');
    div.innerHTML = `<strong>En emisión:</strong> ${p.title} (${formatTime(p.start)} - ${formatTime(p.stop)})<br><small>${p.desc}</small>`;
    epgProgrammes.appendChild(div);
  });

  nextPrograms.slice(0, 3).forEach(p => {
    const div = document.createElement('div');
    div.innerHTML = `<strong>Próximo:</strong> ${p.title} (${formatTime(p.start)} - ${formatTime(p.stop)})<br><small>${p.desc}</small>`;
    epgProgrammes.appendChild(div);
  });
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Filtrar canales por búsqueda
function filterChannels(term) {
  term = term.toLowerCase();
  filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(term) || ch.group.toLowerCase().includes(term)
  );
  renderChannelList(filteredChannels);
}

// Favoritos
function toggleFavorite(channelId, btn) {
  if (favorites.has(channelId)) {
    favorites.delete(channelId);
    btn.textContent = '☆';
  } else {
    favorites.add(channelId);
    btn.textContent = '★';
  }
  localStorage.setItem('favorites', JSON.stringify([...favorites]));
}

// Botón pantalla completa
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    videoPlayer.el().requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Evento búsqueda
searchInput.addEventListener('input', () => {
  filterChannels(searchInput.value);
});

// Inicialización
(async function init() {
  channels = await parseM3U(CHANNELS_M3U);
  epgData = await parseEPG(EPG_XML);

  filteredChannels = channels;

  renderChannelList(channels);

  if (currentChannelId && channels.find(ch => ch.id === currentChannelId)) {
    selectChannel(currentChannelId);
  } else if (channels.length > 0) {
    selectChannel(channels[0].id);
  }
})();
