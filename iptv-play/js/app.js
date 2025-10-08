let allChannels = [];
let player;

document.addEventListener("DOMContentLoaded", () => {
  fetch("channels.m3u")
    .then(response => response.text())
    .then(data => {
      allChannels = parseM3U(data);
      renderChannels(allChannels);
    });

  initPlayer();

  // Eventos de búsqueda desktop y móvil
  document.getElementById("searchInput")?.addEventListener("input", onSearch);
  document.getElementById("searchInputMobile")?.addEventListener("input", onSearch);

  // Toggle dark mode
  document.getElementById("toggleTheme")?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });
});

function onSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = allChannels.filter(ch => ch.name.toLowerCase().includes(query));
  renderChannels(filtered);
}

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
  // Desktop container
  const container = document.getElementById("channelList");
  if (container) {
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

  // Mobile container
  const mobileGrid = document.getElementById("channelGridMobile");
  if (mobileGrid) {
    mobileGrid.innerHTML = "";
    channels.forEach(channel => {
      const btn = document.createElement("div");
      btn.className = "channel-button";
      btn.innerHTML = `
        <img src="${channel.logo}" alt="${channel.name}" style="width:40px;height:40px;border-radius:4px;">
        <small>${channel.name}</small>
      `;
      btn.onclick = () => {
        playChannel(channel);
        scrollToPlayerMobile();
      };
      mobileGrid.appendChild(btn);
    });
  }
}

function initPlayer() {
  player = videojs('videoPlayer', {
    fluid: true,
    autoplay: false,
    controls: true,
    preload: 'auto',
    playsinline: true,
  });
}

function playChannel(channel) {
  if (!player) return;
  updatePlayerTitle(channel.name);

  if (window.Hls && Hls.isSupported()) {
    const tech = player.tech(true);
    if (tech) {
      // destruye instancia anterior si existe
      if (player.hls) {
        player.hls.destroy();
        player.hls = null;
      }
      const hls = new Hls();
      player.hls = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(tech.el());
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        player.play();
      });
    }
  } else {
    player.src({ src: channel.url, type: 'application/x-mpegURL' });
    player.play();
  }
}

function updatePlayerTitle(name) {
  const titleEl = document.getElementById("videoTitle");
  if (titleEl) {
    titleEl.textContent = name;
  }
}

function scrollToPlayerMobile() {
  if (window.innerWidth < 768) {
    const container = document.getElementById("videoContainer");
    if (container) {
      setTimeout(() => {
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }
}
