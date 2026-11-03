// Download Squarespace-native (HLS) videos to content/<slug>/ using the local ffmpeg-static binary.
// Squarespace does not expose the original upload; this is the best (up to 1080p) rendition it serves.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import ffmpeg from 'ffmpeg-static';

const UA = 'Mozilla/5.0 (personal site export by owner)';
const { pages } = JSON.parse(fs.readFileSync('reference/pages.json', 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
const seen = new Map();

for (const p of pages) {
  if (p.slug === 'home-alias') continue;
  let n = 0;
  for (const b of p.blocks.filter((x) => x.kind === 'video' && x.provider === 'squarespace-native')) {
    n++;
    const c = b.config;
    const dir = path.join('content', p.slug);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `video-${String(n).padStart(2, '0')}-${c.systemDataId}.mp4`);
    const master = c.alexandriaUrl.replace('{variant}', 'playlist.m3u8');
    const rec = { slug: p.slug, index: n, id: c.systemDataId, durationSeconds: c.durationSeconds, aspectRatio: c.aspectRatio, variants: c.systemDataVariants, playlist: master, file };
    if (seen.has(c.systemDataId)) { fs.copyFileSync(seen.get(c.systemDataId), file, fs.constants.COPYFILE_FICLONE); rec.copyOf = seen.get(c.systemDataId); }
    else if (!fs.existsSync(file)) {
      try {
        execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-user_agent', UA, '-i', master, '-map', '0:v:m:variant_bitrate:max', '-c', 'copy', file].filter(Boolean), { stdio: 'pipe' });
      } catch {
        // fall back: let ffmpeg choose the best variant itself
        try { execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-user_agent', UA, '-i', master, '-c', 'copy', file], { stdio: 'pipe' }); }
        catch (e) { rec.error = String(e.stderr || e).slice(0, 300); }
      }
      await sleep(800);
    }
    if (fs.existsSync(file)) { rec.bytes = fs.statSync(file).size; seen.set(c.systemDataId, file); }
    out.push(rec);
    console.log(p.slug, n, rec.error ? 'ERROR ' + rec.error : (rec.bytes / 1e6).toFixed(1) + ' MB');
  }
}
fs.writeFileSync('reference/videos.json', JSON.stringify(out, null, 2));
