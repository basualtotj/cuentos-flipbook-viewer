// server.js (con hardening para servir /flipbooks/* sin path traversal)
const http = require('http');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const Stripe = require('stripe');
const fs = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 3000;
const MAIN_DOMAIN = 'cuentosparasiempre.com';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY no está configurada');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

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
  if (!value) return false;
  if (value.length < 1 || value.length > 63) return false;
  if (!/^[a-z0-9-]+$/.test(value)) return false;
  if (value.startsWith('-') || value.endsWith('-')) return false;
  return true;
}

function generateCodigoUnico() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function getRequestHost(req) {
  const raw = (req.headers['x-forwarded-host'] || req.headers.host || '')
    .toString()
    .toLowerCase();
  return raw.split(',')[0].trim().split(':')[0];
}

function parseSubdomainFromHost(cleanHost) {
  if (!cleanHost) return null;
  if (cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`) return null;
  if (!cleanHost.endsWith(`.${MAIN_DOMAIN}`)) return null;

  const prefix = cleanHost.slice(0, -(`.${MAIN_DOMAIN}`).length);
  const sd = prefix.replace(/^www\./, '');
  return sd || null;
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
  const payload = {};
  for (const [key, value] of params.entries()) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const prev = payload[key];
      payload[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else {
      payload[key] = value;
    }
  }
  return payload;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function serveLandingPage(res) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cuentos Personalizados</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 720px; margin: 50px auto; line-height: 1.6; padding: 20px; }
    input, button { padding: 10px; margin: 5px 0; width: 100%; box-sizing: border-box; }
    button { background: #5469d4; color: white; border: none; cursor: pointer; font-size: 16px; }
    button:hover { background: #4355c8; }
    #out { background: #f4f4f4; padding: 12px; overflow: auto; white-space: pre-wrap; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>📚 Cuentos Personalizados</h1>
  <p>Creá tu cuento único. Elegí tu subdominio.</p>

  <form id="form">
    <label>Nombre del niño/a</label>
    <input name="nombre" required placeholder="Ej: Catalina" />

    <label>Email</label>
    <input name="email" type="email" required placeholder="tu@email.com" />

    <label>Subdominio deseado</label>
    <input name="subdomain" placeholder="catalina-estrella" required />
    <small>Solo letras, números y guiones. Ejemplo: juanito-aventura</small>

    <button type="submit">Crear cuento y pagar ($19.990)</button>
  </form>

  <div id="out"></div>

  <script>
    const form = document.getElementById('form');
    const out = document.getElementById('out');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      out.textContent = 'Creando cuento...';

      try {
        const data = new URLSearchParams(new FormData(e.target));
        const r = await fetch('/api/crear-cuento', { method: 'POST', body: data });
        const result = await r.json();

        if (result.success && result.checkout_url) {
          out.textContent = 'Cuento creado. Redirigiendo a pago...';
          setTimeout(() => { window.location.href = result.checkout_url; }, 800);
        } else {
          out.textContent = 'Error: ' + (result.error || 'Desconocido');
        }
      } catch (err) {
        out.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>`;
  return sendHtml(res, 200, html);
}

async function serveFlipbook(res, subdomain) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, subdomain, nombre_nino, codigo_unico, estado, vistas, flipbook_path FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (!rows.length) {
      return sendHtml(
        res,
        404,
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>404</title></head>
<body style="font-family:Arial;text-align:center;padding:50px">
<h1>404 - Cuento no encontrado</h1>
<p>Subdomain: <strong>${escapeHtml(subdomain)}</strong></p>
</body></html>`
      );
    }

    const c = rows[0];
    await pool.execute('UPDATE cuentos SET vistas = COALESCE(vistas, 0) + 1 WHERE id = ?', [c.id]);

    const flipbookFolder = c.flipbook_path || 'cuento-prueba';
    const totalPages = 20;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cuento de ${escapeHtml(String(c.nombre_nino || ''))}</title>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js"></script>
  <style>
    body { margin:0; padding:20px; background:#333; font-family:Arial,sans-serif; display:flex; flex-direction:column; align-items:center; min-height:100vh; }
    .header { color:#fff; text-align:center; margin-bottom:20px; }
    .header h1 { margin:0 0 10px; font-size:2em; }
    .header p { margin:5px 0; opacity:.85; }
    #flipbook { width:800px; height:600px; margin:20px auto; box-shadow:0 4px 20px rgba(0,0,0,.5); }
    #flipbook .page { width:400px; height:600px; background:#fff; display:flex; align-items:center; justify-content:center; }
    #flipbook .page img { width:100%; height:100%; object-fit:contain; }
    .controls { margin-top:20px; text-align:center; }
    .controls button { padding:10px 20px; margin:0 10px; background:#667eea; color:#fff; border:none; border-radius:5px; cursor:pointer; font-size:16px; }
    .controls button:hover { background:#5568d3; }
    .controls button:disabled { background:#666; cursor:not-allowed; }
    @media (max-width: 850px) {
      #flipbook { width:90vw; height: calc(90vw * 0.75); }
      #flipbook .page { width:45vw; height: calc(90vw * 0.75); }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📖 ${escapeHtml(String(c.nombre_nino || 'Tu Cuento'))}</h1>
    <p>Código: ${escapeHtml(String(c.codigo_unico || ''))}</p>
    ${c.estado === 'pagado'
      ? '<p style="color:#4ade80">✅ Pago completado</p>'
      : '<p style="color:#fbbf24">⚠️ Pago pendiente</p>'}
  </div>

  <div id="flipbook">
    ${Array.from({ length: totalPages }, (_, i) => `
      <div class="page">
        <img src="/flipbooks/${encodeURIComponent(flipbookFolder)}/${i + 1}.jpg" alt="Página ${i + 1}" />
      </div>
    `).join('')}
  </div>

  <div class="controls">
    <button id="prev">◀ Anterior</button>
    <span id="page-info" style="color:white;margin:0 20px;font-size:18px;">Página 1 de ${totalPages}</span>
    <button id="next">Siguiente ▶</button>
  </div>

  <script>
    $(function() {
      const totalPages = ${totalPages};

      $('#flipbook').turn({
        width: 800,
        height: 600,
        autoCenter: true,
        duration: 900,
        gradients: true,
        acceleration: true
      });

      function updatePageInfo() {
        const page = $('#flipbook').turn('page');
        $('#page-info').text('Página ' + page + ' de ' + totalPages);
        $('#prev').prop('disabled', page === 1);
        $('#next').prop('disabled', page === totalPages);
      }

      $('#flipbook').bind('turned', function() { updatePageInfo(); });
      $('#prev').click(function() { $('#flipbook').turn('previous'); });
      $('#next').click(function() { $('#flipbook').turn('next'); });
      updatePageInfo();
    });
  </script>
</body>
</html>`;

    return sendHtml(res, 200, html);
  } catch (e) {
    console.error(e);
    return sendHtml(res, 500, 'Error servidor');
  }
}

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

    const subdomain = normalizeSubdomain(subdomainRaw);
    if (!isValidSubdomain(subdomain)) {
      return sendJson(res, 400, { success: false, error: 'Subdominio inválido. Usa letras, números y guiones.' });
    }

    const payload = collectPayloadFromParams(params);
    const payloadJson = JSON.stringify(payload);

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

    const [existsSubdomain] = await pool.execute(
      'SELECT id FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (existsSubdomain.length > 0) {
      return sendJson(res, 409, { success: false, error: 'Subdominio ya en uso' });
    }

    const [result] = await pool.execute(
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

    const cuentoId = result.insertId;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'clp',
          product_data: {
            name: `Cuento Personalizado - ${nombre}`,
            description: `Subdominio: ${subdomain}.${MAIN_DOMAIN}`
          },
          unit_amount: 19990
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `https://${subdomain}.${MAIN_DOMAIN}?pago=exitoso`,
      cancel_url: `https://${MAIN_DOMAIN}?pago=cancelado`,
      customer_email: email || undefined,
      metadata: {
        cuento_id: String(cuentoId),
        subdomain: subdomain,
        codigo_unico: codigo,
        nombre_nino: nombre
      }
    });

    console.log(`✅ Cuento ${cuentoId} creado. Checkout: ${session.id}`);

    return sendJson(res, 200, {
      success: true,
      cuento_id: cuentoId,
      subdomain: subdomain,
      codigo: codigo,
      checkout_url: session.url
    });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { success: false, error: 'Error creando cuento' });
  }
}

const server = http.createServer(async (req, res) => {
  const cleanHost = getRequestHost(req);
  const isMainDomain = cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`;

  // ===== Static seguro para /flipbooks/... =====
  if (req.url && req.url.startsWith('/flipbooks/')) {
    try {
      // Solo GET/HEAD para estáticos
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        return res.end();
      }

      // Normaliza URL (sin querystring) y evita traversal
      const urlPath = req.url.split('?')[0];
      const safeRel = urlPath.replace(/^\/+/, ''); // quita "/" inicial
      const publicRoot = path.join(__dirname, 'public');
      const filePath = path.normalize(path.join(publicRoot, safeRel));

      // Bloquea si intenta salir de /public
      if (!filePath.startsWith(publicRoot + path.sep) && filePath !== publicRoot) {
        return sendHtml(res, 403, 'Forbidden');
      }

      const data = await fs.readFile(filePath);

      const ext = path.extname(filePath).toLowerCase();
      const contentType =
        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
        ext === '.png' ? 'image/png' :
        ext === '.webp' ? 'image/webp' :
        ext === '.gif' ? 'image/gif' :
        'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' });
      if (req.method === 'HEAD') return res.end();
      return res.end(data);
    } catch (e) {
      return sendHtml(res, 404, 'Imagen no encontrada');
    }
  }
  // ============================================

  if (req.method === 'POST' && req.url === '/api/crear-cuento') {
    return handleCrearCuento(req, res);
  }

  if (isMainDomain) {
    return serveLandingPage(res);
  }

  const subdomain = parseSubdomainFromHost(cleanHost);
  if (!subdomain) return sendHtml(res, 404, 'No encontrado');

  return serveFlipbook(res, subdomain);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en ${PORT}`);
});