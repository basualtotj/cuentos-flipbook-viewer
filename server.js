// server.js
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const { PORT, MAIN_DOMAIN } = require('./src/config/constants');
const { getRequestHost, parseSubdomainFromHost, safeJoin, sendHtml, sendJson } = require('./src/utils/http');
const { handleCrearCuento } = require('./src/routes/api');
const { serveFlipbook } = require('./src/routes/flipbook');
const { landingHtml } = require('./src/views/landing');

function serveLandingPage(res) {
  return sendHtml(res, 200, landingHtml);
}

// ====== Static: /flipbooks/... jpg ======
const PUBLIC_DIR = path.join(__dirname, 'public');

async function serveStatic(req, res) {
  if (!req.url.startsWith('/flipbooks/')) return false;

  const filePath = safeJoin(PUBLIC_DIR, req.url);
  if (!filePath) return false;

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' :
      (ext === '.png') ? 'image/png' :
      null;

    if (!contentType) return false;

    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300'
    });
    res.end(data);
    return true;
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Archivo no encontrado');
    return true;
  }
}

// ====== Server ======
const server = http.createServer(async (req, res) => {
  // 1) Estáticos (JPG)
  if (await serveStatic(req, res)) return;

  const cleanHost = getRequestHost(req);
  const isMainDomain = cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`;

  // API
  if (req.method === 'POST' && req.url === '/api/crear-cuento') {
    return handleCrearCuento(req, res);
  }

  // ====== Test Puppeteer ======
  if (req.method === 'GET' && req.url === '/api/test-puppeteer') {
    try {
      const puppeteer = require('puppeteer');

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent('<h1>Puppeteer funciona!</h1>');
      await browser.close();

      return sendJson(res, 200, {
        success: true,
        message: 'Puppeteer instalado correctamente',
        version: puppeteer.version || 'unknown'
      });
    } catch (e) {
      return sendJson(res, 500, {
        success: false,
        error: e.message
      });
    }
  }

  // Landing
  if (isMainDomain) {
    return serveLandingPage(res);
  }

  // Subdominio -> Flipbook
  const subdomain = parseSubdomainFromHost(cleanHost);
  if (!subdomain) {
    return sendHtml(res, 404, 'No encontrado');
  }

  return serveFlipbook(res, subdomain);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en ${PORT}`);
});