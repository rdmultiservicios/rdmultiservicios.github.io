let videoElement = document.getElementById('videoPlayer');
let epgInfoDiv = document.getElementById('epgInfo');

async function playChannel(index, list) {
  const channel = list[index];
  document.getElementById('channelTitle').innerText = channel.name;
  epgInfoDiv.innerHTML = 'Cargando EPG...';

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(videoElement);
  } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
    videoElement.src = channel.url;
  } else {
    epgInfoDiv.innerHTML = 'Tu navegador no soporta este formato.';
  }

  const epg = await fetchEPG(channel.name);
  epgInfoDiv.innerHTML = epg || 'EPG no disponible.';
}

async function fetchEPG(channelName) {
  try {
    const response = await fetch('epg.json');
    const data = await response.json();
    const now = new Date();

    const program = data[channelName]?.find(p => {
      const start = new Date(p.start);
      const end = new Date(p.end);
      return now >= start && now <= end;
    });

    if (program) {
      return `
        <strong>${program.title}</strong><br>
        ${program.description}<br>
        <small>${program.start} - ${program.end}</small>
      `;
    }
  } catch (e) {
    console.error("EPG error:", e);
  }
  return null;
}
