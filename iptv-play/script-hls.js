let contenido = {};
let canales = [];

// ---------------- LAZY LOADING -------------------
const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            const img = e.target;
            img.src = img.dataset.src;
            lazyObserver.unobserve(img);
        }
    });
});

// ---------------- PLAYER ----------------------
function play(url){
    const video = document.getElementById("player");

    if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
    } else {
        video.src = url;
    }
}

// ---------------- BUSCADOR GLOBAL -----------------------
function buscarGeneral(){
    const q = document.getElementById("searchBox").value.toLowerCase();
    document.querySelectorAll(".card-item").forEach(card => {
        const title = card.dataset.title.toLowerCase();
        card.style.display = title.includes(q) ? "block" : "none";
    });
}

// ---------------- MODO TV / MOVIES / ALL -----------------
function mostrarSolo(tipo){
    document.body.dataset.filtro = tipo;
    document.querySelectorAll("[data-type]").forEach(el => {
        el.style.display =
            tipo === "all" || el.dataset.type === tipo ? "block" : "none";
    });
}

// ---------------- CARGA DE CONTENIDO ----------------------
fetch("contenido.json")
    .then(r => r.json())
    .then(data => {
        contenido = data;

        renderPeliculas();
        renderCarruselAutoplay();
    });

function renderPeliculas(){
    const cont = document.getElementById("secciones-peliculas");

    cont.innerHTML = `
        <h3 class="category-title">Películas</h3>
        <div class="row-scroll">
            ${contenido.peliculas.map(p => `
                <div class="card-item" data-title="${p.titulo}" data-type="peliculas"
                     onclick="location.href='detalle.html?id=${p.id}'">
                    
                    <img data-src="${p.poster}" class="lazy-img">

                    <div class="card-overlay">
                        <h6>${p.titulo}</h6>
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    document.querySelectorAll(".lazy-img").forEach(img => lazyObserver.observe(img));
}

// ---------------- CARRUSEL AUTOPLAY (Pluto TV) ----------------
function renderCarruselAutoplay(){

    const cont = document.getElementById("carruselAutoplay");

    cont.innerHTML = contenido.peliculas.slice(0, 15).map(p => `
        <div class="card-item autoplay" onclick="location.href='detalle.html?id=${p.id}'">
            <img data-src="${p.poster}" class="lazy-img">
        </div>
    `).join("");

    document.querySelectorAll(".lazy-img").forEach(img => lazyObserver.observe(img));

    // Movimiento automático
    setInterval(() => {
        cont.scrollBy({ left: 2, behavior: "smooth" });
    }, 50);
}
