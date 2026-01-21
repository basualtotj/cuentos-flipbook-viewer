module.exports = {
  PORT: process.env.PORT || 3000,
  MAIN_DOMAIN: process.env.MAIN_DOMAIN || 'cuentosparasiempre.com',
  
  // APIs
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  
  // Replicate models
  FLUX_MODEL: 'black-forest-labs/flux-schnell',
  
  // Claude models
  CLAUDE_MODEL: 'claude-sonnet-4-5-20250929',
  
  // Dimensiones
  IMAGE_WIDTH: 1920,
  IMAGE_HEIGHT: 1360,
  
  // Paths
  FLIPBOOKS_DIR: 'public/flipbooks',
  TEMP_DIR: 'tmp',
  
  // Cuento config
  TOTAL_PAGES: 23,
  ILLUSTRATION_COUNT: 10,
  TEXT_PAGE_COUNT: 13
};