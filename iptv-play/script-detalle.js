// Obtener ID desde ?id=
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let contenido = [];

fetch("contenido.json")
    .then(r => r.json())
    .then(data => {

        contenido = [
            ...data.peliculas,
            ...data.series || [],
            ...data.tv || []
        ];

        const item = contenido.find(x => x.id === id);

        if (!item) return;

        document.getElementById("titulo").textContent = item.titulo;
        document.getElementById("descripcion").textContent = item.descripcion;
        document.getElementById("poster").src = item.poster;

        document.getElementById("background-blur").style.backgroundImage =
            `url('${item.poster}')`;

        // TRAILER
        if (item.trailer) {
            const video = document.getElementById("trailer");

            if (Hls.isSupported()) {
                let hls = new Hls();
                hls.loadSource(item.trailer);
                hls.attachMedia(video);
            } else {
                video.src = item.trailer;
            }
        }

        // PLAY
        document.getElementById("btnPlay").onclick = () =>
            window.location.href = `index.html?play=${item.stream}`;
    });
