/* global __dirname, Buffer */
const sharp = require('sharp');
const path = require('path');

// Uses the actual NeuroScan brand logos:
// - neuroscan-logo2.png (1259x1259, teal bg) → app icon, favicon, splash
// - neuroscan-logo4.png (314x314, transparent bg) → adaptive icon foreground

async function generate() {
  const dir = path.join(__dirname, '..', 'assets', 'images');
  const logo2 = path.join(dir, 'neuroscan-logo2.png'); // teal bg, 1259x1259
  const logo4 = path.join(dir, 'neuroscan-logo4.png'); // transparent bg, 314x314

  // 1. icon.png — 1024x1024 (uses logo2 with teal bg)
  await sharp(logo2)
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toFile(path.join(dir, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // 2. adaptive-icon.png — foreground for Android adaptive (1024x1024)
  //    Uses logo4 (transparent bg) centered in safe zone (inner 66%)
  const fgSize = 1024;
  const innerSize = Math.round(fgSize * 0.66);
  const resizedFg = await sharp(logo4)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  await sharp({
    create: {
      width: fgSize,
      height: fgSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedFg, gravity: 'centre' }])
    .png()
    .toFile(path.join(dir, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png (1024x1024)');

  // 3. favicon.png — 48x48 (uses logo2 with teal bg, scaled down)
  await sharp(logo2)
    .resize(48, 48, { fit: 'cover' })
    .png()
    .toFile(path.join(dir, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  // 4. splash-image.png — logo centered on teal gradient (1284x2778)
  const splashW = 1284;
  const splashH = 2778;
  const logoSize = 280; // logo size on splash

  // Create teal gradient background as SVG
  const splashBgSVG = `
<svg width="${splashW}" height="${splashH}" viewBox="0 0 ${splashW} ${splashH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="50%" stop-color="#0D9488"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
  </defs>
  <rect width="${splashW}" height="${splashH}" fill="url(#sbg)"/>
  <circle cx="${splashW * 0.85}" cy="${splashH * 0.12}" r="300" fill="rgba(255,255,255,0.05)"/>
  <circle cx="${splashW * 0.15}" cy="${splashH * 0.88}" r="200" fill="rgba(255,255,255,0.04)"/>
</svg>`;

  const resizedLogo = await sharp(logo4)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp(Buffer.from(splashBgSVG))
    .resize(splashW, splashH)
    .composite([{ input: resizedLogo, gravity: 'centre' }])
    .png()
    .toFile(path.join(dir, 'splash-image.png'));
  console.log('✓ splash-image.png (1284x2778)');

  // 5. app-image.png — marketing/share image (1200x630)
  const appW = 1200;
  const appH = 630;
  const appBgSVG = `
<svg width="${appW}" height="${appH}" viewBox="0 0 ${appW} ${appH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="abg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="50%" stop-color="#0D9488"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
  </defs>
  <rect width="${appW}" height="${appH}" fill="url(#abg)"/>
  <circle cx="${appW * 0.85}" cy="${appH * 0.15}" r="180" fill="rgba(255,255,255,0.05)"/>
  <circle cx="${appW * 0.1}" cy="${appH * 0.9}" r="120" fill="rgba(255,255,255,0.04)"/>
</svg>`;

  const appLogo = await sharp(logo4)
    .resize(200, 200, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp(Buffer.from(appBgSVG))
    .resize(appW, appH)
    .composite([{ input: appLogo, gravity: 'centre' }])
    .png()
    .toFile(path.join(dir, 'app-image.png'));
  console.log('✓ app-image.png (1200x630)');

  console.log('\nAll icons generated from brand logos!');
}

generate().catch(console.error);
