// Parse M3U y extrae canales con nombre, url, grupo, logo e id

function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let current = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/#EXTINF:-?\d+,(.*)/);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);

      current = {
        name: nameMatch ? nameMatch[1].trim() : 'Sin nombre',
        group: groupMatch ? groupMatch[1].trim() : '',
        logo: logoMatch ? logoMatch[1].trim() : '',
        id: tvgIdMatch ? tvgIdMatch[1].trim() : '',
        url: ''
      };
    } else if (line && !line.startsWith('#') && current) {
      current.url = line;
      channels.push(current);
      current = null;
    }
  }

  return channels;
}
