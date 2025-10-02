document.addEventListener("DOMContentLoaded", () => {
  const channelListEl = document.getElementById("channelList");
  const videoEl = document.getElementById("videoPlayer");

  fetch("canales.m3u")
    .then(response => response.text())
    .then(data => {
      const channels = parseM3U(data);
      channels.forEach((ch, i) => {
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-primary w-100 text-start mb-2";
        btn.innerHTML = `<strong>${ch.name}</strong>`;
        btn.onclick = () => loadChannel(ch.url);
        channelListEl.appendChild(btn);

        if (i === 0) loadChannel(ch.url); // auto load first
      });
    });

  function loadChannel(url) {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoEl);
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
    } else {
      alert("Tu navegador no soporta HLS");
    }
  }

  function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    let name = "";
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF')) {
        name = lines[i].split(',')[1]?.trim();
      } else if (lines[i].startsWith('http')) {
        channels.push({ name, url: lines[i].trim() });
      }
    }
    return channels;
  }

  // PWA registration
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});
