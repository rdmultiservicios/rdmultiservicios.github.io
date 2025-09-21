let player;
let channels = [];
let epgData = null;
let favorites = new Set();
let currentChannelId = null;

const channelGroupsEl = document.getElementById('channel-groups');
const favoritesListEl = document.getElementById('favorites-list');
const searchInput = document.getElementById('search-input');
const epgProgrammes = document.getElementById('epg-programmes');
const themeToggle = document.getElementById('theme-toggle');

function parseM3U(data) {
  const lines = data.split(/\r?\n/);
  const result = [];
  let current = null;

  lines.forEach((line) => {
    line = line.trim();
    if (!line) return;
    if (line.startsWith('#EXTINF:')) {
      // Parse info line
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const nameMatch = line.match(/,(.*)$/);

      current = {
        id: tvgIdMatch ? tvgIdMatch[1] : `channel-${Math.random().toString(36).substr(2, 9)}`,
        name: tvgNameMatch ? tvgNameMatch[1] : (nameMatch ? nameMatch[1] : 'Sin nombre'),
        logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Sin grupo',
        url: '',
      };
    } else if (current && !line.startsWith('#')) {
      current.url = line;
      result.push(current);
      current = null;
    }
  });

  return result;
}

function loadM3U(url) {
  return fetch(url)
    .then((res) => res.text())
    .then((text) => parseM3U(text));
}

function loadEPG(url) {
  return fetch(url)
    .then((res) => res.text())
    .then((text) => new window.DOMParser().parseFromString(text, 'text/xml'));
}

function groupChannels(channelsList) {
  const groups = {};
  channelsList.forEach((ch) => {
    if (!groups[ch.group]) groups[ch.group] = [];
    groups[ch.group].push(ch);
  });
  // Ordenar grupos alfabéticamente
  const sortedGroups = {};
  Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sortedGroups[key] = groups[key];
    });
  return sortedGroups;
}

function createChannelItem(ch) {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-center';
  li.setAttribute('role', 'button');
  li.setAttribute('tabindex', '0');
  li.dataset.id = ch.id;

  li.innerHTML = `
    <div class="d-flex align-items-center flex-grow-1">
      <img
        src="${ch.logo}"
        alt="${ch.name}"
        style="width: 40px; height: 25px; object-fit: contain; margin-right: 10px;"
        loading="lazy"
      />
      <div>${ch.name}</div>
    </div>
    <button
      class="favorite-btn"
      aria-label="${favorites.has(ch.id) ? 'Quitar favorito' : 'Agregar a favoritos'}"
      title="${favorites.has(ch.id) ? 'Quitar favorito' : 'Agregar a favoritos'}"
    >
      ${favorites.has(ch.id) ? '★' : '☆'}
    </button>
  `;

  li.addEventListener('click', (e) => {
    // Evitar que el click en el botón favorito reproduzca canal
    if (e.target.closest('button.favorite-btn')) return;
    playChannel(ch);
  });
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playChannel(ch);
    }
  });

  const favBtn = li.querySelector('button.favorite-btn');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(ch.id);
    renderFavorites();
    renderChannelList(channels); // para actualizar botones favoritos
  });

  return li;
}

function renderChannelList(list) {
  channelGroupsEl.innerHTML = '';

  // Agrupar canales
  const grouped = groupChannels(list);

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
          aria-controls="${collapseId}"
        >
          ${group} (${chList.length})
        </button>
      </h2>
      <div
        id="${collapseId}"
        class="accordion-collapse collapse"
        aria-labelledby="${headerId}"
        data-bs-parent="#channel-groups"
      >
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

function renderFavorites() {
  favoritesListEl.innerHTML = '';
  if (favorites.size === 0) {
    favoritesListEl.innerHTML = '<li class="list-group-item text-muted">No hay favoritos</li>';
    return;
  }
  const favChannels = channels.filter((ch) => favorites.has(ch.id));
  favChannels.forEach((ch) => {
    const li = createChannelItem(ch);
    favoritesListEl.appendChild(li);
  });
}

function toggleFavorite(channelId) {
  if (favorites.has(channelId)) {
    favorites.delete(channelId);
  } else {
    favorites.add(channelId);
  }
  saveFavorites();
}

function saveFavorites() {
  localStorage.setItem('iptv_favorites', JSON.stringify(Array.from(favorites)));
}

function loadFavorites() {
  const fav = localStorage.getItem('iptv_favorites');
  if (fav) {
    favorites = new Set(JSON.parse(fav));
  }
}

function playChannel(ch) {
  if (!ch.url) return;
  currentChannelId = ch.id;

  if (player) {
    if (player.src()) {
      player.pause();
    }
    // Cambiar fuente
    if (Hls.isSupported()) {
      if (player.hls) {
        player.hls.destroy();
      }
      player.hls = new Hls();
      player.hls.loadSource(ch.url);
      player.hls.attachMedia(player.tech_.el_);
      player.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        player.play();
      });
    } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
      player.src({ src: ch.url, type: 'application/x-mpegURL' });
      player.play();
    } else {
      player.src(ch.url);
      player.play();
    }
  }

  showEPG(ch);
  updateTheme();
}

function showEPG(channel) {
  epgProgrammes.innerHTML = '';
  if (!epgData || !channel) {
    epgProgrammes.innerHTML = '<em>No hay información EPG</em>';
    return;
  }

  const now = new Date();
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

  const currentPrograms = programmes.filter((p) => now >= p.start && now <= p.stop);
  const nextPrograms = programmes.filter((p) => p.start > now).sort((a, b) => a.start - b.start);

  currentPrograms.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'text-success mb-2';
    div.innerHTML = `
      <strong>🟢 En emisión:</strong> ${p.title} (${formatTime(p.start)} - ${formatTime(p.stop)})<br>
      <small>${p.desc}</small>
    `;
    epgProgrammes.appendChild(div);
  });

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

  loadFavorites();

  Promise.all([loadM3U('channels.m3u'), loadEPG('epg.xml')]).then(([m3uChannels, epg]) => {
    channels = m3uChannels;
    epgData = epg;

    renderFavorites();
    renderChannelList(channels);

    if (channels.length > 0) {
      playChannel(channels[0]);
    }
  });

  searchInput.addEventListener('input', (e) => {
    filterChannels(e.target.value);
  });

  // Actualización automática EPG cada 60s
  setInterval(() => {
    if (currentChannelId) {
      const ch = channels.find((c) => c.id === currentChannelId);
      if (ch) {
        showEPG(ch);
      }
    }
  }, 60000);

  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateTheme();
  });

  updateTheme();
}

function updateTheme() {
  const isLight = localStorage.getItem('theme') === 'light';
  if (isLight) {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
}

window.onload = init;
