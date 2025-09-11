function renderVOD(list) {
  const container = document.getElementById('vodList');
  container.innerHTML = '';
  list.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const div = document.createElement('div');
    div.className = 'vod-card d-flex justify-content-between align-items-center';

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

    div.appendChild(info);
    div.appendChild(star);
    div.addEventListener('click', () => playChannel(channel));

    col.appendChild(div);
    container.appendChild(col);
  });
}

function renderFavorites() {
  const favorites = getFavorites();
  const container = document.getElementById('favoritesList');
  container.innerHTML = '';
  favorites.forEach(channel => {
    const col = document.createElement('div');
    col.className = 'col';

    const div = document.createElement('div');
    div.className = 'favorite-card d-flex justify-content-between align-items-center';

    const info = document.createElement('div');
    info.className = 'd-flex align-items-center gap-2';
    
    const img = document.createElement('img');
    img.src = channel.logo || 'https://via.placeholder.com/40?text=★';
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

    div.appendChild(info);
    div.appendChild(star);
    div.addEventListener('click', () => playChannel(channel));

    col.appendChild(div);
    container.appendChild(col);
  });
}

// LocalStorage Helpers
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
