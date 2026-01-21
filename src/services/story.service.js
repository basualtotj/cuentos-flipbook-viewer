const { ANTHROPIC_API_KEY, CLAUDE_MODEL } = require('../config/constants');
const { buildStoryPrompt } = require('../prompts/story-prompts');

async function generateStory(cuentoData) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no configurada');
  }

  // Generar prompt desde template
  const prompt = buildStoryPrompt(cuentoData);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      temperature: 0.9,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const contentText = data.content[0].text;
  
  const jsonText = contentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const story = JSON.parse(jsonText);
  
  return story;
}

module.exports = { generateStory };
