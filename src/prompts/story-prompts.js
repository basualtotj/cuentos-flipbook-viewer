// src/prompts/story-prompts.js
// ✅ INTEGRA EL NUEVO PROMPT Y SUS REGLAS PARA PROBARLO
// - Mantiene tu API actual: buildStoryPrompt(cuentoData)
// - NO cambia nombres de campos del payload
// - Agrega: consistencia fuerte del personaje + reglas anti-deformaciones + reglas por tema
// - Output esperado por tu backend: JSON con {titulo, dedicatoria, escenas[{numero,prompt_imagen,texto_narrativo}], mensaje_final}

const STORY_PROMPT_TEMPLATE = `You are an expert children's story writer and illustrator prompt designer.

Your task is to generate a fully personalized children's story with EXACTLY 10 illustrated scenes.

========================
MAIN CHARACTER (CRITICAL)
========================
Name: {{nombre_nino}}
Age: {{edad}} years old
Gender: {{genero_en}}

Physical description (MUST remain identical in ALL scenes):
{{character_description}}

Clothing & accessories (MUST remain identical in ALL scenes):
{{accesorios_descripcion}}

========================
STORY CONFIGURATION
========================
Main theme: {{tema}}
Narrative tone: {{tono_narrativo}}
Values to transmit: {{valores}}
{{#ciudad}}Location: {{ciudad}}{{/ciudad}}
{{#personajes_adicionales}}Additional characters: {{personajes_adicionales}}{{/personajes_adicionales}}
{{#detalles_opcionales}}Special details: {{detalles_opcionales}}{{/detalles_opcionales}}

========================
STORY STRUCTURE (MANDATORY)
========================
The story must contain EXACTLY 10 scenes.

Narrative progression MUST follow this arc:
1. Introduction
2. Discovery
3. Magical event
4. First adventure
5. Exploration
6. Creative action
7. Gentle challenge
8. Resolution
9. Farewell
10. Return with lesson

========================
TEXT RULES (SPANISH)
========================
- Text must be written in SPANISH
- Avoid repeating the child's name excessively
- After the first mention, use pronouns naturally
- Each scene must add something NEW (no filler)
- Show values through actions (not just stating them)
- No scary content, no violence, no sadness/loss

FOR AGE {{edad}}:
- Short sentences
- Simple vocabulary
- Add ~10% more richness without being verbose
- 2–3 sentences per scene maximum

========================
IMAGE PROMPT RULES (CRITICAL — NO EXCEPTIONS)
========================
ALL image prompts MUST be written in ENGLISH.

---------- UNIVERSAL SAFETY & ANATOMY RULES ----------
- One human child only
- Exactly 2 arms and 2 legs
- Exactly 5 fingers per hand
- Exactly 2 feet visible
- No missing limbs, no extra limbs
- No floating body parts, head must be attached to body
- No distorted faces, no deformed anatomy
- No duplicated body parts
- No horror elements, no skeletons, no skulls
- No scary imagery
- NO text, letters, numbers, names, or symbols in the image
- No watermarks, no logos

---------- CHARACTER CONSISTENCY (MANDATORY) ----------
- Same hairstyle in ALL scenes
- Same hair color in ALL scenes
- Same outfit in ALL scenes
- Same accessories in ALL scenes
- Same facial features and proportions
- Same age appearance

---------- THEME RULES ----------
{{theme_rules}}

========================
IMAGE STYLE (CONSISTENT)
========================
Style: modern children's book illustration
Medium: watercolor + digital soft shading
Color palette: soft pastel colors
Lighting: warm, gentle, magical
Mood: joyful, safe, imaginative
Perspective: child-friendly, eye-level

========================
OUTPUT FORMAT (JSON ONLY)
========================
Return ONLY valid JSON. No markdown. No explanations.

{
  "titulo": "Creative story title",
  "dedicatoria": "Warm personalized dedication in Spanish",
  "escenas": [
    {
      "numero": 1,
      "prompt_imagen": "FULL IMAGE PROMPT IN ENGLISH FOLLOWING ALL RULES ABOVE",
      "texto_narrativo": "Texto narrativo en español"
    }
    // EXACTLY 10 scenes
  ],
  "mensaje_final": "Inspirational closing message in Spanish"
}
`;

// Variaciones por edad (opcional) — se mantienen, pero ahora se inyectan como “guidance”
const PROMPT_VARIANTS = {
  '3-4': {
    complexity: 'oraciones muy simples y cortas',
    vocabulary: 'palabras básicas y repetitivas',
    length: '2–3 oraciones máximo por escena, sin repetir el nombre'
  },
  '5-6': {
    complexity: 'oraciones simples',
    vocabulary: 'palabras cotidianas',
    length: '2–3 oraciones por escena'
  },
  '7-8': {
    complexity: 'oraciones más elaboradas',
    vocabulary: 'vocabulario rico',
    length: '3–4 oraciones por escena'
  },
  '9-10': {
    complexity: 'oraciones complejas',
    vocabulary: 'vocabulario avanzado',
    length: '4–5 oraciones por escena'
  }
};

// Reglas por tema (para imágenes; fuerte control de “cosas raras”)
const THEME_RULES = {
  dinosaurios: `DINOSAURS:
- Dinosaurs must be anatomically coherent
- No extra heads, no extra tails
- Mouth closed unless smiling
- Teeth must be inside the mouth (no teeth outside lips)
- Dinosaurs must stand on the ground
- Only pterosaurs may fly
- Consistent color palette per dinosaur (no random mismatched parts)
- Friendly and gentle appearance`,
  espacio: `SPACE:
- No scary aliens, no horror
- Friendly space setting, soft stars, planets
- Astronaut gear consistent, no broken helmets
- No impossible human anatomy`,
  princesas: `PRINCESSES:
- Avoid stereotypes; brave, curious, kind
- No scary castles, no dark horror vibes
- Consistent outfit details`,
  superheroes: `SUPERHEROES:
- No violence, no weapons, no threatening scenes
- Positive heroic actions only
- No injuries, no scary villains`,
  animales: `ANIMALS:
- Respectful and friendly animals
- No predation, no blood, no scary scenes
- Natural proportions`,
  sirenas: `MERMAIDS:
- Friendly ocean world, no horror sea creatures
- No scary deep-sea vibes
- Consistent character anatomy`
};

function buildStoryPrompt(cuentoData) {
  const {
    nombre_nino,
    edad,
    genero,
    tema,
    tono_narrativo,
    valor,
    ciudad,
    personajes_adicionales,
    detalles_opcionales
  } = cuentoData;

  const edadNum = parseInt(edad, 10);
  let ageGroup = '5-6';
  if (edadNum <= 4) ageGroup = '3-4';
  else if (edadNum <= 6) ageGroup = '5-6';
  else if (edadNum <= 8) ageGroup = '7-8';
  else ageGroup = '9-10';

  const variant = PROMPT_VARIANTS[ageGroup];

  // ✅ Consistencia de personaje (más completa y útil para imágenes)
  const characterDesc = buildCharacterDescription(cuentoData);

  // ✅ Accesorios/outfit fijo (mochila, lentes, etc.)
  const accesoriosDesc = buildAccesoriosDescription(cuentoData);

  // Valores (checkbox array)
  const valores = Array.isArray(valor) ? valor.join(', ') : (valor || '');

  // Género
  const generoText = genero === 'niña' ? 'una niña' : genero === 'niño' ? 'un niño' : 'un/a niño/a';
  const generoEn = genero === 'niña' ? 'girl' : 'boy';

  // Reglas de tema
  const themeRules = THEME_RULES[String(tema || '').toLowerCase()] || `GENERAL THEME RULES:
- Keep everything friendly, safe, child-appropriate
- No scary content
- No text in image`;

  // Template + reemplazos
  let prompt = STORY_PROMPT_TEMPLATE;

  const replacements = {
    '{{nombre_nino}}': nombre_nino || '',
    '{{character_description}}': characterDesc || '',
    '{{accesorios_descripcion}}': accesoriosDesc || 'a simple colorful outfit suitable for a child, consistent in all scenes',
    '{{tema}}': tema || '',
    '{{tono_narrativo}}': tono_narrativo || 'aventurero y emocionante',
    '{{valores}}': valores,
    '{{edad}}': edad || '',
    '{{genero_text}}': generoText,
    '{{genero_en}}': generoEn,
    '{{theme_rules}}': themeRules
  };

  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replace(new RegExp(escapeRegExp(key), 'g'), String(value));
  }

  // Condicionales estilo Handlebars
  prompt = prompt.replace(/\{\{#ciudad\}\}(.*?)\{\{\/ciudad\}\}/g, ciudad ? `$1`.replace('{{ciudad}}', ciudad) : '');
  prompt = prompt.replace(
    /\{\{#personajes_adicionales\}\}(.*?)\{\{\/personajes_adicionales\}\}/g,
    personajes_adicionales ? `$1`.replace('{{personajes_adicionales}}', personajes_adicionales) : ''
  );
  prompt = prompt.replace(
    /\{\{#detalles_opcionales\}\}(.*?)\{\{\/detalles_opcionales\}\}/g,
    detalles_opcionales ? `$1`.replace('{{detalles_opcionales}}', detalles_opcionales) : ''
  );

  // Guidance extra por edad
  prompt += `\n\nAGE TUNING (${edad} years old):\n- Complejidad: ${variant.complexity}\n- Vocabulario: ${variant.vocabulary}\n- Longitud: ${variant.length}\n`;

  return prompt;
}

function buildCharacterDescription(personaje) {
  const parts = [];

  // género/edad
  if (personaje.genero) parts.push(personaje.genero === 'niña' ? 'a young girl' : 'a young boy');
  if (personaje.edad) parts.push(`${personaje.edad} years old`);

  // piel
  if (personaje.tono_piel) {
    const skinTones = {
      muy_claro: 'very fair skin',
      claro: 'light skin',
      medio: 'light olive skin',
      oscuro: 'brown skin'
    };
    parts.push(skinTones[personaje.tono_piel] || personaje.tono_piel);
  }

  // pelo
  if (personaje.color_cabello && personaje.tipo_cabello) {
    parts.push(`${personaje.color_cabello} ${personaje.tipo_cabello} hair`);
  } else if (personaje.color_cabello) {
    parts.push(`${personaje.color_cabello} hair`);
  } else if (personaje.tipo_cabello) {
    parts.push(`${personaje.tipo_cabello} hair`);
  }

  // ojos
  if (personaje.color_ojos) parts.push(`${personaje.color_ojos} eyes`);

  // detalle opcional útil para consistencia (si viene)
  if (personaje.detalles_opcionales) {
    // solo agrega si aporta rasgos (ej mochila, lápices, etc). Evita meter todo.
    const hint = String(personaje.detalles_opcionales).toLowerCase();
    if (hint.includes('mochila')) parts.push('often carries a backpack');
    if (hint.includes('dibuj')) parts.push('loves drawing with colorful crayons');
  }

  return parts.filter(Boolean).join(', ');
}

function buildAccesoriosDescription(cuentoData) {
  const acc = Array.isArray(cuentoData.accesorios) ? cuentoData.accesorios : [];
  const list = new Set(acc.map(a => String(a || '').toLowerCase().trim()).filter(Boolean));

  // Outfit fijo (simple y consistente)
  const baseOutfit = 'wearing a cute pastel overall dress and a simple t-shirt (same outfit in all scenes)';

  const extras = [];
  if (list.has('mochila')) extras.push('a small pink backpack (always visible)');
  if (list.has('lentes')) extras.push('round glasses');
  if (list.has('gorra')) extras.push('a soft cap');
  if (list.has('audifonos')) extras.push('small child-friendly hearing aids');

  // “signature item” ayuda a Flux: un elemento repetible por escena
  if (extras.length) return `${baseOutfit}, plus ${extras.join(', ')}`;
  return baseOutfit;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  buildStoryPrompt,
  STORY_PROMPT_TEMPLATE,
  PROMPT_VARIANTS,
  THEME_RULES
};