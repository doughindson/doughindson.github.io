// Download every image at original resolution into content/<slug>/, one request at a time.
// Writes reference/images.json (manifest incl. alt, caption, size, pixel dimensions).
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const UA = 'Mozilla/5.0 (personal site export by owner)';
const { pages } = JSON.parse(fs.readFileSync('reference/pages.json', 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safe = (s) => decodeURIComponent(s).replace(/\+/g, '_').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg' };

const cache = new Map(); // url -> first saved path
const manifest = [];
const dims = (f) => {
  try {
    const o = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f]).toString();
    return [+o.match(/pixelWidth: (\d+)/)[1], +o.match(/pixelHeight: (\d+)/)[1]];
  } catch { return [null, null]; }
};

for (const p of pages) {
  if (p.slug === 'home-alias') continue; // identical to home
  const list = [];
  if (p.item?.assetUrl) list.push({ role: 'cover', url: p.item.assetUrl.split('?')[0], alt: p.title, caption: null });
  for (const b of p.blocks) if (b.kind === 'image' && !b.external) list.push({ role: 'content', url: b.url, alt: b.alt, caption: b.caption, listedDimensions: b.dimensions });
  if (!list.length) continue;
  const dir = path.join('content', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const im of list) {
    const base = safe(path.basename(new URL(im.url).pathname));
    const seq = im.role === 'cover' ? 'cover' : String(++n).padStart(2, '0');
    let target = path.join(dir, `${seq}-${base}`);
    const rec = { slug: p.slug, role: im.role, sourceUrl: im.url, alt: im.alt || '', caption: im.caption || null, listedDimensions: im.listedDimensions || null };
    if (cache.has(im.url) && fs.existsSync(cache.get(im.url))) {
      fs.copyFileSync(cache.get(im.url), target, fs.constants.COPYFILE_FICLONE);
    } else if (!fs.existsSync(target)) {
      const res = await fetch(im.url + '?format=original', { headers: { 'User-Agent': UA, Accept: 'image/jpeg,image/png,image/gif,image/*;q=0.5' }, redirect: 'follow' });
      if (!res.ok) { rec.error = `HTTP ${res.status}`; manifest.push(rec); console.log('FAIL', res.status, im.url); await sleep(500); continue; }
      const ct = (res.headers.get('content-type') || '').split(';')[0];
      const buf = Buffer.from(await res.arrayBuffer());
      const sniff = buf.subarray(0, 12);
      const real = sniff[0] === 0x89 && sniff[1] === 0x50 ? '.png' : sniff[0] === 0xff && sniff[1] === 0xd8 ? '.jpg' : sniff.toString('ascii', 0, 3) === 'GIF' ? '.gif' : sniff.toString('ascii', 0, 4) === 'RIFF' && sniff.toString('ascii', 8, 12) === 'WEBP' ? '.webp' : null;
      if (real) { const cur = path.extname(target).toLowerCase(); const same = real === cur || (real === '.jpg' && cur === '.jpeg'); if (!same) { target = target.slice(0, target.length - cur.length) + real; rec.extensionFixed = true; } }
      rec.sniffedType = real;
      fs.writeFileSync(target, buf);
      rec.contentType = ct;
      await sleep(450);
    }
    cache.set(im.url, cache.get(im.url) || target);
    const st = fs.statSync(target);
    const [w, h] = dims(target);
    Object.assign(rec, { file: target, bytes: st.size, width: w, height: h });
    manifest.push(rec);
    process.stdout.write('.');
  }
  console.log(`\n${p.slug}: ${list.length}`);
}
fs.writeFileSync('reference/images.json', JSON.stringify(manifest, null, 2));
console.log('done', manifest.length, 'records,', manifest.filter((m) => m.error).length, 'errors');
