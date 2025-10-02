document.getElementById('m3uFile').addEventListener('change', handleFile);
document.getElementById('searchInput').addEventListener('input', filterChannels);
document.getElementById('groupFilter').addEventListener('change', filterChannels);

let allChannels = [];

async function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  allChannels = parseM3U(text);

  populateGroupFilter(allChannels);
  displayChannels(allChannels);
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
          name: info[4]?.trim() || 'Sin nombre',
          logo: info[2]?.trim() || '',
          group: info[3]?.trim() || '',
          url: ''
        };
      }
    } else if (line && !line.startsWith('#')) {
      current.url = line.trim();
      channels.push({ ...current });
    }
  }

  return channels;
}

function populateGroupFilter(channels) {
  const groupSelect = document.getElementById('groupFilter');
  const groups = [...new Set(channels.map(c => c.group).filter(Boolean))].sort();

  groupSelect.innerHTML = `<option value="">Todos los grupos</option>`;
  groups.forEach(group => {
    const option = document.createElement('option');
    option.value = group;
    option.textContent = group;
    groupSelect.appendChild(option);
  });
}

function filterChannels() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const group = document.getElementById('groupFilter').value;

  const filtered = allChannels.filter(channel => {
    const matchesName = channel.name.toLowerCase().includes(search);
    const matchesGroup = group ? channel.group === group : true;
    return matchesName && matchesGroup;
  });

  displayChannels(filtered);
}

function displayChannels(channels) {
  const container = document.getElementById('channelList');
  container.innerHTML = '';

  channels.forEach((channel, i) => {
    const div = document.createElement('div');
    div.className = 'channel-card';
    div.onclick = () => playChannel(i, channels);

    div.innerHTML = `
      <img src="${channel.logo}" alt="${channel.name}" class="channel-logo">
      <div class="channel-info">
        <div class="channel-name">${channel.name}</div>
        <div class="channel-group">${channel.group}</div>
      </div>
    `;

    container.appendChild(div);
  });

  window.filteredChannelList = channels;
}
