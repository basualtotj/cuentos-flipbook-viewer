// test-imports.js
console.log('Testing imports...\n');

try {
  console.log('✓ Loading constants...');
  const constants = require('./src/config/constants');
  
  console.log('✓ Loading db...');
  const db = require('./src/config/db');
  
  console.log('✓ Loading story.service...');
  const storyService = require('./src/services/story.service');
  
  console.log('✓ Loading image.service...');
  const imageService = require('./src/services/image.service');
  
  console.log('✓ Loading render.service...');
  const renderService = require('./src/services/render.service');
  
  console.log('✓ Loading api routes...');
  const api = require('./src/routes/api');
  
  console.log('✓ Loading generate routes...');
  const generate = require('./src/routes/generate');
  
  console.log('✓ Loading story prompts...');
  const prompts = require('./src/prompts/story-prompts');
  
  console.log('\n✅ All imports successful!');
  process.exit(0);
  
} catch (err) {
  console.error('\n❌ Import error:', err.message);
  console.error('\nStack trace:');
  console.error(err.stack);
  process.exit(1);
}
