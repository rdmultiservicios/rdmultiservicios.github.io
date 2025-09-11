// Renderizar la lista de VOD
function renderVOD(vodList) {
  const container = document.getElementById('vodList');
  container.innerHTML = '';

  if (!vodList.length) {
    container.innerHTML = '<p class="text-muted">No hay VOD disponibles.</p>';
    return;
  }

  vodList.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'vod d-flex align-items-center justify-content-between px-2';

    const info = document.createElement('div');
    info.className = 'd-flex align-items-center gap-2';

    const img = document.createElement('img');
    img.src = channel.logo || 'https://via.placeholder.com/48x48?text=VOD';
    img.alt = 'Logo';

    const title = document.createElement('span');
    title.textContent = channel.title;

    info.appendChild(img);
    info.appendChild(title);
    card.appendChild(info);

    // Icono de favorito ⭐
    const star = document.createElement('span');
    star.className = 'star';
    star.innerHTML = isFavorite(channel) ? '⭐' : '☆';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(channel);
      renderAll();
    });

    card.appendChild(star);

    // Al hacer clic, reproducir el VOD
    card.addEventListener('click', () => playChannel(channel));

    col.appendChild(card);
    container.appendChild(col);
  });
}

// Favoritos
function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function isFavorite(channel) {
  const favorites = getFavorites();
  return favorites.some(c => c.url === channel.url);
}

function toggleFavorite(channel) {
  let favorites = getFavorites();
  if (isFavorite(channel)) {
    favorites = favorites.filter(c => c.url !== channel.url);
  } else {
    favorites.push(channel);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function renderFavorites() {
  const container = document.getElementById('favoritesList');
  const favorites = getFavorites().filter(c => {
    const query = document.getElementById('searchInput').value.toLowerCase();
    return c.title.toLowerCase().includes(query);
  });

  container.innerHTML = '';

  if (!favorites.length) {
    container.innerHTML = '<p class="text-muted">No hay favoritos guardados.</p>';
    return;
  }

  favorites.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'favorite d-flex align-items-center justify-content-between px-2';

    const info = document.createElement('div');
    info.className = 'd-flex align-items-center gap-2';

    const img = document.createElement('img');
    img.src = channel.logo || 'https://via.placeholder.com/48x48?text=Fav';
    img.alt = 'Logo';

    const title = document.createElement('span');
    title.textContent = channel.title;

    info.appendChild(img);
    info.appendChild(title);
    card.appendChild(info);

    const star = document.createElement('span');
    star.className = 'star';
    star.innerHTML = '⭐';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(channel);
      renderAll();
    });

    card.appendChild(star);
    card.addEventListener('click', () => playChannel(channel));

    col.appendChild(card);
    container.appendChild(col);
  });
}

// Borrar todos los favoritos
function clearFavorites() {
  if (confirm("¿Estás seguro de borrar todos los favoritos?")) {
    localStorage.removeItem('favorites');
    renderAll();
  }
}

// Renderizar canales (en vivo)
function renderChannels(channelList) {
  const container = document.getElementById('channelList');
  container.innerHTML = '';

  if (!channelList.length) {
    container.innerHTML = '<p class="text-muted">No hay canales disponibles.</p>';
    return;
  }

  channelList.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'channel d-flex align-items-center justify-content-between px-2';

    const info = document.createElement('div');
    info.className = 'd-flex align-items-center gap-2';

    const img = document.createElement('img');
    img.src = channel.logo || 'https://via.placeholder.com/48x48?text=TV';
    img.alt = 'Logo';

    const title = document.createElement('span');
    title.textContent = channel.title;

    info.appendChild(img);
    info.appendChild(title);
    card.appendChild(info);

    const star = document.createElement('span');
    star.className = 'star';
    star.innerHTML = isFavorite(channel) ? '⭐' : '☆';
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(channel);
      renderAll();
    });

    card.appendChild(star);
    card.addEventListener('click', () => playChannel(channel));

    col.appendChild(card);
    container.appendChild(col);
  });
}
