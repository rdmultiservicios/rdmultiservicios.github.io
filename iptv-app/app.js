// Variables globales
let channels = [];
let epgData = null;
let player = null;
let currentChannelId = null;

// Cargar favoritos del localStorage
const favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));

// Referencias DOM
const channelGroupsEl = document.getElementById('channel-groups');
const searchInput = document.getElementById('search');
const epgTitle = document.getElementById('epg-title');
const epgDescription = document.getElementById('epg-description');
const epgProgrammes = document.getElementById('epg-programmes');
const themeToggle = document.getElementById('themeToggle');

async function loadM3U(url) {
  const res = await fetch(url);
  const text = await res.text();
  return parseM3U(text);
}

function parseM3U(data) {
  const lines = data.split('\n');
  const channelsList = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF')) {
      const infoLine = line;
      const urlLine = lines[i + 1]?.trim();
      i++;
      // Parse attributes
      const attrs = {};
      const regex = /(\w+?)="([^"]*?)"/g;
      let match;
      while ((match = regex.exec(infoLine))) {
        attrs[match[1]] = match[2];
      }
      // Parse name after comma
      const name = infoLine.split(',').slice(1).join(',').trim();
      channelsList.push({
        id: attrs['tvg-id'] || name,
        name: attrs['tvg-name'] || name,
        logo: attrs['tvg-logo'] || '',
        group: attrs['group-title'] || 'Sin grupo',
        url: urlLine,
      });
    }
  }
  return channelsList;
}

async function loadEPG(url) {
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');
  return xml;
}

function groupChannels(channelsList) {
  const groups = {};
  channelsList.forEach((ch) => {
    if (!groups[ch.group]) groups[ch.group] = [];
    groups[ch.group].push(ch);
  });
  // Ordenar alfabéticamente grupos
  const sortedGroups = {};
  Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sortedGroups[key] = groups[key];
    });
  return sortedGroups;
}

function renderChannelList(channelsList) {
  channelGroupsEl.innerHTML = '';
  const grouped = groupChannels(channelsList);

  // Crear sección "Favoritos" primero si hay
  const favChannels = channelsList.filter((ch) => favorites.has(ch.id));
  if (favChannels.length) {
    const favId = 'group-favorites';
    const favHeaderId = 'heading-favorites';
    const favCollapseId = 'collapse-favorites';

    const favAccordion = document.createElement('div');
    favAccordion.className = 'accordion-item';

    favAccordion.innerHTML = `
      <h2 class="accordion-header" id="${favHeaderId}">
        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${favCollapseId}" aria-expanded="true" aria-controls="${favCollapseId}">
          ⭐ Favoritos (${favChannels.length})
        </button>
      </h2>
      <div id="${favCollapseId}" class="accordion-collapse collapse show" aria-labelledby="${favHeaderId}" data-bs-parent="#channel-groups">
        <div class="accordion-body p-0">
          <ul class="list-group list-group-flush" id="${favId}-list"></ul>
        </div>
      </div>
    `;
    channelGroupsEl.appendChild(favAccordion);

    const favListEl = document.getElementById(`${favId}-list`);
    favChannels.forEach((ch) => {
      const li = createChannelItem(ch);
      favListEl.appendChild(li);
    });
  }

  Object.entries(grouped).forEach(([group, chList], index) => {
    const groupId = `group-${index}`;
    const headerId = `heading-${index}`;
    const collapseId = `collapse-${index}`;

    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';

    accordionItem.innerHTML = `
      <h2 class="accordion-header" id="${headerId}">
        <button
          class="accordion-button collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#${collapseId}"
          aria-expanded="false"
          aria-controls="${collapseId}">
          ${group} (${chList.length})
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}" data-bs-parent="#channel-groups">
        <div class="accordion-body p-0">
          <ul class="list-group list-group-flush" id="${groupId}-list"></ul>
        </div>
      </div>
    `;

    channelGroupsEl.appendChild(accordionItem);

    const listEl = document.getElementById(`${groupId}-list`);
    chList.forEach((ch) => {
      const li = createChannelItem(ch);
      listEl.appendChild(li);
    });
  });
}

function createChannelItem(ch) {
  const li = document.createElement('li');
  li.className = 'list-group-item channel-item d-flex align-items-center justify-content-between';

  li.innerHTML = `
    <div class="d-flex align-items-center flex-grow-1">
      <img src="${ch.logo}" alt="${ch.name}" style="width: 40px; height: 25px; object-fit: contain; margin-right: 10px;" />
      <div>${ch.name}</div>
    </div>
    <button class="btn btn-sm btn-outline-warning favorite-btn" title="Favorito">${favorites.has(ch.id) ? '★' : '☆'}</button>
  `;

  li.onclick = () => {
    playChannel(ch);
  };

  li.querySelector('.favorite-btn').onclick = (e) => {
    e.stopPropagation();
    toggleFavorite(ch.id, e.target);
  };

  // Marcar activo si es el canal actual
  if (ch.id === currentChannelId) li.classList.add('active');

  return li;
}

function toggleFavorite(channelId, button) {
  if (favorites.has(channelId)) {
    favorites.delete(channelId);
    button.textContent = '☆';
  } else {
    favorites.add(channelId);
    button.textContent = '★';
  }
  localStorage.setItem('favorites', JSON.stringify([...favorites]));
  renderChannelList(channels);
}

function playChannel(channel) {
  currentChannelId = channel.id;
  updateActiveChannelUI();

  if (player) {
    if (Hls.isSupported() && channel.url.endsWith('.m3u8')) {
      if (player.hls) {
        player.hls.destroy();
      }
      const video = document.getElementById('video-player');
      const hls = new Hls();
      player.hls = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        video.play();
      });
    } else {
      player.src({ src: channel.url, type: 'application/vnd.apple.mpegurl' });
    }
  }

  showEPG(channel);
}

function updateActiveChannelUI() {
  document.querySelectorAll('.channel-item').forEach((el) => {
    el.classList.remove('active');
  });
  // Marcar activo el canal seleccionado
  document.querySelectorAll('.channel-item').forEach((el) => {
    if (el.querySelector('div').textContent === channels.find((ch) => ch.id === currentChannelId)?.name) {
      el.classList.add('active');
    }
  });
}

function showEPG(channel) {
  if (!epgData) {
    epgTitle.textContent = channel.name;
    epgDescription.textContent = `Grupo: ${channel.group} / ID: ${channel.id}`;
    epgProgrammes.innerHTML = '<em>EPG no disponible</em>';
    return;
  }

  epgTitle.textContent = channel.name;
  epgDescription.textContent = `Grupo: ${channel.group} / ID: ${channel.id}`;
  epgProgrammes.innerHTML = '';

  const now = new Date();

  // Obtener programas para el canal
  const programmes = Array.from(epgData.querySelectorAll(`programme[channel="${channel.id}"]`)).map((prog) => {
    const start = parseEPGDate(prog.getAttribute('start'));
    const stop = parseEPGDate(prog.getAttribute('stop'));
    return {
      start,
      stop,
      title: prog.querySelector('title')?.textContent || 'Sin título',
      desc: prog.querySelector('desc')?.textContent || '',
    };
  });

  // Programas actuales
  const currentPrograms = programmes.filter((p) => now >= p.start && now <= p.stop);
  // Próximos 3 programas
  const nextPrograms = programmes.filter((p) => p.start > now).sort((a, b) => a.start - b.start);

  // Mostrar programas actuales con indicador 🟢
  currentPrograms.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'text-success mb-2';
    div.innerHTML = `
      <strong>🟢 En emisión:</strong> ${p.title} (${formatTime(p.start)} - ${formatTime(p.stop)})<br>
      <small>${p.desc}</small>
    `;
    epgProgrammes.appendChild(div);
  });

  // Mostrar próximos programas
  nextPrograms.slice(0, 3).forEach((p) => {
    const div = document.createElement('div');
    div.className = 'text-muted mb-2';
    div.innerHTML = `
      <strong>⏭ Próximo:</strong> ${p.title} (${formatTime(p.start)} - ${formatTime(p.stop)})<br>
      <small>${p.desc}</small>
    `;
    epgProgrammes.appendChild(div);
  });

  if (currentPrograms.length === 0 && nextPrograms.length === 0) {
    epgProgrammes.innerHTML = '<em>No hay información EPG para este canal</em>';
  }
}

function parseEPGDate(dateStr) {
  // EPG usa formato: YYYYMMDDHHmmss Z
  // Ejemplo: 20250920120000 +0000
  // Convertir a ISO 8601 para parseo correcto
  if (!dateStr) return null;
  const dateIso = dateStr.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z');
  return new Date(dateIso);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function filterChannels(query) {
  query = query.trim().toLowerCase();
  if (!query) {
    renderChannelList(channels);
    return;
  }
  const filtered = channels.filter((ch) => ch.name.toLowerCase().includes(query));
  renderChannelList(filtered);
}

function init() {
  player = videojs('video-player', {
    autoplay: true,
    controls: true,
    muted: false,
    preload: 'auto',
  });

  // Cargar M3U y EPG
  Promise.all([loadM3U('channels.m3u'), loadEPG('epg.xml')]).then(([m3uChannels, epg]) => {
    channels = m3uChannels;
    epgData = epg;

    renderChannelList(channels);

    // Reproducir el primer canal por defecto
    if (channels.length > 0) {
      playChannel(channels[0]);
    }
  });

  // Buscar canales
  searchInput.addEventListener('input', (e) => {
    filterChannels(e.target.value);
  });

  // Actualizar EPG automáticamente cada 60 segundos
  setInterval(() => {
    const currentChannel = channels.find((ch) => ch.id === currentChannelId);
    if (currentChannel) {
      showEPG(currentChannel);
    }
  }, 60000);

  // Tema claro/oscuro
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateTheme();
  });

  updateTheme();
}

function updateTheme() {
  const isLight = localStorage.getItem('theme') === 'light';
  if (isLight) {
    document.body.classList.add('light-theme');
    document.body.classList.remove('bg-black');
    document.getElementById('sidebar').classList.remove('bg-black');
    document.getElementById('sidebar').classList.add('bg-light');
    document.body.style.color = '#000';
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('bg-black');
    document.getElementById('sidebar').classList.add('bg-black');
    document.getElementById('sidebar').classList.remove('bg-light');
    document.body.style.color = '#eee';
  }
}

window.onload = init;
