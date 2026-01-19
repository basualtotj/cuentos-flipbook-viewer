// src/routes/flipbook.js
const { flipbookHtml } = require('../views/flipbook');
const { sendHtml } = require('../utils/http');
const { DEFAULT_FLIPBOOK_FOLDER, DEFAULT_TOTAL_PAGES } = require('../config/constants');
const { pool } = require('../config/db');

async function serveFlipbook(res, subdomain) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, subdomain, nombre_nino, codigo_unico, estado, vistas, flipbook_path FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (!rows.length) {
      return sendHtml(res, 404, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>404</title></head>
<body style="font-family:Arial;text-align:center;padding:50px">
<h1>404 - Cuento no encontrado</h1>
<p>Subdomain: <strong>${subdomain}</strong></p>
</body></html>`);
    }

    const c = rows[0];
    await pool.execute('UPDATE cuentos SET vistas = COALESCE(vistas, 0) + 1 WHERE id = ?', [c.id]);

    const folder = c.flipbook_path || DEFAULT_FLIPBOOK_FOLDER;
    const totalPages = DEFAULT_TOTAL_PAGES; // luego lo movemos a BD si quieres

    const html = flipbookHtml({
      nombre: c.nombre_nino,
      codigo: c.codigo_unico,
      estado: c.estado,
      folder,
      totalPages,
    });

    return sendHtml(res, 200, html);
  } catch (e) {
    console.error(e);
    return sendHtml(res, 500, 'Error servidor');
  }
}

module.exports = { serveFlipbook };