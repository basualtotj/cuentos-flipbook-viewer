// src/utils/http.js

const path = require('path');
const { MAIN_DOMAIN } = require('../config/constants');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getRequestHost(req) {
  const raw = (req.headers['x-forwarded-host'] || req.headers.host || '')
    .toString()
    .toLowerCase();
  return raw.split(',')[0].trim().split(':')[0];
}

function parseSubdomainFromHost(cleanHost) {
  if (!cleanHost) return null;
  if (cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`) return null;
  if (!cleanHost.endsWith(`.${MAIN_DOMAIN}`)) return null;

  const prefix = cleanHost.slice(0, -(`.${MAIN_DOMAIN}`).length);
  const sd = prefix.replace(/^www\./, '');
  return sd || null;
}

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendHtml(res, code, html) {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
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

function safeJoin(base, urlPath) {
  // evita ../ traversal
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const joined = path.join(base, decoded);
  if (!joined.startsWith(base)) return null;
  return joined;
}

module.exports = {
  escapeHtml,
  getRequestHost,
  parseSubdomainFromHost,
  sendJson,
  sendHtml,
  readBody,
  safeJoin,
};
