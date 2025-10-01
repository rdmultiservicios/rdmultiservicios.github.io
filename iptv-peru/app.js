const canalesLista = document.getElementById('canales-lista');
const player = document.getElementById('player');
const playerTitle = document.getElementById('player-title');
const epgContent = document.getElementById('epg-content');

let canales = [];
let canalActual = null;

// Función para parsear M3U y extraer EPG si hay
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

      // Extraer datos EPG (ejemplo si hay tvg-shift o tvg-name para EPG)
      // Para este ejemplo asumiremos que el EPG está en un atributo llamado "tvg-epg" o similar, si no hay, será null
      // Como ejemplo, también puedes agregar el atributo 'epg' en la lista para probar

      let epgMatch = info.match(/epg="([^"]+)"/);
      let epg = epgMatch ? epgMatch[1] : null;

      currentChannel = { name, tvgLogo, group, url: '', epg };
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

    if (canales.length > 0) {
      seleccionarCanal(canales[0]);
    }
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
    div.onclick = () => seleccionarCanal(canal);
    canalesLista.appendChild(div);
  }
}

// Seleccionar canal para reproducir y mostrar EPG
function seleccionarCanal(canal) {
  if (!canal.url) return;
  canalActual = canal;
  player.src = canal.url;
  playerTitle.textContent = canal.name;
  actualizarEPG(canal.epg);
}

// Actualizar el contenido de la guía EPG
function actualizarEPG(epgData) {
  if (!epgData) {
    epgContent.innerHTML = '<p>No hay información EPG disponible para este canal.</p>';
    return;
  }

  // Ejemplo simple: si el epgData es texto plano o JSON simple, se podría parsear aquí.
  // Para este ejemplo, asumimos que epgData es un string con la info que quieres mostrar directamente.
  // Puedes adaptar esto para tu formato real de EPG.

  epgContent.textContent = epgData;
}

window.onload = () => {
  cargarLista();

  // Registrar service worker para PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(() => {
      console.log('Service Worker registrado');
    }).catch(console.error);
  }
};
