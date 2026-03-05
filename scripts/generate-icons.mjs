import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE = join(ROOT, 'public', 'logo.png');
const OUT = join(ROOT, 'public', 'icons');

mkdirSync(OUT, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  // Standard icons
  for (const size of sizes) {
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 2, g: 6, b: 23, alpha: 1 } })
      .png()
      .toFile(join(OUT, `icon-${size}x${size}.png`));
    console.log(`Created icon-${size}x${size}.png`);
  }

  // Maskable icon (with padding for safe zone — 80% of canvas)
  const maskableSize = 512;
  const innerSize = Math.round(maskableSize * 0.8);
  const padding = Math.round((maskableSize - innerSize) / 2);

  const resized = await sharp(SOURCE)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 2, g: 6, b: 23, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 2, g: 6, b: 23, alpha: 255 },
    },
  })
    .composite([{ input: resized, left: padding, top: padding }])
    .png()
    .toFile(join(OUT, `maskable-512x512.png`));
  console.log('Created maskable-512x512.png');

  // Apple touch icon (180x180)
  await sharp(SOURCE)
    .resize(180, 180, { fit: 'contain', background: { r: 2, g: 6, b: 23, alpha: 1 } })
    .png()
    .toFile(join(OUT, `apple-touch-icon.png`));
  console.log('Created apple-touch-icon.png');

  console.log('All icons generated!');
}

generate().catch(console.error);
