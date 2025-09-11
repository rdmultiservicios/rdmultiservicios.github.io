function loadEPGFile(file) {
  const reader = new FileReader();
  reader.onload = () => parseEPG(reader.result);
  reader.readAsText(file);
}

function parseEPG(xmlContent) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlContent, 'text/xml');
  const programmes = xml.querySelectorAll('programme');

  epgData = {};

  programmes.forEach(prog => {
    const channel = prog.getAttribute('channel');
    const start = parseDate(prog.getAttribute('start'));
    const stop = parseDate(prog.getAttribute('stop'));
    const title = prog.querySelector('title')?.textContent || '';
    const desc = prog.querySelector('desc')?.textContent || '';

    if (!epgData[channel]) epgData[channel] = [];
    epgData[channel].push({ start, stop, title, desc });
  });
}

function parseDate(str) {
  const match = str.match(/^(\d{14})/);
  if (!match) return new Date(0);
  const dateStr = match[1];
  const year = +dateStr.slice(0, 4);
  const month = +dateStr.slice(4, 6) - 1;
  const day = +dateStr.slice(6, 8);
  const hour = +dateStr.slice(8, 10);
  const minute = +dateStr.slice(10, 12);
  const second = +dateStr.slice(12, 14);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}
