// Generate the favicon set from the existing site logo (reference/site-assets/site-logo.png).
import sharp from 'sharp';
import fs from 'fs';
const src = 'reference/site-assets/site-logo.png';
const out = (n) => `public/${n}`;
await sharp(src).resize(180, 180).png().toFile(out('apple-touch-icon.png'));
await sharp(src).resize(192, 192).png().toFile(out('icon-192.png'));
await sharp(src).resize(512, 512).png().toFile(out('icon-512.png'));
const ico = await sharp(src).resize(48, 48).png().toBuffer();
// single-image ICO wrapping a PNG
const hdr = Buffer.alloc(22); hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4);
hdr.writeUInt8(48, 6); hdr.writeUInt8(48, 7); hdr.writeUInt16LE(1, 10); hdr.writeUInt16LE(32, 12); hdr.writeUInt32LE(ico.length, 14); hdr.writeUInt32LE(22, 18);
fs.writeFileSync(out('favicon.ico'), Buffer.concat([hdr, ico]));
const b64 = (await sharp(src).resize(64, 64).png().toBuffer()).toString('base64');
fs.writeFileSync(out('favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${b64}"/></svg>\n`);
await sharp(src).resize(630, 630, { fit: 'contain', background: '#f2f2f2' }).extend({ left: 285, right: 285, background: '#f2f2f2' }).jpeg({ quality: 85 }).toFile(out('og-default.jpg'));
fs.writeFileSync(out('site.webmanifest'), JSON.stringify({ name: 'Doug Hindson', short_name: 'Doug Hindson', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }], theme_color: '#f2f2f2', background_color: '#f2f2f2', display: 'browser' }, null, 2));
console.log('icons written');
