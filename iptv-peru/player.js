let canales = [];
let player;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('canales.m3u');
    if (!res.ok) throw new Error('No se pudo cargar el archivo M3U');
    const data = await res.text();
    canales = parseM3U(data);

    const categorias = [...new Set(canales.map(c => c.group))];
    renderCategorias(categorias);
    renderCanales(categorias[0]);

    renderFiltros(categorias);
    renderCanalesGrid();

    // Usar un solo reproductor con diseño fluido
    const playerId = window.innerWidth <= 768 ? 'videoPlayer' : 'videoPlayerDesktop';
    player = videojs(playerId, {
      autoplay: false,
      controls: true,
      fluid: true,
    });

    const primerCanal = canales.find(c => c.group === categorias[0]);
    if (primerCanal) reproducirCanal(primerCanal.url);
  } catch (error) {
    console.error(error);
    document.getElementById('canales').innerHTML = '<p>Error al cargar los canales.</p>';
  }
});

// Parseador M3U con validación
function parseM3U(data) {
  const lines = data.split('\n');
  const parsed = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const name = lines[i].split(',')[1]?.trim();
      const tvgId = lines[i].match(/tvg-id="(.+?)"/)?.[1] || '';
      const logo = lines[i].match(/tvg-logo="(.+?)"/)?.[1] || 'https://via.placeholder.com/100?text=Logo';
      const group = lines[i].match(/group-title="(.+?)"/)?.[1] || 'Otros';
      const url = lines[i + 1]?.trim();

      if (url && /^https?:\/\//i.test(url) && name) {
        parsed.push({ name, tvgId, logo, group, url });
      }
    }
  }

  return parsed;
}

// Normalizar texto para búsqueda (elimina tildes y convierte a minúsculas)
function normalizeText(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Reproducir canal
function reproducirCanal(url) {
  if (player) {
    player.src({ src: url, type: 'application/x-mpegURL' });
    player.play();
  }

  // Marcar canal activo (opcional)
  document.querySelectorAll('.card-canal.active').forEach(c => c.classList.remove('active'));
  const matchingCards = document.querySelectorAll(`.card-canal[data-url="${url}"]`);
  matchingCards.forEach(card => card.classList.add('active'));
}

// Slider móvil
function renderCategorias(categorias) {
  const container = document.getElementById('categorias');
  container.innerHTML = '';
  categorias.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = 'categoria-btn' + (idx === 0 ? ' active' : '');
    btn.innerText = cat;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCanales(cat);
    });
    container.appendChild(btn);
  });
}

function renderCanales(categoria) {
  const container = document.getElementById('canales');
  container.innerHTML = '';
  const filtrados = canales.filter(c => c.group === categoria);

  filtrados.forEach(canal => {
    const col = document.createElement('div');
    col.className = 'col-4 col-md-2';

    const card = document.createElement('div');
    card.className = 'card-canal';
    card.dataset.url = canal.url;

    card.innerHTML = `
      <img src="${canal.logo}" alt="${canal.name}">
      <p class="small text-white">${canal.name}</p>
    `;

    card.addEventListener('click', () => reproducirCanal(canal.url));

    col.appendChild(card);
    container.appendChild(col);
  });
}

// Sidebar: filtros desktop
function renderFiltros(categorias) {
  const container = document.getElementById('filtros');
  container.innerHTML = '';

  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'categoria-btn';
    btn.innerText = cat;
    btn.addEventListener('click', () => renderCanalesGrid(cat));
    container.appendChild(btn);
  });

  document.getElementById('busqueda').addEventListener('input', () => {
    renderCanalesGrid();
  });
}

// Grid canales desktop
function renderCanalesGrid(filtroCategoria = null) {
  const grid = document.getElementById('canales-grid');
  const search = normalizeText(document.getElementById('busqueda').value);
  grid.innerHTML = '';

  const filtrados = canales.filter(c => {
    const nombreNormal = normalizeText(c.name);
    const matchNombre = nombreNormal.includes(search);
    const matchCategoria = !filtroCategoria || c.group === filtroCategoria;
    return matchNombre && matchCategoria;
  });

  filtrados.forEach(canal => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'card-canal';
    card.dataset.url = canal.url;

    card.innerHTML = `
      <img src="${canal.logo}" alt="${canal.name}">
      <p class="small text-white">${canal.name}</p>
    `;

    card.addEventListener('click', () => reproducirCanal(canal.url));

    col.appendChild(card);
    grid.appendChild(col);
  });
}
