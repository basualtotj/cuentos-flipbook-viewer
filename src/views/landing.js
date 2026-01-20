const landingHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Crea tu Cuento Personalizado ✨</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2.2em;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 1.1em;
      opacity: 0.95;
    }
    
    .form-content {
      padding: 40px 30px;
    }
    
    .section {
      margin-bottom: 35px;
      padding-bottom: 30px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .section:last-child {
      border-bottom: none;
    }
    
    .section-title {
      font-size: 1.3em;
      color: #667eea;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .field {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-size: 0.95em;
    }
    
    label .required {
      color: #e74c3c;
      margin-left: 3px;
    }
    
    label .optional {
      color: #999;
      font-weight: 400;
      font-size: 0.85em;
      margin-left: 5px;
    }
    
    input[type="text"],
    input[type="email"],
    input[type="tel"],
    select,
    textarea {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1em;
      transition: border-color 0.3s;
      font-family: inherit;
    }
    
    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    
    textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    small {
      display: block;
      color: #666;
      font-size: 0.85em;
      margin-top: 5px;
    }
    
    /* Color pickers visuales */
    .color-picker {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    
    .color-option {
      position: relative;
      cursor: pointer;
      text-align: center;
    }
    
    .color-option input[type="radio"] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .color-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      margin: 0 auto 8px;
      border: 3px solid transparent;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .color-option input:checked + .color-circle {
      border-color: #667eea;
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .color-label {
      font-size: 0.85em;
      color: #666;
    }
    
    /* Selectores de iconos */
    .icon-selector {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    
    .icon-option {
      position: relative;
      cursor: pointer;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      text-align: center;
      transition: all 0.3s;
      background: #f9f9f9;
    }
    
    .icon-option:hover {
      background: #f0f0f0;
    }
    
    .icon-option input[type="radio"],
    .icon-option input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .icon-option input:checked ~ .icon-content {
      background: #667eea;
      color: white;
    }
    
    .icon-content {
      padding: 10px;
      border-radius: 8px;
      transition: all 0.3s;
    }
    
    .icon-emoji {
      font-size: 2em;
      display: block;
      margin-bottom: 5px;
    }
    
    .icon-text {
      font-size: 0.85em;
      font-weight: 500;
    }
    
    /* Grid de 2 columnas para algunos campos */
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    /* Botón submit */
    .submit-section {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #f0f0f0;
    }
    
    .price-display {
      text-align: center;
      font-size: 2em;
      color: #667eea;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    button[type="submit"] {
      width: 100%;
      padding: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.2em;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    button[type="submit"]:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    
    button[type="submit"]:active {
      transform: translateY(0);
    }
    
    #out {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      background: #f0f0f0;
      display: none;
    }
    
    #out.show {
      display: block;
    }
    
    #out.error {
      background: #fee;
      color: #c33;
    }
    
    #out.success {
      background: #efe;
      color: #3a3;
    }
    
    @media (max-width: 600px) {
      .field-row {
        grid-template-columns: 1fr;
      }
      
      .header h1 {
        font-size: 1.6em;
      }
      
      .form-content {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 Crea tu Cuento Personalizado</h1>
      <p>Un cuento único, creado especialmente para tu niño/a</p>
    </div>
    
    <form id="form" class="form-content">
      
      <!-- SECCIÓN 1: Datos del niño/a -->
      <div class="section">
        <div class="section-title">
          <span>👶</span>
          <span>Datos del niño/a</span>
        </div>
        
        <div class="field">
          <label>Nombre del niño/a <span class="required">*</span></label>
          <input type="text" name="nombre_nino" required placeholder="Ej: Amanda" />
        </div>
        
        <div class="field-row">
          <div class="field">
            <label>Edad <span class="required">*</span></label>
            <select name="edad" required>
              <option value="">Selecciona...</option>
              <option value="3">3 años</option>
              <option value="4">4 años</option>
              <option value="5">5 años</option>
              <option value="6">6 años</option>
              <option value="7">7 años</option>
              <option value="8">8 años</option>
              <option value="9">9 años</option>
              <option value="10">10 años</option>
            </select>
          </div>
          
          <div class="field">
            <label>Género <span class="optional">(opcional)</span></label>
            <select name="genero">
              <option value="">Prefiero no especificar</option>
              <option value="niña">Niña</option>
              <option value="niño">Niño</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- SECCIÓN 2: Apariencia física -->
      <div class="section">
        <div class="section-title">
          <span>🎨</span>
          <span>Apariencia del personaje</span>
        </div>
        
        <div class="field">
          <label>Tono de piel <span class="optional">(opcional)</span></label>
          <div class="color-picker">
            <label class="color-option">
              <input type="radio" name="tono_piel" value="muy_claro" />
              <div class="color-circle" style="background: #fde6d8;"></div>
              <div class="color-label">Muy claro</div>
            </label>
            <label class="color-option">
              <input type="radio" name="tono_piel" value="claro" />
              <div class="color-circle" style="background: #f5d5c0;"></div>
              <div class="color-label">Claro</div>
            </label>
            <label class="color-option">
              <input type="radio" name="tono_piel" value="medio" />
              <div class="color-circle" style="background: #d4a574;"></div>
              <div class="color-label">Medio</div>
            </label>
            <label class="color-option">
              <input type="radio" name="tono_piel" value="oscuro" />
              <div class="color-circle" style="background: #8d5524;"></div>
              <div class="color-label">Oscuro</div>
            </label>
          </div>
        </div>
        
        <div class="field">
          <label>Color de cabello <span class="optional">(opcional)</span></label>
          <div class="color-picker">
            <label class="color-option">
              <input type="radio" name="color_cabello" value="rubio" />
              <div class="color-circle" style="background: #f0e68c;"></div>
              <div class="color-label">Rubio</div>
            </label>
            <label class="color-option">
              <input type="radio" name="color_cabello" value="castaño" />
              <div class="color-circle" style="background: #8b6f47;"></div>
              <div class="color-label">Castaño</div>
            </label>
            <label class="color-option">
              <input type="radio" name="color_cabello" value="negro" />
              <div class="color-circle" style="background: #2c2c2c;"></div>
              <div class="color-label">Negro</div>
            </label>
            <label class="color-option">
              <input type="radio" name="color_cabello" value="pelirrojo" />
              <div class="color-circle" style="background: #c14a09;"></div>
              <div class="color-label">Pelirrojo</div>
            </label>
          </div>
        </div>
        
        <div class="field-row">
          <div class="field">
            <label>Tipo de cabello <span class="optional">(opcional)</span></label>
            <select name="tipo_cabello">
              <option value="">No especificar</option>
              <option value="liso">Liso</option>
              <option value="ondulado">Ondulado</option>
              <option value="rulos">Rulos/Rizado</option>
            </select>
          </div>
          
          <div class="field">
            <label>Color de ojos <span class="optional">(opcional)</span></label>
            <select name="color_ojos">
              <option value="">No especificar</option>
              <option value="marrones">Marrones</option>
              <option value="azules">Azules</option>
              <option value="verdes">Verdes</option>
              <option value="miel">Miel</option>
              <option value="grises">Grises</option>
            </select>
          </div>
        </div>
        
        <div class="field">
          <label>Accesorios <span class="optional">(opcional, puedes elegir varios)</span></label>
          <div class="icon-selector">
            <label class="icon-option">
              <input type="checkbox" name="accesorios" value="lentes" />
              <div class="icon-content">
                <span class="icon-emoji">👓</span>
                <span class="icon-text">Lentes</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="checkbox" name="accesorios" value="audifonos" />
              <div class="icon-content">
                <span class="icon-emoji">🦻</span>
                <span class="icon-text">Audífonos</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="checkbox" name="accesorios" value="gorra" />
              <div class="icon-content">
                <span class="icon-emoji">🧢</span>
                <span class="icon-text">Gorra</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="checkbox" name="accesorios" value="mochila" />
              <div class="icon-content">
                <span class="icon-emoji">🎒</span>
                <span class="icon-text">Mochila</span>
              </div>
            </label>
          </div>
        </div>
      </div>
      
      <!-- SECCIÓN 3: Personalización del cuento -->
      <div class="section">
        <div class="section-title">
          <span>📖</span>
          <span>Personalización del cuento</span>
        </div>
        
        <div class="field">
          <label>Tema principal <span class="required">*</span></label>
          <div class="icon-selector">
            <label class="icon-option">
              <input type="radio" name="tema" value="dinosaurios" required />
              <div class="icon-content">
                <span class="icon-emoji">🦕</span>
                <span class="icon-text">Dinosaurios</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="radio" name="tema" value="princesas" />
              <div class="icon-content">
                <span class="icon-emoji">👸</span>
                <span class="icon-text">Princesas</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="radio" name="tema" value="espacio" />
              <div class="icon-content">
                <span class="icon-emoji">🚀</span>
                <span class="icon-text">Espacio</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="radio" name="tema" value="animales" />
              <div class="icon-content">
                <span class="icon-emoji">🦁</span>
                <span class="icon-text">Animales</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="radio" name="tema" value="sirenas" />
              <div class="icon-content">
                <span class="icon-emoji">🧜‍♀️</span>
                <span class="icon-text">Sirenas</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="radio" name="tema" value="superhéroes" />
              <div class="icon-content">
                <span class="icon-emoji">🦸</span>
                <span class="icon-text">Superhéroes</span>
              </div>
            </label>
          </div>
        </div>
        
        <div class="field">
          <label>Tono narrativo <span class="optional">(opcional)</span></label>
          <select name="tono_narrativo">
            <option value="">Dejar a criterio del escritor</option>
            <option value="divertido">Divertido y juguetón</option>
            <option value="aventurero">Aventurero y emocionante</option>
            <option value="calmado">Calmado y relajante</option>
            <option value="educativo">Educativo e informativo</option>
            <option value="mágico">Mágico y fantástico</option>
          </select>
        </div>
        
        <div class="field">
          <label>Valores a transmitir <span class="required">* (elige al menos uno)</span></label>
          <div class="icon-selector">
            <label class="icon-option">
              <input type="checkbox" name="valor" value="creatividad" />
              <div class="icon-content">
                <span class="icon-emoji">🎨</span>
                <span class="icon-text">Creatividad</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="checkbox" name="valor" value="amistad" />
              <div class="icon-content">
                <span class="icon-emoji">🤝</span>
                <span class="icon-text">Amistad</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="checkbox" name="valor" value="valentía" />
              <div class="icon-content">
                <span class="icon-emoji">🦁</span>
                <span class="icon-text">Valentía</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="checkbox" name="valor" value="honestidad" />
              <div class="icon-content">
                <span class="icon-emoji">💯</span>
                <span class="icon-text">Honestidad</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="checkbox" name="valor" value="perseverancia" />
              <div class="icon-content">
                <span class="icon-emoji">💪</span>
                <span class="icon-text">Perseverancia</span>
              </div>
            </label>
            <label class="icon-option">
              <input type="checkbox" name="valor" value="empatía" />
              <div class="icon-content">
                <span class="icon-emoji">❤️</span>
                <span class="icon-text">Empatía</span>
              </div>
            </label>
          </div>
        </div>
        
        <div class="field">
          <label>Ciudad o lugar <span class="optional">(opcional)</span></label>
          <input type="text" name="ciudad" placeholder="Ej: Santiago, Valparaíso..." />
          <small>Si quieres que el cuento suceda en un lugar específico</small>
        </div>
        
        <div class="field">
          <label>Personajes adicionales <span class="optional">(opcional)</span></label>
          <input type="text" name="personajes_adicionales" placeholder="Ej: hermano Juan, perrita Luna" />
          <small>Menciona hermanos, mascotas o amigos especiales</small>
        </div>
        
        <div class="field">
          <label>Detalles especiales <span class="optional">(opcional)</span></label>
          <textarea name="detalles_opcionales" placeholder="Ej: le encantan los lápices de colores, tiene una mochila rosa..."></textarea>
          <small>Cualquier detalle que quieras que aparezca en el cuento</small>
        </div>
      </div>
      
      <!-- SECCIÓN 4: Datos de contacto -->
      <div class="section">
        <div class="section-title">
          <span>📧</span>
          <span>Datos de contacto</span>
        </div>
        
        <div class="field">
          <label>Email <span class="required">*</span></label>
          <input type="email" name="email" required placeholder="tu@email.com" />
          <small>Aquí recibirás el link a tu cuento personalizado</small>
        </div>
        
        <div class="field-row">
          <div class="field">
            <label>Tu nombre <span class="optional">(opcional)</span></label>
            <input type="text" name="nombre_comprador" placeholder="Carolina" />
          </div>
          
          <div class="field">
            <label>Teléfono <span class="optional">(opcional)</span></label>
            <input type="tel" name="telefono" placeholder="+56..." />
          </div>
        </div>
      </div>
      
      <!-- SECCIÓN 5: Subdominio -->
      <div class="section">
        <div class="section-title">
          <span>🌐</span>
          <span>Tu link personalizado</span>
        </div>
        
        <div class="field">
          <label>Subdominio deseado <span class="required">*</span></label>
          <input type="text" name="subdomain" required placeholder="amanda-dino" />
          <small>Solo letras, números y guiones. Ej: juanito-aventura</small>
          <div id="subdomain-preview" style="margin-top:10px;font-size:0.9em;color:#667eea;"></div>
        </div>
      </div>
      
      <!-- Submit -->
      <div class="submit-section">
        <div class="price-display">$19.990</div>
        <button type="submit">✨ Crear mi cuento personalizado</button>
        <div id="out"></div>
      </div>
    </form>
  </div>

  <script>
    const form = document.getElementById('form');
    const out = document.getElementById('out');
    const subdomainInput = document.querySelector('input[name="subdomain"]');
    const subdomainPreview = document.getElementById('subdomain-preview');

    // Preview del subdomain
    subdomainInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      if (value) {
        subdomainPreview.textContent = '🔗 Tu cuento estará en: ' + value + '.cuentosparasiempre.com';
      } else {
        subdomainPreview.textContent = '';
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validar que al menos un valor esté seleccionado
      const valoresChecked = form.querySelectorAll('input[name="valor"]:checked');
      if (valoresChecked.length === 0) {
        out.className = 'show error';
        out.textContent = 'Por favor selecciona al menos un valor para transmitir en el cuento.';
        return;
      }
      
      out.className = 'show';
      out.textContent = 'Creando tu cuento personalizado...';

      try {
        const formData = new FormData(e.target);
        
        // Convertir valores checkbox a array
        const valores = Array.from(formData.getAll('valor'));
        const accesorios = Array.from(formData.getAll('accesorios'));
        
        // Reconstruir FormData con arrays serializados
        const data = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
          if (key !== 'valor' && key !== 'accesorios') {
            data.append(key, value);
          }
        }
        data.append('valor', JSON.stringify(valores));
        data.append('accesorios', JSON.stringify(accesorios));
        
        const r = await fetch('/api/crear-cuento', { method: 'POST', body: data });
        let result = {};
        try { result = await r.json(); } catch {}

        if (r.status === 409) {
          out.className = 'show error';
          out.textContent = 'Ese subdominio ya está en uso. Por favor elige otro.';
          return;
        }

        if (result.success && result.checkout_url) {
          out.className = 'show success';
          out.textContent = '✅ Cuento creado! Redirigiendo a pago seguro...';
          setTimeout(() => window.location.href = result.checkout_url, 1000);
        } else {
          out.className = 'show error';
          out.textContent = 'Error: ' + (result.error || ('HTTP ' + r.status));
        }
      } catch (err) {
        out.className = 'show error';
        out.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>`;

module.exports = {
  landingHtml,
};
