// Genera los íconos PNG de la PWA (192, 512, maskable) sin dependencias externas:
// dibuja un vaso simple sobre fondo sólido, pixel a pixel, y codifica un PNG
// manualmente (IHDR/IDAT/IEND) usando el zlib de Node para el deflate.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = [14, 116, 144]; // organizador/frio-ish teal oscuro
const GLASS = [255, 255, 255];
const LIQUID = [249, 115, 22]; // naranja (caliente) para dar contraste

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaPixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgbaPixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawIcon(size, { padding = 0.14, maskable = false } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const pad = size * padding;

  // vaso: trapecio simple (más angosto abajo), con "líquido" en la mitad inferior
  const glassTop = pad;
  const glassBottom = size - pad;
  const glassHalfTopW = (size - pad * 2) * 0.42;
  const glassHalfBottomW = (size - pad * 2) * 0.3;
  const liquidTop = glassTop + (glassBottom - glassTop) * 0.42;

  const bgRadius = maskable ? size * 0.5 : size * 0.22; // maskable: círculo completo de fondo

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let r = BG[0], g = BG[1], b = BG[2], a = 255;

      if (!maskable) {
        // esquinas redondeadas del ícono "any"
        const dx = Math.max(0, Math.max(bgRadius - x, x - (size - bgRadius)));
        const dy = Math.max(0, Math.max(bgRadius - y, y - (size - bgRadius)));
        if (dx > 0 && dy > 0 && dx * dx + dy * dy > bgRadius * bgRadius) {
          a = 0;
        }
      }

      if (a > 0 && y >= glassTop && y <= glassBottom) {
        const t = (y - glassTop) / (glassBottom - glassTop);
        const halfW = glassHalfTopW + (glassHalfBottomW - glassHalfTopW) * t;
        if (x >= cx - halfW && x <= cx + halfW) {
          const isEdge = x <= cx - halfW + size * 0.02 || x >= cx + halfW - size * 0.02 || y >= glassBottom - size * 0.02;
          if (isEdge) {
            r = GLASS[0]; g = GLASS[1]; b = GLASS[2];
          } else if (y >= liquidTop) {
            r = LIQUID[0]; g = LIQUID[1]; b = LIQUID[2];
          } else {
            r = BG[0]; g = BG[1]; b = BG[2];
            a = 40; // "vacío": deja ver el fondo, casi transparente
            r = GLASS[0]; g = GLASS[1]; b = GLASS[2];
          }
        }
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }
  return pixels;
}

for (const size of [192, 512]) {
  const png = encodePNG(size, size, drawIcon(size));
  writeFileSync(path.join(outDir, `icon-${size}.png`), png);
}
const maskablePng = encodePNG(512, 512, drawIcon(512, { padding: 0.2, maskable: true }));
writeFileSync(path.join(outDir, "icon-512-maskable.png"), maskablePng);

console.log("Íconos generados en public/icons/");
