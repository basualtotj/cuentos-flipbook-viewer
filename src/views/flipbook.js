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

  flipbookHtml,
};

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
  </style>
</head>
<body>
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

  <div id="reader">
    <div class="header">
      <h1>📖 ${safeNombre}</h1>
      <div class="meta">
        <div>Código: <span class="code">${safeCodigo}</span></div>
        <!-- Intentionally hidden: do not show payment technical states to end users -->
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
