// src/views/flipbook.js

function flipbookHtml({
  safeNombre,
  safeCodigo,
  paidBadge,
  pagesHtml,
  imageCount,
  BOOK_ASPECT,
}) {
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeNombre}</title>

  <link rel="stylesheet" href="/css/tw.css" />

  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js"></script>

  <style>
    :root{
      --maxw: 1200px;

      /* Match landing palette */
      --bg: #fff;
      --text: #1c1b22;
      --muted: rgba(28,27,34,.72);
      --card: rgba(255,255,255,.92);
      --border: rgba(31, 33, 39, .10);
      --shadow: 0 18px 60px rgba(17, 24, 39, .12);
      --shadow-soft: 0 10px 26px rgba(17, 24, 39, .08);
      --r-xl: 26px;
      --r-lg: 18px;
      --r-md: 14px;
      --r-sm: 12px;

      /* palette (kids friendly) */
      --p1: #E88B7B; /* coral */
      --p2: #D4C5E8; /* lavender */
      --p3: #A8D5BA; /* mint */
      --p4: #BCE3F5; /* sky */
      --p5: #FFD4B8; /* peach */
      --p6: #F5C8D8; /* pink */

      --focus: 0 0 0 4px rgba(232, 139, 123, .22);
    }
    body{
      margin:0;
      padding:18px 14px 26px;
      color: var(--text);
      background:
        radial-gradient(900px 600px at 15% 10%, rgba(212,197,232,.30), transparent 70%),
        radial-gradient(900px 600px at 85% 15%, rgba(168,213,186,.25), transparent 70%),
        radial-gradient(900px 700px at 55% 90%, rgba(255,212,184,.22), transparent 70%),
        linear-gradient(180deg, #fff 0%, #fff9f5 100%);
      font-family: ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:14px;
    }

  html, body{ height: 100%; max-width:100%; overflow-x:hidden; }
    .header{
      width:min(96vw, var(--maxw));
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-soft);
      padding: 14px 16px;
      box-sizing: border-box;
      min-width:0;
    }
    .header h1{ margin:0 0 6px; font-size: 22px; }
    .meta{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; color:var(--muted); }
    .code{ color: var(--text); font-weight:900; }
    .badge{ padding:6px 10px; border-radius:999px; font-size:13px; font-weight:700; }
    .badge.ok{ background: rgba(34,197,94,.18); color:#4ade80; }
    .badge.warn{ background: rgba(251,191,36,.18); color:#fbbf24; }

    #flipbook{
      width: min(96vw, var(--maxw));
      aspect-ratio: ${BOOK_ASPECT};
      height: auto;
      margin: 6px 0;
  box-shadow: 0 18px 60px rgba(17,24,39,.22);
  border-radius: var(--r-lg);
      overflow: hidden;
  background: rgba(17,17,17,0.96);
    }

    #flipbook .page{
      background:#111;
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
  #reader:fullscreen{
      width: 100vw;
      height: 100vh;
      background: #000;
      margin: 0;
      border-radius: 0;
    }
  #reader:-webkit-full-screen{
      width: 100vw;
      height: 100vh;
      background: #000;
      margin: 0;
      border-radius: 0;
    }
  #reader:-ms-fullscreen{
      width: 100vw;
      height: 100vh;
      background: #000;
      margin: 0;
      border-radius: 0;
    }

    /* Fullscreen should give Turn.js a stable box, then JS will size the book. */
    body.fullscreen{ padding:0; }
    body.fullscreen #flipbook{
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      aspect-ratio: auto;
      margin: 0;
      border-radius: 0;
      box-shadow: none;
      background: #000;
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
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      background: #000;
      margin: 0;
      border-radius: 0;
      aspect-ratio: auto;
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
  background: linear-gradient(90deg, var(--p1), var(--p2));
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
  <div id="reader">
      background: linear-gradient(90deg, var(--p1), var(--p2));
      <h1>📖 ${safeNombre}</h1>
      <div class="meta">
        <div>Código: <span class="code">${safeCodigo}</span></div>
        ${paidBadge}
      </div>

    /* Hide the flipbook until the story is ready */
    body.is-loading #flipbook,
    body.is-loading .controls,
    body.is-loading .fs-controls,
    body.is-loading .fs-hint{
      visibility: hidden;
    }

    /* ===== Status Modal Overlay ===== */
    #status-overlay{
      position: fixed;
      inset: 0;
      z-index: 20000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 18px 14px;
      min-width: 0;
    }
    #status-overlay[data-open="true"]{ display:flex; }

    #status-overlay .backdrop{
      position:absolute;
      inset:0;
      background: rgba(255,255,255,0.55);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    #status-overlay .card{
      position: relative;
      width: min(96vw, 960px);
      min-width: 0;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      box-shadow: var(--shadow);
      padding: 18px;
      overflow: hidden;
    }

    #status-overlay h2{ margin:0; font-size: 24px; letter-spacing:-0.02em; }
    #status-overlay .sub{ margin-top:6px; color: var(--muted); font-weight: 900; }

    #status-overlay .bar{
      margin-top: 14px;
      width: 100%;
      height: 12px;
      border-radius: 999px;
      background: rgba(31,33,39,.08);
      overflow:hidden;
      border: 1px solid rgba(31,33,39,.08);
    }
    #status-overlay .bar > div{
      height:100%;
      width:0%;
      background: linear-gradient(90deg, var(--p1), var(--p2));
      transition: width 220ms ease;
    }

    #status-overlay .kvs{ margin-top: 14px; display:grid; grid-template-columns: 1fr; gap: 10px; min-width:0; }
    #status-overlay .kv{ display:grid; grid-template-columns: 140px minmax(0, 1fr); gap: 12px; align-items:start; min-width:0; }
    #status-overlay .k{ color: rgba(28,27,34,.62); font-weight: 900; font-size: 13px; }
    #status-overlay .v{ font-weight: 900; min-width: 0; overflow-wrap:anywhere; word-break: break-word; }
    #status-overlay .v.muted{ color: var(--muted); font-weight: 800; }

    #status-overlay .actions{ margin-top: 16px; display:flex; gap:10px; flex-wrap:wrap; }
    #status-overlay .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 16px;
      border: 0;
      cursor: pointer;
      font-weight: 900;
      font-size: 15px;
      color: #fff;
      background: linear-gradient(90deg, var(--p1), var(--p2));
      box-shadow: 0 18px 34px rgba(232,139,123,.22);
      text-decoration:none;
      max-width:100%;
      min-width: 0;
    }
    #status-overlay .btn.secondary{
      background: rgba(255,255,255,.9);
      color: rgba(28,27,34,.88);
      border: 1px solid rgba(31,33,39,.14);
      box-shadow: var(--shadow-soft);
    }
    #status-overlay .btn[aria-disabled="true"]{ opacity: .55; cursor:not-allowed; box-shadow: none; }

    #status-overlay .cta{ margin-top: 12px; font-size: 12px; font-weight: 900; color: rgba(28,27,34,.74); }
    #status-overlay .cta a{ text-decoration: underline; }

    @media (max-width: 640px){
      #status-overlay .card{ padding: 16px; border-radius: 22px; }
      #status-overlay h2{ font-size: 20px; }
      #status-overlay .kv{ grid-template-columns: 1fr; gap: 6px; }
      #status-overlay .btn{ width: 100%; }
    }
    </div>

    <div id="flipbook">
  <div id="status-overlay" data-open="false" aria-live="polite" aria-modal="true" role="dialog">
    <div class="backdrop" aria-hidden="true"></div>
    <div class="card">
      <h2>Generando tu cuento...</h2>
      <div class="sub">Puedes esperar aquí o revisar tu correo en ~10 min.</div>

      <div class="bar" aria-label="Progreso">
        <div id="status-bar"></div>
      </div>

      <div class="kvs">
        <div class="kv"><div class="k">Paso</div><div id="status-step" class="v">—</div></div>
        <div class="kv"><div class="k">Progreso</div><div id="status-progress" class="v">0%</div></div>
        <div class="kv"><div class="k">Detalle</div><div id="status-message" class="v muted">Esperando estado…</div></div>
      </div>

      <div class="actions">
        <a id="status-open" class="btn" href="/" aria-disabled="true" style="pointer-events:none;">📖 Abrir cuento</a>
        <a class="btn secondary" href="https://cuentosparasiempre.com" target="_blank" rel="noopener noreferrer">Crear otro cuento</a>
      </div>

      <div id="status-error" class="cta" style="display:none;">
        Hubo un problema generando tu cuento. <a href="mailto:hola@cuentosparasiempre.com">Escríbenos</a>.
      </div>
    </div>
  </div>

      ${pagesHtml}
    </div>

    <div class="fs-controls" aria-hidden="true">
      <div class="left">
        <button class="fs-nav" id="fs-prev">◀</button>

        <!-- Intentionally hidden: do not show payment technical states to end users -->
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
  </div>

  <script>
    $(function () {
      const POLL_MS = 2500;
      const urlParams = new URLSearchParams(window.location.search);
      const hasPagoExitoso = urlParams.get('pago') === 'exitoso';

      const overlay = document.getElementById('status-overlay');
      const bar = document.getElementById('status-bar');
      const stepEl = document.getElementById('status-step');
      const progressEl = document.getElementById('status-progress');
      const msgEl = document.getElementById('status-message');
      const openBtn = document.getElementById('status-open');
      const errCta = document.getElementById('status-error');

      function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
      function toInt(v){ const n = parseInt(String(v ?? ''), 10); return Number.isFinite(n) ? n : null; }
      function isImageStep(step){
        const s = String(step || '').toLowerCase();
        return s.includes('image') || s.includes('imagen') || s.includes('images') || s.includes('ilustr');
      }
      function setOverlayOpen(open){
        overlay.setAttribute('data-open', open ? 'true' : 'false');
        document.body.classList.toggle('is-loading', !!open);
      }
      function setProgress(percent){
        const pct = clamp(Math.round(Number(percent) || 0), 0, 100);
        progressEl.textContent = String(pct) + '%';
        bar.style.width = String(pct) + '%';
      }
      function setOpenEnabled(href){
        openBtn.href = href || '/';
        openBtn.setAttribute('aria-disabled', 'false');
        openBtn.style.pointerEvents = '';
      }

      // Build status URL without changing backend contract.
      function buildStatusUrl(){
        const p = new URLSearchParams(window.location.search);
        const cuentoId = p.get('cuento_id');
        const codigo = p.get('codigo');
        if (cuentoId && codigo) {
          return '/api/cuentos/status?cuento_id=' + encodeURIComponent(cuentoId) + '&codigo=' + encodeURIComponent(codigo);
        }
        const host = String(window.location.hostname || '');
        const subdomain = host.split('.')[0] || '';
        return '/api/cuentos/status?subdomain=' + encodeURIComponent(subdomain);
      }

      // Delay Turn.js init until story is ready.
      let turnInitialized = false;
      function initTurnOnce(){
        if (turnInitialized) return;
        turnInitialized = true;

      const imageCount = ${imageCount}; // 23 imágenes (0.jpg a 22.jpg)
  const $reader = $('#reader');
      const $fb = $('#flipbook');

      // UI state (only for hint timers).
      const uiState = {
        hintTimer: null,
      };

      const BOOK_ASPECT = ${BOOK_ASPECT};

      function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      }

      function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
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
        $fb.turn('size', w, h);
      }

      function fitToViewport() {
        const fitted = fitIntoAspect(window.innerWidth, window.innerHeight);
        applyTurnSize(fitted.w, fitted.h);
      }

      function fitToNormal() {
        const w = Math.max(1, Math.floor($fb.width() || 1));
        const h = Math.max(1, Math.floor($fb.height() || 1));
        applyTurnSize(w, h);
      }

  const s = { w: Math.max(1, Math.floor($fb.width() || 1)), h: Math.max(1, Math.floor($fb.height() || 1)) };

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
            if (on) {
              fitToViewport();
              requestAnimationFrame(() => {
                fitToViewport();
                update();
              });
            } else {
              fitToNormal();
              requestAnimationFrame(() => {
                fitToNormal();
                update();
              });
            }
            return;
          }

          if (isFullscreen()) exitFullscreen();
          else requestFullscreen($reader[0]);
        });
      }

      function onFullscreenChange() {
        const on = isFullscreen();
        setFullscreenUi(on);

        if (on) {
          fitToViewport();
          requestAnimationFrame(() => {
            fitToViewport();
            update();
          });
        } else {
          fitToNormal();
          requestAnimationFrame(() => {
            fitToNormal();
            update();
          });
        }
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
              fitToNormal();
              requestAnimationFrame(() => {
                fitToNormal();
                update();
              });
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
            fitToNormal();
            requestAnimationFrame(() => {
              fitToNormal();
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
          const inViewportMode = isFullscreen() || document.body.classList.contains('ios-fullscreen');
          if (inViewportMode) {
            fitToViewport();
            requestAnimationFrame(() => {
              fitToViewport();
              update();
            });
          } else {
            fitToNormal();
            requestAnimationFrame(() => {
              fitToNormal();
              update();
            });
          }
        }, 150);
      });

      // Initial sizing.
      fitToNormal();
      requestAnimationFrame(() => fitToNormal());
      }

      function renderStatus(data){
        const estado = String(data?.estado || '').toLowerCase();
        const step = String(data?.step || '');
        const msg = String(data?.message || '');
        const current = toInt(data?.current);
        const total = toInt(data?.total);
        const percent = (data?.percent !== undefined && data?.percent !== null) ? Number(data.percent) : null;

        stepEl.textContent = step || '—';

        if (isImageStep(step) && Number.isFinite(current) && Number.isFinite(total) && total > 0) {
          msgEl.textContent = 'Generando ilustración ' + String(current) + ' de ' + String(total) + (msg ? ' · ' + msg : '');
        } else {
          msgEl.textContent = msg || '—';
        }

        errCta.style.display = 'none';

        if (Number.isFinite(percent)) setProgress(percent);
        else if (Number.isFinite(current) && Number.isFinite(total) && total > 0) setProgress((current / total) * 100);
        else setProgress(0);

        if (estado === 'listo') {
          const ready = String(data?.ready_url || '/');
          setOpenEnabled(ready);
          // Close overlay and then init flipbook.
          setOverlayOpen(false);
          initTurnOnce();
          return 'done';
        }

        if (estado === 'error') {
          errCta.style.display = 'block';
          setOverlayOpen(true);
          return 'continue';
        }

        // pendiente | pagado | generando
        setOverlayOpen(true);
        return 'continue';
      }

      async function poll(){
        const url = buildStatusUrl();
        try {
          const r = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
          const data = await r.json();
          const state = renderStatus(data);
          if (state === 'done') return;
        } catch {
          // Keep overlay visible while retrying
          setOverlayOpen(true);
          msgEl.textContent = 'Estamos conectando…';
        }

        window.setTimeout(poll, POLL_MS);
      }

      // Default: show overlay until confirmed listo.
      // If user comes from payment success, open immediately.
      setOverlayOpen(!!hasPagoExitoso);
      poll();
    });
  </script>
</body>
</html>`;

  return html;
}

module.exports = {
  flipbookHtml,
};
