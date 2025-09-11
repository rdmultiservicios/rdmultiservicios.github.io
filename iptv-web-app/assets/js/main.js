document.getElementById('loadPlaylistBtn').addEventListener('click', () => {
  document.getElementById('m3uFile').click();
});

document.getElementById('m3uFile').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const channels = parseM3U(content);
    displayChannels(channels);
  };
  reader.readAsText(file);
});

function parseM3U(m3uText) {
  const lines = m3uText.split('\n');
  const channels = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const name = lines[i].split(',')[1];
      const url = lines[i + 1];
      if (url && url.startsWith('http')) {
        channels.push({ name, url });
      }
    }
  }
  return channels;
}

function displayChannels(channels) {
  const list = document.getElementById('channelList');
  list.innerHTML = '';

  channels.forEach(channel => {
    const li = document.createElement('li');
    li.className = 'list-group-item list-group-item-dark';
    li.textContent = channel.name;
    li.addEventListener('click', () => {
      playChannel(channel.url);
    });
    list.appendChild(li);
  });
}

function playChannel(url) {
  const video = document.getElementById('videoPlayer');
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
  } else {
    alert('Tu navegador no soporta HLS');
  }
}
