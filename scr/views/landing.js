// src/views/landing.js
function landingHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cuentos Personalizados</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 720px; margin: 50px auto; line-height: 1.6; padding: 20px; }
    input, button { padding: 10px; margin: 5px 0; width: 100%; box-sizing: border-box; }
    button { background: #5469d4; color: white; border: none; cursor: pointer; font-size: 16px; }
    button:hover { background: #4355c8; }
    #out { background: #f4f4f4; padding: 12px; overflow: auto; white-space: pre-wrap; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>📚 Cuentos Personalizados</h1>
  <p>Creá tu cuento único. Elegí tu subdominio.</p>

  <form id="form">
    <label>Nombre del niño/a</label>
    <input name="nombre" required placeholder="Ej: Catalina" />

    <label>Email</label>
    <input name="email" type="email" required placeholder="tu@email.com" />

    <label>Subdominio deseado</label>
    <input name="subdomain" placeholder="catalina-estrella" required />
    <small>Solo letras, números y guiones. Ejemplo: juanito-aventura</small>

    <button type="submit">Crear cuento y pagar ($19.990)</button>
  </form>

  <div id="out"></div>

  <script>
    const form = document.getElementById('form');
    const out = document.getElementById('out');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      out.textContent = 'Creando cuento...';

      try {
        const data = new URLSearchParams(new FormData(e.target));
        const r = await fetch('/api/crear-cuento', { method: 'POST', body: data });
        const result = await r.json();

        if (result.success && result.checkout_url) {
          out.textContent = 'Cuento creado. Redirigiendo a pago...';
          setTimeout(() => window.location.href = result.checkout_url, 700);
        } else {
          out.textContent = 'Error: ' + (result.error || 'Desconocido');
        }
      } catch (err) {
        out.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>`;
}

module.exports = { landingHtml };