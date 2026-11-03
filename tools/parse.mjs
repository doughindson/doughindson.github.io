// Parse saved Squarespace HTML (+ ?format=json) into reference/pages.json
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const RAW = 'reference/raw-html';
const BASE = 'https://www.doughindson.com';

const PAGES = [
  ['', 'home'], ['about', 'about'], ['404', '404'], ['selected-projects', 'selected-projects'],
  ['home', 'home-alias'], ['selected-projects-1', 'selected-projects-1'], ['design-motion', 'design-motion'],
  ...[
    'transportation-alternatives', 'thorne-build-to-last', 'citi', 'ibm-illustrations', 'thorne-healthy-aging',
    'microsoft-365', 'ibm-watsonx', 'landscapes', 'chase-usopen', 'disconnect', 'here-we-are', 'spotify-premium',
    'ibm-partnerships',
  ].map((s) => [`design-motion/${s}`, s]),
];

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const imgBase = (u) => (u ? (u.startsWith('//') ? 'https:' + u : u).split('?')[0] : null);
const decoded = (u) => { try { return decodeURIComponent(u); } catch { return u; } };

function htmlToMd($, el) {
  // minimal HTML -> Markdown for Squarespace rich text, keeping links, emphasis, headings, lists
  const walk = (node) => {
    if (node.type === 'text') return node.data.replace(/ /g, ' ');
    if (node.type !== 'tag') return '';
    const tag = node.tagName;
    const inner = () => $(node).contents().toArray().map(walk).join('');
    switch (tag) {
      case 'style': case 'script': return '';
      case 'br': return '  \n';
      case 'strong': case 'b': { const t = inner(); return t.trim() ? `**${t.trim()}** ` : t; }
      case 'em': case 'i': { const t = inner(); return t.trim() ? `*${t.trim()}* ` : t; }
      case 'a': { const t = inner().trim(); const h = $(node).attr('href'); return h ? `[${t}](${h})` : t; }
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        return `\n\n${'#'.repeat(+tag[1])} ${clean(inner())}\n\n`;
      case 'p': return `\n\n${inner().trim()}\n\n`;
      case 'ul': return '\n\n' + $(node).children('li').toArray().map((li) => `- ${clean(walk(li))}`).join('\n') + '\n\n';
      case 'ol': return '\n\n' + $(node).children('li').toArray().map((li, i) => `${i + 1}. ${clean(walk(li))}`).join('\n') + '\n\n';
      case 'li': return inner();
      case 'blockquote': return '\n\n' + inner().trim().split('\n').map((l) => `> ${l}`).join('\n') + '\n\n';
      case 'hr': return '\n\n---\n\n';
      default: return inner();
    }
  };
  return $(el).contents().toArray().map(walk).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function imageFrom($, img) {
  const $i = $(img);
  const url = imgBase($i.attr('data-image') || $i.attr('data-src') || $i.attr('src'));
  if (!url || !/squarespace-cdn|sqspcdn/.test(url)) return url ? { kind: 'image', url, external: true, alt: $i.attr('alt') || '' } : null;
  const fig = $i.closest('figure, .image-block-outer-wrapper, .sqs-block-image, .fluid-image-component-root, .sqs-block');
  let caption = clean(fig.find('figcaption, .image-caption, .image-caption-wrapper').first().text());
  const link = $i.closest('a[href]').attr('href') || null;
  return {
    kind: 'image', url, alt: clean($i.attr('alt')), caption: caption || null, link,
    dimensions: $i.attr('data-image-dimensions') || (($i.attr('width') && $i.attr('height')) ? `${$i.attr('width')}x${$i.attr('height')}` : null),
  };
}

function parsePage(route, slug) {
  const file = path.join(RAW, (route === '' ? '_root' : route.replace(/\//g, '__')));
  const $ = cheerio.load(fs.readFileSync(file + '.html', 'utf8'));
  const json = JSON.parse(fs.readFileSync(file + '.json', 'utf8'));
  const meta = (n) => $(`meta[name="${n}"]`).attr('content') || null;
  const prop = (n) => $(`meta[property="${n}"]`).attr('content') || null;

  const blocks = [];
  const main = $('main#page, main').first();

  const visit = (node) => {
    if (node.type !== 'tag') return;
    const $n = $(node);
    const cls = $n.attr('class') || '';
    const tag = node.tagName;
    if (['style', 'script', 'noscript'].includes(tag)) return;

    if ($n.is('figure.gallery-lightbox-item, .gallery-lightbox')) return; // duplicate of masonry items
    if ($n.is('.sqs-html-content')) { const md = htmlToMd($, node); if (md) blocks.push({ kind: 'text', markdown: md, size: (cls.match(/sqsrte-(small|large)/) || [])[1] || null }); return; }
    if ($n.is('.sqs-block-video, .video-block')) {
      const nv = $n.find('.sqs-native-video').first();
      if (nv.length) {
        let cfg = {}; try { cfg = JSON.parse(nv.attr('data-config-video')); } catch {}
        blocks.push({ kind: 'video', provider: 'squarespace-native', config: cfg, caption: clean($n.find('figcaption, .caption').text()) || null });
      } else {
        const wrap = $n.find('.sqs-video-wrapper').first();
        const frag = cheerio.load(wrap.attr('data-html') || '');
        const src = frag('iframe').attr('src') || $n.find('iframe').first().attr('src') || null;
        const norm = src ? (src.startsWith('//') ? 'https:' + src : src) : null;
        blocks.push({
          kind: 'video', provider: wrap.attr('data-provider-name') || 'iframe', src: norm, title: frag('iframe').attr('title') || null,
          id: norm ? (norm.match(/video\/(\d+)|embed\/([\w-]+)|v=([\w-]+)/) || []).slice(1).find(Boolean) || null : null,
        });
      }
      return;
    }
    if ($n.is('.sqs-block-code')) {
      const fr = $n.find('iframe').first();
      blocks.push({ kind: 'code', iframeSrc: fr.attr('src') || null, html: $n.find('.sqs-code-container').html()?.trim().slice(0, 4000) || null });
      return;
    }
    if (tag === 'iframe') { blocks.push({ kind: 'embed', src: $n.attr('src') }); return; }
    if ($n.is('.sqs-block-horizontalrule')) { blocks.push({ kind: 'rule' }); return; }
    if ($n.is('.sqs-block-spacer')) { blocks.push({ kind: 'spacer' }); return; }
    if ($n.is('a.grid-item')) {
      const img = $n.find('img').first();
      blocks.push({ kind: 'portfolio-item', href: $n.attr('href'), title: clean($n.find('.portfolio-title, .portfolio-overlay, h3, h2').first().text()) || img.attr('alt') || '', thumb: imgBase(img.attr('data-image') || img.attr('data-src')), alt: img.attr('alt') || '' });
      return;
    }
    if ($n.is('a.sqs-block-button-element, a.sqs-button-element--primary, a.sqs-button-element--secondary')) {
      blocks.push({ kind: 'button', text: clean($n.text()), href: $n.attr('href') }); return;
    }
    if (tag === 'img') { const im = imageFrom($, node); if (im) blocks.push(im); return; }
    $n.contents().toArray().forEach(visit);
  };
  visit(main.get(0));

  // de-dupe consecutive identical images (same url) that come from duplicate markup
  const seen = new Set();
  const deduped = blocks.filter((b) => {
    if (b.kind !== 'image') return true;
    const k = b.url + '|' + (b.caption || '');
    if (seen.has(k)) return false; seen.add(k); return true;
  });

  const item = json.item || null;
  const coll = json.collection || {};
  const fullUrl = route === '' ? `${BASE}/` : `${BASE}/${route}`;
  const title = clean(prop('og:title') || $('title').text());
  return {
    slug, route: '/' + route, url: fullUrl, canonical: $('link[rel=canonical]').attr('href') || null,
    title, h1: clean($('main h1').first().text()) || null,
    description: meta('description') || prop('og:description') || null,
    ogImage: prop('og:image') || null, ogType: prop('og:type'),
    collection: { urlId: coll.urlId, title: coll.title, navigationTitle: coll.navigationTitle, ordering: coll.ordering, enabled: coll.enabled, type: coll.type, typeLabel: coll.typeName },
    item: item && { id: item.id, title: item.title, addedOn: item.addedOn, publishOn: item.publishOn, updatedOn: item.updatedOn, displayIndex: item.displayIndex, assetUrl: item.assetUrl, filename: item.filename, originalSize: item.originalSize, fullUrl: item.fullUrl, workflowState: item.workflowState },
    updatedOn: json.collection?.updatedOn || null,
    blocks: deduped,
  };
}

const pages = PAGES.map(([r, s]) => parsePage(r, s));

// navigation (desktop header), de-duplicated in order
const $h = cheerio.load(fs.readFileSync(path.join(RAW, '_root.html'), 'utf8'));
const nav = [];
$h('header nav a').each((i, e) => { const h = $h(e).attr('href'); if (h && !nav.find((n) => n.href === h)) nav.push({ href: h, label: clean($h(e).text()) }); });
const site = { title: clean($h('meta[property="og:site_name"]').attr('content')), tagline: null, nav };

fs.writeFileSync('reference/pages.json', JSON.stringify({ site, pages }, null, 2));
for (const p of pages) console.log(p.slug.padEnd(28), p.blocks.length, 'blocks;', p.blocks.filter((b) => b.kind === 'image').length, 'images;', p.blocks.filter((b) => b.kind === 'video').length, 'videos');
console.log(nav);
