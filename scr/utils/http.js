// src/utils/http.js
const path = require('path');

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendHtml(res, code, html) {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function setSecurityHeaders(res) {
  // Básico, no rompe nada
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function readBody(req, maxBytes = 1024 * 1024) {
  return await new Promise((resolve, reject) => {
    let size = 0;
    let body = '';
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function getRequestHost(req) {
  const raw = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().toLowerCase();
  return raw.split(',')[0].trim().split(':')[0];
}

function parseSubdomainFromHost(cleanHost, MAIN_DOMAIN) {
  if (!cleanHost) return null;
  if (cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`) return null;
  if (!cleanHost.endsWith(`.${MAIN_DOMAIN}`)) return null;

  const prefix = cleanHost.slice(0, -(`.${MAIN_DOMAIN}`).length);
  const sd = prefix.replace(/^www\./, '');
  return sd || null;
}

function safeJoin(baseDir, urlPath) {
  // Evita path traversal: /flipbooks/../../etc/passwd
  const normalized = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.join(baseDir, normalized);
  if (!full.startsWith(baseDir)) return null;
  return full;
}

module.exports = {
  sendJson,
  sendHtml,
  setSecurityHeaders,
  escapeHtml,
  readBody,
  getRequestHost,
  parseSubdomainFromHost,
  safeJoin,
};