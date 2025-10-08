let allChannels = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("channels.m3u")
    .then(response => response.text())
    .then(data => {
      allChannels = parseM3U(data);
      renderChannels(allChannels);
    });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allChannels.filter(ch => ch.name.toLowerCase().includes(query));
    renderChannels(filtered);
  });

  // Toggle dark mode
  document.getElementById("toggleTheme").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });
});

function parseM3U(content) {
  const lines = content.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",")[1]?.trim() || "Canal";
      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : "https://via.placeholder.com/50x50?text=Logo";
      const url = lines[i + 1]?.trim();
      if (url && url.startsWith("http")) {
        channels.push({ name, logo, url });
      }
    }
  }

  return channels;
}

function renderChannels(channels) {
  const container = document.getElementById("channelList");
  container.innerHTML = "";

  channels.forEach(channel => {
    const btn = document.createElement("div");
    btn.className = "channel-button";
    btn.innerHTML = `
      <img src="${channel.logo}" alt="${channel.name}">
      <span>${channel.name}</span>
    `;
    btn.onclick = () => playChannel(channel);
    container.appendChild(btn);
  });
}

function playChannel(channel) {
  const container = document.getElementById("videoContainer");

  container.innerHTML = `
    <h5>${channel.name}</h5>
    <video id="videoPlayer" class="video-js vjs-default-skin" controls autoplay width="100%" height="400"></video>
  `;

  const player = videojs('videoPlayer', {
    fluid: true,
    autoplay: true,
    controls: true,
    preload: 'auto'
  });

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(player.tech().el_);
  } else {
    player.src({ type: "application/x-mpegURL", src: channel.url });
  }
}
