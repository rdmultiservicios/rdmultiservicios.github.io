const canalesLista = document.getElementById('canales-lista');
const playerSection = document.getElementById('player-section');
const player = document.getElementById('player');
const playerTitle = document.getElementById('player-title');
const backBtn = document.getElementById('back-btn');

let canales = [];

// Función para parsear M3U
function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim());
  let result = [];
  let currentChannel = null;

  for (let line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const info = line.substring(8);
      // Ejemplo #EXTINF:-1 tvg-id="xxx" tvg-name="xxx" tvg-logo="url" group-title="xxx",Nombre Canal
      let nameMatch = info.match(/,(.*)$/);
      let name = nameMatch ? nameMatch[1] : 'Sin nombre';
      let tvgLogoMatch = info.match(/tvg-logo="([^"]+)"/);
      let tvgLogo = tvgLogoMatch ? tvgLogoMatch[1] : '';
      let groupMatch = info.match(/group-title="([^"]+)"/);
      let group = groupMatch ? groupMatch[1] : 'Sin categoría';

      currentChannel = { name, tvgLogo, group, url: '' };
    } else if (line && !line.startsWith('#')) {
      // La URL del canal
      if (currentChannel) {
        currentChannel.url = line;
        result.push(currentChannel);
        currentChannel = null;
      }
    }
  }
  return result;
}

// Cargar lista M3U desde archivo local canales.m3u
async function cargarLista() {
  try {
    const response = await fetch('canales.m3u');
    const text = await response.text();
    canales = parseM3U(text);
    mostrarCanales();
  } catch (err) {
    console.error('Error cargando lista M3U:', err);
    canalesLista.textContent = 'Error cargando la lista de canales.';
  }
}

// Mostrar canales en pantalla
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
    div.onclick = () => reproducirCanal(canal);
    canalesLista.appendChild(div);
  }
}

// Reproducir canal seleccionado
function reproducirCanal(canal) {
  player.src = canal.url;
  playerTitle.textContent = canal.name;
  playerSection.hidden = false;
  canalesLista.style.display = 'none';
}

// Volver a la lista
backBtn.onclick = () => {
  player.pause();
  player.src = '';
  playerSection.hidden = true;
  canalesLista.style.display = 'grid';
};

window.onload = () => {
  cargarLista();

  // Registrar service worker para PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(() => {
      console.log('Service Worker registrado');
    }).catch(console.error);
  }
};
