const http = require('http');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const Stripe = require('stripe');

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

/**
 * Host seguro: SOLO aceptamos:
 * - cuentosparasiempre.com
 * - www.cuentosparasiempre.com
 * - *.cuentosparasiempre.com
 *
 * Nota: Preferimos req.headers.host; usamos x-forwarded-host solo como fallback
 * porque puede ser spoofeado si la app es accesible directo.
 */
function getRequestHost(req) {
  const hostHeader = (req.headers.host || '').toString().toLowerCase();
  const xfhHeader = (req.headers['x-forwarded-host'] || '').toString().toLowerCase();

  const raw = (hostHeader || xfhHeader).split(',')[0].trim();
  const clean = raw.split(':')[0].trim();

  if (!clean) return '';

  const ok =
    clean === MAIN_DOMAIN ||
    clean === `www.${MAIN_DOMAIN}` ||
    clean.endsWith(`.${MAIN_DOMAIN}`);

  return ok ? clean : '';
}

function parseSubdomainFromHost(cleanHost) {
  if (!cleanHost) return null;

  if (cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`) {
    return null;
  }

  if (!cleanHost.endsWith(`.${MAIN_DOMAIN}`)) {
    return null;
  }

  const prefix = cleanHost.slice(0, -(`.${MAIN_DOMAIN}`).length); // lo de antes del .dominio
  const sd = prefix.replace(/^www\./, '');

  if (!sd) return null;

  // Validación fuerte del subdomain proveniente del host
  if (!isValidSubdomain(sd)) return null;

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
      return sendHtml(res, 404, 'Cuento no encontrado');
    }

    const c = rows[0];

    await pool.execute(
      'UPDATE cuentos SET vistas = COALESCE(vistas, 0) + 1 WHERE id = ?',
      [c.id]
    );

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cuento de ${escapeHtml(String(c.nombre_nino || ''))}</title>
</head>
<body style="font-family:Arial;max-width:720px;margin:50px auto;line-height:1.4;padding:20px">
  <h1>📖 Cuento de ${escapeHtml(String(c.nombre_nino || ''))}</h1>
  <p><strong>Subdominio:</strong> ${escapeHtml(String(c.subdomain || ''))}</p>
  <p><strong>Código:</strong> ${escapeHtml(String(c.codigo_unico || ''))}</p>
  <p><strong>Estado:</strong> ${escapeHtml(String(c.estado || ''))}</p>
  <p><strong>Vistas:</strong> ${escapeHtml(String(c.vistas ?? ''))}</p>
  ${c.flipbook_path ? `<p><strong>Flipbook:</strong> ${escapeHtml(String(c.flipbook_path))}</p>` : ''}
  ${c.estado === 'pendiente' ? '<p style="color:orange">⚠️ Pago pendiente</p>' : ''}
  ${c.estado === 'pagado' ? '<p style="color:green">✅ Pago completado</p>' : ''}
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

    // Genera un codigo unico REAL (si colisiona, reintenta)
    let codigo = null;
    let codigoOk = false;
    for (let i = 0; i < 8; i++) {
      codigo = generateCodigoUnico();
      const [r] = await pool.execute(
        'SELECT id FROM cuentos WHERE codigo_unico = ? LIMIT 1',
        [codigo]
      );
      if (!r.length) { codigoOk = true; break; }
    }
    if (!codigoOk) {
      return sendJson(res, 500, { success: false, error: 'No se pudo generar código único' });
    }

    // INSERT directo + captura duplicado (evita race condition)
    let cuentoId;
    try {
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
      cuentoId = result.insertId;
    } catch (e) {
      if (e && e.code === 'ER_DUP_ENTRY') {
        return sendJson(res, 409, { success: false, error: 'Subdominio ya en uso' });
      }
      throw e;
    }

    // Stripe Checkout Session con metadata
    const session = await stripe.checkout.sessions.create({
      // Nota: payment_method_types es opcional en versiones nuevas; no rompe dejarlo.
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

  // Guardrail: si host no es válido, corta.
  if (!cleanHost) {
    return sendHtml(res, 404, 'No encontrado');
  }

  const isMainDomain = cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`;

  // Guardrail de métodos/rutas
  const isCreateRoute = req.method === 'POST' && req.url === '/api/crear-cuento';
  const isGet = req.method === 'GET';

  if (!isGet && !isCreateRoute) {
    return sendHtml(res, 404, 'No encontrado');
  }

  if (isCreateRoute) {
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