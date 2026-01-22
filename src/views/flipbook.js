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
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>${safeNombre}</title>

  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="/js/turn.min.js"></script>

  <style>
    :root{
      --text: #1c1b22;
      --muted: rgba(28,27,34,.72);
      --border: rgba(31, 33, 39, .10);
      --shadow: 0 18px 60px rgba(17, 24, 39, .12);
      --shadow-soft: 0 10px 26px rgba(17, 24, 39, .08);
      --p1: #E88B7B;
      --p2: #D4C5E8;
      --p3: #A8D5BA;
      --p4: #BCE3F5;
      --p5: #FFD4B8;
      --p6: #F5C8D8;
    }

    *{ box-sizing: border-box; }
    html, body{ height:100%; }

    body{
      margin:0;
      color: var(--text);
      background:
        radial-gradient(900px 600px at 15% 10%, rgba(212,197,232,.30), transparent 70%),
        radial-gradient(900px 600px at 85% 15%, rgba(168,213,186,.25), transparent 70%),
        radial-gradient(900px 700px at 55% 90%, rgba(255,212,184,.22), transparent 70%),
        linear-gradient(180deg, #fff 0%, #fff9f5 100%);
      font-family: ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      line-height: 1.45;
      overflow-x:hidden;
    }

    #reader{
      width: min(1200px, 94vw);
      margin: 0 auto;
      padding: 18px 0 24px;
    }

    .header{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom: 12px; }
    .header h1{ margin:0; font-size:22px; font-weight:900; letter-spacing:-.02em; }
    .meta{ font-size:12px; font-weight:900; color: rgba(28,27,34,.72); }
    .code{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; padding:2px 8px; border-radius:999px; border:1px solid rgba(31,33,39,.12); background: rgba(255,255,255,.9); }

    #flipbook{
      width: 100%;
      height: 70vh;
      min-height: 420px;
      background: rgba(255,255,255,.75);
      border: 1px solid rgba(31,33,39,.10);
      border-radius: 22px;
      overflow:hidden;
      box-shadow: var(--shadow);
    }

    #flipbook .page{ background:#fff; }
    #flipbook img{ width:100%; height:100%; object-fit:contain; display:block; }

    .controls{ margin-top: 12px; display:flex; align-items:center; justify-content:space-between; gap: 10px; flex-wrap:wrap; }
    .controls button{ padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(31,33,39,.14); background: rgba(255,255,255,.9); font-weight: 900; cursor:pointer; }
    .controls button:disabled{ opacity: .55; cursor:not-allowed; }

    /* ===== Modal overlay (status) ===== */
    #status-overlay{ position:fixed; inset:0; display:none; align-items:center; justify-content:center; padding:22px; z-index:9999; }
    #status-overlay[data-open="true"]{ display:flex; }
    #status-overlay .backdrop{ position:absolute; inset:0; background: rgba(15, 15, 18, .45); backdrop-filter: blur(6px); }
    #status-overlay .card{ position:relative; width:min(680px, 92vw); background: rgba(255,255,255,.92); border:1px solid rgba(31,33,39,.10); border-radius:26px; box-shadow: var(--shadow); padding:18px; overflow:hidden; }
    #status-overlay h2{ margin:0; font-size:22px; letter-spacing:-.02em; font-weight:900; }
    #status-overlay .sub{ margin-top: 6px; color: var(--muted); font-weight: 800; }
    #status-overlay .bar{ margin-top: 14px; width: 100%; height: 12px; border-radius: 999px; background: rgba(31,33,39,.08); overflow:hidden; border:1px solid rgba(31,33,39,.08); }
    #status-overlay .bar > div{ height:100%; width:0%; background: linear-gradient(90deg, var(--p1), var(--p2)); transition: width 220ms ease; }
    #status-overlay .kvs{ margin-top: 14px; display:grid; grid-template-columns: 1fr; gap: 10px; min-width:0; }
    #status-overlay .kv{ display:grid; grid-template-columns: 140px minmax(0, 1fr); gap: 12px; align-items:start; min-width:0; }
    #status-overlay .k{ color: rgba(28,27,34,.62); font-weight: 900; font-size: 13px; }
    #status-overlay .v{ font-weight: 900; min-width: 0; overflow-wrap:anywhere; word-break: break-word; }
    #status-overlay .v.muted{ color: var(--muted); font-weight: 800; }
    #status-overlay .actions{ margin-top: 16px; display:flex; gap:10px; flex-wrap:wrap; }
    #status-overlay .btn{ display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:14px 16px; border-radius:16px; border:0; cursor:pointer; font-weight:900; font-size:15px; color:#fff; background: linear-gradient(90deg, var(--p1), var(--p2)); box-shadow: 0 18px 34px rgba(232,139,123,.22); text-decoration:none; max-width:100%; min-width:0; }
    #status-overlay .btn.secondary{ background: rgba(255,255,255,.9); color: rgba(28,27,34,.88); border: 1px solid rgba(31,33,39,.14); box-shadow: var(--shadow-soft); }
    #status-overlay .btn[aria-disabled="true"]{ opacity:.55; cursor:not-allowed; box-shadow:none; }
    #status-overlay .cta{ margin-top: 12px; font-size: 12px; font-weight: 900; color: rgba(28,27,34,.74); }
    #status-overlay .cta a{ text-decoration: underline; }
    @media (max-width: 640px){
      #status-overlay .card{ padding: 16px; border-radius: 22px; }
      #status-overlay h2{ font-size: 20px; }
      #status-overlay .kv{ grid-template-columns: 1fr; gap: 6px; }
      #status-overlay .btn{ width: 100%; }
    }

    body.fullscreen #reader{ width: 100vw; padding: 0; }
    body.fullscreen #flipbook{ height: 100vh; border-radius: 0; }
  </style>
</head>
<body>
  <div id="status-overlay" data-open="false" aria-live="polite" aria-modal="true" role="dialog">
    <div class="backdrop" aria-hidden="true"></div>
    <div class="card">
      <h2>Generando tu cuento...</h2>
      <div class="sub">Puedes esperar aquí o revisar tu correo en ~10 min.</div>
      <div class="bar" aria-label="Progreso"><div id="status-bar"></div></div>

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
        ${paidBadge || ''}
      </div>
    </div>

    <div id="flipbook">${pagesHtml}</div>

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
  const isLocalPreview = urlParams.get('local_preview') === '1' || window.location.pathname.startsWith('/preview/');

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

      let turnInitialized = false;
      function initTurnOnce(){
        if (turnInitialized) return;
        turnInitialized = true;

        const $reader = $('#reader');
        const $fb = $('#flipbook');
        const ASPECT = ${BOOK_ASPECT};
        const TOTAL = ${imageCount};

        function isFullscreen(){
          return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        }
        function requestFullscreen(el){
          if (el.requestFullscreen) return el.requestFullscreen();
          if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
          if (el.msRequestFullscreen) return el.msRequestFullscreen();
        }
        function exitFullscreen(){
          if (document.exitFullscreen) return document.exitFullscreen();
          if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
          if (document.msExitFullscreen) return document.msExitFullscreen();
        }

        function fitIntoAspect(boxW, boxH){
          let newW, newH;
          if (boxW / boxH > ASPECT) { newH = boxH; newW = boxH * ASPECT; }
          else { newW = boxW; newH = boxW / ASPECT; }
          return { w: Math.max(1, Math.floor(newW)), h: Math.max(1, Math.floor(newH)) };
        }
        function applyTurnSize(w,h){ $fb.turn('size', w, h); }
        function fitToNormal(){
          const w = Math.max(1, Math.floor($fb.width() || 1));
          const h = Math.max(1, Math.floor($fb.height() || 1));
          applyTurnSize(w,h);
        }
        function fitToViewport(){
          const fitted = fitIntoAspect(window.innerWidth, window.innerHeight);
          applyTurnSize(fitted.w, fitted.h);
        }

        const s = { w: Math.max(1, Math.floor($fb.width() || 1)), h: Math.max(1, Math.floor($fb.height() || 1)) };
        $fb.turn({ width: s.w, height: s.h, autoCenter: true, duration: 900, gradients: true, acceleration: true });

        function update(){
          const page = $fb.turn('page');
          $('#page-info').text('Página ' + page + ' de ' + TOTAL);
          $('#prev').prop('disabled', page === 1);
          $('#next').prop('disabled', page === TOTAL);
        }

        $fb.bind('turned', update);
        $('#prev').click(() => $fb.turn('previous'));
        $('#next').click(() => $fb.turn('next'));
        update();

        const fsBtn = document.getElementById('fullscreen');
        if (fsBtn) {
          fsBtn.addEventListener('click', () => {
            if (isFullscreen()) exitFullscreen();
            else requestFullscreen($reader[0]);
          });
        }

        function onFullscreenChange(){
          const on = isFullscreen();
          document.body.classList.toggle('fullscreen', on);
          if (on) { fitToViewport(); requestAnimationFrame(fitToViewport); }
          else { fitToNormal(); requestAnimationFrame(fitToNormal); }
        }

        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('msfullscreenchange', onFullscreenChange);

        window.addEventListener('resize', () => {
          const on = isFullscreen();
          if (on) { fitToViewport(); requestAnimationFrame(fitToViewport); }
          else { fitToNormal(); requestAnimationFrame(fitToNormal); }
        });

        fitToNormal();
        requestAnimationFrame(fitToNormal);
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
          const ready = String(data?.ready_url || window.location.href);
          setOpenEnabled(ready);
          setOverlayOpen(false);
          initTurnOnce();
          return 'done';
        }

        if (estado === 'error') {
          errCta.style.display = 'block';
          setOverlayOpen(true);
          return 'continue';
        }

        setOverlayOpen(true);
        return 'continue';
      }

      async function poll(){
        // Local preview (sin DB): simulamos progreso visible y cerramos el modal.
        // Importante: NO consultamos el endpoint real porque en local típicamente no hay MySQL.
        if (isLocalPreview) {
          let p = 0;
          const total = ${imageCount};
          setOverlayOpen(true);
          stepEl.textContent = 'generando';
          msgEl.textContent = 'Preparando tu cuento…';

          const timer = window.setInterval(() => {
            p = Math.min(100, p + 8);
            const current = Math.max(1, Math.round((p / 100) * total));
            setProgress(p);
            stepEl.textContent = current < total ? 'ilustraciones' : 'finalizando';
            msgEl.textContent = current < total
              ? ('Generando ilustración ' + current + ' de ' + total)
              : '¡Listo!';

            if (p >= 100) {
              window.clearInterval(timer);
              setOverlayOpen(false);
              setOpenEnabled(window.location.href);
              initTurnOnce();
            }
          }, 650);

          return;
        }

        const url = buildStatusUrl();
        try {
          const r = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
          const data = await r.json();
          const state = renderStatus(data);
          if (state === 'done') return;
        } catch {
          setOverlayOpen(true);
          msgEl.textContent = 'Estamos conectando…';
        }

        window.setTimeout(poll, POLL_MS);
      }

      setOverlayOpen(!!hasPagoExitoso || !!isLocalPreview);
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
