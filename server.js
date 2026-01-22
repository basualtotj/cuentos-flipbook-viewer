// server.js
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const { PORT, MAIN_DOMAIN } = require('./src/config/constants');
const { getRequestHost, parseSubdomainFromHost, safeJoin, sendHtml, sendJson, readBody, escapeHtml } = require('./src/utils/http');
const { handleCrearCuento } = require('./src/routes/api');
const { handleGenerateCuento } = require('./src/routes/generate');
const { serveFlipbook } = require('./src/routes/flipbook');
const { handleSubdomainRequest } = require('./src/routes/subdomain');
const { landingHtml } = require('./src/views/landing');
const { pool } = require('./src/config/db');

// Modo local (DX): permite ver el landing en http://127.0.0.1:<PORT>/ sin depender del Host.
// En producción debe permanecer apagado.
const LOCAL_PREVIEW = String(process.env.LOCAL_PREVIEW || '').toLowerCase() === '1';

async function serveStatusPage(req, res) {
  try {
    const filePath = path.join(__dirname, 'public', 'status.html');
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      throw new Error(`status.html no es un archivo: ${filePath}`);
    }

    const html = await fs.readFile(filePath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  } catch (e) {
    console.error('Error sirviendo status.html:', e);
    return sendHtml(res, 500, 'Error servidor');
  }
}

function serveLandingPage(req, res) {
  // ====== Página de prueba FLUX ======
  if (req.url === '/test-flux-page') {
    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Test FLUX - Generador de Imágenes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-top: 15px;
      font-weight: bold;
      color: #555;
    }
    textarea {
      width: 100%;
      padding: 12px;
      margin-top: 5px;
      border: 2px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      font-family: Arial;
      box-sizing: border-box;
      min-height: 100px;
    }
    button {
      margin-top: 20px;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
    }
    button:hover {
      background: #5568d3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    #result {
      margin-top: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 5px;
      display: none;
    }
    #result.show {
      display: block;
    }
    #result.error {
      background: #fee;
      border-left: 4px solid #f44;
    }
    #result.success {
      background: #efe;
      border-left: 4px solid #4a4;
    }
    #result img {
      max-width: 100%;
      margin-top: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .info {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #1565c0;
    }
    .loading {
      text-align: center;
      padding: 20px;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 Test FLUX - Generador de Imágenes</h1>
    
    <div class="info">
      <strong>ℹ️ Prueba de concepto:</strong> Este endpoint genera una imagen usando FLUX via Replicate API.
      Tarda aproximadamente 3-8 segundos.
    </div>

    <form id="form">
      <label>Prompt (descripción de la imagen):</label>
      <textarea 
        id="prompt" 
        placeholder="Ejemplo: A happy 8-year-old girl playing with her dog in a sunny garden, children's book illustration style, warm colors, digital art"
      >A cheerful young boy reading a magical glowing book in a cozy bedroom at night, children's book illustration style, warm lighting, digital art</textarea>

      <button type="submit" id="btn">🚀 Generar Imagen con FLUX</button>
    </form>

    <div id="result"></div>
  </div>

  <script>
    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const form = document.getElementById('form');
    const btn = document.getElementById('btn');
    const result = document.getElementById('result');
    const promptInput = document.getElementById('prompt');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const prompt = promptInput.value.trim();
      if (!prompt) {
        showResult('error', 'Por favor ingresa un prompt');
        return;
      }

      btn.disabled = true;
      btn.textContent = '⏳ Generando imagen...';
      
      result.className = 'show';
      result.innerHTML =
        '<div class="loading">' +
          '<div class="spinner"></div>' +
          '<p>Generando imagen con FLUX...<br>Esto toma 3-8 segundos</p>' +
        '</div>';

      try {
        const startTime = Date.now();
        
        const response = await fetch('/api/test-flux', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'prompt=' + encodeURIComponent(prompt)
        });

        const data = await response.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (data.success) {
          showResult('success',
            '<h3>✅ Imagen generada exitosamente</h3>' +
            '<p><strong>Tiempo:</strong> ' + elapsed + ' segundos</p>' +
            '<p><strong>Prompt usado:</strong> ' + esc(data.prompt || '') + '</p>' +
            '<p><strong>Prediction ID:</strong> ' + esc(data.prediction_id || '') + '</p>' +
            '<img src="' + encodeURI(String(data.image_url || '')) + '" alt="Imagen generada" />' +
            '<p style="margin-top:15px; font-size:12px; color:#666;">' +
              '<a href="' + encodeURI(String(data.image_url || '')) + '" target="_blank">Abrir imagen en nueva pestaña</a>' +
            '</p>'
          );
        } else {
          showResult('error',
            '<h3>❌ Error al generar imagen</h3>' +
            '<p><strong>Error:</strong> ' + esc(data.error || '') + '</p>' +
            '<pre style="background:#f5f5f5;padding:10px;border-radius:5px;overflow:auto;">' +
              esc(JSON.stringify(data.details || data, null, 2)) +
            '</pre>'
          );
        }
      } catch (err) {
        showResult('error',
          '<h3>❌ Error de conexión</h3>' +
          '<p>' + esc((err && err.message) ? err.message : err) + '</p>'
        );
      } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Generar Imagen con FLUX';
      }
    });

    function showResult(type, html) {
      result.className = 'show ' + type;
      result.innerHTML = html;
    }
  </script>
</body>
</html>`;

    return sendHtml(res, 200, html);
  }

  // ====== Página de prueba Puppeteer ======
  if (req.url === '/test-puppeteer-page') {
    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Test Puppeteer - Generador de Plantillas</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-top: 15px;
      font-weight: bold;
      color: #555;
    }
    textarea {
      width: 100%;
      padding: 12px;
      margin-top: 5px;
      border: 2px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      font-family: Georgia, serif;
      box-sizing: border-box;
      min-height: 120px;
      line-height: 1.6;
    }
    button {
      margin-top: 20px;
      padding: 12px 30px;
      background: #764ba2;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
    }
    button:hover {
      background: #5f3a82;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    #result {
      margin-top: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 5px;
      display: none;
    }
    #result.show {
      display: block;
    }
    #result.error {
      background: #fee;
      border-left: 4px solid #f44;
    }
    #result.success {
      background: #efe;
      border-left: 4px solid #4a4;
    }
    #result img {
      max-width: 100%;
      margin-top: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 1px solid #ddd;
    }
    .info {
      background: #e8eaf6;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #3f51b5;
    }
    .loading {
      text-align: center;
      padding: 20px;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #764ba2;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .examples {
      background: #fff3e0;
      padding: 15px;
      border-radius: 5px;
      margin-top: 15px;
      font-size: 13px;
    }
    .examples h4 {
      margin: 0 0 10px;
      color: #e65100;
    }
    .examples p {
      margin: 5px 0;
      cursor: pointer;
      color: #666;
    }
    .examples p:hover {
      color: #764ba2;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📄 Test Puppeteer - Generador de Plantillas</h1>
    
    <div class="info">
      <strong>ℹ️ Prueba de concepto:</strong> Este endpoint genera una plantilla de texto usando Puppeteer.
      Convierte HTML a JPG en ~1-2 segundos.
    </div>

    <form id="form">
      <label>Texto para la plantilla:</label>
      <textarea 
        id="texto" 
        placeholder="Escribe el texto que quieres ver en la plantilla..."
      >Érase una vez, en un reino muy lejano, vivía una niña llamada Ana que soñaba con volar entre las nubes y tocar las estrellas con sus manos.</textarea>

      <div class="examples">
        <h4>💡 Ejemplos de texto (click para usar):</h4>
        <p onclick="setText(this.textContent)">En un bosque encantado, donde los árboles susurraban secretos antiguos, vivía un pequeño conejo llamado Tito que guardaba un gran secreto.</p>
        <p onclick="setText(this.textContent)">Bajo el mar, en un palacio de coral y perlas, la sirena Marina descubrió que podía hablar con todos los peces del océano.</p>
        <p onclick="setText(this.textContent)">La luna brillaba con fuerza aquella noche, mientras el pequeño búho Nico volaba por primera vez fuera de su nido.</p>
      </div>

      <button type="submit" id="btn">🎨 Generar Plantilla con Puppeteer</button>
    </form>

    <div id="result"></div>
  </div>

  <script>
    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const form = document.getElementById('form');
    const btn = document.getElementById('btn');
    const result = document.getElementById('result');
    const textoInput = document.getElementById('texto');

    function setText(text) {
      textoInput.value = text;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const texto = textoInput.value.trim();
      if (!texto) {
        showResult('error', 'Por favor ingresa un texto');
        return;
      }

      btn.disabled = true;
      btn.textContent = '⏳ Generando plantilla...';
      
      result.className = 'show';
      result.innerHTML =
        '<div class="loading">' +
          '<div class="spinner"></div>' +
          '<p>Generando plantilla con Puppeteer...<br>Esto toma 1-2 segundos</p>' +
        '</div>';

      try {
        const startTime = Date.now();
        
        const response = await fetch('/api/test-puppeteer-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'texto=' + encodeURIComponent(texto)
        });

        const data = await response.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (data.success) {
          const t = String(data.texto_usado || '');
          showResult('success',
            '<h3>✅ Plantilla generada exitosamente</h3>' +
            '<p><strong>Tiempo:</strong> ' + elapsed + ' segundos</p>' +
            '<p><strong>Dimensiones:</strong> ' + esc(data.dimensions || '') + '</p>' +
            '<p><strong>Texto usado:</strong> ' + esc(t.substring(0, 100)) + (t.length > 100 ? '...' : '') + '</p>' +
            '<img src="' + String(data.image_data || '') + '" alt="Plantilla generada" />' +
            '<p style="margin-top:15px; font-size:12px; color:#666;">' +
              'Imagen guardada en: ' + esc(data.image_path || '') +
            '</p>'
          );
        } else {
          showResult('error',
            '<h3>❌ Error al generar plantilla</h3>' +
            '<p><strong>Error:</strong> ' + esc(data.error || '') + '</p>' +
            '<pre style="background:#f5f5f5;padding:10px;border-radius:5px;overflow:auto;font-size:11px;">' + esc(data.stack || '') + '</pre>'
          );
        }
      } catch (err) {
        showResult('error',
          '<h3>❌ Error de conexión</h3>' +
          '<p>' + esc((err && err.message) ? err.message : err) + '</p>'
        );
      } finally {
        btn.disabled = false;
        btn.textContent = '🎨 Generar Plantilla con Puppeteer';
      }
    });

    function showResult(type, html) {
      result.className = 'show ' + type;
      result.innerHTML = html;
    }
  </script>
</body>
</html>`;

    return sendHtml(res, 200, html);
  }

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

// Estáticos generales (solo DX): sirve /public completo en modo local preview
async function serveStaticLocalPreview(req, res) {
  if (String(process.env.LOCAL_PREVIEW || '').toLowerCase() !== '1') return false;

  // Permitimos css/js/img/fonts desde /public
  const filePath = safeJoin(PUBLIC_DIR, req.url);
  if (!filePath) return false;

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return false;

    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      (ext === '.html') ? 'text/html; charset=utf-8' :
      (ext === '.css') ? 'text/css; charset=utf-8' :
      (ext === '.js') ? 'application/javascript; charset=utf-8' :
      (ext === '.json') ? 'application/json; charset=utf-8' :
      (ext === '.svg') ? 'image/svg+xml' :
      (ext === '.ico') ? 'image/x-icon' :
      (ext === '.png') ? 'image/png' :
      (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' :
      (ext === '.webp') ? 'image/webp' :
      (ext === '.woff') ? 'font/woff' :
      (ext === '.woff2') ? 'font/woff2' :
      null;

    if (!contentType) return false;

    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

// ====== Server ======
const server = http.createServer(async (req, res) => {
  // 1) Estáticos (JPG)
  if (await serveStatic(req, res)) return;

  // 1.b) Estáticos generales (solo local preview)
  if (await serveStaticLocalPreview(req, res)) return;

  const cleanHost = getRequestHost(req);
  const isLocalHost = cleanHost === 'localhost' || cleanHost === '127.0.0.1';
  const isMainDomain = cleanHost === MAIN_DOMAIN || cleanHost === `www.${MAIN_DOMAIN}`;

  // ===== Local preview routes (DX) =====
  // Objetivo: permitir ver el flujo completo en browser SIN depender de subdominios/hosts.
  // - No afecta producción (solo con LOCAL_PREVIEW=1)
  if (LOCAL_PREVIEW && isLocalHost && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, `http://${cleanHost}`);

      // 1) /?pago=exitoso en localhost -> sirve status.html
      if (urlObj.pathname === '/' && urlObj.searchParams.get('pago') === 'exitoso') {
        return await serveStatusPage(req, res);
      }

      // 2) /preview/<sub>/... -> simula subdominio en path
      //    - /preview/carla/               => flipbook (con modal)
      //    - /preview/carla/status         => status
      //    - /preview/carla/?pago=exitoso  => status
      const m = urlObj.pathname.match(/^\/preview\/([^/]+)(\/.*)?$/);
      if (m) {
        const previewSub = decodeURIComponent(m[1] || '').trim();
        const rest = m[2] || '/';

        // Reescribimos URL para que el router de subdominio funcione igual
        const innerUrlObj = new URL(rest + urlObj.search, `http://${cleanHost}`);
        const isStatusPath = innerUrlObj.pathname === '/status';
        const isPagoExitoso = innerUrlObj.searchParams.get('pago') === 'exitoso';

        if (isStatusPath || (innerUrlObj.pathname === '/' && isPagoExitoso)) {
          return await serveStatusPage(req, res);
        }

        // Flipbook (local): forzamos el modal al cargar para simular post-pago
        req.url = (innerUrlObj.pathname || '/') + innerUrlObj.search;
        if (!/([?&])local_preview=1(\b|&|$)/.test(req.url)) {
          req.url += (req.url.includes('?') ? '&' : '?') + 'local_preview=1';
        }

        return serveFlipbook(res, previewSub);
      }
    } catch {
      // ignore
    }
  }

  // API
  // POST /api/crear-cuento
  if (req.method === 'POST' && req.url === '/api/crear-cuento') {
    return handleCrearCuento(req, res, sendJson);
  }

  // POST /api/generate-cuento
  if (req.method === 'POST' && req.url === '/api/generate-cuento') {
    return handleGenerateCuento(req, res, sendJson);
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

  // ====== Test FLUX (Replicate) ======
  if (req.method === 'POST' && req.url === '/api/test-flux') {
    try {
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const prompt = params.get('prompt') || 'A happy 8-year-old boy playing in a colorful garden, children\'s book illustration style';

      const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

      if (!REPLICATE_API_TOKEN) {
        return sendJson(res, 500, {
          success: false,
          error: 'REPLICATE_API_TOKEN no configurada'
        });
      }

  // Llamar a Replicate API con el formato correcto
  const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            num_outputs: 1,
            aspect_ratio: '3:2', // Horizontal para cuentos
            output_format: 'jpg',
            output_quality: 90
          }
        })
      });

      const prediction = await response.json();

      if (!response.ok) {
        return sendJson(res, 500, {
          success: false,
          error: prediction.detail || 'Error en Replicate API',
          details: prediction
        });
      }

      // Replicate es asíncrono, necesitamos esperar el resultado
      let result = prediction;
      let attempts = 0;
      const maxAttempts = 60; // 60 segundos máximo

      while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo

        const checkResponse = await fetch(result.urls.get, {
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          }
        });

        result = await checkResponse.json();
        attempts++;
      }

      if (result.status === 'failed') {
        return sendJson(res, 500, {
          success: false,
          error: 'Generación falló',
          details: result
        });
      }

      if (result.status !== 'succeeded') {
        return sendJson(res, 500, {
          success: false,
          error: 'Timeout esperando resultado'
        });
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Imagen generada con FLUX',
        image_url: result.output[0],
        prompt: prompt,
        time_taken: `${attempts} segundos`,
        prediction_id: result.id
      });

    } catch (e) {
      console.error('Error test FLUX:', e);
      return sendJson(res, 500, {
        success: false,
        error: e.message
      });
    }
  }

  // ====== Test Puppeteer (Plantilla de texto) ======
  if (req.method === 'POST' && req.url === '/api/test-puppeteer-template') {
    try {
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const texto = params.get('texto') || 'Érase una vez, en un reino muy lejano, vivía una niña llamada Ana que soñaba con volar entre las nubes y tocar las estrellas con sus manos.';

      const puppeteer = require('puppeteer');
      const path = require('path');
      const fs = require('fs').promises;

      // Crear carpeta temporal si no existe
      const tempDir = path.join(__dirname, 'public', 'temp');
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (e) {
        // Carpeta ya existe
      }

      const outputPath = path.join(tempDir, 'test-template.jpg');

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Configurar viewport para A4 horizontal
      await page.setViewport({
        width: 1920,
        height: 1360,
        deviceScaleFactor: 1
      });

      // HTML de la plantilla
      const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 1920px;
      height: 1360px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Georgia', serif;
    }
    .text-box {
      background: rgba(255, 255, 255, 0.95);
      padding: 80px;
      border-radius: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 1600px;
      margin: 0 80px;
    }
    p {
      font-size: 52px;
      line-height: 1.8;
      color: #2c3e50;
      text-align: justify;
      text-indent: 60px;
    }
    .decoration {
      position: absolute;
      font-size: 120px;
      opacity: 0.1;
    }
    .decoration.top-left {
      top: 40px;
      left: 40px;
    }
    .decoration.bottom-right {
      bottom: 40px;
      right: 40px;
    }
  </style>
</head>
<body>
  <div class="decoration top-left">✨</div>
  <div class="decoration bottom-right">📖</div>
  <div class="text-box">
    <p>${escapeHtml(texto)}</p>
  </div>
</body>
</html>`;

      await page.setContent(html, { waitUntil: 'networkidle0' });

  // Esperar un poco para que se renderice
  await new Promise(resolve => setTimeout(resolve, 500));

      // Capturar screenshot
      await page.screenshot({
        path: outputPath,
        type: 'jpeg',
        quality: 90
      });

      await browser.close();

      // Leer la imagen generada
      const imageBuffer = await fs.readFile(outputPath);
      const base64Image = imageBuffer.toString('base64');

      return sendJson(res, 200, {
        success: true,
        message: 'Plantilla generada con Puppeteer',
        image_data: `data:image/jpeg;base64,${base64Image}`,
        image_path: '/temp/test-template.jpg',
        texto_usado: texto,
        dimensions: '1920x1360px'
      });

    } catch (e) {
      console.error('Error test Puppeteer template:', e);
      return sendJson(res, 500, {
        success: false,
        error: e.message,
        stack: e.stack
      });
    }
  }

  // GET /api/cuentos/status (main domain o subdominio)
  if (req.method === 'GET' && req.url.startsWith('/api/cuentos/status')) {
    try {
      const url = new URL(req.url, `http://${cleanHost}`);
      const cuentoId = url.searchParams.get('cuento_id');
      const codigo = url.searchParams.get('codigo');
      const subdomainParam = url.searchParams.get('subdomain');

      // Prioridad: cuento_id + codigo (validación fuerte)
      let row = null;
      if (cuentoId && codigo) {
        const [rows] = await pool.execute(
          'SELECT id, subdomain, codigo_unico, estado, progreso_json, error_message, flipbook_path, pdf_filename FROM cuentos WHERE id = ? LIMIT 1',
          [cuentoId]
        );
        if (rows.length) {
          const c = rows[0];
          if (String(c.codigo_unico || '') !== String(codigo || '')) {
            return sendJson(res, 403, {
              estado: 'error',
              step: 'validacion',
              current: 0,
              total: 23,
              message: 'Código inválido',
              ready_url: null
            });
          }
          row = c;
        }
      } else {
        // Fallback: por subdomain (menos seguro)
        const sub = (subdomainParam || parseSubdomainFromHost(cleanHost) || '').trim();
        if (sub) {
          const [rows] = await pool.execute(
            'SELECT id, subdomain, codigo_unico, estado, progreso_json, error_message, flipbook_path, pdf_filename FROM cuentos WHERE subdomain = ? ORDER BY id DESC LIMIT 1',
            [sub]
          );
          if (rows.length) row = rows[0];
        }
      }

      if (!row) {
        return sendJson(res, 404, {
          estado: 'error',
          step: 'lookup',
          current: 0,
          total: 23,
          message: 'Cuento no encontrado',
          ready_url: null
        });
      }

      const estado = String(row.estado || 'pendiente');

      let progress = null;
      try {
        if (row.progreso_json) {
          progress = typeof row.progreso_json === 'string'
            ? JSON.parse(row.progreso_json)
            : row.progreso_json;
        }
      } catch {
        progress = null;
      }

      const step = progress && progress.step ? String(progress.step) : (estado === 'listo' ? 'final' : 'starting');
      const current = (progress && Number.isFinite(parseInt(progress.current, 10))) ? parseInt(progress.current, 10) : null;
      const total = (progress && Number.isFinite(parseInt(progress.total, 10))) ? parseInt(progress.total, 10) : null;
      const percent = (progress && Number.isFinite(parseInt(progress.percent, 10))) ? Math.max(0, Math.min(100, parseInt(progress.percent, 10))) : null;

      const message = (estado === 'error')
        ? (row.error_message || (progress && progress.message) || 'Hubo un problema generando tu cuento')
        : ((progress && progress.message) || 'Generación en progreso…');

      const readyUrl = (estado === 'listo')
        ? `https://${row.subdomain}.${MAIN_DOMAIN}/`
        : null;

      const pdfUrl = (estado === 'listo' && row.pdf_filename)
        ? `https://${row.subdomain}.${MAIN_DOMAIN}/${encodeURIComponent(String(row.pdf_filename))}`
        : null;

      return sendJson(res, 200, {
        success: true,
        estado,
        step,
        current,
        total,
        percent,
        message,
        ready_url: readyUrl,
        pdf_url: pdfUrl
      });
    } catch (e) {
      console.error('Error /api/cuentos/status:', e);
      return sendJson(res, 500, {
        success: false,
        estado: 'error',
        step: 'server',
        current: null,
        total: null,
        percent: null,
        message: 'Error servidor',
        ready_url: null,
        pdf_url: null
      });
    }
  }

  // Landing
  // - Producción: solo en dominio principal
  // - Local: opcionalmente también en localhost/127.0.0.1 para pruebas visibles en browser
  if (isMainDomain || (LOCAL_PREVIEW && isLocalHost)) {
    return serveLandingPage(req, res);
  }

  // Subdominio -> status / flipbook
  return handleSubdomainRequest(req, res, { cleanHost, serveStatusPage });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en ${PORT}`);
});