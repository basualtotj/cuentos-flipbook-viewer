const http = require('http');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// ==================
// CONFIGURACIÓN
// ==================
const PORT = process.env.PORT || 3000;
const MAIN_DOMAIN = 'cuentosparasiempre.com';

// ==================
// DB POOL
// ==================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==================
// HELPERS
// ==================
function normalizeSubdomain(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generarCodigoUnico() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// ==================
// SERVER
// ==================
const server = http.createServer(async (req, res) => {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const cleanHost = host.split(':')[0].trim();

  const isMainDomain =
    cleanHost === MAIN_DOMAIN ||
    cleanHost === `www.${MAIN_DOMAIN}`;

  // -------- API: verificar subdomain --------
  if (req.method === 'POST' && req.url === '/api/verificar-subdomain') {
    return handleVerificarSubdomain(req, res);
  }

  // -------- API: crear cuento --------
  if (req.method === 'POST' && req.url === '/api/crear-cuento') {
    return handleCrearCuento(req, res);
  }

  // -------- Landing --------
  if (isMainDomain) {
    return serveLandingPage(req, res);
  }

  // -------- Flipbook --------
  const subdomain = cleanHost.replace(`.${MAIN_DOMAIN}`, '').replace(/^www\./, '');
  return serveFlipbook(req, res, subdomain);
});

// ==================
// HANDLERS
// ==================
async function handleVerificarSubdomain(req, res) {
  let body = '';
  req.on('data', c => body += c.toString());
  req.on('end', async () => {
    try {
      const { subdomain } = JSON.parse(body);
      const limpio = normalizeSubdomain(subdomain);

      const [rows] = await pool.execute(
        'SELECT id FROM cuentos WHERE subdomain = ? LIMIT 1',
        [limpio]
      );

      const disponible = rows.length === 0;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        disponible,
        subdomain: limpio,
        mensaje: disponible
          ? `El subdominio "${limpio}" está disponible`
          : `El subdominio "${limpio}" ya está en uso`
      }));
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Payload inválido' }));
    }
  });
}

async function handleCrearCuento(req, res) {
  let body = '';

  req.on('data', c => { body += c.toString(); });

  req.on('end', async () => {
    try {
      const params = new URLSearchParams(body);

      const nombre = (params.get('nombre') || '').trim();
      const edad = (params.get('edad') || '').trim();      // NO existe columna: va a payload_json
      const email = (params.get('email') || '').trim();
      const subdomainRaw = (params.get('subdomain') || '').trim();

      if (!nombre || !email || !subdomainRaw) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          error: 'Datos incompletos',
          required: ['nombre', 'email', 'subdomain'],
          note: 'edad es opcional y se guarda en payload_json'
        }));
      }

      const subdomain = normalizeSubdomain(subdomainRaw);
      const codigo = generarCodigoUnico();

      // Guardamos TODO lo extra aquí (edad hoy, más campos mañana)
      const payload = {
        edad: edad || null,
        // futuro: genero, tono_piel, etc...
      };

      const sql = `
        INSERT INTO cuentos
          (subdomain, nombre_nino, codigo_unico, email_cliente, estado, payload_json)
        VALUES
          (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        subdomain,
        nombre,
        codigo,
        email || null,
        'pendiente',
        JSON.stringify(payload)
      ];

      const [result] = await pool.execute(sql, values);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        id: result.insertId,
        subdomain,
        codigo,
        url: `https://${subdomain}.${MAIN_DOMAIN}`,
        mensaje: 'Registro creado (pendiente). Próximo paso: pago + webhook.'
      }));
    } catch (e) {
      console.error('Error creando cuento:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Error creando cuento',
        code: e.code || null,
        message: e.message || String(e)
      }));
    }
  });
}

// ==================
// LANDING
// ==================
function serveLandingPage(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
<!DOCTYPE html>
<html>
<body style="font-family:Arial;max-width:600px;margin:50px auto">
<h1>Cuentos Personalizados</h1>
<form id="f">
<input name="nombre" placeholder="Nombre" required><br><br>
<input name="edad" placeholder="Edad" required><br><br>
<input name="email" placeholder="Email" required><br><br>
<input name="subdomain" placeholder="Subdominio deseado" required><br><br>
<button>Crear cuento</button>
</form>
<pre id="out"></pre>
<script>
document.getElementById('f').onsubmit = async e => {
  e.preventDefault();
  const r = await fetch('/api/crear-cuento', {
    method:'POST',
    body:new URLSearchParams(new FormData(e.target))
  });
  document.getElementById('out').textContent = await r.text();
}
</script>
</body>
</html>
`);
}

// ==================
// FLIPBOOK
// ==================
async function serveFlipbook(req, res, subdomain) {
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
    pool.execute('UPDATE cuentos SET vistas = vistas + 1 WHERE id = ?', [c.id]);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<h1>Cuento de ${c.nombre_nino}</h1>
<p>Subdomain: ${c.subdomain}</p>
<p>Estado: ${c.estado}</p>
<p>Vistas: ${c.vistas}</p>
`);
  } catch {
    res.writeHead(500);
    res.end('Error servidor');
  }
}

// ==================
server.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor activo en puerto', PORT);
});
