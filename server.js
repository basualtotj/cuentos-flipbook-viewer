// server.js (ISLA: solo este archivo)
const http = require('http');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const Stripe = require('stripe');
const fs = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 3000;
const MAIN_DOMAIN = process.env.MAIN_DOMAIN || 'cuentosparasiempre.com';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY no está configurada');
  process.exit(1);
}
const stripe = new Stripe(STRIPE_SECRET_KEY);

// ====== DB ======
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// ====== Helpers ======
function normalizeSubdomain(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidSubdomain(value) {
  if (!value) return false;
  if (value.length < 1 || value.length > 63) return false;
  if (!/^[a-z0-9-]+$/.test(value)) return false;
  if (value.startsWith('-') || value.endsWith('-')) return false;
  return true;
}

function generateCodigoUnico() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

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

// ====== Landing ======
function serveLandingPage(res) {
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Cuentos Personalizados</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:720px;margin:50px auto;line-height:1.6;padding:20px}
    input,button{padding:10px;margin:5px 0;width:100%;box-sizing:border-box}
    button{background:#5469d4;color:#fff;border:0;cursor:pointer;font-size:16px;border-radius:8px}
    button:hover{background:#4355c8}
    #out{background:#f4f4f4;padding:12px;white-space:pre-wrap;margin-top:20px;border-radius:8px}
    small{color:#666}
  </style>
</head>
<body>
  <h1>📚 Cuentos Personalizados</h1>
  <p>Creá tu cuento único. Elegí tu subdominio.</p>

  <form id="form">
    <label>Nombre del niño/a</label>
    <input name="nombre" required placeholder="Ej: Catalina" />

    <label>Email</label>
    <input name="email" type="email" required placeholder="tu@email.com" />

    <label>Subdominio deseado</label>
    <input name="subdomain" placeholder="catalina-estrella" required />
    <small>Solo letras, números y guiones.</small>

    <button type="submit">Crear cuento y pagar ($19.990)</button>
  </form>

  <div id="out"></div>

  <script>
    const form = document.getElementById('form');
    const out = document.getElementById('out');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      out.textContent = 'Creando cuento...';

      try {
        const data = new URLSearchParams(new FormData(e.target));
        const r = await fetch('/api/crear-cuento', { method: 'POST', body: data });

        let result = {};
        try { result = await r.json(); } catch {}

        if (r.status === 409) {
          out.textContent = 'Subdominio ya en uso. Prueba otro.';
          return;
        }

        if (result.success && result.checkout_url) {
          out.textContent = 'Cuento creado. Redirigiendo a pago...';
          setTimeout(() => window.location.href = result.checkout_url, 700);
        } else {
          out.textContent = 'Error: ' + (result.error || ('HTTP ' + r.status));
        }
      } catch (err) {
        out.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>`;
  return sendHtml(res, 200, html);
}

// ====== API: crear cuento ======
async function handleCrearCuento(req, res) {
  try {
    const body = await readBody(req);
    const params = new URLSearchParams(body);

    const nombre = (params.get('nombre') || '').trim();
    const email = (params.get('email') || '').trim();
    const subdomainRaw = params.get('subdomain');

    if (!nombre || !subdomainRaw) {
      return sendJson(res, 400, { success: false, error: 'Datos incompletos' });
    }

    const subdomain = normalizeSubdomain(subdomainRaw);
    if (!isValidSubdomain(subdomain)) {
      return sendJson(res, 400, { success: false, error: 'Subdominio inválido' });
    }

    // código único
    let codigo = null;
    for (let i = 0; i < 5; i += 1) {
      codigo = generateCodigoUnico();
      const [existsCode] = await pool.execute(
        'SELECT id FROM cuentos WHERE codigo_unico = ? LIMIT 1',
        [codigo]
      );
      if (!existsCode.length) break;
    }
    if (!codigo) return sendJson(res, 500, { success: false, error: 'No se pudo generar código' });

    // subdomain único
    const [existsSubdomain] = await pool.execute(
      'SELECT id FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );
    if (existsSubdomain.length) {
      return sendJson(res, 409, { success: false, error: 'Subdominio ya en uso' });
    }

    // guardar pendiente
    const payloadJson = JSON.stringify({
      nombre,
      email,
      subdomain,
      created_at: new Date().toISOString(),
    });

    const [result] = await pool.execute(
      `INSERT INTO cuentos (subdomain, nombre_nino, codigo_unico, email_cliente, estado, payload_json)
       VALUES (?, ?, ?, ?, 'pendiente', ?)`,
      [subdomain, nombre, codigo, email || null, payloadJson]
    );

    const cuentoId = result.insertId;

    // Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'clp',
          product_data: {
            name: `Cuento Personalizado - ${nombre}`,
            description: `Subdominio: ${subdomain}.${MAIN_DOMAIN}`,
          },
          unit_amount: 19990,
        },
        quantity: 1,
      }],
      success_url: `https://${subdomain}.${MAIN_DOMAIN}?pago=exitoso`,
      cancel_url: `https://${MAIN_DOMAIN}?pago=cancelado`,
      customer_email: email || undefined,
      metadata: {
        cuento_id: String(cuentoId),
        subdomain,
        codigo_unico: codigo,
        nombre_nino: nombre,
      },
    });

    return sendJson(res, 200, {
      success: true,
      cuento_id: cuentoId,
      subdomain,
      codigo,
      checkout_url: session.url,
    });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { success: false, error: 'Error creando cuento' });
  }
}

async function serveFlipbook(res, subdomain) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, subdomain, nombre_nino, codigo_unico, estado, vistas, flipbook_path FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (!rows.length) {
      return sendHtml(res, 404, `<h1>404 - Cuento no encontrado</h1><p>${escapeHtml(subdomain)}</p>`);
    }

    const c = rows[0];
    await pool.execute('UPDATE cuentos SET vistas = COALESCE(vistas, 0) + 1 WHERE id = ?', [c.id]);

    const folder = c.flipbook_path || 'cuento-prueba';
    
    // IMPORTANTE: tienes imágenes 0.jpg a 22.jpg = 23 archivos
    const imageCount = 23; // cantidad de archivos JPG
    
    const BOOK_ASPECT = 2.8285714;

    // Turn.js indexa páginas desde 1. Tus imágenes empiezan en 0.
    // Mapeo esperado:
    //   Turn.js page 1 -> 0.jpg
    //   Turn.js page 2 -> 1.jpg
    //   ...
    //   Turn.js page 23 -> 22.jpg
    const pagesHtml = Array.from({ length: imageCount }, (_, idx) => {
      const turnPage = idx + 1; // 1..imageCount
      const imgIndex = turnPage - 1; // 0..imageCount-1
      // Cache-busting is the fix (avoids stale images being reused by cache/CDN).
      const src = `/flipbooks/${encodeURIComponent(folder)}/${imgIndex}.jpg?v=${imgIndex}`;
      return `<div class="page"><img src="${src}" alt="Página ${turnPage}" loading="eager" decoding="async"></div>`;
    }).join('\n');

    const safeNombre = escapeHtml(c.nombre_nino || 'Tu Cuento');
    const safeCodigo = escapeHtml(c.codigo_unico || '');
    const paidBadge = c.estado === 'pagado'
      ? '<span class="badge ok">✅ Pago completado</span>'
      : '<span class="badge warn">⚠️ Pago pendiente</span>';

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeNombre}</title>

  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js"></script>

  <style>
    :root{
      --maxw: 1200px;
      --bg: #0f0f12;
      --panel: rgba(255,255,255,.06);
      --txt: #f5f5f7;
      --muted: rgba(245,245,247,.75);
    }
    body{
      margin:0;
      padding:18px 14px 26px;
      background: var(--bg);
      color: var(--txt);
      font-family: Arial, sans-serif;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:14px;
    }

  html, body{ height: 100%; }
    .header{
      width:min(96vw, var(--maxw));
      background: var(--panel);
      border-radius: 14px;
      padding: 14px 16px;
      box-sizing: border-box;
    }
    .header h1{ margin:0 0 6px; font-size: 22px; }
    .meta{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; color:var(--muted); }
    .code{ color: var(--txt); font-weight:700; }
    .badge{ padding:6px 10px; border-radius:999px; font-size:13px; font-weight:700; }
    .badge.ok{ background: rgba(34,197,94,.18); color:#4ade80; }
    .badge.warn{ background: rgba(251,191,36,.18); color:#fbbf24; }

    #flipbook{
      width: min(96vw, var(--maxw));
      aspect-ratio: ${BOOK_ASPECT};
      height: auto;
      margin: 6px 0;
      box-shadow: 0 12px 40px rgba(0,0,0,.55);
      border-radius: 14px;
      overflow: hidden;
      background: #111;
    }

    #flipbook .page{
      background:#111;
      width: 50%;
      height: 100%;
      display:flex;
      align-items:center;
      justify-content:center;
    }

    #flipbook .page img{
      width:100%;
      height:100%;
      display:block;
      object-fit: cover;
      background:#111;
    }

    /* In immersive/fullscreen we prefer to avoid cropping the content */
    body.fullscreen #flipbook .page img,
    body.ios-fullscreen #flipbook .page img{
      object-fit: contain;
    }

    .controls{
      width:min(96vw, var(--maxw));
      display:flex;
      justify-content:center;
      align-items:center;
      gap:14px;
    }

  /* Fullscreen helper UI (when it's not intuitive to drag page corners) */
  .fs-controls{ display:none; }
  .fs-hint{ display:none; }
  body.fullscreen .fs-controls,
  body.ios-fullscreen .fs-controls{ display:flex; }
  body.fullscreen .fs-hint,
  body.ios-fullscreen .fs-hint{ display:block; }

    .fs-controls{
      position: fixed;
      left: 12px;
      right: 12px;
      top: 12px;
      z-index: 10001;
      justify-content: space-between;
      gap: 10px;
      pointer-events: none;
    }
  .fs-controls .left,
  .fs-controls .right{
      display:flex;
      gap:10px;
      pointer-events: auto;
    }

  body.fullscreen .fs-controls{ pointer-events: auto; }

  /* Important: override generic places where 'button' might be hidden/blocked */
  .fs-controls button{ display:inline-flex; align-items:center; justify-content:center; }

    .fs-hint{
      position: fixed;
      left: 50%;
      bottom: 72px;
      transform: translateX(-50%);
      z-index: 10001;
      font-size: 13px;
      color: rgba(255,255,255,0.9);
      background: rgba(0,0,0,0.55);
      padding: 8px 10px;
      border-radius: 999px;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      user-select: none;
      opacity: 0;
      transition: opacity 180ms ease;
    }

    /* Fullscreen styles */
    #flipbook:fullscreen{
      width: 100vw;
      height: 100vh;
      background: #000;
      margin: 0;
      border-radius: 0;
    }
    #flipbook:-webkit-full-screen{
      width: 100vw;
      height: 100vh;
      background: #000;
      margin: 0;
      border-radius: 0;
    }
    #flipbook:-ms-fullscreen{
      width: 100vw;
      height: 100vh;
      background: #000;
      margin: 0;
      border-radius: 0;
    }

    /* Center the (aspect-ratio fitted) content inside fullscreen viewport */
    body.fullscreen{ padding:0; }
    body.fullscreen #flipbook,
    body.ios-fullscreen #flipbook{
      display:flex;
      align-items:center;
      justify-content:center;
    }

    body.fullscreen .controls{
      position: fixed;
      left: 50%;
      bottom: 20px;
      transform: translateX(-50%);
      width: auto;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(0,0,0,0.7);
      z-index: 9999;
    }

    /* In fullscreen, keep bottom controls visible and compact */
    body.fullscreen .controls,
    body.ios-fullscreen .controls{
      gap: 10px;
    }

  /* iOS fallback (Safari iOS doesn't support Fullscreen API on arbitrary elements) */
  body.ios-fullscreen{ overflow: hidden; background:#000; }
    body.ios-fullscreen .header{ display:none; }
    body.ios-fullscreen #flipbook{
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      background: #000;
      margin: 0;
      border-radius: 0;
  display:flex;
  align-items:center;
  justify-content:center;
    }
    body.ios-fullscreen .controls{
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: rgba(0,0,0,0.8);
      padding: 8px 10px;
      border-radius: 18px;
      width: auto;
    }

    body.ios-fullscreen button{
      padding: 8px 10px;
      font-size: 13px;
    }
    body.ios-fullscreen #page-info{
      font-size: 12px;
    }
    button{
      padding: 10px 14px;
      border:0;
      border-radius:10px;
      background:#667eea;
      color:#fff;
      font-size:15px;
      cursor:pointer;
    }
    button:disabled{ opacity:.45; cursor:not-allowed; }
    #page-info{ color: var(--muted); font-size: 14px; }

    @media (max-width: 520px){
      .header h1{ font-size:18px; }
      button{ padding: 9px 12px; font-size:14px; }
    }

    .fs-nav{
      padding: 12px 14px;
      font-size: 14px;
      border-radius: 12px;
      background: rgba(102,126,234,0.95);
    }
    .fs-close{
      background: rgba(255,255,255,0.16);
      color:#fff;
    }

    /* Ensure fullscreen overlay controls are prominent on desktop fullscreen */
    body.fullscreen .fs-controls{
      top: auto;
      bottom: 18px;
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      width: auto;
      background: rgba(0,0,0,0.65);
      padding: 10px 12px;
      border-radius: 16px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    body.fullscreen .fs-controls .left,
    body.fullscreen .fs-controls .right{ gap: 12px; }
    body.fullscreen .fs-nav{ padding: 14px 16px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📖 ${safeNombre}</h1>
    <div class="meta">
      <div>Código: <span class="code">${safeCodigo}</span></div>
      ${paidBadge}
    </div>
  </div>

  <div id="flipbook">
    ${pagesHtml}
  </div>

  <div class="fs-controls" aria-hidden="true">
    <div class="left">
      <button class="fs-nav" id="fs-prev">◀</button>
      <button class="fs-nav" id="fs-next">▶</button>
    </div>
    <div class="right">
      <button class="fs-nav fs-close" id="fs-close">✕</button>
    </div>
  </div>

  <div class="fs-hint" id="fs-hint">Usa ◀ ▶ o arrastra (también teclado)</div>

  <div class="controls">
    <button id="prev">◀ Anterior</button>
    <span id="page-info">Página 1 de ${imageCount}</span>
  <button id="fullscreen">⛶ Pantalla completa</button>
    <button id="next">Siguiente ▶</button>
  </div>

  <script>
    $(function () {
      const imageCount = ${imageCount}; // 23 imágenes (0.jpg a 22.jpg)
      const $fb = $('#flipbook');

      // Deterministic sizing + UI state (avoid trial-and-error timing issues)
      const uiState = {
        normalW: null,
        normalH: null,
        hintTimer: null,
        inited: false,
      };

      function sizeFromCss(){
        const w = $fb.width();
        const h = $fb.height();
        return { w, h };
      }

      const BOOK_ASPECT = ${BOOK_ASPECT};

      function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      }

      function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      }

      function getMode() {
        if (document.body.classList.contains('ios-fullscreen')) return 'ios';
        if (isFullscreen()) return 'fs';
        return 'normal';
      }

      function getTargetBoxForMode(mode) {
        if (mode === 'normal') {
          const ns = sizeFromCss();
          return { w: ns.w, h: ns.h };
        }

        if (mode === 'fs') {
          // Use actual fullscreen element box when possible.
          const el = (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) || $fb[0];
          const rect = el.getBoundingClientRect();
          return { w: rect.width || window.innerWidth, h: rect.height || window.innerHeight };
        }

        // iOS immersive simulation: viewport box
        return { w: window.innerWidth, h: window.innerHeight };
      }

      function fitIntoAspect(boxW, boxH) {
        let newW, newH;
        if (boxW / boxH > BOOK_ASPECT) {
          newH = boxH;
          newW = boxH * BOOK_ASPECT;
        } else {
          newW = boxW;
          newH = boxW / BOOK_ASPECT;
        }
        newW = Math.max(1, Math.floor(newW));
        newH = Math.max(1, Math.floor(newH));
        return { w: newW, h: newH };
      }

      function applyTurnSize(w, h) {
        // Turn.js can glitch if called with same size repeatedly; keep it simple.
        $fb.turn('size', w, h);
      }

      function fitBook(reason) {
        const mode = getMode();
        const box = getTargetBoxForMode(mode);

        if (mode === 'normal') {
          uiState.normalW = box.w;
          uiState.normalH = box.h;
          applyTurnSize(uiState.normalW, uiState.normalH);
          return;
        }

        const fitted = fitIntoAspect(box.w, box.h);
        applyTurnSize(fitted.w, fitted.h);
      }

  const s = sizeFromCss();
  uiState.normalW = s.w;
  uiState.normalH = s.h;

      $fb.turn({
        width: s.w,
        height: s.h,
        /* NOTE: Turn.js normally infers page count from the DOM. */
        autoCenter: true,
        duration: 900,
        gradients: true,
        acceleration: true
      });

      function update(){
        const page = $fb.turn('page');
  const isIosImmersive = document.body.classList.contains('ios-fullscreen');
  $('#page-info').text((isIosImmersive ? '' : 'Página ') + page + ' de ' + imageCount);
        $('#prev').prop('disabled', page === 1);
        $('#next').prop('disabled', page === imageCount);
  $('#fs-prev').prop('disabled', page === 1);
  $('#fs-next').prop('disabled', page === imageCount);
      }

      $fb.bind('turned', update);
      $('#prev').click(() => $fb.turn('previous'));
      $('#next').click(() => $fb.turn('next'));
  $('#fs-prev').click(() => $fb.turn('previous'));
  $('#fs-next').click(() => $fb.turn('next'));
      update();

  const fsBtn = document.getElementById('fullscreen');

      function setFullscreenUi(on) {
        document.body.classList.toggle('fullscreen', on);
        if (fsBtn) fsBtn.textContent = on ? '✕ Salir' : '⛶ Pantalla completa';

        const hint = document.getElementById('fs-hint');
        if (hint) {
          if (uiState.hintTimer) clearTimeout(uiState.hintTimer);
          if (on) {
            hint.style.opacity = '1';
            uiState.hintTimer = setTimeout(() => { hint.style.opacity = '0'; }, 3500);
          } else {
            hint.style.opacity = '0';
          }
        }
      }

      function requestFullscreen(el) {
        if (el.requestFullscreen) return el.requestFullscreen();
        if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
        if (el.msRequestFullscreen) return el.msRequestFullscreen();
      }

      function exitFullscreen() {
        if (document.exitFullscreen) return document.exitFullscreen();
        if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
        if (document.msExitFullscreen) return document.msExitFullscreen();
      }

      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          if (isIOS()) {
            // iOS immersive mode (no Fullscreen API)
            document.body.classList.toggle('ios-fullscreen');
            const on = document.body.classList.contains('ios-fullscreen');
            fsBtn.textContent = on ? '✕ Cerrar' : '⛶ Pantalla completa';
            if (on) {
              // Best-effort: scroll to top to reduce Safari bars.
              window.scrollTo(0, 0);
              document.documentElement.style.overflow = 'hidden';
              document.body.style.overflow = 'hidden';
            } else {
              document.documentElement.style.overflow = '';
              document.body.style.overflow = '';
            }
            // Deterministic: apply sizing immediately + after a frame (Safari updates viewport late)
            fitBook('ios-toggle');
            requestAnimationFrame(() => {
              fitBook('ios-toggle-raf');
              update();
            });
            return;
          }

          if (isFullscreen()) exitFullscreen();
          else requestFullscreen($fb[0]);
        });
      }

      function onFullscreenChange() {
        const on = isFullscreen();
        setFullscreenUi(on);

        // Deterministic sizing: compute from the current mode.
        // Apply twice (now + next frame) to avoid transient values on exit.
        fitBook('fs-change');
        requestAnimationFrame(() => {
          fitBook('fs-change-raf');
          update();
        });
      }

      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', onFullscreenChange);
      document.addEventListener('msfullscreenchange', onFullscreenChange);

      // Keyboard navigation in fullscreen (and iOS immersive mode)
      document.addEventListener('keydown', (e) => {
        const inFs = isFullscreen() || document.body.classList.contains('ios-fullscreen');
        if (!inFs) return;

        if (e.key === 'ArrowLeft') { e.preventDefault(); $fb.turn('previous'); }
        if (e.key === 'ArrowRight') { e.preventDefault(); $fb.turn('next'); }
        if (e.key === 'Escape') {
          if (document.body.classList.contains('ios-fullscreen')) {
            document.body.classList.remove('ios-fullscreen');
            if (fsBtn) fsBtn.textContent = '⛶ Pantalla completa';
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            setTimeout(() => {
              const ns = sizeFromCss();
              uiState.normalW = ns.w;
              uiState.normalH = ns.h;
              $fb.turn('size', uiState.normalW, uiState.normalH);
              update();
            }, 80);
          }
        }
      });

      // Close button (works in both desktop fullscreen + iOS immersive)
      const fsClose = document.getElementById('fs-close');
      if (fsClose) {
        fsClose.addEventListener('click', () => {
          if (document.body.classList.contains('ios-fullscreen')) {
            document.body.classList.remove('ios-fullscreen');
            if (fsBtn) fsBtn.textContent = '⛶ Pantalla completa';
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            fitBook('ios-close');
            requestAnimationFrame(() => {
              fitBook('ios-close-raf');
              update();
            });
            return;
          }
          if (isFullscreen()) exitFullscreen();
        });
      }

      let t = null;
      window.addEventListener('resize', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          fitBook('resize');
          requestAnimationFrame(() => {
            fitBook('resize-raf');
            update();
          });
        }, 150);
      });

      // Initialize with a deterministic first sizing pass.
      if (!uiState.inited) {
        uiState.inited = true;
        fitBook('init');
        requestAnimationFrame(() => fitBook('init-raf'));
      }
    });
  </script>
</body>
</html>`;

    return sendHtml(res, 200, html);
  } catch (e) {
    console.error(e);
    return sendHtml(res, 500, 'Error servidor');
  }
}


// ====== Static: /flipbooks/... jpg ======
const PUBLIC_DIR = path.join(__dirname, 'public');

function safeJoin(base, urlPath) {
  // evita ../ traversal
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const joined = path.join(base, decoded);
  if (!joined.startsWith(base)) return null;
  return joined;
}

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