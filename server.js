// server.js
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const { PORT, MAIN_DOMAIN } = require('./src/config/constants');
const { getRequestHost, parseSubdomainFromHost, safeJoin, sendHtml, sendJson, readBody } = require('./src/utils/http');
const { handleCrearCuento } = require('./src/routes/api');
const { serveFlipbook } = require('./src/routes/flipbook');
const { landingHtml } = require('./src/views/landing');

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

      // Llamar a Replicate API (FLUX schnell - rápido y barato)
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'f2ab8a5569279d9b84c84235e4c7df30e7f98e2cd8c35fd9c04de2e4ef6e2f97', // FLUX schnell
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

        const checkResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
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

  // Landing
  if (isMainDomain) {
  return serveLandingPage(req, res);
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