document.addEventListener("DOMContentLoaded", () => {
  const channelListEl = document.getElementById("channelList");
  const videoEl = document.getElementById("videoPlayer");
  const groupFilterEl = document.getElementById("groupFilter");
  const fileInput = document.getElementById("fileInput");
  const currentProgramEl = document.getElementById("currentProgram");
  const upcomingProgramsEl = document.getElementById("upcomingPrograms");
  const epgUrl = "https://raw.githubusercontent.com/mudstein/XML/main/Peru/peru.xml";

  let channels = [];
  let filteredChannels = [];
  let xmlEPG = null;
  let currentHls = null;

  // Carga archivo EPG XML
  function loadEPG(url) {
    return fetch(url)
      .then(res => res.text())
      .then(text => {
        const parser = new DOMParser();
        return parser.parseFromString(text, "application/xml");
      });
  }

  // Parsea .m3u
  function parseM3U(data) {
    const lines = data.split('\n').map(l => l.trim()).filter(l => l !== "");
    const result = [];

    for(let i = 0; i < lines.length; i++) {
      if(lines[i].startsWith('#EXTINF')) {
        const infoLine = lines[i];
        const url = lines[i+1];

        const nameMatch = infoLine.match(/tvg-name="([^"]+)"/);
        const logoMatch = infoLine.match(/tvg-logo="([^"]+)"/);
        const groupMatch = infoLine.match(/group-title="([^"]+)"/);
        const idMatch = infoLine.match(/tvg-id="([^"]+)"/);

        const name = nameMatch ? nameMatch[1] : "Canal sin nombre";
        const logo = logoMatch ? logoMatch[1] : "";
        const group = groupMatch ? groupMatch[1] : "Sin grupo";
        const id = idMatch ? idMatch[1] : null;

        result.push({ name, logo, group, url, id });
      }
    }

    return result;
  }

  // Renderiza lista de canales según filtro
  function renderChannels(chList) {
    channelListEl.innerHTML = "";
    chList.forEach(ch => {
      const item = document.createElement("div");
      item.className = "channel-item d-flex align-items-center mb-3";
      item.style.cursor = "pointer";
      item.title = ch.name;

      item.innerHTML = `
        <img src="${ch.logo}" alt="${ch.name}" class="me-2 channel-logo" />
        <div>
          <div class="fw-bold">${ch.name}</div>
          <div class="text-muted small">${ch.group}</div>
        </div>
      `;

      item.onclick = () => loadChannel(ch);

      channelListEl.appendChild(item);
    });
  }

  // Carga canal en video
  function loadChannel(ch) {
    if (currentHls) {
      currentHls.destroy();
      currentHls = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(ch.url);
      hls.attachMedia(videoEl);
      currentHls = hls;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = ch.url;
    } else {
      alert("Tu navegador no soporta reproducción HLS.");
      return;
    }

    updateEPGDisplay(ch);
  }

  // Obtiene programación actual y siguientes del canal
  function getProgramacionParaCanal(xml, channelId) {
    if(!xml || !channelId) return null;
    const programmes = Array.from(xml.querySelectorAll(`programme[channel="${channelId}"]`));
    const ahora = new Date();

    const actual = programmes.find(p => {
      const start = parseXMLTVDate(p.getAttribute("start"));
      const stop = parseXMLTVDate(p.getAttribute("stop"));
      return ahora >= start && ahora < stop;
    });

    const siguientes = programmes.filter(p => {
      const start = parseXMLTVDate(p.getAttribute("start"));
      return start > ahora;
    }).slice(0,5);

    return { actual, siguientes };
  }

  // Parsea fecha formato XMLTV: 20231001230000 +0000
  function parseXMLTVDate(str) {
    if(!str) return null;
    // Extrae fecha y zona horaria si existe
    // Ej: "20231001230000 +0000"
    const datePart = str.substr(0,14);
    const year = parseInt(datePart.substr(0,4));
    const month = parseInt(datePart.substr(4,2)) - 1;
    const day = parseInt(datePart.substr(6,2));
    const hour = parseInt(datePart.substr(8,2));
    const min = parseInt(datePart.substr(10,2));
    const sec = parseInt(datePart.substr(12,2));

    // Para simplicidad asumimos UTC
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  }

  // Actualiza panel EPG en la UI
  function updateEPGDisplay(channel) {
    if (!xmlEPG || !channel.id) {
      currentProgramEl.textContent = "Sin datos de EPG para este canal";
      upcomingProgramsEl.innerHTML = "";
      return;
    }

    const prog = getProgramacionParaCanal(xmlEPG, channel.id);
    if (!prog) {
      currentProgramEl.textContent = "Sin programación disponible";
      upcomingProgramsEl.innerHTML = "";
      return;
    }

    if(prog.actual) {
      const title = prog.actual.querySelector('title');
      currentProgramEl.textContent = `Ahora: ${title ? title.textContent : 'Sin título'}`;
    } else {
      currentProgramEl.textContent = "Actualmente no hay programa activo";
    }

    upcomingProgramsEl.innerHTML = "";
    prog.siguientes.forEach(p => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      const start = parseXMLTVDate(p.getAttribute("start"));
      const title = p.querySelector('title');
      li.textContent = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${title ? title.textContent : 'Sin título'}`;
      upcomingProgramsEl.appendChild(li);
    });
  }

  // Filtra canales por grupo
  function filterChannelsByGroup(group) {
    if (group === "all") {
      filteredChannels = channels;
    } else {
      filteredChannels = channels.filter(c => c.group === group);
    }
    renderChannels(filteredChannels);
    if(filteredChannels.length > 0) loadChannel(filteredChannels[0]);
  }

  // Llena selector de grupos
  function loadGroups() {
    const groups = [...new Set(channels.map(c => c.group))].sort();
    groupFilterEl.innerHTML = '<option value="all">Todos</option>';
    groups.forEach(g => {
      const option = document.createElement("option");
      option.value = g;
      option.textContent = g;
      groupFilterEl.appendChild(option);
    });
  }

  // Maneja archivo m3u personalizado
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      channels = parseM3U(reader.result);
      loadGroups();
      filterChannelsByGroup("all");
    };
    reader.readAsText(file);
  });

  // Cambio de filtro grupo
  groupFilterEl.addEventListener("change", e => {
    filterChannelsByGroup(e.target.value);
  });

  // Carga inicial .m3u y EPG
  fetch("canales.m3u")
    .then(res => res.text())
    .then(text => {
      channels = parseM3U(text);
      loadGroups();
      filterChannelsByGroup("all");
    });

  loadEPG(epgUrl).then(xml => {
    xmlEPG = xml;
    // Actualizar EPG para canal inicial (si existe)
    if(filteredChannels && filteredChannels.length > 0) {
      updateEPGDisplay(filteredChannels[0]);
    }
  }).catch(() => {
    currentProgramEl.textContent = "No se pudo cargar la EPG.";
  });
});
