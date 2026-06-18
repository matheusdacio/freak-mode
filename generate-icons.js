const zlib = require('zlib');
const fs = require('fs');

function crc32(data) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const dataBytes = data || Buffer.alloc(0);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBytes.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, dataBytes])), 0);
  return Buffer.concat([lenBuf, typeBytes, dataBytes, crcBuf]);
}

function generatePNG(size, r, g, b) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const rowSize = size * 3 + 1;
  const rawData = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    rawData[y * rowSize] = 0; // filter None
    for (let x = 0; x < size; x++) {
      const o = y * rowSize + 1 + x * 3;
      rawData[o] = r; rawData[o + 1] = g; rawData[o + 2] = b;
    }
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rawData)),
    chunk('IEND', null)
  ]);
}

// #a855f7 = rgb(168, 85, 247)
fs.writeFileSync('src/assets/icons/icon-192.png', generatePNG(192, 168, 85, 247));
fs.writeFileSync('src/assets/icons/icon-512.png', generatePNG(512, 168, 85, 247));
console.log('Icones gerados: icon-192.png e icon-512.png');
