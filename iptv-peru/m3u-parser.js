function parseM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let current = {};

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('#EXTINF')) {
      const name = line.split(',')[1]?.trim() || 'Canal desconocido';
      const logo = line.match(/tvg-logo="(.*?)"/)?.[1] || '';
      const group = line.match(/group-title="(.*?)"/)?.[1] || 'General';
      current = { name, logo, group };
    } else if (line && !line.startsWith('#')) {
      current.url = line;
      channels.push({ ...current });
    }
  });

  return channels;
}
