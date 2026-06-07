// Generates Muninn's PNG icons from the raven SVG mark at the sizes the
// manifest needs. Run with: node scripts/gen-icons.mjs
// Uses only Node built-ins (zlib) — no image dependencies. Renders a simple
// raven silhouette on the accent color into a raw RGBA buffer, then encodes PNG.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

// Accent indigo background, light raven.
const BG = [99, 89, 222, 255];
const FG = [232, 234, 244, 255];

// CRC32 (PNG chunk checksums).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// A tiny bitmap of a raven head (1 = ink) on a 16x16 grid, scaled per size.
const GRID = [
  '0000000000000000',
  '0000000111000000',
  '0000011111110000',
  '0000111111111000',
  '0001111111111100',
  '0011110111111110',
  '0011100111111111',
  '0011111111111100',
  '0001111111111000',
  '0000111111111000',
  '0000011111110000',
  '0000011111100000',
  '0000001111000000',
  '0000011110000000',
  '0000111000000000',
  '0000000000000000',
];

function makePng(size) {
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x / size) * 16);
      const gy = Math.floor((y / size) * 16);
      const ink = GRID[gy][gx] === '1';
      const [r, g, b, a] = ink ? FG : BG;
      const o = (y * size + x) * 4;
      px[o] = r;
      px[o + 1] = g;
      px[o + 2] = b;
      px[o + 3] = a;
    }
  }
  // Add a filter byte (0) at the start of each scanline.
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(OUT, `icon-${size}.png`), makePng(size));
  console.log(`wrote icon-${size}.png`);
}
