// Generate content/<slug>.md and reference/inventory.json from pages.json + images.json + videos.json
import fs from 'fs';
import path from 'path';

const { site, pages } = JSON.parse(fs.readFileSync('reference/pages.json', 'utf8'));
const images = JSON.parse(fs.readFileSync('reference/images.json', 'utf8'));
const videos = fs.existsSync('reference/videos.json') ? JSON.parse(fs.readFileSync('reference/videos.json', 'utf8')) : [];

const q = (s) => JSON.stringify(s ?? null);
const iso = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : null);
const byUrl = (slug) => {
  const m = new Map();
  for (const i of images.filter((x) => x.slug === slug && x.role === 'content')) { (m.get(i.sourceUrl) || m.set(i.sourceUrl, []).get(i.sourceUrl)).push(i); }
  return m;
};

// navigation / project order
const idx = pages.find((p) => p.slug === 'design-motion');
const projectOrder = idx.blocks.filter((b) => b.kind === 'portfolio-item').map((b) => b.href);
const navOrder = site.nav.map((n) => n.href);

const typeOf = (p) => {
  if (p.slug === 'home') return 'home';
  if (p.slug === 'home-alias') return 'alias';
  if (p.slug === 'about') return 'about';
  if (p.slug === '404') return 'error';
  if (p.slug === 'design-motion') return 'project-index';
  if (p.route.startsWith('/design-motion/')) return 'project';
  return 'legacy';
};

const inventory = [];
for (const p of pages) {
  const type = typeOf(p);
  const imgsHere = byUrl(p.slug);
  const used = new Map();
  const nextImg = (url) => { const arr = imgsHere.get(url) || []; const i = used.get(url) || 0; used.set(url, i + 1); return arr[Math.min(i, arr.length - 1)]; };
  const vids = videos.filter((v) => v.slug === p.slug);
  let vi = 0;

  const lines = [];
  let run = [];
  const flush = () => { if (run.length) { lines.push(run.join('\n')); run = []; } };
  for (const b of p.blocks) {
    if (b.kind === 'image') {
      const rec = b.external ? null : nextImg(b.url);
      const href = rec ? `./${path.relative('content', rec.file)}` : b.url;
      const alt = b.alt && !/\.(png|jpe?g|gif|webp)$/i.test(b.alt) ? b.alt : ''; // Squarespace default alt = filename
      run.push(`![${alt}](${href})` + (b.caption ? `\n*${b.caption}*` : ''));
      continue;
    }
    flush();
    if (b.kind === 'text') lines.push(b.markdown);
    else if (b.kind === 'rule') lines.push('---');
    else if (b.kind === 'button') lines.push(`[${b.text}](${b.href})`);
    else if (b.kind === 'video') {
      if (b.provider === 'squarespace-native') {
        const v = vids[vi++];
        lines.push(`[Video — ${v ? path.basename(v.file) : b.config.systemDataId} (Squarespace-hosted, ${Math.round(b.config.durationSeconds)}s)](${v ? './' + path.basename(path.dirname(v.file)) + '/' + path.basename(v.file) : ''})`);
      } else lines.push(`[${b.provider} video${b.title ? ' — ' + b.title : ''}](${b.src})`);
    } else if (b.kind === 'code' || b.kind === 'embed') {
      const src = b.iframeSrc || b.src || (b.html || '').match(/src="([^"]+)"/)?.[1];
      lines.push(src ? `[Embed — ${src.replace(/^\/\//, 'https://')}](${src.replace(/^\/\//, 'https://')})` : `<!-- code block: ${(b.html || '').slice(0, 200)} -->`);
    } else if (b.kind === 'portfolio-item') lines.push(`- [${b.title}](${b.href})`);
  }
  flush();

  const cover = images.find((i) => i.slug === p.slug && i.role === 'cover');
  let order;
  if (type === 'project') order = projectOrder.indexOf(p.route) + 1;
  else if (navOrder.includes(p.route)) order = navOrder.indexOf(p.route) + 1;
  else order = null;

  const slug = p.slug;
  const fm = [
    '---',
    `title: ${q(p.h1 && type !== 'home' && type !== 'about' ? p.h1 : p.title.replace(/ — Doug Hindson — Creative Director$/, ''))}`,
    `slug: ${q(slug)}`,
    `original_url: ${q(p.url)}`,
    `type: ${q(type)}`,
    `date: ${q(type === 'project' && p.item ? iso(p.item.publishOn) : null)}`,
    `date_note: ${q(type === 'project' ? 'Squarespace CMS publish date, not necessarily the project date' : null)}`,
    `description: ${q(p.description)}`,
    `cover_image: ${q(cover ? './' + path.relative('content', cover.file) : null)}`,
    `og_image: ${q(p.ogImage)}`,
    `order: ${order ?? 'null'}`,
    '---',
    '',
  ].join('\n');
  if (type !== 'alias') fs.writeFileSync(path.join('content', `${slug}.md`), (fm + lines.join('\n\n') + '\n').replace(/(\S) {2,}(?=\S)/g, '$1 '));

  inventory.push({
    url: p.url, path: p.route === '/' ? '/' : p.route, slug, title: p.title, h1: p.h1,
    metaDescription: p.description, ogImage: p.ogImage, canonical: p.canonical,
    type, navigationPosition: navOrder.includes(p.route) ? navOrder.indexOf(p.route) + 1 : null,
    inNavigation: navOrder.includes(p.route), projectOrder: type === 'project' ? projectOrder.indexOf(p.route) + 1 : null,
    lastModifiedInSitemap: null, publishedOn: type === 'project' && p.item ? iso(p.item.publishOn) : null,
    imageCount: p.blocks.filter((b) => b.kind === 'image').length,
    videoCount: p.blocks.filter((b) => b.kind === 'video').length,
    contentFile: type === 'alias' ? null : `content/${slug}.md`,
  });
}

// sitemap lastmod
const sm = fs.readFileSync(process.env.SITEMAP || 'reference/sitemap.xml', 'utf8');
for (const m of sm.matchAll(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>/g)) {
  const pth = new URL(m[1]).pathname.replace(/\/$/, '') || '/';
  const it = inventory.find((i) => i.path === pth);
  if (it) it.lastModifiedInSitemap = m[2];
}
fs.writeFileSync('inventory.json', JSON.stringify({ generated: new Date().toISOString(), source: 'https://www.doughindson.com (doughindson.com 301-redirects to www)', navigation: site.nav, projectOrder, pages: inventory }, null, 2));
console.log(inventory.map((i) => `${i.path} [${i.type}] nav=${i.navigationPosition} order=${i.projectOrder}`).join('\n'));
