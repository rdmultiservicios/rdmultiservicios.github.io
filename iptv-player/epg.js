// Cargar archivo EPG y parsear
function loadEPGFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(reader.result, "application/xml");
    parseEPG(xml);
  };
  reader.readAsText(file);
}

// Parsear XMLTV
function parseEPG(xml) {
  epgData = {};

  const programmes = xml.querySelectorAll("programme");

  programmes.forEach(program => {
    const channelId = program.getAttribute("channel");
    const startStr = program.getAttribute("start");
    const stopStr = program.getAttribute("stop");

    const titleEl = program.querySelector("title");
    const title = titleEl ? titleEl.textContent : "Sin título";

    const start = parseEPGDate(startStr);
    const stop = parseEPGDate(stopStr);

    if (!epgData[channelId]) {
      epgData[channelId] = [];
    }

    epgData[channelId].push({
      title,
      start,
      stop
    });
  });

  console.log("EPG cargado:", epgData);
}

// Convertir fecha XMLTV a Date
function parseEPGDate(str) {
  // Ejemplo: 20250910120000 +0000
  const clean = str.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  const year = parseInt(clean.slice(0, 4));
  const month = parseInt(clean.slice(4, 6)) - 1;
  const day = parseInt(clean.slice(6, 8));
  const hour = parseInt(clean.slice(8, 10));
  const minute = parseInt(clean.slice(10, 12));
  const second = parseInt(clean.slice(12, 14));

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}
