const http = require('http');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const MAIN_DOMAIN = 'cuentosparasiempre.com';

// Pool MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Utilidades
function normalizeSubdomain(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// SERVER
const server = http.createServer(async (req, res) => {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const cleanHost = host.split(':')[0];

  const isMainDomain =
    cleanHost === MAIN_DOMAIN ||
    cleanHost === `www.${MAIN_DOMAIN}`;

  if (req.method === 'POST' && req.url === '/api/crear-cuento') {
    return handleCrearCuento(req, res);
  }

  if (isMainDomain) {
    return serveLandingPage(res);
  }

  const subdomain = cleanHost.replace(`.${MAIN_DOMAIN}`, '').replace('www.', '');
  return serveFlipbook(res, subdomain);
});

// === HANDLER CREAR CUENTO ===
async function handleCrearCuento(req, res) {
  let body = '';

  req.on('data', chunk => body += chunk.toString());

  req.on('end', async () => {
    try {
      const params = new URLSearchParams(body);

      const nombre = params.get('nombre');
      const email = params.get('email');
      const subdomainRaw = params.get('subdomain');

      if (!nombre || !email || !subdomainRaw) {
        return json(res, 400, { error: 'Datos incompletos' });
      }

      const subdomain = normalizeSubdomain(subdomainRaw);
      const codigo = generateCode();

      // Verificar si subdomain existe
      const [exists] = await pool.execute(
        'SELECT id FROM cuentos WHERE subdomain = ? LIMIT 1',
        [subdomain]
      );

      if (exists.length > 0) {
        return json(res, 409, { error: 'Subdominio ya en uso' });
      }

      // Insertar
      await pool.execute(
        `INSERT INTO cuentos 
        (subdomain, nombre_nino, codigo_unico, email_cliente, estado, payload_json)
        VALUES (?, ?, ?, ?, 'pendiente', ?)`,
        [
          subdomain,
          nombre,
          codigo,
          email,
          JSON.stringify({
            nombre,
            email,
            subdomain
          })
        ]
      );

      return json(res, 200, {
        success: true,
        subdomain,
        codigo,
        url: `https://${subdomain}.${MAIN_DOMAIN}`,
        mensaje: 'Registro creado (pendiente). Próximo paso: pago + webhook.'
      });

    } catch (err) {
      console.error(err);
      return json(res, 500, { error: 'Error creando cuento' });
    }
  });
}

// === LANDING PAGE ===
function serveLandingPage(res) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Cuentos Personalizados</title>
</head>
<body style="font-family:Arial;max-width:600px;margin:50px auto">
<h1>Cuentos personalizados</h1>

<form id="form">
  <label>Nombre del niño</label><br>
  <input name="nombre" required><br><br>

  <label>Email</label><br>
  <input name="email" type="email" required><br><br>

  <label>Subdominio deseado</label><br>
  <input name="subdomain" placeholder="juanito-estrella" required><br><br>

  <button>Crear cuento</button>
</form>

<pre id="out"></pre>

<script>
document.getElementById('form').addEventListener('submit', async e => {
  e.preventDefault();
  const data = new URLSearchParams(new FormData(e.target));
  const r = await fetch('/api/crear-cuento', { method:'POST', body:data });
  document.getElementById('out').textContent = await r.text();
});
</script>
</body>
</html>`;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// === FLIPBOOK ===
async function serveFlipbook(res, subdomain) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (!rows.length) {
      res.writeHead(404);
      return res.end('Cuento no encontrado');
    }

    const c = rows[0];

    await pool.execute(
      'UPDATE cuentos SET vistas = vistas + 1 WHERE id = ?',
      [c.id]
    );

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<h1>Cuento de ${c.nombre_nino}</h1>
<p>Subdomain: ${c.subdomain}</p>
<p>Código: ${c.codigo_unico}</p>
<p>Estado: ${c.estado}</p>
<p>Vistas: ${c.vistas}</p>
`);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end('Error servidor');
  }
}

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

server.listen(PORT, '0.0.0.0', () =>
  console.log(`Servidor escuchando en ${PORT}`)
);
