// server.js
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const { PORT, MAIN_DOMAIN } = require('./src/config/constants');
const { landingHtml } = require('./src/views/landing');
const { handleCrearCuento } = require('./src/routes/api');
const { serveFlipbook } = require('./src/routes/flipbook');

const {
  sendHtml,
  setSecurityHeaders,
  getRequestHost,
  parseSubdomainFromHost,
  safeJoin
} = require('./src/utils/http');

const PUBLIC_DIR = path.join(__dirname, 'public');

async function serveStatic(req, res) {
  // Solo permitimos servir desde /public
  const filePath = safeJoin(PUBLIC_DIR, req.url);
  if (!filePath) return false;

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.css' ? 'text/css; charset=utf-8' :
      ext === '.js' ? 'application/javascript; charset=utf-8' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.png' ? 'image/png' :
      ext === '.webp' ? 'image/webp' :
      ext === '.svg' ? 'image/svg+xml; charset=utf-8' :
      null;

    if (!contentType) return false;

    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=300' });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);

  // 1) Estáticos
  const served = await serveStatic(req, res);
  if (served) return;

  // 2) Routing por host
  const cleanHost = getRequestHost(req);
  const isMainDomain = cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`;

  // API
  if (req.method === 'POST' && req.url === '/api/crear-cuento') {
    return handleCrearCuento(req, res);
  }

  // Landing
  if (isMainDomain) {
    return sendHtml(res, 200, landingHtml());
  }

  // Subdominio -> Flipbook
  const subdomain = parseSubdomainFromHost(cleanHost, MAIN_DOMAIN);
  if (!subdomain) {
    return sendHtml(res, 404, 'No encontrado');
  }

  return serveFlipbook(res, subdomain);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en ${PORT}`);
});