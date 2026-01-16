const http = require('http');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const MAIN_DOMAIN = 'cuentosparasiempre.com';

// MariaDB/MySQL pool (mysql2/promise)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

function normalizeSubdomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidSubdomain(value) {
  // must be dns-ish, 1..63 chars, no leading/trailing '-', only [a-z0-9-]
  if (!value) return false;
  if (value.length < 1 || value.length > 63) return false;
  if (!/^[a-z0-9-]+$/.test(value)) return false;
  if (value.startsWith('-') || value.endsWith('-')) return false;
  return true;
}

function generateCodigoUnico() {
  // 8 hex chars -> 8 chars, then uppercase. Fits varchar(20)
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function getRequestHost(req) {
  // Respect proxy header from Easypanel/reverse proxy
  const raw = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().toLowerCase();
  return raw.split(',')[0].trim().split(':')[0];
}

function parseSubdomainFromHost(cleanHost) {
  if (!cleanHost) return null;

  if (cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`) {
    return null;
  }

  // Only accept *.MAIN_DOMAIN
  if (!cleanHost.endsWith(`.${MAIN_DOMAIN}`)) {
    return null;
  }

  const prefix = cleanHost.slice(0, -(`.${MAIN_DOMAIN}`).length);
  const sd = prefix.replace(/^www\./, '');
  if (!sd) return null;
  return sd;
}

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendHtml(res, code, html) {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

async function readBody(req, maxBytes = 1024 * 1024) {
  return await new Promise((resolve, reject) => {
    let size = 0;
    let body = '';

    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function collectPayloadFromParams(params) {
  // Save ALL form fields in a JSON-valid object
  const payload = {};
  for (const [key, value] of params.entries()) {
    // If a key appears multiple times, keep an array
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const prev = payload[key];
      payload[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else {
      payload[key] = value;
    }
  }
  return payload;
}

// === LANDING PAGE ===
function serveLandingPage(res) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cuentos Personalizados</title>
</head>
<body style="font-family:Arial;max-width:720px;margin:50px auto;line-height:1.4">
  <h1>Cuentos personalizados</h1>
  <p>Creá tu cuento. Elegí tu subdominio.</p>

  <form id="form">
    <label>Nombre del niño</label><br />
    <input name="nombre" required /><br /><br />

    <label>Email</label><br />
    <input name="email" type="email" required /><br /><br />

    <label>Subdominio deseado</label><br />
    <input name="subdomain" placeholder="juanito-estrella" required /><br /><br />

    <button type="submit">Crear cuento</button>
  </form>

  <pre id="out" style="background:#f4f4f4;padding:12px;overflow:auto"></pre>

  <script>
    document.getElementById('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new URLSearchParams(new FormData(e.target));
      const r = await fetch('/api/crear-cuento', { method: 'POST', body: data });
      document.getElementById('out').textContent = await r.text();
    });
  </script>
</body>
</html>`;

  return sendHtml(res, 200, html);
}

// === FLIPBOOK (placeholder) ===
async function serveFlipbook(res, subdomain) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, subdomain, nombre_nino, codigo_unico, estado, vistas, flipbook_path FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (!rows.length) {
      return sendHtml(res, 404, 'Cuento no encontrado');
    }

    const c = rows[0];

    await pool.execute('UPDATE cuentos SET vistas = COALESCE(vistas, 0) + 1 WHERE id = ?', [c.id]);

    // This repo is only the viewer; we keep the output minimal.
    // If flipbook_path exists, you can later serve static HTML/PDF from there.
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cuento de ${escapeHtml(String(c.nombre_nino || ''))}</title>
</head>
<body style="font-family:Arial;max-width:720px;margin:50px auto;line-height:1.4">
  <h1>Cuento de ${escapeHtml(String(c.nombre_nino || ''))}</h1>
  <p><strong>Subdominio:</strong> ${escapeHtml(String(c.subdomain || ''))}</p>
  <p><strong>Estado:</strong> ${escapeHtml(String(c.estado || ''))}</p>
  <p><strong>Vistas:</strong> ${escapeHtml(String(c.vistas ?? ''))}</p>
  ${c.flipbook_path ? `<p><strong>flipbook_path:</strong> ${escapeHtml(String(c.flipbook_path))}</p>` : ''}
</body>
</html>`;

    return sendHtml(res, 200, html);
  } catch (e) {
    console.error(e);
    return sendHtml(res, 500, 'Error servidor');
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// === HANDLER CREAR CUENTO ===
async function handleCrearCuento(req, res) {
  try {
    const body = await readBody(req);
    const params = new URLSearchParams(body);

    const nombre = (params.get('nombre') || '').trim();
    const email = (params.get('email') || '').trim();
    const subdomainRaw = params.get('subdomain');

    if (!nombre || !subdomainRaw) {
      return sendJson(res, 400, { success: false, error: 'Datos incompletos' });
    }

    // User chooses subdomain (do NOT generate random). We only normalize/sanitize.
    const subdomain = normalizeSubdomain(subdomainRaw);
    if (!isValidSubdomain(subdomain)) {
      return sendJson(res, 400, {
        success: false,
        error: 'Subdominio inválido. Usa letras, números y guiones (sin espacios).'
      });
    }

    const payload = collectPayloadFromParams(params);
    const payloadJson = JSON.stringify(payload);

    // Ensure uniqueness of codigo_unico as well.
    // If collision happens (very unlikely), retry a few times.
    let codigo = null;
    for (let i = 0; i < 5; i += 1) {
      codigo = generateCodigoUnico();
      const [existsCode] = await pool.execute(
        'SELECT id FROM cuentos WHERE codigo_unico = ? LIMIT 1',
        [codigo]
      );
      if (!existsCode.length) break;
    }

    if (!codigo) {
      return sendJson(res, 500, { success: false, error: 'No se pudo generar código único' });
    }

    // Validate: subdomain must be available
    const [existsSubdomain] = await pool.execute(
      'SELECT id FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (existsSubdomain.length > 0) {
      return sendJson(res, 409, { success: false, error: 'Subdominio ya en uso' });
    }

    // Insert only real columns
    // estado inicial = 'pendiente'
    await pool.execute(
      `INSERT INTO cuentos (
        subdomain,
        nombre_nino,
        codigo_unico,
        email_cliente,
        estado,
        payload_json
      ) VALUES (?, ?, ?, ?, 'pendiente', ?)`,
      [subdomain, nombre, codigo, email || null, payloadJson]
    );

    return sendJson(res, 200, {
      success: true,
      url: `https://${subdomain}.${MAIN_DOMAIN}`
    });
  } catch (err) {
    console.error(err);
    if (String(err && err.message).includes('Payload too large')) {
      return sendJson(res, 413, { success: false, error: 'Payload demasiado grande' });
    }
    return sendJson(res, 500, { success: false, error: 'Error creando cuento' });
  }
}

// SERVER
const server = http.createServer(async (req, res) => {
  const cleanHost = getRequestHost(req);
  const isMainDomain = cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`;

  // Only one API endpoint for now
  if (req.method === 'POST' && req.url === '/api/crear-cuento') {
    return handleCrearCuento(req, res);
  }

  if (isMainDomain) {
    return serveLandingPage(res);
  }

  const subdomain = parseSubdomainFromHost(cleanHost);
  if (!subdomain) {
    return sendHtml(res, 404, 'No encontrado');
  }

  return serveFlipbook(res, subdomain);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en ${PORT}`);
});