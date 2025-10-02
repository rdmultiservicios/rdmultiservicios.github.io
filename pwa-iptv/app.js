document.getElementById('m3uFile').addEventListener('change', handleFile);

async function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  const channels = parseM3U(text);
  displayChannels(channels);
}

function parseM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let current = {};

  for (let line of lines) {
    line = line.trim();

    if (line.startsWith('#EXTINF:')) {
      const info = line.match(/#EXTINF:-1.*?(?:tvg-name="([^"]*)")?.*?(?:tvg-logo="([^"]*)")?.*?(?:group-title="([^"]*)")?.*?,(.*)/);
      if (info) {
        current = {
          name: info[4] || 'Sin nombre',
          logo: info[2] || '',
          group: info[3] || '',
          url: ''
        };
      }
    } else if (line && !line.startsWith('#')) {
      current.url = line;
      channels.push({ ...current });
    }
  }

  return channels;
}

function displayChannels(channels) {
  const container = document.getElementById('channelList');
  container.innerHTML = '';

  channels.forEach((channel, i) => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-3 mb-3';
    col.innerHTML = `
      <div class="channel-card" onclick="playChannel(${i})">
        <img src="${channel.logo}" alt="${channel.name}" class="channel-logo">
        <div>${channel.name}</div>
        <small>${channel.group}</small>
      </div>
    `;
    container.appendChild(col);
  });

  window.channelList = channels; // global
}
