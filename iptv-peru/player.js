let canales = [];
let playerMobile;
let playerDesktop;

document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('canales.m3u');
  const data = await res.text();
  canales = parseM3U(data);

  const categorias = [...new Set(canales.map(c => c.group))];
  renderCategorias(categorias);
  renderCanales(categorias[0]);

  renderFiltros(categorias);
  renderCanalesGrid();

  playerMobile = videojs('videoPlayer', {
    autoplay: false,
    controls: true,
    fluid: true,
  });

  playerDesktop = videojs('videoPlayerDesktop', {
    autoplay: false,
    controls: true,
    fluid: true,
  });

  const primerCanal = canales.find(c => c.group === categorias[0]);
  if (primerCanal) reproducirCanal(primerCanal.url);
});

// Parseador M3U
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
      if (url && name) parsed.push({ name, tvgId, logo, group, url });
    }
  }
  return parsed;
}

// Reproducir canal en ambos players
function reproducirCanal(url) {
  if (playerMobile) {
    playerMobile.src({ src: url, type: 'application/x-mpegURL' });
    playerMobile.play();
  }
  if (playerDesktop) {
    playerDesktop.src({ src: url, type: 'application/x-mpegURL' });
    playerDesktop.play();
  }
}

// Slider móvil
function renderCategorias(categorias) {
  const container = document.getElementById('categorias');
  container.innerHTML = '';
  categorias.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = 'categoria-btn' + (idx === 0 ? ' active' : '');
    btn.innerText = cat;
    btn.onclick = () => {
      document.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCanales(cat);
    };
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
    col.innerHTML = `
      <div class="card-canal" onclick="reproducirCanal('${canal.url}')">
        <img src="${canal.logo}" alt="${canal.name}">
        <p class="small text-white">${canal.name}</p>
      </div>`;
    container.appendChild(col);
  });
}

// Sidebar: filtros desktop
function renderFiltros(categorias) {
  const container = document.getElementById('filtros');
  categorias.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'categoria-btn';
    btn.innerText = cat;
    btn.onclick = () => renderCanalesGrid(cat);
    container.appendChild(btn);
  });

  document.getElementById('busqueda').addEventListener('input', () => {
    renderCanalesGrid();
  });
}

// Grid canales desktop
function renderCanalesGrid(filtroCategoria = null) {
  const grid = document.getElementById('canales-grid');
  const search = document.getElementById('busqueda').value.toLowerCase();
  grid.innerHTML = '';

  const filtrados = canales.filter(c => {
    const matchNombre = c.name.toLowerCase().includes(search);
    const matchCategoria = !filtroCategoria || c.group === filtroCategoria;
    return matchNombre && matchCategoria;
  });

  filtrados.forEach(canal => {
    const card = document.createElement('div');
    card.className = 'col';
    card.innerHTML = `
      <div class="card-canal" onclick="reproducirCanal('${canal.url}')">
        <img src="${canal.logo}" alt="${canal.name}">
        <p class="small text-white">${canal.name}</p>
      </div>`;
    grid.appendChild(card);
  });
}
