/*
  One-off build script: generates resized WebP + JPEG variants of the
  before/after restoration photos for responsive <picture>/srcset markup.
  Run with: node scripts/generate-gallery-images.js
*/
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.join(__dirname, '..', 'images', 'gallery', 'restorations');
const SIZES = [
  { suffix: '160', width: 160 },  // thumbnail strip
  { suffix: '800', width: 800 },  // default card size
  { suffix: '1200', width: 1200 }, // large / retina
];

async function run() {
  const files = fs.readdirSync(SRC_DIR).filter(f => /\.jpe?g$/i.test(f) && !/-(160|800|1200)\.jpe?g$/.test(f));

  for (const file of files) {
    const base = file.replace(/\.jpe?g$/i, '');
    const srcPath = path.join(SRC_DIR, file);
    const meta = await sharp(srcPath).metadata();

    for (const { suffix, width } of SIZES) {
      if (meta.width && meta.width < width) continue; // don't upscale

      const jpgOut = path.join(SRC_DIR, `${base}-${suffix}.jpg`);
      const webpOut = path.join(SRC_DIR, `${base}-${suffix}.webp`);

      await sharp(srcPath).resize({ width }).jpeg({ quality: 78, mozjpeg: true }).toFile(jpgOut);
      await sharp(srcPath).resize({ width }).webp({ quality: 78 }).toFile(webpOut);

      console.log(`${base}-${suffix}.{jpg,webp}`);
    }

    // Narrow/portrait originals (e.g. 721px wide) are smaller than the
    // largest tier above, so no near-full-resolution variant gets made.
    // Emit one webp at native resolution so <picture> still gets a webp
    // option alongside the untouched original jpg used as the fallback.
    const largestTier = SIZES[SIZES.length - 1].width;
    if (meta.width && meta.width < largestTier) {
      const webpOut = path.join(SRC_DIR, `${base}-orig.webp`);
      await sharp(srcPath).webp({ quality: 82 }).toFile(webpOut);
      console.log(`${base}-orig.webp`);
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); });
