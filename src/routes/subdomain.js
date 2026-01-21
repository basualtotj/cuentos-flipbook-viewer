// src/routes/subdomain.js

const { parseSubdomainFromHost, sendHtml } = require('../utils/http');
const { serveFlipbook } = require('./flipbook');

async function handleSubdomainRequest(req, res, { cleanHost, serveStatusPage }) {
  const subdomain = parseSubdomainFromHost(cleanHost);
  if (!subdomain) {
    return sendHtml(res, 404, 'No encontrado');
  }

  if (typeof serveStatusPage !== 'function') {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Status handler missing');
  }

  // Pantalla de estado en subdominio
  // - /status siempre muestra el progreso
  // - /?pago=exitoso muestra progreso (redirigible desde Stripe)
  try {
    const urlObj = new URL(req.url, `https://${cleanHost}`);
    const isStatusPath = urlObj.pathname === '/status';
    const isPagoExitoso = urlObj.searchParams.get('pago') === 'exitoso';
    if (req.method === 'GET' && (isStatusPath || (urlObj.pathname === '/' && isPagoExitoso))) {
      return await serveStatusPage(req, res);
    }
  } catch {
    // ignore URL parse errors
  }

  return serveFlipbook(res, subdomain);
}

module.exports = { handleSubdomainRequest };
