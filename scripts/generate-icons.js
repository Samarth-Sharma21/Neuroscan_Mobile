const sharp = require('sharp');
const path = require('path');

// NeuroScan brain icon SVG — teal gradient with neural network motif
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="50%" stop-color="#0D9488"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
    <linearGradient id="brain" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.9)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${size * 0.01}" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  
  <!-- Decorative orbs -->
  <circle cx="${size * 0.82}" cy="${size * 0.15}" r="${size * 0.18}" fill="rgba(255,255,255,0.06)"/>
  <circle cx="${size * 0.15}" cy="${size * 0.85}" r="${size * 0.14}" fill="rgba(255,255,255,0.04)"/>
  
  <!-- Neural network dots -->
  <circle cx="${size * 0.2}" cy="${size * 0.3}" r="${size * 0.015}" fill="rgba(255,255,255,0.2)"/>
  <circle cx="${size * 0.82}" cy="${size * 0.7}" r="${size * 0.012}" fill="rgba(255,255,255,0.15)"/>
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.01}" fill="rgba(255,255,255,0.18)"/>
  <circle cx="${size * 0.25}" cy="${size * 0.75}" r="${size * 0.013}" fill="rgba(255,255,255,0.12)"/>
  
  <!-- Brain icon (centered, scaled) -->
  <g transform="translate(${size * 0.22}, ${size * 0.22}) scale(${(size * 0.56) / 24})" filter="url(#glow)">
    <!-- Brain outline -->
    <path d="M12 2C10 2 8.5 3.2 7.8 4.5C6.5 4 5 4.5 4.2 5.8C3.2 7.2 3.5 9 4.5 10.2C3.5 11.2 3 12.8 3.5 14.3C4 15.8 5.2 16.8 6.5 17C6.8 18.5 8 19.8 9.5 20.2C11 20.6 12 20 12 20" 
          fill="none" stroke="url(#brain)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M12 2C14 2 15.5 3.2 16.2 4.5C17.5 4 19 4.5 19.8 5.8C20.8 7.2 20.5 9 19.5 10.2C20.5 11.2 21 12.8 20.5 14.3C20 15.8 18.8 16.8 17.5 17C17.2 18.5 16 19.8 14.5 20.2C13 20.6 12 20 12 20"
          fill="none" stroke="url(#brain)" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Center line -->
    <line x1="12" y1="2" x2="12" y2="20" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" stroke-dasharray="2,2"/>
    <!-- Neural pulses -->
    <circle cx="8" cy="9" r="1.2" fill="rgba(255,255,255,0.9)"/>
    <circle cx="16" cy="9" r="1.2" fill="rgba(255,255,255,0.9)"/>
    <circle cx="9" cy="14" r="0.9" fill="rgba(255,255,255,0.7)"/>
    <circle cx="15" cy="14" r="0.9" fill="rgba(255,255,255,0.7)"/>
    <circle cx="12" cy="11" r="1" fill="rgba(255,255,255,0.8)"/>
    <!-- Connections -->
    <line x1="8" y1="9" x2="12" y2="11" stroke="rgba(255,255,255,0.35)" stroke-width="0.6"/>
    <line x1="16" y1="9" x2="12" y2="11" stroke="rgba(255,255,255,0.35)" stroke-width="0.6"/>
    <line x1="9" y1="14" x2="12" y2="11" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
    <line x1="15" y1="14" x2="12" y2="11" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
  </g>
</svg>`;

// Adaptive icon foreground (transparent bg, just the brain)
const createAdaptiveFgSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brain" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.9)"/>
    </linearGradient>
  </defs>
  
  <!-- Brain icon centered in safe zone (inner 66%) -->
  <g transform="translate(${size * 0.28}, ${size * 0.28}) scale(${(size * 0.44) / 24})">
    <path d="M12 2C10 2 8.5 3.2 7.8 4.5C6.5 4 5 4.5 4.2 5.8C3.2 7.2 3.5 9 4.5 10.2C3.5 11.2 3 12.8 3.5 14.3C4 15.8 5.2 16.8 6.5 17C6.8 18.5 8 19.8 9.5 20.2C11 20.6 12 20 12 20" 
          fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M12 2C14 2 15.5 3.2 16.2 4.5C17.5 4 19 4.5 19.8 5.8C20.8 7.2 20.5 9 19.5 10.2C20.5 11.2 21 12.8 20.5 14.3C20 15.8 18.8 16.8 17.5 17C17.2 18.5 16 19.8 14.5 20.2C13 20.6 12 20 12 20"
          fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="12" y1="2" x2="12" y2="20" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-dasharray="2,2"/>
    <circle cx="8" cy="9" r="1.5" fill="rgba(255,255,255,0.95)"/>
    <circle cx="16" cy="9" r="1.5" fill="rgba(255,255,255,0.95)"/>
    <circle cx="9" cy="14" r="1.1" fill="rgba(255,255,255,0.8)"/>
    <circle cx="15" cy="14" r="1.1" fill="rgba(255,255,255,0.8)"/>
    <circle cx="12" cy="11" r="1.2" fill="rgba(255,255,255,0.9)"/>
    <line x1="8" y1="9" x2="12" y2="11" stroke="rgba(255,255,255,0.4)" stroke-width="0.7"/>
    <line x1="16" y1="9" x2="12" y2="11" stroke="rgba(255,255,255,0.4)" stroke-width="0.7"/>
    <line x1="9" y1="14" x2="12" y2="11" stroke="rgba(255,255,255,0.35)" stroke-width="0.7"/>
    <line x1="15" y1="14" x2="12" y2="11" stroke="rgba(255,255,255,0.35)" stroke-width="0.7"/>
  </g>
</svg>`;

async function generate() {
  const dir = path.join(__dirname, '..', 'assets', 'images');

  // 1. icon.png — 1024x1024
  await sharp(Buffer.from(createIconSVG(1024)))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(dir, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // 2. adaptive-icon.png — foreground for Android adaptive (1024x1024)
  await sharp(Buffer.from(createAdaptiveFgSVG(1024)))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(dir, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png (1024x1024)');

  // 3. favicon.png — 48x48
  await sharp(Buffer.from(createIconSVG(512)))
    .resize(48, 48)
    .png()
    .toFile(path.join(dir, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  // 4. splash-image.png — 1284x2778 (iPhone 14 Pro Max size)
  const splashSize = 1284;
  const splashH = 2778;
  const splashSVG = `
<svg width="${splashSize}" height="${splashH}" viewBox="0 0 ${splashSize} ${splashH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="50%" stop-color="#0D9488"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
  </defs>
  <rect width="${splashSize}" height="${splashH}" fill="url(#sbg)"/>
  <circle cx="${splashSize * 0.85}" cy="${splashH * 0.12}" r="300" fill="rgba(255,255,255,0.05)"/>
  <circle cx="${splashSize * 0.15}" cy="${splashH * 0.88}" r="200" fill="rgba(255,255,255,0.04)"/>
</svg>`;

  await sharp(Buffer.from(splashSVG))
    .resize(splashSize, splashH)
    .png()
    .toFile(path.join(dir, 'splash-image.png'));
  console.log('✓ splash-image.png (1284x2778)');

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
