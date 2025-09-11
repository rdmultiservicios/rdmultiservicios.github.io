// Cargar archivo XML de EPG
function loadEPGFile(file) {
  const reader = new FileReader();
  reader.onload = () => parseEPG(reader.result);
  reader.readAsText(file);
}

// Parsear EPG XML y almacenar en epgData
function parseEPG(xmlString) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, 'application/xml');
  epgData = {};

  const programmes = xml.querySelectorAll('programme');
  programmes.forEach(prog => {
    const channel = prog.getAttribute('channel');
    const title = prog.querySelector('title')?.textContent || '';
    const desc = prog.querySelector('desc')?.textContent || '';
    const startStr = prog.getAttribute('start');
    const stopStr = prog.getAttribute('stop');

    // Parse fechas (formato: 20210910120000 + timezone)
    const parseDate = str => {
      // Formato esperado: yyyymmddhhmmss + timezone opcional
      // Ejemplo: 20210910120000 +0000
      const datePart = str.substring(0, 14);
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      const hour = datePart.substring(8, 10);
      const min = datePart.substring(10, 12);
      const sec = datePart.substring(12, 14);
      return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
    };

    const start = parseDate(startStr);
    const stop = parseDate(stopStr);

    if (!epgData[channel]) epgData[channel] = [];
    epgData[channel].push({ title, desc, start, stop });
  });

  // Ordenar cada lista por fecha inicio
  for (const ch in epgData) {
    epgData[ch].sort((a, b) => a.start - b.start);
  }

  alert('EPG cargado correctamente');
}
