/*
  test-imports.js

  Purpose:
  - Quick sanity check that server.js and its local requires can be resolved and parsed.
  - This is NOT a full runtime test; it just attempts to load modules.

  Usage:
    node test-imports.js
*/

function tryRequire(label, p) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    require(p);
    console.log(`✅ ${label}: OK (${p})`);
    return true;
  } catch (err) {
    console.error(`❌ ${label}: FAIL (${p})`);
    console.error(err && err.stack ? err.stack : String(err));
    process.exitCode = 1;
    return false;
  }
}

// Load core entry.
tryRequire('server', './server.js');

// Load key route modules explicitly (helps pinpoint failures faster).
tryRequire('routes/api', './src/routes/api');
tryRequire('routes/generate', './src/routes/generate');
tryRequire('routes/flipbook', './src/routes/flipbook');

// Views
tryRequire('views/landing', './src/views/landing');
tryRequire('views/flipbook', './src/views/flipbook');

// Config (often fails due to env/db)
tryRequire('config/constants', './src/config/constants');
tryRequire('config/db', './src/config/db');
