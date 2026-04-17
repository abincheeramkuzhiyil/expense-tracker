/**
 * Generates PWA icons for the Expense Tracker app.
 * Run: node scripts/generate-icons.mjs
 *
 * Produces:
 *   public/icon-192x192.png          — standard icon
 *   public/icon-512x512.png          — standard icon
 *   public/icon-maskable-192x192.png — maskable (full-bleed, safe-zone graphic)
 *   public/icon-maskable-512x512.png — maskable
 *   public/favicon-32x32.png         — browser favicon
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const BRAND_BLUE = '#1976d2';
const WHITE = '#ffffff';

// ─── SVG builder ─────────────────────────────────────────────────────────────

/**
 * Builds the SVG source.
 * @param {number} size      Canvas size in px
 * @param {boolean} maskable Full-bleed background (no padding), safe-zone graphic
 */
function buildSvg(size, maskable) {
  // For maskable icons the safe zone is the central 80% (40% inset on each side
  // relative to the canvas), so we scale the graphic down to fit within 72% to
  // give a comfortable margin.
  const scale = maskable ? 0.72 : 0.62;
  const graphicSize = size * scale;
  const offset = (size - graphicSize) / 2;

  // Background: full bleed blue square for maskable, rounded for standard
  const bgRadius = maskable ? 0 : size * 0.22;

  // Wallet body proportions (relative to graphicSize)
  const wW = graphicSize * 0.82;   // wallet width
  const wH = graphicSize * 0.62;   // wallet height
  const wX = offset + (graphicSize - wW) / 2;
  const wY = offset + (graphicSize - wH) / 2 + graphicSize * 0.04;
  const wR = graphicSize * 0.09;   // corner radius

  // Card slot (horizontal line near top of wallet body)
  const slotY = wY + wH * 0.30;

  // Coin pocket (right side rectangle)
  const pW = wW * 0.24;
  const pH = wH * 0.45;
  const pX = wX + wW - pW - graphicSize * 0.02;
  const pY = slotY + (wH - pH) / 2 - wH * 0.04;
  const pR = graphicSize * 0.05;

  // Dollar sign: centred in the left ~60% of the wallet below the slot
  const dsX = wX + (wW - pW) * 0.44;
  const dsY = wY + wH * 0.68;
  const dsFontSize = graphicSize * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${bgRadius}" fill="${BRAND_BLUE}"/>

  <!-- Wallet body -->
  <rect x="${wX}" y="${wY}" width="${wW}" height="${wH}" rx="${wR}" fill="${WHITE}" opacity="0.95"/>

  <!-- Card slot divider -->
  <line x1="${wX + wR}" y1="${slotY}" x2="${wX + wW - wR}" y2="${slotY}" stroke="${BRAND_BLUE}" stroke-width="${graphicSize * 0.025}" stroke-linecap="round"/>

  <!-- Coin pocket -->
  <rect x="${pX}" y="${pY}" width="${pW}" height="${pH}" rx="${pR}" fill="${BRAND_BLUE}" opacity="0.20"/>

  <!-- Dollar sign -->
  <text
    x="${dsX}" y="${dsY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${dsFontSize}"
    font-weight="700"
    fill="${BRAND_BLUE}"
    text-anchor="middle"
    dominant-baseline="middle"
  >$</text>
</svg>`;
}

// ─── Generation tasks ─────────────────────────────────────────────────────────

const tasks = [
  { file: 'icon-192x192.png',          size: 192, maskable: false },
  { file: 'icon-512x512.png',          size: 512, maskable: false },
  { file: 'icon-maskable-192x192.png', size: 192, maskable: true  },
  { file: 'icon-maskable-512x512.png', size: 512, maskable: true  },
  { file: 'favicon-32x32.png',         size: 32,  maskable: false },
];

for (const { file, size, maskable } of tasks) {
  const svg = buildSvg(size, maskable);
  const outPath = resolve(publicDir, file);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✅ Generated ${file}`);
}

// Also write a minimal favicon.ico (32x32 PNG renamed — most modern browsers accept PNG favicons)
console.log('\nAll icons generated in public/');
