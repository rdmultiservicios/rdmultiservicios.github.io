document.getElementById("m3uFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const text = event.target.result;
    const channels = parseM3U(text);
    renderChannelList(channels);
  };
  reader.readAsText(file);
});

function parseM3U(content) {
  const lines = content.split(/\r?\n/);
  const channels = [];
  let current = {};

  lines.forEach(line => {
    line = line.trim();

    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      current = {
        name: nameMatch ? nameMatch[1] : "Canal desconocido",
        logo: logoMatch ? logoMatch[1] : null,
        url: ''
      };
    } else if (line && !line.startsWith('#')) {
      current.url = line;
      channels.push({ ...current });
    }
  });

  return channels;
}

function renderChannelList(channels) {
  const list = document.getElementById("channelList");
  list.innerHTML = "";

  channels.forEach(channel => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-action bg-secondary text-light d-flex align-items-center";
    li.style.cursor = "pointer";

    if (channel.logo) {
      const img = document.createElement("img");
      img.src = channel.logo;
      img.alt = "Logo";
      img.width = 40;
      img.className = "me-2";
      li.appendChild(img);
    }

    const span = document.createElement("span");
    span.textContent = channel.name;
    li.appendChild(span);

    li.addEventListener("click", () => playChannel(channel.url));

    list.appendChild(li);
  });
}

function playChannel(url) {
  const video = document.getElementById("videoPlayer");

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.addEventListener('loadedmetadata', () => video.play());
  } else {
    alert("Tu navegador no soporta la reproducción de este canal.");
  }
}
