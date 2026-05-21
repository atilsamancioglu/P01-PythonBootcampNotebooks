import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgStandard = readFileSync(join(publicDir, 'icon.svg'));
const svgMaskable = readFileSync(join(publicDir, 'icon-maskable.svg'));

const SIZES = [
  { src: svgStandard, name: 'icon-192.png', size: 192 },
  { src: svgStandard, name: 'icon-512.png', size: 512 },
  { src: svgMaskable, name: 'icon-maskable-512.png', size: 512 },
  { src: svgStandard, name: 'apple-touch-icon.png', size: 180 },
  { src: svgStandard, name: 'favicon-32.png', size: 32 },
];

for (const { src, name, size } of SIZES) {
  await sharp(src)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name));
  console.log('wrote', name);
}
