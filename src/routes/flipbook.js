// src/routes/flipbook.js

const { pool } = require('../config/db');
const { escapeHtml, sendHtml } = require('../utils/http');
const { flipbookHtml } = require('../views/flipbook');

async function serveFlipbook(res, subdomain) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, subdomain, nombre_nino, codigo_unico, estado, vistas, flipbook_path FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (!rows.length) {
      return sendHtml(res, 404, `<h1>404 - Cuento no encontrado</h1><p>${escapeHtml(subdomain)}</p>`);
    }

    const c = rows[0];
    await pool.execute('UPDATE cuentos SET vistas = COALESCE(vistas, 0) + 1 WHERE id = ?', [c.id]);

    const folder = c.flipbook_path || 'cuento-prueba';
    
    // IMPORTANTE: tienes imágenes 0.jpg a 22.jpg = 23 archivos
    const imageCount = 23; // cantidad de archivos JPG
    
    const BOOK_ASPECT = 2.8285714;

    // Turn.js indexa páginas desde 1. Tus imágenes empiezan en 0.
    // Mapeo esperado:
    //   Turn.js page 1 -> 0.jpg
    //   Turn.js page 2 -> 1.jpg
    //   ...
    //   Turn.js page 23 -> 22.jpg
    const pagesHtml = Array.from({ length: imageCount }, (_, idx) => {
      const turnPage = idx + 1; // 1..imageCount
      const imgIndex = turnPage - 1; // 0..imageCount-1
      // Cache-busting is the fix (avoids stale images being reused by cache/CDN).
      const src = `/flipbooks/${encodeURIComponent(folder)}/${imgIndex}.jpg?v=${imgIndex}`;
      return `<div class="page"><img src="${src}" alt="Página ${turnPage}" loading="eager" decoding="async"></div>`;
    }).join('\n');

    const safeNombre = escapeHtml(c.nombre_nino || 'Tu Cuento');
    const safeCodigo = escapeHtml(c.codigo_unico || '');
    const paidBadge = c.estado === 'pagado'
      ? '<span class="badge ok">✅ Pago completado</span>'
      : '<span class="badge warn">⚠️ Pago pendiente</span>';

    const html = flipbookHtml({
      safeNombre,
      safeCodigo,
      paidBadge,
      pagesHtml,
      imageCount,
      BOOK_ASPECT,
    });

    return sendHtml(res, 200, html);
  } catch (e) {
    console.error(e);
    return sendHtml(res, 500, 'Error servidor');
  }
}

module.exports = {
  serveFlipbook,
};
