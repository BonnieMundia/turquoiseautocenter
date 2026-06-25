const fs = require('fs');
const path = require('path');

const requiredVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];

const missing = requiredVars.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`ERROR: missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || null,
  postsPerPage: 10,
  debug: false,
};

const output = `// AUTO-GENERATED CONFIG - Do not commit this file\nconst FIREBASE_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
const outputPath = path.join(__dirname, '..', 'js', 'config.js');

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Generated ${outputPath}`);
