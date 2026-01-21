const puppeteer = require('puppeteer');
const { IMAGE_WIDTH, IMAGE_HEIGHT } = require('../config/constants');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function renderPage(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    deviceScaleFactor: 1
  });

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 500));

  await page.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 90
  });

  await browser.close();
}

async function renderPortada(nombre_nino, titulo, outputPath) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${IMAGE_WIDTH}px;
      height: ${IMAGE_HEIGHT}px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Georgia', serif;
      color: white;
      text-align: center;
      padding: 80px;
    }
    h1 {
      font-size: 120px;
      margin-bottom: 40px;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    h2 {
      font-size: 80px;
      margin-bottom: 60px;
      font-weight: 300;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .subtitle {
      font-size: 48px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <h1>📚</h1>
  <h2>${escapeHtml(titulo || 'Tu Cuento Personalizado')}</h2>
  <div class="subtitle">Una historia especial para ${escapeHtml(nombre_nino)}</div>
</body>
</html>`;

  await renderPage(html, outputPath);
}

async function renderDedicatoria(dedicatoria, outputPath) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${IMAGE_WIDTH}px;
      height: ${IMAGE_HEIGHT}px;
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Georgia', serif;
    }
    .text-box {
      background: rgba(255, 255, 255, 0.95);
      padding: 100px;
      border-radius: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 1600px;
      margin: 0 80px;
      text-align: center;
    }
    p {
      font-size: 56px;
      line-height: 1.8;
      color: #2c3e50;
      font-style: italic;
    }
    .decoration {
      position: absolute;
      font-size: 140px;
      opacity: 0.1;
    }
    .decoration.top-left { top: 40px; left: 40px; }
    .decoration.bottom-right { bottom: 40px; right: 40px; }
  </style>
</head>
<body>
  <div class="decoration top-left">💝</div>
  <div class="decoration bottom-right">✨</div>
  <div class="text-box">
    <p>${escapeHtml(dedicatoria)}</p>
  </div>
</body>
</html>`;

  await renderPage(html, outputPath);
}

async function renderTextPage(texto, outputPath) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${IMAGE_WIDTH}px;
      height: ${IMAGE_HEIGHT}px;
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
    .decoration.top-left { top: 40px; left: 40px; }
    .decoration.bottom-right { bottom: 40px; right: 40px; }
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

  await renderPage(html, outputPath);
}

async function renderContraportada(mensaje_final, outputPath) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${IMAGE_WIDTH}px;
      height: ${IMAGE_HEIGHT}px;
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Georgia', serif;
      color: white;
      text-align: center;
      padding: 100px;
    }
    .message {
      font-size: 56px;
      line-height: 1.6;
      margin-bottom: 60px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .footer {
      font-size: 40px;
      opacity: 0.8;
    }
    .emoji {
      font-size: 100px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="message">${escapeHtml(mensaje_final || 'Fin')}</div>
  <div class="footer">Cuentos Para Siempre</div>
  <div class="emoji">📚✨</div>
</body>
</html>`;

  await renderPage(html, outputPath);
}

module.exports = {
  renderPortada,
  renderDedicatoria,
  renderTextPage,
  renderContraportada
};
