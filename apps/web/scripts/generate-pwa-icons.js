import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, '..', 'static');
const outDir = join(staticDir, 'brand-marks', 'pwa');

const svg = readFileSync(join(staticDir, 'brand-marks', 'mark.svg'));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskablePadding = 0.1;

mkdirSync(outDir, { recursive: true });

async function generate() {
  for (const size of sizes) {
    await sharp(svg, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(join(outDir, `icon-${size}x${size}.png`));

    const padding = Math.round(size * maskablePadding);
    await sharp(svg, { density: 300 })
      .resize(size - padding * 2, size - padding * 2)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(join(outDir, `maskable-icon-${size}x${size}.png`));
  }

  await sharp(svg, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(join(staticDir, 'brand-marks', 'apple-touch-icon.png'));

  console.log('PWA icons generated:', outDir);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
