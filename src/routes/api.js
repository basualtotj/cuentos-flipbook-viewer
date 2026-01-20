// src/routes/api.js

const crypto = require('crypto');
const Stripe = require('stripe');

const { MAIN_DOMAIN } = require('../config/constants');
const { pool } = require('../config/db');
const { readBody, sendJson } = require('../utils/http');

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
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY no está configurada');
  process.exit(1);
}
const stripe = new Stripe(STRIPE_SECRET_KEY);

// ====== API: crear cuento ======
async function handleCrearCuento(req, res) {
  try {
    const body = await readBody(req);
    const params = new URLSearchParams(body);

    const nombre = (params.get('nombre') || '').trim();
    const email = (params.get('email') || '').trim();
    const subdomainRaw = params.get('subdomain');

    if (!nombre || !subdomainRaw) {
      return sendJson(res, 400, { success: false, error: 'Datos incompletos' });
    }

    const subdomain = normalizeSubdomain(subdomainRaw);
    if (!isValidSubdomain(subdomain)) {
      return sendJson(res, 400, { success: false, error: 'Subdominio inválido' });
    }

    // código único
    let codigo = null;
    for (let i = 0; i < 5; i += 1) {
      codigo = generateCodigoUnico();
      const [existsCode] = await pool.execute(
        'SELECT id FROM cuentos WHERE codigo_unico = ? LIMIT 1',
        [codigo]
      );
      if (!existsCode.length) break;
    }
    if (!codigo) return sendJson(res, 500, { success: false, error: 'No se pudo generar código' });

    // subdomain único
    const [existsSubdomain] = await pool.execute(
      'SELECT id FROM cuentos WHERE subdomain = ? LIMIT 1',
      [subdomain]
    );
    if (existsSubdomain.length) {
      return sendJson(res, 409, { success: false, error: 'Subdominio ya en uso' });
    }

    // guardar pendiente
    const payloadJson = JSON.stringify({
      nombre,
      email,
      subdomain,
      created_at: new Date().toISOString(),
    });

    const [result] = await pool.execute(
      `INSERT INTO cuentos (subdomain, nombre_nino, codigo_unico, email_cliente, estado, payload_json)
       VALUES (?, ?, ?, ?, 'pendiente', ?)`,
      [subdomain, nombre, codigo, email || null, payloadJson]
    );

    const cuentoId = result.insertId;

    // Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'clp',
          product_data: {
            name: `Cuento Personalizado - ${nombre}`,
            description: `Subdominio: ${subdomain}.${MAIN_DOMAIN}`,
          },
          unit_amount: 19990,
        },
        quantity: 1,
      }],
      success_url: `https://${subdomain}.${MAIN_DOMAIN}?pago=exitoso`,
      cancel_url: `https://${MAIN_DOMAIN}?pago=cancelado`,
      customer_email: email || undefined,
      metadata: {
        cuento_id: String(cuentoId),
        subdomain,
        codigo_unico: codigo,
        nombre_nino: nombre,
      },
    });

    return sendJson(res, 200, {
      success: true,
      cuento_id: cuentoId,
      subdomain,
      codigo,
      checkout_url: session.url,
    });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { success: false, error: 'Error creando cuento' });
  }
}

module.exports = {
  handleCrearCuento,
};
