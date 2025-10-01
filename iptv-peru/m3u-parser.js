// Parse M3U string y retorna array de objetos con propiedades: name, url, group, id

function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      const match = line.match(/#EXTINF:-?\d+,(.*)/);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/i);
      current = {
        name: match ? match[1].trim() : 'Sin nombre',
        group: groupMatch ? groupMatch[1].trim() : '',
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
