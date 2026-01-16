const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cuento de ${subdomain}</title>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        .subdomain { 
          color: #ffd700; 
          font-size: 2.5em; 
          font-weight: bold;
          margin: 30px 0;
        }
        .info {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>🎉 ¡Sistema Funcionando!</h1>
      <div class="info">
        <p>Subdomain detectado:</p>
        <p class="subdomain">${subdomain}</p>
        <p>Host completo: <strong>${host}</strong></p>
      </div>
      <hr style="border: 1px solid rgba(255,255,255,0.3); margin: 40px 0;">
      <p><em>✅ Wildcard SSL activo</em></p>
      <p><em>🚀 Próximo paso: Conectar con base de datos</em></p>
    </body>
    </html>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Escuchando en todas las interfaces: 0.0.0.0:${PORT}`);
});
