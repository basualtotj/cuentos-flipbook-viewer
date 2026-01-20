const landingHtml = `<!doctype html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
        <title>Cuentos Para Siempre · Cuentos personalizados</title>
        <style>
          :root{
            --bg: #fff;
            --text: #1c1b22;
            --muted: rgba(28,27,34,.72);
            --card: rgba(255,255,255,.92);
            --border: rgba(31, 33, 39, .10);
            --shadow: 0 18px 60px rgba(17, 24, 39, .12);
            --shadow-soft: 0 10px 26px rgba(17, 24, 39, .08);
            --r-xl: 26px;
            --r-lg: 18px;
            --r-md: 14px;
            --r-sm: 12px;
            --maxw: 1200px;

            /* palette (kids friendly) */
            --p1: #E88B7B; /* coral */
            --p2: #D4C5E8; /* lavender */
            --p3: #A8D5BA; /* mint */
            --p4: #BCE3F5; /* sky */
            --p5: #FFD4B8; /* peach */
            --p6: #F5C8D8; /* pink */

            --focus: 0 0 0 4px rgba(232, 139, 123, .22);
          }

          *{ box-sizing: border-box; }
          html{ scroll-behavior: smooth; }

          body{
            margin: 0;
            color: var(--text);
            background:
              radial-gradient(900px 600px at 15% 10%, rgba(212,197,232,.30), transparent 70%),
              radial-gradient(900px 600px at 85% 15%, rgba(168,213,186,.25), transparent 70%),
              radial-gradient(900px 700px at 55% 90%, rgba(255,212,184,.22), transparent 70%),
              linear-gradient(180deg, #fff 0%, #fff9f5 100%);
            font-family: ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            line-height: 1.45;
          }

          a{ color: inherit; text-decoration: none; }
          a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, summary:focus-visible{
            outline: none;
            box-shadow: var(--focus);
            border-radius: 10px;
          }

          .container{ width: min(var(--maxw), calc(100% - 40px)); margin: 0 auto; }
          .pill{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-radius: 999px;
            border: 1px solid rgba(232,139,123,.22);
            background: linear-gradient(90deg, rgba(232,139,123,.10), rgba(212,197,232,.10));
            color: rgba(28,27,34,.85);
            font-weight: 700;
            font-size: 13px;
          }

          .header{
            position: sticky;
            top: 0;
            z-index: 50;
            background: rgba(255,255,255,.82);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border);
          }

          .nav{
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 0;
          }

          .brand{
            display:flex;
            align-items:center;
            gap: 10px;
            font-weight: 900;
            letter-spacing: -0.02em;
          }

          .brand-badge{
            width: 42px;
            height: 42px;
            border-radius: 999px;
            background: linear-gradient(135deg, var(--p1), var(--p2));
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow: 0 10px 20px rgba(232,139,123,.20);
            color: #fff;
            font-size: 18px;
          }

          .nav-links{ display: flex; align-items:center; gap: 18px; }
          .nav-links a{
            font-size: 13px;
            font-weight: 700;
            color: rgba(28,27,34,.70);
            padding: 10px 10px;
            border-radius: 999px;
          }
          .nav-links a:hover{ background: rgba(232,139,123,.08); color: rgba(28,27,34,.92); }

          .cta{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 999px;
            border: 0;
            cursor: pointer;
            font-weight: 900;
            letter-spacing: -0.01em;
            transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
            user-select: none;
          }
          .cta.primary{
            background: linear-gradient(90deg, var(--p1), var(--p2));
            color: #fff;
            box-shadow: 0 14px 30px rgba(232,139,123,.20);
          }
          .cta.primary:hover{ transform: translateY(-1px); box-shadow: 0 18px 36px rgba(232,139,123,.25); }

          .cta.secondary{
            background: #fff;
            color: var(--p1);
            border: 2px solid rgba(232,139,123,.55);
          }
          .cta.secondary:hover{ background: rgba(232,139,123,.07); }

          .menu-btn{
            display:none;
            border: 1px solid var(--border);
            background: #fff;
            border-radius: 12px;
            padding: 10px 12px;
            font-weight: 900;
            cursor: pointer;
          }

          .hero{
            padding: 54px 0 26px;
          }

          .hero-grid{
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 28px;
            align-items: center;
          }

          .hero h1{
            font-size: clamp(34px, 4vw, 56px);
            line-height: 1.06;
            letter-spacing: -0.03em;
            margin: 14px 0 12px;
          }

          .grad{
            background: linear-gradient(90deg, var(--p1), var(--p2));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .hero p{ color: var(--muted); font-size: 18px; max-width: 56ch; margin: 0 0 20px; }

          .hero-actions{ display:flex; gap: 12px; flex-wrap: wrap; margin: 18px 0 18px; }
          .trust{ display:flex; flex-wrap: wrap; gap: 14px; color: rgba(28,27,34,.62); font-weight: 700; font-size: 13px; }
          .trust span{ display:inline-flex; align-items:center; gap: 8px; padding: 8px 12px; border: 1px dashed rgba(31,33,39,.16); border-radius: 999px; background: rgba(255,255,255,.65); }

          .mock{
            border-radius: var(--r-xl);
            background: linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.7));
            border: 1px solid var(--border);
            box-shadow: var(--shadow);
            overflow: hidden;
            position: relative;
          }
          .mock .img{
            aspect-ratio: 4/3;
            background:
              radial-gradient(240px 240px at 20% 20%, rgba(232,139,123,.30), transparent 70%),
              radial-gradient(260px 260px at 90% 35%, rgba(212,197,232,.30), transparent 70%),
              radial-gradient(240px 240px at 65% 95%, rgba(168,213,186,.28), transparent 70%),
              linear-gradient(135deg, rgba(255,249,245,1) 0%, rgba(255,255,255,1) 100%);
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 22px;
          }
          .mock-card{
            width: min(92%, 420px);
            border-radius: 22px;
            background: rgba(255,255,255,.96);
            border: 1px solid rgba(31,33,39,.10);
            box-shadow: 0 16px 40px rgba(17,24,39,.12);
            padding: 18px;
          }
          .mock-top{
            display:flex;
            align-items:center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 10px;
          }
          .mini-badge{
            display:inline-flex;
            align-items:center;
            gap: 6px;
            padding: 8px 10px;
            border-radius: 999px;
            background: rgba(232,139,123,.10);
            color: rgba(28,27,34,.82);
            font-size: 12px;
            font-weight: 900;
          }
          .mock-lines{ display:grid; gap: 10px; }
          .line{ height: 10px; border-radius: 999px; background: rgba(31,33,39,.08); }
          .line.w1{ width: 90%; }
          .line.w2{ width: 78%; }
          .line.w3{ width: 85%; }
          .line.w4{ width: 62%; }

          .section{ padding: 66px 0; }
          .section.alt{ background: rgba(255,255,255,.72); }
          .section-head{ text-align:center; margin-bottom: 26px; }
          .section-title{ font-size: clamp(26px, 2.6vw, 40px); letter-spacing: -0.02em; margin: 0 0 10px; }
          .section-sub{ color: var(--muted); max-width: 70ch; margin: 0 auto; }

          .grid-4{ display:grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
          .card{
            border-radius: 20px;
            background: rgba(255,255,255,.92);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-soft);
            padding: 16px;
            position: relative;
            overflow: hidden;
          }
          .card .num{
            position:absolute;
            top: 14px;
            left: 14px;
            width: 32px;
            height: 32px;
            border-radius: 999px;
            background: linear-gradient(135deg, var(--p1), var(--p2));
            color: #fff;
            display:flex;
            align-items:center;
            justify-content:center;
            font-weight: 900;
            box-shadow: 0 10px 20px rgba(232,139,123,.18);
          }
          .card .icon{
            width: 56px;
            height: 56px;
            border-radius: 18px;
            display:flex;
            align-items:center;
            justify-content:center;
            margin: 30px 0 10px;
            font-size: 24px;
            background: rgba(232,139,123,.10);
          }
          .card h3{ margin: 6px 0 8px; font-size: 18px; letter-spacing: -0.01em; }
          .card p{ margin: 0; color: var(--muted); font-size: 14px; }

          /* FORM */
          .form-wrap{
            border-radius: var(--r-xl);
            background: rgba(255,255,255,.92);
            border: 1px solid rgba(31,33,39,.10);
            box-shadow: var(--shadow);
            overflow: hidden;
          }
          .form-top{
            padding: 22px 22px 16px;
            border-bottom: 1px solid rgba(31,33,39,.08);
            background:
              radial-gradient(420px 220px at 15% 10%, rgba(232,139,123,.15), transparent 70%),
              radial-gradient(420px 220px at 85% 40%, rgba(212,197,232,.16), transparent 70%),
              linear-gradient(180deg, rgba(255,255,255,.9) 0%, rgba(255,255,255,.75) 100%);
          }
          .form-top h2{ margin: 0 0 6px; font-size: 24px; letter-spacing:-0.02em; }
          .form-top p{ margin: 0; color: var(--muted); }

          form#form{ padding: 22px; }
          .form-grid{ display:grid; gap: 16px; }
          .form-card{
            border-radius: 20px;
            border: 1px solid rgba(31,33,39,.10);
            background: rgba(255,255,255,.94);
            box-shadow: 0 10px 26px rgba(17,24,39,.08);
            padding: 18px;
          }
          .form-card-head{ display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 12px; }
          .form-card-head strong{ font-size: 16px; letter-spacing:-0.01em; }
          .tag{ font-size: 12px; font-weight: 900; color: rgba(28,27,34,.72); background: rgba(232,139,123,.10); padding: 8px 10px; border-radius: 999px; border: 1px solid rgba(232,139,123,.16); }

          .field{ margin-bottom: 14px; }
          .field:last-child{ margin-bottom: 0; }
          label{ display:block; font-weight: 900; font-size: 13px; color: rgba(28,27,34,.88); margin-bottom: 6px; }
          .required{ color: #e74c3c; margin-left: 4px; }
          .optional{ color: rgba(28,27,34,.50); font-weight: 700; font-size: 12px; margin-left: 6px; }

          input[type="text"], input[type="email"], input[type="tel"], select, textarea{
            width:100%;
            padding: 12px 12px;
            border-radius: 12px;
            border: 1px solid rgba(31,33,39,.16);
            background: rgba(255,255,255,.95);
            font: inherit;
            font-size: 15px;
            transition: border-color .15s ease, box-shadow .15s ease;
          }
          input:focus, select:focus, textarea:focus{
            border-color: rgba(232,139,123,.60);
            box-shadow: var(--focus);
            outline: none;
          }
          textarea{ resize: vertical; min-height: 90px; }
          small{ display:block; margin-top: 6px; color: rgba(28,27,34,.62); font-size: 12px; }

          /* existing pickers (kept IDs/names, restyled) */
          .color-picker{ display:grid; grid-template-columns: repeat(auto-fit, minmax(88px, 1fr)); gap: 10px; margin-top: 10px; }
          .color-option{ position: relative; cursor: pointer; text-align:center; }
          .color-option input[type="radio"]{ position:absolute; opacity:0; width:0; height:0; }
          .color-circle{ width: 56px; height: 56px; border-radius: 999px; margin: 0 auto 8px; border: 3px solid transparent; box-shadow: 0 10px 18px rgba(17,24,39,.10); transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
          .color-option input:checked + .color-circle{ border-color: rgba(232,139,123,.75); transform: scale(1.08); box-shadow: 0 16px 26px rgba(232,139,123,.18); }
          .color-label{ font-size: 12px; font-weight: 800; color: rgba(28,27,34,.68); }

          .icon-selector{ display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 10px; }
          .icon-option{ position: relative; cursor: pointer; padding: 14px; border: 1px solid rgba(31,33,39,.14); border-radius: 16px; background: rgba(255,255,255,.9); transition: transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease; }
          .icon-option:hover{ transform: translateY(-1px); box-shadow: 0 12px 24px rgba(17,24,39,.08); }
          .icon-option input[type="radio"], .icon-option input[type="checkbox"]{ position:absolute; opacity:0; width:0; height:0; }
          .icon-content{ padding: 10px; border-radius: 14px; transition: background .12s ease, color .12s ease; text-align:center; }
          .icon-emoji{ font-size: 26px; display:block; margin-bottom: 6px; }
          .icon-text{ font-size: 13px; font-weight: 900; color: rgba(28,27,34,.74); }
          .icon-option input:checked ~ .icon-content{ background: linear-gradient(135deg, rgba(232,139,123,.20), rgba(212,197,232,.18)); }

          .field-row{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }

          .submit-row{
            display:flex;
            align-items:center;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
            margin-top: 8px;
          }
          .price{
            display:flex;
            align-items:baseline;
            gap: 10px;
            padding: 10px 14px;
            border-radius: 16px;
            background: rgba(232,139,123,.08);
            border: 1px solid rgba(232,139,123,.16);
            font-weight: 900;
          }
          .price .big{ font-size: 28px; }
          .price .small{ font-size: 12px; color: rgba(28,27,34,.60); font-weight: 800; }

          button[type="submit"]{
            width: 100%;
            padding: 16px 18px;
            border-radius: 16px;
            border: 0;
            cursor: pointer;
            font-weight: 900;
            font-size: 16px;
            color: #fff;
            background: linear-gradient(90deg, var(--p1), var(--p2));
            box-shadow: 0 18px 34px rgba(232,139,123,.22);
            transition: transform .15s ease, box-shadow .15s ease;
          }
          button[type="submit"]:hover{ transform: translateY(-1px); box-shadow: 0 22px 40px rgba(232,139,123,.26); }

          #out{
            margin-top: 14px;
            padding: 14px;
            border-radius: 14px;
            background: rgba(31,33,39,.04);
            display: none;
            border: 1px solid rgba(31,33,39,.08);
          }
          #out.show{ display:block; }
          #out.error{ background: rgba(255, 0, 0, .06); color: #8a1e1e; border-color: rgba(255,0,0,.12); }
          #out.success{ background: rgba(0, 180, 90, .08); color: #0f5d31; border-color: rgba(0,180,90,.14); }

          /* Example */
          .example{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            align-items: stretch;
          }
          .example .panel{ border-radius: 22px; border: 1px solid var(--border); background: rgba(255,255,255,.92); box-shadow: var(--shadow-soft); overflow:hidden; }
          .example .panel .ph{
            aspect-ratio: 4/3;
            background:
              radial-gradient(220px 220px at 20% 30%, rgba(188,227,245,.45), transparent 70%),
              radial-gradient(220px 220px at 80% 20%, rgba(245,200,216,.42), transparent 70%),
              radial-gradient(220px 220px at 60% 85%, rgba(168,213,186,.35), transparent 70%),
              linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,249,245,1) 100%);
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 22px;
            font-size: 48px;
          }
          .example .panel .txt{ padding: 18px; }
          .example .panel .txt p{ margin: 0; color: var(--muted); }
          .example .panel .txt strong{ display:block; margin-bottom: 8px; font-size: 16px; }

          /* Pricing */
          .price-card{ max-width: 760px; margin: 0 auto; border-radius: 28px; border: 2px solid rgba(232,139,123,.18); background: rgba(255,255,255,.95); box-shadow: var(--shadow); padding: 22px; position: relative; }
          .price-badge{ position:absolute; top: -14px; left: 50%; transform: translateX(-50%); padding: 10px 16px; border-radius: 999px; background: linear-gradient(90deg, var(--p1), var(--p2)); color:#fff; font-weight: 900; font-size: 13px; box-shadow: 0 14px 30px rgba(232,139,123,.20); }
          .price-main{ text-align:center; padding-top: 18px; }
          .price-main .big{ font-size: 54px; font-weight: 1000; letter-spacing: -0.03em; }
          .price-main .note{ color: rgba(28,27,34,.60); font-weight: 800; }
          .features{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; margin-top: 18px; }
          .feat{ display:flex; gap: 10px; align-items:flex-start; color: rgba(28,27,34,.78); font-weight: 700; font-size: 14px; }
          .check{ width: 22px; height: 22px; border-radius: 999px; background: linear-gradient(135deg, var(--p3), var(--p4)); display:flex; align-items:center; justify-content:center; color:#fff; font-weight: 1000; flex: 0 0 auto; }

          /* FAQ */
          .faq{ max-width: 880px; margin: 0 auto; display:grid; gap: 12px; }
          details{
            border-radius: 18px;
            border: 1px solid rgba(31,33,39,.12);
            background: rgba(255,255,255,.92);
            box-shadow: var(--shadow-soft);
            overflow: hidden;
          }
          summary{
            padding: 16px 18px;
            cursor: pointer;
            font-weight: 900;
            list-style: none;
          }
          summary::-webkit-details-marker{ display:none; }
          details p{ margin: 0; padding: 0 18px 18px; color: var(--muted); }

          .footer{
            padding: 28px 0 36px;
            border-top: 1px solid rgba(31,33,39,.10);
            background: rgba(255,255,255,.75);
          }
          .foot-grid{ display:grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 16px; align-items:start; }
          .foot-muted{ color: var(--muted); }
          .foot-links{ display:grid; gap: 10px; }
          .foot-links a{ color: rgba(28,27,34,.70); font-weight: 800; }
          .foot-links a:hover{ color: rgba(28,27,34,.92); text-decoration: underline; }

          /* Mobile */
          @media (max-width: 980px){
            .hero-grid{ grid-template-columns: 1fr; }
            .mock{ order: 2; }
            .hero{ padding-top: 32px; }
            .grid-4{ grid-template-columns: 1fr 1fr; }
            .example{ grid-template-columns: 1fr; }
            .features{ grid-template-columns: 1fr; }
            .foot-grid{ grid-template-columns: 1fr; }
          }

          @media (max-width: 760px){
            .nav-links{ display: none; }
            .menu-btn{ display: inline-flex; }
            .mobile-menu{ display:none; padding: 8px 0 14px; }
            .mobile-menu.open{ display:block; }
            .mobile-menu a{ display:block; padding: 10px 10px; border-radius: 12px; font-weight: 900; color: rgba(28,27,34,.78); }
            .mobile-menu a:hover{ background: rgba(232,139,123,.08); }
            .field-row{ grid-template-columns: 1fr; }
          }
        </style>
      opacity: 0;
      width: 0;
        <header class="header" aria-label="Barra de navegación">
          <div class="container">
            <div class="nav">
              <a class="brand" href="#inicio" aria-label="Cuentos Para Siempre">
                <span class="brand-badge" aria-hidden="true">✨</span>
                <span>Cuentos Para Siempre</span>
              </a>

              <nav class="nav-links" aria-label="Menú">
                <a href="#inicio">Inicio</a>
                <a href="#como-funciona">Cómo funciona</a>
                <a href="#personaliza">Personaliza</a>
                <a href="#ejemplo">Ejemplo</a>
                <a href="#precio">Precio</a>
                <a href="#faq">FAQ</a>
                <a class="cta primary" href="#personaliza" aria-label="Crear cuento">Crear cuento</a>
              </nav>

              <button class="menu-btn" id="menu-btn" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-menu">☰</button>
            </div>

            <nav class="mobile-menu" id="mobile-menu" aria-label="Menú móvil">
              <a href="#inicio">Inicio</a>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#personaliza">Personaliza</a>
              <a href="#ejemplo">Ejemplo</a>
              <a href="#precio">Precio</a>
              <a href="#faq">FAQ</a>
              <a class="cta primary" href="#personaliza" aria-label="Crear cuento (móvil)" style="justify-content:center; width: 100%; margin-top: 10px;">Crear cuento</a>
            </nav>
          </div>
        </header>

        <main>
          <section class="hero" id="inicio">
            <div class="container hero-grid">
              <div>
                <span class="pill">✨ Cuentos únicos y personalizados</span>
                <h1>
                  Crea un cuento
                  <span class="grad"> mágico y único</span>
                  <br />
                  para tu pequeño
                </h1>
                <p>
                  Personalizamos el nombre, la apariencia y los valores que quieres transmitir.
                  Recibes un flipbook digital con acceso permanente y un PDF listo para imprimir.
                </p>
                <div class="hero-actions">
                  <a class="cta primary" href="#personaliza" aria-label="Crear mi cuento">✨ Crear mi cuento</a>
                  <a class="cta secondary" href="#ejemplo" aria-label="Ver ejemplo">📖 Ver ejemplo</a>
                </div>
                <div class="trust" aria-label="Confianza">
                  <span>❤️ Diseñado con amor</span>
                  <span>🎨 Ilustraciones únicas</span>
                  <span>🔗 Acceso permanente</span>
                </div>
              </div>

              <div class="mock" aria-label="Vista previa">
                <div class="img">
                  <div class="mock-card">
                    <div class="mock-top">
                      <span class="mini-badge">📚 Vista previa</span>
                      <span class="mini-badge" style="background: rgba(168,213,186,.14);">🧒 Hecho a medida</span>
                    </div>
                    <div class="mock-lines" aria-hidden="true">
                      <div class="line w1"></div>
                      <div class="line w2"></div>
                      <div class="line w3"></div>
                      <div class="line w4"></div>
                    </div>
                    <div style="margin-top: 14px; display:flex; gap: 10px;">
                      <span class="mini-badge" style="background: rgba(188,227,245,.20);">Turn.js</span>
                      <span class="mini-badge" style="background: rgba(245,200,216,.20);">PDF</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="section alt" id="como-funciona">
            <div class="container">
              <div class="section-head">
                <span class="pill">⏱️ Proceso simple</span>
                <h2 class="section-title">¿Cómo funciona?</h2>
                <p class="section-sub">En 4 pasos sencillos tendrás un cuento personalizado que tu peque atesorará para siempre.</p>
              </div>

              <div class="grid-4">
                <div class="card">
                  <div class="num">1</div>
                  <div class="icon" style="background: rgba(232,139,123,.12);">🧩</div>
                  <h3>Personalizas</h3>
                  <p>Completa el formulario con nombre, apariencia, tema y valores.</p>
                </div>
                <div class="card">
                  <div class="num">2</div>
                  <div class="icon" style="background: rgba(168,213,186,.14);">💳</div>
                  <h3>Pagas</h3>
                  <p>Pago único y seguro. Sin suscripciones ni sorpresas.</p>
                </div>
                <div class="card">
                  <div class="num">3</div>
                  <div class="icon" style="background: rgba(212,197,232,.16);">✨</div>
                  <h3>Creamos tu cuento</h3>
                  <p>Ilustradores y escritores trabajan en tu historia (3–5 días hábiles).</p>
                </div>
                <div class="card">
                  <div class="num">4</div>
                  <div class="icon" style="background: rgba(255,212,184,.18);">📩</div>
                  <h3>Recibes link + PDF</h3>
                  <p>Flipbook digital permanente y PDF descargable para imprimir.</p>
                </div>
              </div>
            </div>
          </section>

          <section class="section" id="personaliza">
            <div class="container">
              <div class="section-head">
                <span class="pill">🧸 Personalización</span>
                <h2 class="section-title">Personaliza tu cuento</h2>
                <p class="section-sub">Mantuvimos el mismo formulario y comportamiento. Solo mejoramos el diseño para que sea más cómodo y bonito.</p>
              </div>

              <div class="form-wrap">
                <div class="form-top">
                  <h2>✨ Continuar al pago</h2>
                  <p>Completa estos datos y te llevamos a un pago seguro. Luego creamos tu cuento con tu URL personalizada.</p>
                </div>

                <form id="form">
                  <div class="form-grid">
            <div class="form-card">
              <div class="form-card-head">
                <strong>👶 Sobre el niño/a</strong>
                <span class="tag">Paso 1</span>
              </div>
              
    
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
      <div class="form-card">
        <div class="form-card-head">
          <strong>🎨 Apariencia</strong>
          <span class="tag" style="background: rgba(188,227,245,.18); border-color: rgba(188,227,245,.24);">Opcional</span>
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
      <div class="form-card">
        <div class="form-card-head">
          <strong>📖 Detalles del cuento</strong>
          <span class="tag">Paso 2</span>
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
      <div class="form-card">
        <div class="form-card-head">
          <strong>📧 Información de contacto</strong>
          <span class="tag">Paso 3</span>
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
      <div class="form-card">
        <div class="form-card-head">
          <strong>🌐 URL personalizada</strong>
          <span class="tag">Paso 4</span>
        </div>
        
        <div class="field">
          <label>Subdominio deseado <span class="required">*</span></label>
          <input type="text" name="subdomain" required placeholder="amanda-dino" />
          <small>Solo letras, números y guiones. Ej: juanito-aventura</small>
          <div id="subdomain-preview" style="margin-top:10px;font-size:0.9em;color:#667eea;"></div>
        </div>
      </div>
      
      <!-- Submit -->
      <div class="form-card" style="border-style: dashed;">
        <div class="form-card-head">
          <strong>✅ Revisión y pago</strong>
          <span class="tag" style="background: rgba(168,213,186,.16); border-color: rgba(168,213,186,.24);">Seguro</span>
        </div>
        <div class="submit-row">
          <div class="price" aria-label="Precio">
            <span class="big">$19.990</span>
            <span class="small">Pago único · sin suscripción</span>
          </div>
        </div>
        <button type="submit" aria-label="Continuar al pago">✨ Continuar al pago</button>
        <div id="out" role="status" aria-live="polite"></div>
      </div>
      </div>
    </form>
        </div>
      </div>
    </section>

    <section class="section alt" id="ejemplo">
      <div class="container">
        <div class="section-head">
          <span class="pill">📖 Vista previa</span>
          <h2 class="section-title">Ejemplo de cuento</h2>
          <p class="section-sub">Así se verá tu cuento en formato flipbook. (Aquí mostramos un ejemplo ilustrativo.)</p>
        </div>

        <div class="example">
          <div class="panel">
            <div class="ph" aria-hidden="true">🪄</div>
            <div class="txt">
              <strong>Página ilustrada</strong>
              <p>Ilustraciones a todo color en formato horizontal, pensadas para sorprender.</p>
            </div>
          </div>
          <div class="panel">
            <div class="ph" aria-hidden="true">📚</div>
            <div class="txt">
              <strong>Historia personalizada</strong>
              <p>Nombre, tema y valores integrados en una narrativa cálida y divertida.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="precio">
      <div class="container">
        <div class="section-head">
          <span class="pill">💝 Inversión única</span>
          <h2 class="section-title">Un regalo que durará para siempre</h2>
          <p class="section-sub">Precio transparente, sin suscripciones ni costos ocultos.</p>
        </div>

        <div class="price-card">
          <div class="price-badge">✨ Plan único</div>
          <div class="price-main">
            <div class="big"><span class="grad">$19.990</span></div>
            <div class="note">Pago único · acceso permanente</div>
          </div>

          <div class="features" aria-label="Incluye">
            <div class="feat"><span class="check">✓</span> Cuento 100% personalizado</div>
            <div class="feat"><span class="check">✓</span> Ilustraciones únicas</div>
            <div class="feat"><span class="check">✓</span> Flipbook digital interactivo</div>
            <div class="feat"><span class="check">✓</span> PDF listo para imprimir</div>
            <div class="feat"><span class="check">✓</span> URL única y permanente</div>
            <div class="feat"><span class="check">✓</span> Entrega en 3–5 días hábiles</div>
          </div>

          <div style="margin-top: 18px; text-align:center;">
            <a class="cta primary" href="#personaliza" aria-label="Crear mi cuento ahora" style="width:min(360px,100%);">Crear mi cuento ahora</a>
            <div style="margin-top: 10px; color: rgba(28,27,34,.60); font-weight: 800; font-size: 12px;">🔒 Pago seguro</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section alt" id="faq">
      <div class="container">
        <div class="section-head">
          <span class="pill">❓ Preguntas frecuentes</span>
          <h2 class="section-title">FAQ</h2>
          <p class="section-sub">Resolvemos las dudas más comunes.</p>
        </div>

        <div class="faq">
          <details>
            <summary>¿Cuánto tiempo tarda en estar listo mi cuento?</summary>
            <p>Una vez recibido el pago y completado el formulario, trabajamos en tu cuento. La entrega estimada es de 3 a 5 días hábiles.</p>
          </details>
          <details>
            <summary>¿El cuento estará disponible para siempre?</summary>
            <p>Sí. Tu URL personalizada queda activa de forma permanente y además recibes un PDF descargable para guardar e imprimir.</p>
          </details>
          <details>
            <summary>¿Qué edades son recomendadas?</summary>
            <p>Está pensado especialmente para niños y niñas de 3 a 10 años. Adaptamos el tono según la edad.</p>
          </details>
          <details>
            <summary>¿Puedo pedir varios cuentos?</summary>
            <p>Sí. Puedes completar un formulario por cada niño/a y crear tantos cuentos como quieras (ideal para regalos).</p>
          </details>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="foot-grid">
        <div>
          <div class="brand" style="margin-bottom: 8px;">
            <span class="brand-badge" aria-hidden="true">✨</span>
            <span>Cuentos Para Siempre</span>
          </div>
          <div class="foot-muted">Creamos cuentos personalizados únicos que capturan la magia de la infancia.</div>
          <div class="foot-muted" style="margin-top: 10px; font-weight: 900;">📩 hola@cuentosparasiempre.com</div>
        </div>
        <div class="foot-links" aria-label="Enlaces">
          <a href="#inicio">Inicio</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#personaliza">Personaliza</a>
          <a href="#precio">Precio</a>
          <a href="#faq">FAQ</a>
        </div>
        <div class="foot-muted">
          <div style="font-weight: 1000; margin-bottom: 10px;">Hecho con ❤️ para familias</div>
          <div>© ${new Date().getFullYear()} Cuentos Para Siempre</div>
        </div>
      </div>
    </div>
  </footer>

  <script>
    // Mobile menu
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        const open = mobileMenu.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuBtn.textContent = open ? '✕' : '☰';
      });
      // Close menu when clicking a link
      mobileMenu.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
          menuBtn.textContent = '☰';
        });
      });
    }

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
