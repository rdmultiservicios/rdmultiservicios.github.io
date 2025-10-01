const canalesLista = document.getElementById('canales-lista');
const player = document.getElementById('player');
const playerTitle = document.getElementById('player-title');
const epgContent = document.getElementById('epg-content');

let canales = [];
let canalActual = null;

function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim());
  let result = [];
  let currentChannel = null;

  for (let line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const info = line.substring(8);
      let nameMatch = info.match(/,(.*)$/);
      let name = nameMatch ? nameMatch[1] : 'Sin nombre';
      let tvgLogoMatch = info.match(/tvg-logo="([^"]+)"/);
      let tvgLogo = tvgLogoMatch ? tvgLogoMatch[1] : '';
      let groupMatch = info.match(/group-title="([^"]+)"/);
      let group = groupMatch ? groupMatch[1] : 'Sin categoría';
      let epgMatch = info.match(/epg="([^"]+)"/);
      let epg = epgMatch ? epgMatch[1] : null;
      currentChannel = { name, tvgLogo, group, url: '', epg };
    } else if (line && !line.startsWith('#')) {
      if (currentChannel) {
        currentChannel.url = line;
        result.push(currentChannel);
        currentChannel = null;
      }
    }
  }
  return result;
}

async function cargarLista() {
  try {
    const response = await fetch('canales.m3u');
    const text = await response.text();
    canales = parseM3U(text);
    mostrarCanales();
    if (canales.length > 0) {
      seleccionarCanal(canales[0]);
    }
  } catch (err) {
    console.error('Error cargando lista M3U:', err);
    canalesLista.textContent = 'Error cargando la lista de canales.';
  }
}

function mostrarCanales() {
  canalesLista.innerHTML = '';
  for (const canal of canales) {
    const div = document.createElement('div');
    div.classList.add('canal');
    div.innerHTML = `
      <img src="${canal.tvgLogo || 'https://via.placeholder.com/320x180?text=No+Logo'}" alt="${canal.name}" />
      <div class="canal-info">
        <h3>${canal.name}</h3>
        <p>${canal.group}</p>
      </div>
    `;
    div.onclick = () => seleccionarCanal(canal);
    canalesLista.appendChild(div);
  }
}

function seleccionarCanal(canal) {
  if (!canal.url) return;
  canalActual = canal;
  player.src = canal.url;
  playerTitle.textContent = canal.name;
  actualizarEPG(canal.epg);
}

// Cuando se selecciona canal:
function setCanal(canal) {
  player.src = canal.url;
  player.play().catch(() => {}); // intentar play
  player.autoplay = true;
  player.volume = 1.0; // volumen máximo
  document.getElementById('player-title').textContent = canal.name;
  updateEPG(canal.epg);
}

function actualizarEPG(epgData) {
  if (!epgData) {
    epgContent.innerHTML = '<p>No hay información EPG disponible para este canal.</p>';
    return;
  }
  epgContent.textContent = epgData;
}

window.onload = () => {
  cargarLista();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(() => {
      console.log('Service Worker registrado');
    }).catch(console.error);
  }
};
