let allChannels = [];
let player;

document.addEventListener("DOMContentLoaded", () => {
  fetch("channels.m3u")
    .then(response => response.text())
    .then(data => {
      allChannels = parseM3U(data);
      renderChannels(allChannels);
      initPlayer();
    });

  // Filtros desktop
  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("categoryFilter").addEventListener("change", applyFilters);

  // Filtros móvil
  const searchInputMobile = document.getElementById("searchInputMobile");
  if (searchInputMobile) {
    searchInputMobile.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = allChannels.filter(ch => ch.name.toLowerCase().includes(query));
      renderChannels(filtered);
    });
  }

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

      // Extraemos categoría si existe (ejemplo: group-title="news")
      const catMatch = lines[i].match(/group-title="(.*?)"/);
      const category = catMatch ? catMatch[1].toLowerCase() : null;

      const url = lines[i + 1]?.trim();
      if (url && url.startsWith("http")) {
        channels.push({ name, logo, url, category });
      }
    }
  }

  return channels;
}

function renderChannels(channels) {
  // Desktop grid
  const desktopGrid = document.getElementById("channelGridDesktop");
  if (desktopGrid) {
    desktopGrid.innerHTML = "";
    channels.forEach(channel => {
      const btn = document.createElement("div");
      btn.className = "channel-button";
      btn.title = channel.name;
      btn.innerHTML = `
        <img src="${channel.logo}" alt="${channel.name}" style="width:50px;height:50px;border-radius:4px;">
        <small>${channel.name}</small>
      `;
      btn.onclick = () => playChannel(channel);
      desktopGrid.appendChild(btn);
    });
  }

  // Móvil grid
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
      btn.onclick = () => playChannel(channel);
      mobileGrid.appendChild(btn);
    });
  }
}

function applyFilters() {
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const categoryValue = document.getElementById("categoryFilter").value;

  const filtered = allChannels.filter(ch => {
    const matchName = ch.name.toLowerCase().includes(searchValue);
    const matchCategory = categoryValue === "all" || (ch.category && ch.category.toLowerCase() === categoryValue);
    return matchName && matchCategory;
  });

  renderChannels(filtered);
}

function initPlayer() {
  player = videojs('videoPlayer', {
    fluid: true,
    autoplay: false,
    controls: true,
    preload: 'auto',
    html5: {
      hls: {
        overrideNative: true
      }
    }
  });
}

function playChannel(channel) {
  if (!player) return;
  player.src({ src: channel.url, type: 'application/x-mpegURL' });
  player.play();
}
