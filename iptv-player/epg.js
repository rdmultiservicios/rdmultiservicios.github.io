function loadEPGFile(file) {
  const reader = new FileReader();
  reader.onload = () => parseEPG(reader.result);
  reader.readAsText(file);
}

function parseEPG(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  const programmes = xml.querySelectorAll('programme');
  epgData = {};

  programmes.forEach(prog => {
    const channel = prog.getAttribute('channel');
    const start = parseEPGDate(prog.getAttribute('start'));
    const stop = parseEPGDate(prog.getAttribute('stop'));
    const title = prog.querySelector('title')?.textContent || '';
    const desc = prog.querySelector('desc')?.textContent || '';

    if (!epgData[channel]) epgData[channel] = [];
    epgData[channel].push({ start, stop, title, desc });
  });
}

function parseEPGDate(dateStr) {
  const match = dateStr.match(/^(\d{14})/);
  if (!match) return new Date();
  const dt = match[1];
  return new Date(
    dt.substring(0, 4),       // year
    dt.substring(4, 6) - 1,   // month (0-based)
    dt.substring(6, 8),       // day
    dt.substring(8, 10),      // hour
    dt.substring(10, 12),     // minute
    dt.substring(12, 14)      // second
  );
}
