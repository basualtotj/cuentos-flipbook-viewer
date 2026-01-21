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

async function updateProgress(cuentoId, payload) {
  const base = {
    step: 'starting',
    percent: 0,
    message: 'Iniciando…',
    updated_at: new Date().toISOString()
  };

  const merged = {
    ...base,
    ...(payload || {}),
    updated_at: new Date().toISOString()
  };

  // Solo el background job escribe progreso_json y error_message.
  await pool.execute(
    'UPDATE cuentos SET progreso_json = ? WHERE id = ?',
    [JSON.stringify(merged), cuentoId]
  );
}

async function markError(cuentoId, humanMessage) {
  const msg = String(humanMessage || 'Ocurrió un error durante la generación');
  try {
    await pool.execute(
      'UPDATE cuentos SET estado = ?, error_message = ? WHERE id = ?',
      ['error', msg, cuentoId]
    );
  } catch (e) {
    console.error('❌ [BACKGROUND] Error guardando error_message:', e);
  }

  try {
    await updateProgress(cuentoId, {
      step: 'error',
      percent: 100,
      message: msg
    });
  } catch (e) {
    console.error('❌ [BACKGROUND] Error guardando progreso_json (error):', e);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isReplicateThrottlingError(err) {
  const msg = (err && err.message ? String(err.message) : String(err || '')).toLowerCase();
  return msg.includes('throttl') || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('429');
}

async function generateImageWithThrottleRetry(prompt, options = {}) {
  const baseDelayMs = typeof options.baseDelayMs === 'number' ? options.baseDelayMs : 8000;
  const retryBackoffMs = Array.isArray(options.retryBackoffMs) ? options.retryBackoffMs : [8000, 12000, 16000];

  // Requirement: delay base (~8000ms) between *each* generation.
  await sleep(baseDelayMs);

  try {
    return await generateImage(prompt);
  } catch (err) {
    // Requirement: retry ONLY on throttling.
    if (!isReplicateThrottlingError(err)) {
      throw err;
    }

    for (let i = 0; i < retryBackoffMs.length; i++) {
      const delayMs = retryBackoffMs[i];
      console.warn(`🔄 [BACKGROUND] Replicate throttled. Retry ${i + 1}/${retryBackoffMs.length} in ${Math.round(delayMs / 1000)}s`);
      await sleep(delayMs);

      try {
        return await generateImage(prompt);
      } catch (retryErr) {
        if (!isReplicateThrottlingError(retryErr)) {
          throw retryErr;
        }
      }
    }

    throw err;
  }
}

async function handleGenerateCuento(req, res, sendJson) {
  try {
    const body = await readBody(req);
    const params = new URLSearchParams(body);
    const cuentoId = params.get('cuento_id');
    const callbackUrl = params.get('callback_url'); // URL de n8n para notificar cuando termine

    if (!cuentoId) {
      return sendJson(res, 400, {
        success: false,
        error: 'cuento_id es requerido'
      });
    }

    console.log(`🎨 Recibida solicitud de generación para cuento ID: ${cuentoId}`);

    // Verificar que el cuento existe y está pagado
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

    // Actualizar estado a "generando"
    await pool.execute(
      'UPDATE cuentos SET estado = ? WHERE id = ?',
      ['generando', cuentoId]
    );

    // CRÍTICO: Iniciar generación en background (no esperar)
    setImmediate(() => {
      generateCuentoBackground(cuentoId, cuento, callbackUrl);
    });

    // Responder INMEDIATAMENTE (antes de que termine la generación)
    console.log(`✅ Generación iniciada en background para cuento ${cuentoId}`);
    
    return sendJson(res, 202, { // 202 Accepted
      success: true,
      message: 'Generación iniciada en background',
      cuento_id: parseInt(cuentoId),
      status: 'processing',
      estimated_time_minutes: 5,
      callback_url: callbackUrl || null
    });

  } catch (err) {
    console.error('❌ Error iniciando generación:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message
    });
  }
}

// Función que trabaja en background (asíncrona)
async function generateCuentoBackground(cuentoId, cuento, callbackUrl) {
  const startTime = Date.now();
  
  try {
    console.log(`🎨 [BACKGROUND] Iniciando generación de cuento ID: ${cuentoId}`);

    await updateProgress(cuentoId, {
      step: 'starting',
      percent: 0,
      message: 'Iniciando generación…'
    });

    const payload = JSON.parse(cuento.payload_json);
    const subdomain = cuento.subdomain;

    console.log(`📝 [BACKGROUND] Generando historia para: ${payload.nombre_nino}`);

    // 1. Generar historia con Claude
    const story = await generateStory(payload);

    await updateProgress(cuentoId, {
      step: 'story_generated',
      percent: 10,
      message: 'Historia generada'
    });
    
    console.log(`✅ [BACKGROUND] Historia generada: "${story.titulo}"`);
    console.log(`🖼️  [BACKGROUND] Generando ${story.escenas.length} ilustraciones...`);

    // 2. Crear carpeta para el flipbook
    const flipbookPath = path.join(FLIPBOOKS_DIR, subdomain);
    await fs.mkdir(flipbookPath, { recursive: true });

    // 3. Generar portada (0.jpg y 1.jpg - duplicada)
    await renderPortada(payload.nombre_nino, story.titulo, path.join(flipbookPath, '0.jpg'));
    await renderPortada(payload.nombre_nino, story.titulo, path.join(flipbookPath, '1.jpg'));
    console.log('✅ [BACKGROUND] Portada generada');

    // 4. Generar dedicatoria (2.jpg)
    await renderDedicatoria(story.dedicatoria, path.join(flipbookPath, '2.jpg'));
    console.log('✅ [BACKGROUND] Dedicatoria generada');

    await updateProgress(cuentoId, {
      step: 'cover_dedicatoria',
      percent: 20,
      message: 'Portada y dedicatoria listas'
    });

    // 5. Generar escenas (ilustraciones + textos alternados)
  const totalImages = Array.isArray(story.escenas) ? story.escenas.length : 0;
  for (let i = 0; i < story.escenas.length; i++) {
      const escena = story.escenas[i];
      const ilustracionNum = i * 2 + 3; // 3, 5, 7, 9...
      const textoNum = i * 2 + 4;       // 4, 6, 8, 10...

      console.log(`🎨 [BACKGROUND] Generando ilustración ${i + 1}/10...`);

      // Progreso real antes de pedir la imagen
      // Percent dinámico 20% -> 95% durante el loop
      const loopStart = 20;
      const loopEnd = 95;
      const doneBefore = i;
      const percentBefore = totalImages > 0
        ? Math.round(loopStart + ((loopEnd - loopStart) * (doneBefore / totalImages)))
        : loopStart;
      await updateProgress(cuentoId, {
        step: 'images',
        current: i,
        total: totalImages,
        percent: percentBefore,
        message: `Generando ilustración ${i + 1} de ${totalImages}…`
      });
      
      // Generar ilustración con FLUX
      // Requisitos:
      // - No paralelizar generateImage (loop secuencial + await)
      // - Delay base de ~8s entre cada generación
      // - Retry SOLO si es throttling, con backoff progresivo
      const imageUrl = await generateImageWithThrottleRetry(escena.prompt_imagen, {
        baseDelayMs: 8000,
        retryBackoffMs: [8000, 12000, 16000]
      });
      const imageBuffer = await downloadImage(imageUrl);
      await fs.writeFile(path.join(flipbookPath, `${ilustracionNum}.jpg`), imageBuffer);
      
      console.log(`✅ [BACKGROUND] Ilustración ${i + 1} guardada (${ilustracionNum}.jpg)`);

      // Progreso real después de terminar la imagen
      const doneAfter = i + 1;
      const percentAfter = totalImages > 0
        ? Math.round(loopStart + ((loopEnd - loopStart) * (doneAfter / totalImages)))
        : loopEnd;
      await updateProgress(cuentoId, {
        step: 'images',
        current: doneAfter,
        total: totalImages,
        percent: percentAfter,
        message: `Ilustración ${doneAfter} de ${totalImages} lista`
      });

      // Generar página de texto con Puppeteer
      await renderTextPage(escena.texto_narrativo, path.join(flipbookPath, `${textoNum}.jpg`));
      console.log(`✅ [BACKGROUND] Texto ${i + 1} generado (${textoNum}.jpg)`);
    }

    // 6. Generar contraportada (22.jpg)
    await renderContraportada(story.mensaje_final, path.join(flipbookPath, '22.jpg'));
    console.log('✅ [BACKGROUND] Contraportada generada');

    await updateProgress(cuentoId, {
      step: 'final',
      percent: 98,
      message: 'Finalizando…'
    });

    // 7. Actualizar BD
    await pool.execute(
      `UPDATE cuentos 
       SET 
         flipbook_path = ?,
         estado = 'listo',
         fecha_generacion = NOW()
       WHERE id = ?`,
      [subdomain, cuentoId]
    );

    await updateProgress(cuentoId, {
      step: 'final',
      percent: 100,
      message: 'Cuento listo'
    });

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`🎉 [BACKGROUND] Cuento ${cuentoId} generado exitosamente en ${timeTaken}s`);

    // 8. Notificar a n8n vía callback (si existe)
    if (callbackUrl) {
      console.log(`📞 [BACKGROUND] Llamando callback: ${callbackUrl}`);
      
      try {
        const callbackPayload = {
          success: true,
          cuento_id: parseInt(cuentoId),
          subdomain: subdomain,
          flipbook_path: subdomain,
          images_generated: 23,
          time_taken_seconds: parseFloat(timeTaken),
          story_title: story.titulo,
          completed_at: new Date().toISOString()
        };

        const callbackResponse = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Cuentos-Background-Worker/1.0'
          },
          body: JSON.stringify(callbackPayload)
        });

        const raw = await callbackResponse.text().catch(() => '');
        if (callbackResponse.ok) {
          console.log('✅ [BACKGROUND] Callback OK');
        } else {
          console.warn(`⚠️ [BACKGROUND] Callback falló: ${callbackResponse.status} ${callbackResponse.statusText}`);
          console.warn(`⚠️ [BACKGROUND] Callback body: ${String(raw || '').slice(0, 400)}`);
        }
      } catch (callbackErr) {
        console.error(`❌ [BACKGROUND] Error en callback:`, callbackErr.message);
      }
    }

  } catch (err) {
    console.error('❌ [BACKGROUND] Error generando cuento:', err);

  // Actualizar BD con error + progreso_json/error_message
  await markError(cuentoId, err && err.message ? err.message : String(err));

    // Notificar error vía callback
    if (callbackUrl) {
      try {
        const callbackPayload = {
          success: false,
          cuento_id: parseInt(cuentoId),
          error: err.message,
          failed_at: new Date().toISOString()
        };

        const callbackResponse = await fetch(callbackUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Cuentos-Background-Worker/1.0'
          },
          body: JSON.stringify(callbackPayload)
        });

        const raw = await callbackResponse.text().catch(() => '');
        if (callbackResponse.ok) {
          console.log('✅ [BACKGROUND] Callback OK');
        } else {
          console.warn(`⚠️ [BACKGROUND] Callback falló: ${callbackResponse.status} ${callbackResponse.statusText}`);
          console.warn(`⚠️ [BACKGROUND] Callback body: ${String(raw || '').slice(0, 400)}`);
        }
      } catch (callbackErr) {
        console.error('❌ [BACKGROUND] Error notificando error:', callbackErr.message);
      }
    }
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
