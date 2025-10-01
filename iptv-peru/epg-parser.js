function parseXMLTV(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const programs = {};

  const entries = xml.querySelectorAll('programme');
  entries.forEach(entry => {
    const channel = entry.getAttribute('channel');
    const title = entry.querySelector('title')?.textContent;
    const start = entry.getAttribute('start');
    const stop = entry.getAttribute('stop');
    if (!programs[channel]) programs[channel] = [];
    programs[channel].push({ title, start, stop });
  });

  return programs;
}
