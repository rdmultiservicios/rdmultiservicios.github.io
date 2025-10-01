// Parse XMLTV y retorna un objeto de programas por canal (key = canal id o nombre)

function parseXMLTV(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
  const programMap = {};

  const programmes = xmlDoc.querySelectorAll('programme');
  programmes.forEach(prog => {
    const chan = prog.getAttribute('channel');  // canal id
    const start = prog.getAttribute('start');
    const stop = prog.getAttribute('stop');
    const titleEl = prog.querySelector('title');
    const title = titleEl ? titleEl.textContent : '';

    if (!programMap[chan]) {
      programMap[chan] = [];
    }
    programMap[chan].push({ start, stop, title });
  });

  // Ordenar cronológicamente
  for (const chan in programMap) {
    programMap[chan].sort((a, b) => {
      return parseXMLTVDate(a.start) - parseXMLTVDate(b.start);
    });
  }

  return programMap;
}

function parseXMLTVDate(dt) {
  // formato: YYYYMMDDHHMMSS +TZ o sin zona
  const s = dt.trim().split(' ')[0];
  const year = s.slice(0,4);
  const month = s.slice(4,6);
  const day = s.slice(6,8);
  const hour = s.slice(8,10);
  const minute = s.slice(10,12);
  const second = s.slice(12,14) || '00';
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}
