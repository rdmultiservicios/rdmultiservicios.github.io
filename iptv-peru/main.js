document.addEventListener("DOMContentLoaded", () => {
  const channelListEl = document.getElementById("channelList");
  const videoEl = document.getElementById("videoPlayer");
  const groupFilterEl = document.getElementById("groupFilter");
  const fileInput = document.getElementById("fileInput");
  const currentProgramEl = document.getElementById("currentProgram");
  const upcomingProgramsEl = document.getElementById("upcomingPrograms");
  
  // URL pública EPG Perú (XMLTV)
  const epgUrl = "https://raw.githubusercontent.com/mudstein/XML/main/Peru/peru.xml";

  let channels = [];
  let filteredChannels = [];
  let xmlEPG = null;
  let currentHls = null;
  let activeChannel = null;

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
      item.className = "channel-item d-flex align-items-center mb-2";
      item.title = ch.name;

      if(activeChannel && activeChannel.url === ch.url) {
        item.classList.add("active");
      }

      item.innerHTML = `
        <img src="${ch.logo}" alt="${ch.name}" class="channel-logo" />
        <div>
          <div class="fw-semibold">${ch.name}</div>
          <small class="text-muted">${ch.group}</small>
        </div>
      `;

      item.onclick = () => {
        activeChannel = ch;
        loadChannel(ch);
        renderChannels(filteredChannels);
      };

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
      currentProgramEl.textContent = `Ahora: ${title ? title.textContent : "Sin título"}`;
    } else {
      currentProgramEl.textContent = "No hay programa actual";
    }

    upcomingProgramsEl.innerHTML = "";
    prog.siguientes.forEach(p => {
      const title = p.querySelector('title');
      const start = parseXMLTVDate(p.getAttribute("start"));
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${title ? title.textContent : "Sin título"}`;
      upcomingProgramsEl.appendChild(li);
    });
  }

  // Carga archivo M3U default y EPG
  async function init() {
    try {
      // Ejemplo: carga archivo M3U inicial (reemplaza con URL o local)
      const m3uUrl = "https://tu-servidor.com/tu-archivo.m3u"; // Cambia a tu fuente real
      const m3uResponse = await fetch(m3uUrl);
      const m3uText = await m3uResponse.text();
      channels = parseM3U(m3uText);

      // Carga EPG XML
      xmlEPG = await loadEPG(epgUrl);

      setupFilters();
      applyFilter();
      if(channels.length) {
        activeChannel = channels[0];
        loadChannel(activeChannel);
      }
    } catch(e) {
      alert("Error cargando canales o EPG: " + e.message);
    }
  }

  // Configura filtro de grupos
  function setupFilters() {
    const groups = [...new Set(channels.map(c => c.group))].sort();
    groupFilterEl.innerHTML = `<option value="all">Todos los grupos</option>` +
      groups.map(g => `<option value="${g}">${g}</option>`).join('');
    
    groupFilterEl.onchange = () => {
      applyFilter();
    };
  }

  function applyFilter() {
    const selectedGroup = groupFilterEl.value;
    if(selectedGroup === "all") {
      filteredChannels = channels;
    } else {
      filteredChannels = channels.filter(ch => ch.group === selectedGroup);
    }
    renderChannels(filteredChannels);
  }

  // Carga archivo .m3u local
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      channels = parseM3U(reader.result);
      setupFilters();
      applyFilter();
      if(channels.length) {
        activeChannel = channels[0];
        loadChannel(activeChannel);
      }
    };
    reader.readAsText(file);
  });

  // Inicia la app
  init();
});
