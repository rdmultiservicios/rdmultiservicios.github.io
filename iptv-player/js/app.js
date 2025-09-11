<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>IPTV - Reproductor con cuadrícula 3x3</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet" />
  <!-- Video.js CSS -->
  <link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />

  <style>
    body {
      background-color: #111;
      color: #fff;
      height: 100vh;
      display: flex;
      flex-direction: column;
      margin: 0;
    }

    #video-container {
      flex: 0 0 auto;
      max-height: 40vh;
      background: black;
    }

    #lists-container {
      flex: 1 1 auto;
      display: flex;
      gap: 1rem;
      padding: 1rem;
      overflow-y: auto;
      flex-wrap: nowrap;
    }

    @media (min-width: 768px) {
      #lists-container {
        flex-direction: row;
      }
      #channelList, #favoritesList {
        flex: 1;
        max-height: calc(60vh - 2rem);
        overflow-y: auto;
        padding-right: 0.5rem;
        scroll-behavior: smooth;
      }
    }

    @media (max-width: 767.98px) {
      #lists-container {
        flex-direction: column;
      }
      #channelList, #favoritesList {
        max-height: 30vh;
        width: 100%;
        margin-bottom: 1rem;
        overflow-y: auto;
        padding-right: 0.5rem;
        scroll-behavior: smooth;
      }
    }

    /* Grid de 3 columnas fijas (en escritorio) */
    .channel-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    /* Ajustes responsive */
    @media (max-width: 767.98px) {
      .channel-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .channel-grid {
        grid-template-columns: 1fr;
      }
    }

    .channel-card {
      background-color: #222;
      border-radius: 0.5rem;
      padding: 0.5rem;
      cursor: pointer;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: background-color 0.2s ease;
      user-select: none;
    }

    .channel-card:hover {
      background-color: #333;
    }

    .channel-card img {
      width: 80px;
      height: 45px;
      object-fit: contain;
      margin-bottom: 0.5rem;
      border-radius: 4px;
    }

    .channel-name {
      text-align: center;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    .channel-fav-btn {
      margin-top: auto;
      color: #f0ad4e;
      font-size: 1.3rem;
      cursor: pointer;
      user-select: none;
    }

    .channel-fav-btn:hover {
      color: #ffc107;
    }

    .favorite-card {
      background-color: #444;
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s ease;
      margin-bottom: 0.5rem;
      user-select: none;
    }

    .favorite-card:hover {
      background-color: #555;
    }

    .favorite-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      overflow: hidden;
    }

    .favorite-info img {
      width: 50px;
      height: 30px;
      object-fit: contain;
      border-radius: 4px;
    }

    .favorite-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .favorite-delete-btn {
      background: transparent;
      border: none;
      color: #dc3545;
      font-size: 1.3rem;
      cursor: pointer;
      user-select: none;
    }

    .favorite-delete-btn:hover {
      color: #ff6b6b;
    }

    .current-channel-label {
      font-weight: bold;
      font-size: 1.2rem;
      padding: 0.5rem 1rem;
      background-color: #222;
      text-align: center;
      user-select: none;
    }
  </style>
</head>
<body>

  <div id="video-container">
    <video
      id="video-player"
      class="video-js vjs-default-skin"
      controls
      preload="auto"
      autoplay
      playsinline
      fluid
    ></video>
    <div class="current-channel-label" id="currentChannel">Canal Actual</div>
  </div>

  <div id="lists-container" class="container-fluid">
    <div>
      <h5>Canales</h5>
      <input
        type="text"
        id="search"
        class="form-control mb-3"
        placeholder="Buscar canal..."
        autocomplete="off"
      />
      <div id="channelList"></div>
    </div>

    <div>
      <h5>Favoritos</h5>
      <div id="favoritesList"></div>
    </div>
  </div>

  <!-- Video.js y app.js -->
  <script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
