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
  <div id="reader">
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
  </div>

  <script>
    $(function () {
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
    });
  </script>
</body>
</html>`;

  return html;
}

module.exports = {
  flipbookHtml,
};
