const { REPLICATE_API_TOKEN, FLUX_MODEL } = require('../config/constants');

async function generateImage(prompt) {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN no configurada');
  }

  const response = await fetch(`https://api.replicate.com/v1/models/${FLUX_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        prompt: prompt,
        num_outputs: 1,
        aspect_ratio: '3:2',
        output_format: 'jpg',
        output_quality: 90
      }
    })
  });

  const prediction = await response.json();

  if (!response.ok) {
    throw new Error(`Replicate API error: ${prediction.detail || 'Unknown error'}`);
  }

  let result = prediction;
  let attempts = 0;
  const maxAttempts = 60;

  while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const checkResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
    });

    result = await checkResponse.json();
    attempts++;
  }

  if (result.status === 'failed') {
    throw new Error('Image generation failed');
  }

  if (result.status !== 'succeeded') {
    throw new Error('Timeout waiting for image');
  }

  return result.output[0];
}

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = { generateImage, downloadImage };
