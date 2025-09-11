// Renderizar videos bajo demanda con botón favorito
function renderVOD(list) {
  const container = document.getElementById('vodList');
  container.innerHTML = '';
  list.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'vod d-flex justify-content-between align-items-center';

    const info = document.createElement('div');
    info.className = 'd-flex align-items-center gap-2';

    const img = document.createElement('img');
    img.src = channel.logo || 'https://via.placeholder.com/40?text=VOD';
    img.alt = 'logo';

    const title = document.createElement('span');
    title.textContent = channel.title;

    info.appendChild(img);
    info.appendChild(title);

    const star = document.createElement('span');
    star.innerHTML = isFavorite(channel) ? '⭐' : '☆';
    star.style.cursor = 'pointer';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(channel);
      renderAll();
    });

    card.appendChild(info);
    card.appendChild(star);
    card.addEventListener('click', () => playChannel(channel));

    col.appendChild(card);
    container.appendChild(col);
  });
}

// Renderizar la lista de favoritos
function renderFavorites() {
  const container = document.getElementById('favoritesList');
  const favs = getFavorites();
  container.innerHTML = '';
  if (favs.length === 0) {
    container.innerHTML = '<p class="text-muted">No tienes favoritos aún.</p>';
    return;
  }
  favs.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'favorite d-flex justify-content-between align-items-center';

    const info = document.createElement('div');
    info.className = 'd-flex align-items-center gap-2';

    const img = document.createElement('img');
    img.src = channel.logo || 'https://via.placeholder.com/40?text=⭐';
    img.alt = 'logo';

    const title = document.createElement('span');
    title.textContent = channel.title;

    info.appendChild(img);
    info.appendChild(title);

    const star = document.createElement('span');
    star.innerHTML = '⭐';
    star.style.cursor = 'pointer';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(channel);
      renderAll();
    });

    card.appendChild(info);
    card.appendChild(star);
    card.addEventListener('click', () => playChannel(channel));

    col.appendChild(card);
    container.appendChild(col);
  });
}

// Funciones para manejar favoritos en localStorage

function getFavorites() {
  const favs = localStorage.getItem('vod-favorites');
  return favs ? JSON.parse(favs) : [];
}

function isFavorite(channel) {
  return getFavorites().some(c => c.url === channel.url);
}

function toggleFavorite(channel) {
  let favs = getFavorites();
  if (isFavorite(channel)) {
    favs = favs.filter(c => c.url !== channel.url);
  } else {
    favs.push(channel);
  }
  localStorage.setItem('vod-favorites', JSON.stringify(favs));
}

// Función para borrar todos los favoritos
function clearFavorites() {
  if (confirm('¿Seguro que quieres borrar todos los favoritos?')) {
    localStorage.removeItem('vod-favorites');
    renderAll();
  }
}
