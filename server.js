const http = require('http');
const mysql = require('mysql2/promise');

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

const server = http.createServer(async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  
  // Remover www si existe
  const cleanHost = host.replace('www.', '');
  
  // Detectar si es dominio principal (sin subdomain) o tiene subdomain
  const isMainDomain = cleanHost === MAIN_DOMAIN;
  
  if (isMainDomain) {
    serveLandingPage(req, res);
  } else {
    const subdomain = cleanHost.split('.')[0];
    await serveFlipbook(req, res, subdomain);
  }
});

function serveLandingPage(req, res) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cuentos Personalizados - Para Siempre</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #667eea;
      font-size: 2.5em;
      margin-bottom: 10px;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 1.1em;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 600;
    }
    input, select {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border 0.3s;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
    }
    .price {
      text-align: center;
      margin: 20px 0;
      font-size: 2em;
      color: #667eea;
      font-weight: bold;
    }
    .features {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .features ul {
      list-style: none;
    }
    .features li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }
    .features li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 Cuentos Personalizados</h1>
    <p class="subtitle">Un cuento único para tu hijo/a que durará para siempre</p>
    
    <div class="features">
      <ul>
        <li>Cuento 100% personalizado con el nombre de tu hijo/a</li>
        <li>Flipbook digital interactivo</li>
        <li>Acceso ilimitado desde cualquier dispositivo</li>
        <li>URL personalizada única</li>
      </ul>
    </div>
    
    <div class="price">$19.990</div>
    
    <form id="cuentoForm" method="POST" action="/crear-cuento">
      <div class="form-group">
        <label for="nombre">Nombre del niño/a *</label>
        <input type="text" id="nombre" name="nombre" required placeholder="Ej: Sofía">
      </div>
      
      <div class="form-group">
        <label for="edad">Edad *</label>
        <select id="edad" name="edad" required>
          <option value="">Selecciona edad</option>
          <option value="3">3 años</option>
          <option value="4">4 años</option>
          <option value="5">5 años</option>
          <option value="6">6 años</option>
          <option value="7">7 años</option>
          <option value="8">8 años</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="email">Tu email *</label>
        <input type="email" id="email" name="email" required placeholder="tu@email.com">
      </div>
      
      <button type="submit">Crear Mi Cuento Ahora</button>
    </form>
  </div>
  
  <script>
    document.getElementById('cuentoForm').addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Formulario enviado (próximo paso: integrar con Stripe y n8n)');
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
      res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>404</title></head>
<body style="font-family:Arial;text-align:center;padding:50px">
<h1>404 - Cuento no encontrado</h1>
<p>Subdomain: <strong>${subdomain}</strong></p>
</body></html>`);
      return;
    }
    
    const cuento = rows[0];
    
    pool.execute('UPDATE cuentos SET vistas = vistas + 1 WHERE id = ?', [cuento.id])
      .catch(err => console.error('Error updating views:', err));
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${cuento.nombre_nino}</title></head>
<body style="font-family:Arial;max-width:600px;margin:50px auto;padding:20px">
<h1>Cuento de ${cuento.nombre_nino}</h1>
<p><strong>Subdomain:</strong> ${cuento.subdomain}</p>
<p><strong>Código:</strong> ${cuento.codigo_unico}</p>
<p><strong>Estado:</strong> ${cuento.estado}</p>
<p><strong>Vistas:</strong> ${cuento.vistas}</p>
<p><strong>Email:</strong> ${cuento.email_cliente || 'N/A'}</p>
<hr>
<p><em>Sistema operativo - BD conectada</em></p>
</body></html>`);
    
  } catch (error) {
    console.error('DB Error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error de servidor');
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});
