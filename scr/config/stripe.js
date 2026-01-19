// src/config/stripe.js
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY no está configurada');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

module.exports = { stripe };