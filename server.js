const http = require('http');
const mysql = require('mysql2/promise');

const PORT = process.env.PORT || 3000;

// Pool de conexiones (reutilizable, no abre/cierra por request)
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
  // Detectar subdomain (soporta X-Forwarded-Host de proxies)
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const subdomain = host.split('.')[0];
  
  try {
    // Consultar cuento por subdomain
    const [rows] = await pool.execute(
      'SELECT * FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );
    
    if (rows.length === 0) {
      // 404 - Cuento no encontrado
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
    
    // Incrementar vistas (fire-and-forget, no esperar)
    pool.execute('UPDATE cuentos SET vistas = vistas + 1 WHERE id = ?', [cuento.id])
      .catch(err => console.error('Error updating views:', err));
    
    // Render HTML simple
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
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});
