// src/views/flipbook.js
const { escapeHtml } = require('../utils/http');

function flipbookHtml({ nombre, codigo, estado, folder, totalPages }) {
  const safeNombre = escapeHtml(nombre || 'Tu Cuento');
  const safeCodigo = escapeHtml(codigo || '');
  const safeFolder = encodeURIComponent(folder);

  const paidBadge = estado === 'pagado'
    ? '<p class="badge ok">✅ Pago completado</p>'
    : '<p class="badge warn">⚠️ Pago pendiente</p>';

  const pagesHtml = Array.from({ length: totalPages }, (_, i) => {
    const n = i + 1;
    return `<div class="page"><img src="/flipbooks/${safeFolder}/${n}.jpg" alt="Página ${n}" loading="lazy"></div>`;
  }).join('\n');

  // A4 horizontal (page) = 1.414; libro abierto (2 páginas) = 2.828
  const PAGE_ASPECT = 2970 / 2100;
  const BOOK_ASPECT = PAGE_ASPECT * 2;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Cuento de ${safeNombre}</title>

  <link rel="stylesheet" href="/css/flipbook.css" />
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js"></script>
</head>
<body>
  <div class="header">
    <h1>📖 ${safeNombre}</h1>
    <p class="code">Código: <strong>${safeCodigo}</strong></p>
    ${paidBadge}
  </div>

  <div id="flipbook" class="flipbook">
    ${pagesHtml}
  </div>

  <div class="controls">
    <button id="prev">◀ Anterior</button>
    <span id="page-info">Página 1 de ${Number(totalPages)}</span>
    <button id="next">Siguiente ▶</button>
  </div>

  <script>
    window.__BOOK__ = {
      totalPages: ${Number(totalPages)},
      // Para calcular altura correcta según el ancho disponible
      bookAspect: ${BOOK_ASPECT}
    };
  </script>
  <script src="/js/flipbook.js"></script>
</body>
</html>`;
}

module.exports = { flipbookHtml };