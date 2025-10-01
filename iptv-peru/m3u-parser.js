// Parse M3U y extrae canales con nombre, url, grupo, imagen, id etc.

function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/#EXTINF:-?\d+,(.*)/);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);

      current = {
        name: nameMatch ? nameMatch[1].trim() : 'Sin nombre',
        group: groupMatch ? groupMatch[1].trim() : 'Sin grupo',
        logo: logoMatch ? logoMatch[1].trim() : '',
        id: tvgIdMatch ? tvgIdMatch[1].trim() : '',
        url: ''
      };
    } else if (line.trim() && !line.startsWith('#') && current) {
      current.url = line.trim();
      channels.push(current);
      current = null;
    }
  }
  return channels;
}
