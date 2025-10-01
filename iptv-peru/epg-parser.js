// Parse XMLTV y genera objeto con clave = nombre canal o id y valor = array de programas

function parseXMLTV(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");
  const programsByChannel = {};

  const programs = xmlDoc.querySelectorAll('programme');

  programs.forEach(prog => {
    const channel = prog.getAttribute('channel');
    const start = prog.getAttribute('start');
    const stop = prog.getAttribute('stop');
    const titleEl = prog.querySelector('title');
    const title = titleEl ? titleEl.textContent : 'Sin título';

    if (!programsByChannel[channel]) {
      programsByChannel[channel] = [];
    }
    programsByChannel[channel].push({ start, stop, title });
  });

  // Ordenar programas por fecha inicio
  for (const ch in programsByChannel) {
    programsByChannel[ch].sort((a, b) => parseXMLTVDate(a.start) - parseXMLTVDate(b.start));
  }

  return programsByChannel;
}

function parseXMLTVDate(dateStr) {
  // Formato XMLTV típico: 20251001120000 +0000 (YYYYMMDDHHMMSS +TZ)
  // Parse simple, ignorando TZ
  const y = dateStr.substr(0, 4);
  const m = dateStr.substr(4, 2);
  const d = dateStr.substr(6, 2);
  const H = dateStr.substr(8, 2);
  const M = dateStr.substr(10, 2);
  const S = dateStr.substr(12, 2);
  return new Date(`${y}-${m}-${d}T${H}:${M}:${S}Z`);
}
