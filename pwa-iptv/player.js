let videoElement = document.getElementById('videoPlayer');
let modal = new bootstrap.Modal(document.getElementById('playerModal'));
let epgInfoDiv = document.getElementById('epgInfo');

async function playChannel(index) {
  const channel = window.channelList[index];

  document.getElementById('channelTitle').innerText = channel.name;
  videoElement.src = channel.url;
  epgInfoDiv.innerHTML = 'Cargando EPG...';

  modal.show();

  const epg = await fetchEPG(channel.name);
  epgInfoDiv.innerHTML = epg || 'EPG no disponible.';
}

async function fetchEPG(channelName) {
  try {
    // Simulación. Usa un XMLTV a JSON si tienes acceso real
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
