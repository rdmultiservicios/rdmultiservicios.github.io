document.addEventListener("DOMContentLoaded", () => {
  fetch("channels.m3u")
    .then(response => response.text())
    .then(data => parseM3U(data))
    .catch(error => console.error("Error cargando el archivo M3U:", error));
});

function parseM3U(m3uContent) {
  const lines = m3uContent.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF")) {
      const info = line;
      const url = lines[i + 1]?.trim();

      const nameMatch = info.match(/,(.*)$/);
      const logoMatch = info.match(/tvg-logo="(.*?)"/);

      const name = nameMatch ? nameMatch[1] : "Canal desconocido";
      const logo = logoMatch ? logoMatch[1] : "https://via.placeholder.com/150";

      channels.push({ name, logo, url });
    }
  }

  displayChannels(channels);
}

function displayChannels(channels) {
  const list = document.getElementById("channelList");
  list.innerHTML = "";

  channels.forEach(channel => {
    const col = document.createElement("div");
    col.className = "col";

    col.innerHTML = `
      <div class="card h-100">
        <img src="${channel.logo}" class="card-img-top" alt="${channel.name}">
        <div class="card-body">
          <h5 class="card-title">${channel.name}</h5>
          <button class="btn btn-primary w-100" onclick="playChannel('${channel.name}', '${channel.url}')">
            Ver canal
          </button>
        </div>
      </div>
    `;

    list.appendChild(col);
  });
}

function playChannel(name, url) {
  const video = document.getElementById("videoPlayer");
  const title = document.getElementById("playerTitle");

  title.textContent = name;
  video.src = url;
  video.load();

  const modal = new bootstrap.Modal(document.getElementById("playerModal"));
  modal.show();
}
