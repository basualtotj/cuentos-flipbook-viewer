const http = require('http');
const mysql = require('mysql2/promise');

const PORT = 3000;

// Configuración de conexión a MariaDB
const dbConfig = {
  host: 'cuentos-db',
  user: 'cuentos_user',
  password: 'Cuentos2025!User#App',
  database: 'cuentos'
};

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  
  let html = '';
  let connection = null;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    
    // Consultar el cuento según el subdomain
    const [rows] = await connection.execute(
      'SELECT * FROM cuentos WHERE subdomain = ?',
      [subdomain]
    );
    
    if (rows.length > 0) {
      // Cuento encontrado
      const cuento = rows[0];
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cuento de ${cuento.nombre_nino}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Comic Sans MS', cursive, sans-serif;
              max-width: 900px;
              margin: 0 auto;
              padding: 40px 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
            }
            .container {
              background: rgba(255,255,255,0.95);
              color: #333;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            h1 { 
              font-size: 3em; 
              color: #667eea;
              margin-bottom: 10px;
            }
            .nombre {
              font-size: 2.5em;
              color: #764ba2;
              font-weight: bold;
              margin: 20px 0;
            }
            .info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              text-align: left;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: white;
              border-left: 4px solid #667eea;
            }
            .label {
              font-weight: bold;
              color: #667eea;
            }
            .status {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-weight: bold;
            }
            .status.activo { background: #d4edda; color: #155724; }
            .status.pendiente { background: #fff3cd; color: #856404; }
            .status.pagado { background: #cce5ff; color: #004085; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📚 Cuento Personalizado</h1>
            <div class="nombre">✨ ${cuento.nombre_nino} ✨</div>
            
            <div class="info">
              <div class="info-item">
                <span class="label">ID:</span> ${cuento.id}
              </div>
              <div class="info-item">
                <span class="label">Subdomain:</span> ${cuento.subdomain}
              </div>
              <div class="info-item">
                <span class="label">Código único:</span> ${cuento.codigo_unico}
              </div>
              <div class="info-item">
                <span class="label">Email:</span> ${cuento.email_cliente || 'No especificado'}
              </div>
              <div class="info-item">
                <span class="label">Estado:</span> 
                <span class="status ${cuento.estado}">${cuento.estado.toUpperCase()}</span>
              </div>
              <div class="info-item">
                <span class="label">Fecha creación:</span> ${new Date(cuento.fecha_creacion).toLocaleString('es-CL')}
              </div>
              <div class="info-item">
                <span class="label">Vistas:</span> ${cuento.vistas}
              </div>
            </div>
            
            <hr style="border: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666;">
              <strong>✅ Sistema funcionando correctamente</strong><br>
              <em>Próximo paso: Cargar PDF del flipbook</em>
            </p>
          </div>
        </body>
        </html>
      `;
      
      // Incrementar contador de vistas
      await connection.execute(
        'UPDATE cuentos SET vistas = vistas + 1 WHERE id = ?',
        [cuento.id]
      );
      
    } else {
      // Cuento no encontrado
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cuento no encontrado</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 100px auto;
              padding: 40px;
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .box {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            h1 { color: #667eea; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>😔 Cuento no encontrado</h1>
            <p>No encontramos un cuento para el subdomain:</p>
            <p style="font-size: 1.5em; color: #764ba2;"><strong>${subdomain}</strong></p>
            <hr>
            <p style="color: #666; font-size: 0.9em;">
              Verifica que el subdomain sea correcto o contacta con soporte.
            </p>
          </div>
        </body>
        </html>
      `;
    }
    
  } catch (error) {
    // Error de conexión o consulta
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 40px;
            background: #f44336;
            color: white;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>⚠️ Error de conexión</h1>
        <p>No se pudo conectar con la base de datos.</p>
        <p style="font-size: 0.8em; opacity: 0.8;">${error.message}</p>
      </body>
      </html>
    `;
    console.error('Error DB:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Conectado a MariaDB: ${dbConfig.host}`);
});
