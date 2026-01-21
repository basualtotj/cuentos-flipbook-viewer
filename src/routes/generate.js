const { pool } = require('../config/db');
const { FLIPBOOKS_DIR } = require('../config/constants');
const { generateStory } = require('../services/story.service');
const { generateImage, downloadImage } = require('../services/image.service');
const { 
  renderPortada, 
  renderDedicatoria, 
  renderTextPage, 
  renderContraportada 
} = require('../services/render.service');
const fs = require('fs').promises;
const path = require('path');

async function handleGenerateCuento(req, res, sendJson) {
  const startTime = Date.now();
  
  try {
    const body = await readBody(req);
    const params = new URLSearchParams(body);
    const cuentoId = params.get('cuento_id');

    if (!cuentoId) {
      return sendJson(res, 400, {
        success: false,
        error: 'cuento_id es requerido'
      });
    }

    console.log(`🎨 Iniciando generación de cuento ID: ${cuentoId}`);

    // 1. Obtener datos del cuento desde BD
    const [rows] = await pool.execute(
      'SELECT id, subdomain, payload_json, estado FROM cuentos WHERE id = ? LIMIT 1',
      [cuentoId]
    );

    if (!rows.length) {
      return sendJson(res, 404, {
        success: false,
        error: 'Cuento no encontrado'
      });
    }

    const cuento = rows[0];
    
    if (cuento.estado !== 'pagado') {
      return sendJson(res, 400, {
        success: false,
        error: 'El cuento debe estar pagado para generar contenido'
      });
    }

    const payload = JSON.parse(cuento.payload_json);
    const subdomain = cuento.subdomain;

    console.log(`📝 Generando historia para: ${payload.nombre_nino}`);

    // 2. Generar historia con Claude
    const story = await generateStory(payload);
    
    console.log(`✅ Historia generada: "${story.titulo}"`);
    console.log(`🖼️  Generando ${story.escenas.length} ilustraciones...`);

    // 3. Crear carpeta para el flipbook
    const flipbookPath = path.join(FLIPBOOKS_DIR, subdomain);
    await fs.mkdir(flipbookPath, { recursive: true });

    // 4. Generar portada (0.jpg y 1.jpg - duplicada)
    await renderPortada(payload.nombre_nino, story.titulo, path.join(flipbookPath, '0.jpg'));
    await renderPortada(payload.nombre_nino, story.titulo, path.join(flipbookPath, '1.jpg'));
    console.log('✅ Portada generada');

    // 5. Generar dedicatoria (2.jpg)
    await renderDedicatoria(story.dedicatoria, path.join(flipbookPath, '2.jpg'));
    console.log('✅ Dedicatoria generada');

    // 6. Generar escenas (ilustraciones + textos alternados)
    for (let i = 0; i < story.escenas.length; i++) {
      const escena = story.escenas[i];
      const ilustracionNum = i * 2 + 3; // 3, 5, 7, 9...
      const textoNum = i * 2 + 4;       // 4, 6, 8, 10...

      console.log(`🎨 Generando ilustración ${i + 1}/10...`);
      
      // Generar ilustración con FLUX
      const imageUrl = await generateImage(escena.prompt_imagen);
      const imageBuffer = await downloadImage(imageUrl);
      await fs.writeFile(path.join(flipbookPath, `${ilustracionNum}.jpg`), imageBuffer);
      
      console.log(`✅ Ilustración ${i + 1} guardada (${ilustracionNum}.jpg)`);

      // Generar página de texto con Puppeteer
      await renderTextPage(escena.texto_narrativo, path.join(flipbookPath, `${textoNum}.jpg`));
      console.log(`✅ Texto ${i + 1} generado (${textoNum}.jpg)`);
    }

    // 7. Generar contraportada (22.jpg)
    await renderContraportada(story.mensaje_final, path.join(flipbookPath, '22.jpg'));
    console.log('✅ Contraportada generada');

    // 8. Actualizar BD
    await pool.execute(
      `UPDATE cuentos 
       SET 
         flipbook_path = ?,
         estado = 'listo',
         fecha_generacion = NOW()
       WHERE id = ?`,
      [subdomain, cuentoId]
    );

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`🎉 Cuento generado exitosamente en ${timeTaken}s`);

    return sendJson(res, 200, {
      success: true,
      cuento_id: parseInt(cuentoId),
      subdomain: subdomain,
      flipbook_path: subdomain,
      images_generated: 23,
      time_taken_seconds: parseFloat(timeTaken),
      story_title: story.titulo
    });

  } catch (err) {
    console.error('❌ Error generando cuento:', err);
    
    // Actualizar BD con error
    try {
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const cuentoId = params.get('cuento_id');
      
      if (cuentoId) {
        await pool.execute(
          `UPDATE cuentos SET estado = 'error' WHERE id = ?`,
          [cuentoId]
        );
      }
    } catch {}

    return sendJson(res, 500, {
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

async function readBody(req, maxBytes = 2 * 1024 * 1024) {
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

module.exports = { handleGenerateCuento };
