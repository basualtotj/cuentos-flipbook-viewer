// src/prompts/story-prompts.js

const STORY_PROMPT_TEMPLATE = `Eres un escritor experto de cuentos infantiles personalizados. Crea un cuento único y especial.

PERSONAJE PRINCIPAL:
- Nombre: {{nombre_nino}}
- Descripción: {{character_description}}

CONFIGURACIÓN:
- Tema principal: {{tema}}
- Tono narrativo: {{tono_narrativo}}
- Valores a transmitir: {{valores}}
{{#ciudad}}- Ubicación: {{ciudad}}{{/ciudad}}
{{#personajes_adicionales}}- Personajes adicionales: {{personajes_adicionales}}{{/personajes_adicionales}}
{{#detalles_opcionales}}- Detalles especiales: {{detalles_opcionales}}{{/detalles_opcionales}}

ESTRUCTURA REQUERIDA:
El cuento debe tener exactamente 10 ESCENAS ilustradas.

REGLAS CRÍTICAS PARA PROMPTS DE IMAGEN:
1. SIEMPRE mencionar la apariencia completa de {{nombre_nino}} en CADA escena
2. Mantener consistencia absoluta: {{character_description}}
3. Prompts en INGLÉS, estilo "children's book illustration"
4. Ser específico con colores, ropa, expresiones
5. Incluir contexto del entorno

FORMATO DE RESPUESTA (JSON):
{
  "titulo": "Título creativo del cuento",
  "dedicatoria": "Para {{nombre_nino}}, {{genero_text}} especial de {{edad}} años...",
  "escenas": [
    {
      "numero": 1,
      "prompt_imagen": "##CHARACTER CONSISTENCY REQUIRED##\\n\\nMAIN CHARACTER (MUST remain identical):\\nA {{edad}}-year-old {{genero_en}} named {{nombre_nino}}, {{character_description}}, wearing [outfit], [signature item].\\n\\nSCENE:\\n[descripción detallada de la escena en inglés]\\n\\nStyle: children's book illustration, watercolor, soft pastel colors, warm lighting\\nMood: happy and safe\\nNO text in image.",
      "texto_narrativo": "Texto de 2-3 oraciones narrativas y emocionantes en español"
    }
  ],
  "mensaje_final": "Texto inspirador de cierre en español"
}

IMPORTANTE:
- Los prompt_imagen deben estar en INGLÉS
- Los texto_narrativo deben estar en ESPAÑOL
- Mantener {{nombre_nino}} reconocible en todas las escenas
- Transmitir los valores: {{valores}}

Responde SOLO con JSON válido, sin markdown.`;

// Variaciones por edad (opcional)
const PROMPT_VARIANTS = {
  '3-4': {
    complexity: 'oraciones muy simples y cortas',
    vocabulary: 'palabras básicas y repetitivas',
    length: '1-2 oraciones por escena'
  },
  '5-6': {
    complexity: 'oraciones simples',
    vocabulary: 'palabras cotidianas',
    length: '2-3 oraciones por escena'
  },
  '7-8': {
    complexity: 'oraciones más elaboradas',
    vocabulary: 'vocabulario rico',
    length: '3-4 oraciones por escena'
  },
  '9-10': {
    complexity: 'oraciones complejas',
    vocabulary: 'vocabulario avanzado',
    length: '4-5 oraciones por escena'
  }
};

// Instrucciones específicas por tema (opcional)
const THEME_INSTRUCTIONS = {
  'dinosaurios': 'Incluir datos curiosos reales sobre dinosaurios. Mantener precisión científica básica.',
  'espacio': 'Incluir conceptos astronómicos simples. Inspirar curiosidad científica.',
  'princesas': 'Evitar estereotipos de género. Princesa puede ser valiente, inteligente, aventurera.',
  'superhéroes': 'Enfatizar que el verdadero poder viene de valores internos, no solo habilidades físicas.',
  'animales': 'Incluir datos reales sobre comportamiento animal. Fomentar respeto por la naturaleza.',
  'sirenas': 'Incluir temas de conservación marina. Combinar fantasía con conciencia ecológica.'
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

  // Determinar variante por edad
  const edadNum = parseInt(edad);
  let ageGroup = '5-6';
  if (edadNum <= 4) ageGroup = '3-4';
  else if (edadNum <= 6) ageGroup = '5-6';
  else if (edadNum <= 8) ageGroup = '7-8';
  else ageGroup = '9-10';

  const variant = PROMPT_VARIANTS[ageGroup];
  const themeInstructions = THEME_INSTRUCTIONS[tema] || '';

  // Construir descripción del personaje
  const characterDesc = buildCharacterDescription(cuentoData);
  
  // Preparar valores
  const valores = Array.isArray(valor) ? valor.join(', ') : valor;
  
  // Texto de género
  const generoText = genero === 'niña' ? 'una niña' : genero === 'niño' ? 'un niño' : 'un/a niño/a';
  const generoEn = genero === 'niña' ? 'girl' : 'boy';

  // Reemplazar variables en el template
  let prompt = STORY_PROMPT_TEMPLATE;
  
  const replacements = {
    '{{nombre_nino}}': nombre_nino,
    '{{character_description}}': characterDesc,
    '{{tema}}': tema,
    '{{tono_narrativo}}': tono_narrativo || 'aventurero y emocionante',
    '{{valores}}': valores,
    '{{edad}}': edad,
    '{{genero_text}}': generoText,
    '{{genero_en}}': generoEn
  };

  // Reemplazos básicos
  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replace(new RegExp(key, 'g'), value);
  }

  // Reemplazos condicionales (Handlebars-style)
  prompt = prompt.replace(/\{\{#ciudad\}\}(.*?)\{\{\/ciudad\}\}/g, ciudad ? `$1`.replace('{{ciudad}}', ciudad) : '');
  prompt = prompt.replace(/\{\{#personajes_adicionales\}\}(.*?)\{\{\/personajes_adicionales\}\}/g, 
    personajes_adicionales ? `$1`.replace('{{personajes_adicionales}}', personajes_adicionales) : '');
  prompt = prompt.replace(/\{\{#detalles_opcionales\}\}(.*?)\{\{\/detalles_opcionales\}\}/g, 
    detalles_opcionales ? `$1`.replace('{{detalles_opcionales}}', detalles_opcionales) : '');

  // Agregar instrucciones específicas de edad y tema
  prompt += `\n\nAJUSTES POR EDAD (${edad} años):
- Complejidad: ${variant.complexity}
- Vocabulario: ${variant.vocabulary}
- Longitud: ${variant.length}`;

  if (themeInstructions) {
    prompt += `\n\nINSTRUCCIONES DEL TEMA "${tema}":
${themeInstructions}`;
  }

  return prompt;
}

function buildCharacterDescription(personaje) {
  const parts = [];
  
  if (personaje.genero) {
    parts.push(personaje.genero === 'niña' ? 'girl' : 'boy');
  }
  
  if (personaje.edad) {
    parts.push(`${personaje.edad} years old`);
  }
  
  if (personaje.tono_piel) {
    const skinTones = {
      'muy_claro': 'very fair skin',
      'claro': 'light skin',
      'medio': 'light olive skin',
      'oscuro': 'brown skin'
    };
    parts.push(skinTones[personaje.tono_piel] || personaje.tono_piel);
  }
  
  if (personaje.color_cabello && personaje.tipo_cabello) {
    parts.push(`${personaje.color_cabello} ${personaje.tipo_cabello} hair`);
  } else if (personaje.color_cabello) {
    parts.push(`${personaje.color_cabello} hair`);
  }
  
  if (personaje.color_ojos) {
    parts.push(`${personaje.color_ojos} eyes`);
  }
  
  return parts.join(', ');
}

module.exports = {
  buildStoryPrompt,
  STORY_PROMPT_TEMPLATE,
  PROMPT_VARIANTS,
  THEME_INSTRUCTIONS
};
