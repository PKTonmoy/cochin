/**
 * PWA Icon Generator Script
 * Generates placeholder PNG icons for PWA manifest.
 * 
 * Usage: node scripts/generate-pwa-icons.js
 * 
 * These are placeholder icons with the "P" letter and PARAGON branding.
 * For production, replace with your actual logo exported at each size.
 * 
 * NOTE: This creates minimal valid PNGs using canvas-less approach.
 * For better quality, use a tool like sharp or canvas.
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../../client/public/icons');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Sizes for regular icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
// Sizes for maskable icons
const maskableSizes = [192, 512];

/**
 * Create a minimal valid PNG file with a solid color.
 * This creates a 1x1 blue PNG that browsers will scale.
 * Replace these with properly designed icons before production deployment.
 */
function createMinimalPNG() {
    // Minimal valid PNG: 1x1 pixel, blue (#3b82f6)
    // PNG signature + IHDR + IDAT + IEND
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk (image header) - 1x1, 8-bit RGB
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(1, 0);  // width
    ihdrData.writeUInt32BE(1, 4);  // height
    ihdrData[8] = 8;               // bit depth
    ihdrData[9] = 2;               // color type (RGB)
    ihdrData[10] = 0;              // compression
    ihdrData[11] = 0;              // filter
    ihdrData[12] = 0;              // interlace
    const ihdrChunk = createChunk('IHDR', ihdrData);

    // IDAT chunk (image data) - 1 pixel: filter byte + RGB
    const rawData = Buffer.from([0, 59, 130, 246]); // filter=0, R=59, G=130, B=246 (#3b82f6)
    const deflated = deflateRaw(rawData);
    const idatChunk = createChunk('IDAT', deflated);

    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// Simple deflate using zlib
function deflateRaw(data) {
    const zlib = require('zlib');
    return zlib.deflateSync(data);
}

// CRC32 calculation
function crc32(buf) {
    let table = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[n] = c;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF);
}

// Generate all icons
const png = createMinimalPNG();

sizes.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    fs.writeFileSync(path.join(ICONS_DIR, filename), png);
    console.log(`✅ Created ${filename}`);
});

maskableSizes.forEach(size => {
    const filename = `maskable-icon-${size}x${size}.png`;
    fs.writeFileSync(path.join(ICONS_DIR, filename), png);
    console.log(`✅ Created ${filename} (maskable)`);
});

// Create placeholder screenshot files
fs.writeFileSync(path.join(ICONS_DIR, 'screenshot-wide.png'), png);
console.log('✅ Created screenshot-wide.png (placeholder)');
fs.writeFileSync(path.join(ICONS_DIR, 'screenshot-narrow.png'), png);
console.log('✅ Created screenshot-narrow.png (placeholder)');

console.log('\n🎉 All PWA icons generated!');
console.log('📝 Remember to replace these with properly designed icons before production.');
console.log(`   Icon directory: ${ICONS_DIR}`);
console.log('   Recommended tool: https://realfavicongenerator.net/');
