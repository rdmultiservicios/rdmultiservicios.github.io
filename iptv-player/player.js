let channels = [];
let epgData = {};

// Cargar lista M3U desde archivo
document.getElementById('playlistFile').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => parseM3U(reader.result);
    reader.readAsText(file);
  }
});

// Cargar EPG desde archivo
document.getElementById('epgFile').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    loadEPGFile(file);
  }
});

// Cargar canal o VOD desde URL con validación mejorada
document.getElementById('loadFromUrl').addEventListener('click', () => {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) {
    alert("Por favor ingresa una URL.");
    return;
  }

  // Validar protocolo http o https
  if (!/^https?:\/\//i.test(url)) {
    alert("La URL debe comenzar con http:// o https://");
    return;
  }

  const title = prompt("Nombre del canal o video:", "Reproducción desde URL");
  const lowerUrl = url.toLowerCase();

  // Detectar tipo para agrupar
  let group = "Otros";
  if (lowerUrl.endsWith('.mp4')) {
    group = "VOD";
  } else if (lowerUrl.endsWith('.m3u8')) {
    group = "Live";
  }

  const channel = {
    title: title || "Reproducción desde URL",
    url,
    logo: null,
    group,
    tvgId: null
  };

  channels.push(channel);
  renderAll();
  playChannel(channel);
});

// Buscar canales o VOD
document.getElementById('searchInput').addEventListener('input', () => {
  renderAll();
});

// Reproducir canal o VOD con manejo de errores
function playChannel(channel) {
  const video = document.getElementById('videoPlayer');

  // Detener stream anterior
  if (video.hls) {
    video.hls.destroy();
    video.hls = null;
  }

  const isHls = channel.url.toLowerCase().endsWith('.m3u8');
  const isMp4 = channel.url.toLowerCase().endsWith('.mp4');

  if (isHls && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
    video.hls = hls;

    hls.on(Hls.Events.ERROR, function(event, data) {
      if (data.fatal) {
        alert("Error fatal al reproducir stream HLS: " + data.details);
        hls.destroy();
      }
    });

  } else {
    // Para .mp4 o navegadores con soporte nativo HLS
    video.src = channel.url;
    video.load();
  }

  video.play().catch(err => {
    console.error("Error al reproducir:", err);
    alert("No se pudo reproducir el video. Verifica la URL y el formato.");
  });

  // Mostrar EPG si disponible
  const epg = epgData[channel.tvgId] || [];
  const now = new Date();
  const current = epg.find(p => now >= p.start && now <= p.stop);
  document.getElementById('epgInfo').textContent = current
    ? `${current.title} (${formatTime(current.start)} - ${formatTime(current.stop)})`
    : 'Sin información EPG disponible';
}

// Formatear hora
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Parsear archivo M3U
function parseM3U(text) {
  channels = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF')) {
      const info = line;
      const url = lines[++i]?.trim();
      if (!url) continue;

      const titleMatch = info.match(/,(.*)$/);
      const tvgIdMatch = info.match(/tvg-id="(.*?)"/);
      const logoMatch = info.match(/tvg-logo="(.*?)"/);
      const groupMatch = info.match(/group-title="(.*?)"/);

      channels.push({
        title: titleMatch ? titleMatch[1] : url,
        url,
        logo: logoMatch ? logoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'Otros',
        tvgId: tvgIdMatch ? tvgIdMatch[1] : null
      });
    }
  }
  renderAll();
}

// Filtrar canales por tipo y búsqueda
function filterChannels(type) {
  return channels.filter(c => {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const match = c.title.toLowerCase().includes(query);
    if (type === 'vod') return match && (c.group.toLowerCase() === 'vod' || c.url.toLowerCase().endsWith('.mp4'));
    if (type === 'favorites') return match && isFavorite(c);
    return match && !c.url.toLowerCase().endsWith('.mp4') && c.group.toLowerCase() !== 'vod';
  });
}

// Renderizar todo (canales, VOD, favoritos)
function renderAll() {
  renderChannels(filterChannels('live'));
  renderVOD(filterChannels('vod'));
  renderFavorites();
}

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  renderAll();
});

/* === MODO OSCURO === */
const themeToggleBtn = document.getElementById('themeToggle');

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️ Modo claro';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggleBtn.textContent = '🌙 Modo oscuro';
  }
  localStorage.setItem('theme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});
