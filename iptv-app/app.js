// --------------------------------------------------
// Utilidades para parsear

// Parsea el archivo .m3u
function parseM3U(data) {
  const lines = data.split('\n');
  const channels = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (ln.startsWith('#EXTINF')) {
      const info = ln;
      const url = lines[i + 1]?.trim();
      const nameMatch = info.match(/,(.*)$/);
      const logoMatch = info.match(/tvg-logo="(.*?)"/);
      const groupMatch = info.match(/group-title="(.*?)"/);
      const tvgIdMatch = info.match(/tvg-id="(.*?)"/);

      const channel = {
        name: nameMatch ? nameMatch[1] : 'Canal',
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : '',
        url: url || '',
        tvgId: tvgIdMatch ? tvgIdMatch[1] : ''
      };
      channels.push(channel);
    }
  }
  return channels;
}

// Parsea XMLTV (versión simple usando DOMParser)
function parseXMLTV(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");
  
  const channelElems = Array.from(xml.querySelectorAll('tv > channel'));
  const programmeElems = Array.from(xml.querySelectorAll('tv > programme'));

  const epgChannels = channelElems.map(ch => ({
    id: ch.getAttribute('id'),
    displayName: ch.querySelector('display-name')?.textContent || '',
    icon: ch.querySelector('icon')?.getAttribute('src') || ''
  }));

  const programmes = programmeElems.map(pr => ({
    channel: pr.getAttribute('channel'),
    start: pr.getAttribute('start'),
    stop: pr.getAttribute('stop'),
    title: pr.querySelector('title')?.textContent || '',
    desc: pr.querySelector('desc')?.textContent || ''
  }));

  return { epgChannels, programmes };
}

// Convierte fecha XMLTV string a objeto Date
function parseXmltvDate(str) {
  // ejemplo: "20250920120000 +0000"
  const match = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+\-]\d{4})$/);
  if (!match) return null;
  const [_, year, month, day, hour, minute, second, tz] = match;
  // Construir parte ISO
  const tzFormatted = tz.slice(0,3) + ':' + tz.slice(3);
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${tzFormatted}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

// Obtener programa actual y próximo para un canal dado
function getCurrentAndNextProgramme(epg, tvgId) {
  const now = new Date();
  const progs = epg.programmes.filter(p => p.channel === tvgId);
  const progsWithDates = progs.map(p => {
    const startD = parseXmltvDate(p.start);
    const stopD = parseXmltvDate(p.stop);
    return { ...p, startDate: startD, stopDate: stopD };
  }).filter(p => p.startDate && p.stopDate);
  // ordenar por hora de inicio
  progsWithDates.sort((a, b) => a.startDate - b.startDate);

  let current = null;
  let next = null;
  for (const p of progsWithDates) {
    if (now >= p.startDate && now < p.stopDate) {
      current = p;
    }
    if (p.startDate > now) {
      if (!next) {
        next = p;
      }
    }
  }

  return { current, next };
}

// Formato de hora para mostrar
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
}


// --------------------------------------------------
// Variables globales
let channels = [];
let epg = { epgChannels: [], programmes: [] };

// --------------------------------------------------
// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [m3uText, epgText] = await Promise.all([
      fetch('channels.m3u').then(r => {
        if (!r.ok) throw new Error('No se pudo cargar channels.m3u');
        return r.text();
      }),
      fetch('epg.xml').then(r => {
        if (!r.ok) throw new Error('No se pudo cargar epg.xml');
        return r.text();
      })
    ]);

    channels = parseM3U(m3uText);
    epg = parseXMLTV(epgText);

    renderChannelList(channels);

    if (channels.length > 0) {
      setActiveChannel(channels[0].tvgId);
      playChannel(channels[0].url, channels[0]);
    }
  } catch (err) {
    console.error('Error al inicializar:', err);
  }
});

// --------------------------------------------------
// Renderizar lista de canales
function renderChannelList(channels) {
  const list = document.getElementById('channel-list');
  list.innerHTML = '';
  channels.forEach(ch => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center channel-item bg-dark text-white';
    if (ch.logo) {
      li.innerHTML = `<img src="${ch.logo}" class="me-2" style="width: 40px; height: auto;"> <span>${ch.name}</span>`;
    } else {
      li.innerHTML = `<span>${ch.name}</span>`;
    }
    li.addEventListener('click', () => {
      setActiveChannel(ch.tvgId);
      playChannel(ch.url, ch);
    });
    list.appendChild(li);
  });
}

// Cambiar canal activo visualmente
function setActiveChannel(tvgId) {
  const nodes = document.querySelectorAll('#channel-list .channel-item');
  nodes.forEach(node => {
    node.classList.remove('active');
  });
  const items = Array.from(nodes);
  items.forEach(item => {
    // comparar nombre del canal dentro del item
    if (item.textContent.trim() === (channels.find(ch => ch.tvgId === tvgId)?.name || '')) {
      item.classList.add('active');
    }
  });
}

// --------------------------------------------------
// Reproducción + actualización EPG

function playChannel(url, channel) {
  const player = videojs('video-player');
  player.src({ type: 'application/x-mpegURL', src: url });
  player.play();

  // mostrar info básica
  document.getElementById('epg-title').textContent = channel.name;
  document.getElementById('epg-description').textContent = `Grupo: ${channel.group || 'N/A'} | ID: ${channel.tvgId}`;

  // mostrar programas de la guía
  const { current, next } = getCurrentAndNextProgramme(epg, channel.tvgId);
  const epgEl = document.getElementById('epg-programmes');
  epgEl.innerHTML = ''; // limpiar

  if (current) {
    const divNow = document.createElement('div');
    divNow.innerHTML = `<strong>Ahora:</strong> ${current.title} <em>(${formatTime(current.startDate)} – ${formatTime(current.stopDate)})</em>`;
    epgEl.appendChild(divNow);
  } else {
    const divNoNow = document.createElement('div');
    divNoNow.textContent = 'Ahora: no disponible';
    epgEl.appendChild(divNoNow);
  }

  if (next) {
    const divNext = document.createElement('div');
    divNext.innerHTML = `<strong>Próximo:</strong> ${next.title} <em>(${formatTime(next.startDate)} – ${formatTime(next.stopDate)})</em>`;
    epgEl.appendChild(divNext);
  } else {
    const divNoNext = document.createElement('div');
    divNoNext.textContent = 'Próximo: no disponible';
    epgEl.appendChild(divNoNext);
  }
}
