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
    const filtered = allChannels.filter(ch =>
      ch.name.toLowerCase().includes(query)
    );
    renderChannels(filtered);
  });
});

function parseM3U(content) {
  const lines = content.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",")[1]?.trim() || "Canal sin nombre";
      const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : "https://via.placeholder.com/100x100?text=Logo";
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
    const button = document.createElement("button");
    button.className = "btn btn-outline-secondary d-flex flex-column align-items-center p-2";
    button.style.width = "75px";
    button.title = channel.name;
    button.innerHTML = `
      <img src="${channel.logo}" alt="${channel.name}" class="img-fluid rounded mb-1" style="width: 50px; height: 50px; object-fit: cover;">
      <small class="text-truncate">${channel.name}</small>
    `;
    button.onclick = () => playChannel(channel);
    container.appendChild(button);
  });
}

function playChannel(channel) {
  const videoContainer = document.getElementById("videoContainer");
  videoContainer.innerHTML = `
    <div class="w-100">
      <h5>${channel.name}</h5>
      <video class="w-100" controls autoplay>
        <source src="${channel.url}" type="application/x-mpegURL">
        Tu navegador no soporta video HTML5.
      </video>
    </div>
  `;
}
