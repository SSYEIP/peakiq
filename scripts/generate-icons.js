#!/usr/bin/env node
// Generates PWA icon PNGs from public/icon.svg
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const publicDir = path.join(__dirname, '..', 'public');
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [192, 512];

async function generate() {
  for (const size of sizes) {
    const outPath = path.join(publicDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`✓ Generated ${outPath}`);
  }
  // Also generate a small apple-touch-icon (180x180)
  const appleOut = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile(appleOut);
  console.log(`✓ Generated ${appleOut}`);

  // And a 32x32 favicon PNG
  const faviconOut = path.join(publicDir, 'favicon-32.png');
  await sharp(svgBuffer).resize(32, 32).png().toFile(faviconOut);
  console.log(`✓ Generated ${faviconOut}`);
}

generate().catch((err) => { console.error(err); process.exit(1); });
