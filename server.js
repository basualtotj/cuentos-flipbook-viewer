const http = require('http');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const MAIN_DOMAIN = 'cuentosparasiempre.com';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Generar subdomain único desde nombre
function generarSubdomain(nombre) {
  const normalizado = (nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const sufijo = crypto.randomBytes(3).toString('hex');
  return `${normalizado || 'cuento'}-${sufijo}`;
}

// Generar código único
function generarCodigoUnico() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

const server = http.createServer(async (req, res) => {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const cleanHost = host.split(':')[0].trim();

  const isMainDomain =
    cleanHost === MAIN_DOMAIN ||
    cleanHost === `www.${MAIN_DOMAIN}`;

  // API
  if (req.method === 'POST' && req.url === '/api/crear-cuento') {
    await handleCrearCuento(req, res);
    return;
  }

  // Routing por host
  if (isMainDomain) {
    serveLandingPage(req, res);
    return;
  }

  // Subdomain
  const subdomain = cleanHost
    .replace(`.${MAIN_DOMAIN}`, '')
    .replace('www.', '')
    .trim();

  await serveFlipbook(req, res, subdomain);
});

async function handleCrearCuento(req, res) {
  let body = '';

  req.on('data', (chunk) => { body += chunk.toString(); });

  req.on('end', async () => {
    try {
      const params = new URLSearchParams(body);

      // Campos actuales del form (puedes agregar más sin tocar BD)
      const nombre = params.get('nombre')?.trim();
      const edad = params.get('edad')?.trim();
      const email = params.get('email')?.trim();

      if (!nombre || !edad || !email) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Faltan datos requeridos' }));
        return;
      }

      const subdomain = generarSubdomain(nombre);
      const codigoUnico = generarCodigoUnico();

      // Guardamos TODO el formulario aquí (futuro-proof)
      const payload = Object.fromEntries(params.entries());
      payload.subdomain = subdomain;
      payload.codigo_unico = codigoUnico;

      await pool.execute(
        `INSERT INTO cuentos
          (subdomain, nombre_nino, codigo_unico, email_cliente, estado, payload_json)
         VALUES
          (?, ?, ?, ?, 'pendiente', ?)`,
        [subdomain, nombre, codigoUnico, email, JSON.stringify(payload)]
      );

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        subdomain,
        codigo: codigoUnico,
        url: `https://${subdomain}.${MAIN_DOMAIN}`,
        mensaje: 'Registro creado (pendiente). Próximo paso: pago + webhook.'
      }));
    } catch (error) {
      console.error('Error creando cuento:', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Error del servidor' }));
    }
  });
}

function serveLandingPage(req, res) {
  // (tu HTML igual, solo asegúrate que haga POST a /api/crear-cuento como ya lo tienes)
  // Lo dejo intacto para no romper nada.
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cuentos Personalizados - Para Siempre</title>
</head>
<body>
  <h1>Landing</h1>
  <form id="cuentoForm">
    <input name="nombre" placeholder="Nombre" required />
    <select name="edad" required>
      <option value="">Edad</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
      <option value="8">8</option>
    </select>
    <input name="email" type="email" placeholder="Email" required />
    <button type="submit" id="submitBtn">Crear</button>
    <pre id="mensaje"></pre>
  </form>

  <script>
    document.getElementById('cuentoForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const mensaje = document.getElementById('mensaje');
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;

      try {
        const formData = new FormData(this);
        const r = await fetch('/api/crear-cuento', {
          method: 'POST',
          body: new URLSearchParams(formData)
        });
        const data = await r.json();
        mensaje.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        mensaje.textContent = 'Error: ' + err.message;
      } finally {
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

async function serveFlipbook(req, res, subdomain) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (rows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>404 - Cuento no encontrado</h1><p>${subdomain}</p>`);
      return;
    }

    const cuento = rows[0];

    pool.execute('UPDATE cuentos SET vistas = vistas + 1 WHERE id = ?', [cuento.id])
      .catch(() => {});

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <h1>Cuento de ${cuento.nombre_nino}</h1>
      <p><b>Subdomain:</b> ${cuento.subdomain}</p>
      <p><b>Código:</b> ${cuento.codigo_unico}</p>
      <p><b>Estado:</b> ${cuento.estado}</p>
      <p><b>Vistas:</b> ${cuento.vistas}</p>
      <p><b>Email:</b> ${cuento.email_cliente || 'N/A'}</p>
    `);
  } catch (error) {
    console.error('DB Error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error de servidor');
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});
