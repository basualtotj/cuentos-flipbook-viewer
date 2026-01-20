const { STRIPE_SECRET_KEY, MAIN_DOMAIN } = require('../config/constants');
const { pool } = require('../config/db');
const Stripe = require('stripe');

const stripe = new Stripe(STRIPE_SECRET_KEY);

// Helpers
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
  return require('crypto').randomBytes(4).toString('hex').toUpperCase();
}

function collectPayloadFromParams(params) {
  const payload = {};
  
  for (const [key, value] of params.entries()) {
    // Si es un array serializado en JSON, parsearlo
    if (key === 'valor' || key === 'accesorios') {
      try {
        payload[key] = JSON.parse(value);
      } catch {
        payload[key] = value ? [value] : [];
      }
    } else if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const prev = payload[key];
      payload[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else {
      payload[key] = value;
    }
  }
  
  return payload;
}

function buildCuentoMetadata(payload) {
  return {
    // Datos básicos
    nombre_nino: payload.nombre_nino || '',
    edad: payload.edad || '',
    genero: payload.genero || '',
    
    // Apariencia
    tono_piel: payload.tono_piel || '',
    color_cabello: payload.color_cabello || '',
    tipo_cabello: payload.tipo_cabello || '',
    color_ojos: payload.color_ojos || '',
    accesorios: Array.isArray(payload.accesorios) 
      ? payload.accesorios.join(', ') 
      : (payload.accesorios || ''),
    
    // Personalización
    tema: payload.tema || '',
    tono_narrativo: payload.tono_narrativo || '',
    valor: Array.isArray(payload.valor) 
      ? payload.valor.join(', ') 
      : (payload.valor || ''),
    ciudad: payload.ciudad || '',
    personajes_adicionales: payload.personajes_adicionales || '',
    detalles_opcionales: payload.detalles_opcionales || '',
    
    // Contacto
    email_comprador: payload.email || '',
    nombre_comprador: payload.nombre_comprador || '',
    telefono: payload.telefono || '',
  };
}

async function handleCrearCuento(req, res, sendJson) {
  try {
    const body = await readBody(req);
    const params = new URLSearchParams(body);
    
    // Recoger todos los datos del formulario
    const payload = collectPayloadFromParams(params);
    
    // Validaciones básicas
    const nombre = (payload.nombre_nino || '').trim();
    const email = (payload.email || '').trim();
    const subdomainRaw = payload.subdomain;
    const edad = payload.edad;
    const tema = payload.tema;
    const valor = payload.valor;

    if (!nombre || !subdomainRaw || !email) {
      return sendJson(res, 400, { 
        success: false, 
        error: 'Datos incompletos: nombre, email y subdominio son requeridos' 
      });
    }
    
    if (!edad) {
      return sendJson(res, 400, { 
        success: false, 
        error: 'La edad es requerida' 
      });
    }
    
    if (!tema) {
      return sendJson(res, 400, { 
        success: false, 
        error: 'El tema del cuento es requerido' 
      });
    }
    
    // Validar que al menos un valor esté seleccionado
    if (!valor || (Array.isArray(valor) && valor.length === 0)) {
      return sendJson(res, 400, { 
        success: false, 
        error: 'Debes seleccionar al menos un valor para transmitir' 
      });
    }

    // Normalizar y validar subdomain
    const subdomain = normalizeSubdomain(subdomainRaw);
    if (!isValidSubdomain(subdomain)) {
      return sendJson(res, 400, {
        success: false,
        error: 'Subdominio inválido. Usa letras, números y guiones.'
      });
    }

    // Generar código único
    let codigo = null;
    for (let i = 0; i < 5; i += 1) {
      codigo = generateCodigoUnico();
      const [existsCode] = await pool.execute(
        'SELECT id FROM cuentos WHERE codigo_unico = ? LIMIT 1',
        [codigo]
      );
      if (!existsCode.length) break;
    }

    if (!codigo) {
      return sendJson(res, 500, { 
        success: false, 
        error: 'No se pudo generar código único' 
      });
    }

    // Verificar disponibilidad de subdomain
    const [existsSubdomain] = await pool.execute(
      'SELECT id FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );

    if (existsSubdomain.length > 0) {
      return sendJson(res, 409, { 
        success: false, 
        error: 'Subdominio ya en uso' 
      });
    }

    // Construir payload JSON completo para BD
    const payloadJson = JSON.stringify({
      ...payload,
      subdomain: subdomain,
      codigo_unico: codigo,
      fecha_creacion: new Date().toISOString()
    });

    // Insertar en BD
    const [result] = await pool.execute(
      `INSERT INTO cuentos (
        subdomain,
        nombre_nino,
        codigo_unico,
        email_cliente,
        estado,
        payload_json
      ) VALUES (?, ?, ?, ?, 'pendiente', ?)`,
      [subdomain, nombre, codigo, email, payloadJson]
    );

    const cuentoId = result.insertId;

    // Construir metadata para Stripe (campos limitados)
    const stripeMetadata = buildCuentoMetadata(payload);
    stripeMetadata.cuento_id = String(cuentoId);
    stripeMetadata.subdomain = subdomain;
    stripeMetadata.codigo_unico = codigo;

    // Crear Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'clp',
          product_data: {
            name: `Cuento Personalizado - ${nombre}`,
            description: `Tema: ${tema} | ${subdomain}.${MAIN_DOMAIN}`,
            images: ['https://cuentosparasiempre.com/assets/logo.png'] // opcional
          },
          unit_amount: 19990
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `https://${subdomain}.${MAIN_DOMAIN}?pago=exitoso`,
      cancel_url: `https://${MAIN_DOMAIN}?pago=cancelado`,
      customer_email: email,
      metadata: stripeMetadata
    });

    console.log(`✅ Cuento ${cuentoId} creado. Checkout: ${session.id}`);

    return sendJson(res, 200, {
      success: true,
      cuento_id: cuentoId,
      subdomain: subdomain,
      codigo: codigo,
      checkout_url: session.url
    });

  } catch (err) {
    console.error('Error en handleCrearCuento:', err);
    return sendJson(res, 500, { 
      success: false, 
      error: 'Error creando cuento: ' + err.message 
    });
  }
}

async function readBody(req, maxBytes = 2 * 1024 * 1024) { // 2MB max
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

module.exports = {
  handleCrearCuento
};
