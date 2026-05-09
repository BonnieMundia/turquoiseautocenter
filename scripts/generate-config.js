const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY must be set in environment variables.');
  process.exit(1);
}

const config = {
  supabaseUrl,
  supabaseKey,
  postsPerPage: 10,
  debug: false
};

const output = `// AUTO-GENERATED CONFIG - Do not commit this file\nconst BLOG_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
const outputPath = path.join(__dirname, '..', 'js', 'config.js');

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Generated ${outputPath}`);
