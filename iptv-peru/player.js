let canales = [];
let player;

// Inicializar todo al cargar
document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('canales.m3u');
  const data = await res.text();
  canales = parseM3U(data);

  const categorias = [...new Set(canales.map(c => c.group))];
  renderCategorias(categorias);
  renderCanales(categorias[0]);

  // Inicializar player
  player = videojs('videoPlayer', {
    autoplay: false,
    controls: true,
    fluid: true,
  });

  // Reproducir el primer canal automáticamente
  const primerCanal = canales.find(c => c.group === categorias[0]);
  if (primerCanal) reproducirCanal(primerCanal.name, primerCanal.url);
});

// Parseador de M3U
function parseM3U(data) {
  const lines = data.split('\n');
  const parsed = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const name = lines[i].split(',')[1].trim();
      const tvgId = lines[i].match(/tvg-id="(.+?)"/)?.[1] || '';
      const logo = lines[i].match(/tvg-logo="(.+?)"/)?.[1] || 'default.png';
      const group = lines[i].match(/group-title="(.+?)"/)?.[1] || 'Otros';
      const url = lines[i + 1]?.trim();
      parsed.push({ name, tvgId, logo, group, url });
    }
  }
  return parsed;
}


// Render categorías como botones scrollables
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

// Render canales por categoría
function renderCanales(categoria) {
  const container = document.getElementById('canales');
  container.innerHTML = '';

  const filtrados = canales.filter(c => c.group === categoria);
  filtrados.forEach(canal => {
    const col = document.createElement('div');
    col.className = 'col-4 col-md-2';

    const card = document.createElement('div');
    card.className = 'card-canal';
    card.innerHTML = `
      <img src="${canal.logo}" alt="${canal.name}" loading="lazy">
      <p class="small text-white">${canal.name}</p>
    `;
    card.onclick = () => reproducirCanal(canal.name, canal.url);

    col.appendChild(card);
    container.appendChild(col);
  });
}


// Reproduce el canal
function reproducirCanal(nombre, url) {
  document.getElementById('canalTitulo')?.remove(); // si hay modal anterior
  player.src({ src: url, type: 'application/x-mpegURL' });
  player.play();
}
