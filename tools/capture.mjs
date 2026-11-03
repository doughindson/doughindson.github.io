// Playwright: full-page screenshots (1440 & 390), computed-style design tokens, fonts, scripts, forms.
// One page at a time, with a pause between pages.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://www.doughindson.com';
const { pages } = JSON.parse(fs.readFileSync('reference/pages.json', 'utf8'));
const targets = pages.filter((p) => p.slug !== 'home-alias');
const SIZES = [{ name: '1440', width: 1440, height: 900 }, { name: '390', width: 390, height: 844 }];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('reference/screenshots', { recursive: true });

const extract = () => {
  const pick = (el) => {
    const s = getComputedStyle(el);
    return {
      fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, fontStyle: s.fontStyle, lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing, textTransform: s.textTransform, color: s.color, textDecoration: s.textDecorationLine,
    };
  };
  const key = (o) => JSON.stringify(o);
  const typeMap = {};
  const sel = ['h1', 'h2', 'h3', 'h4', 'p', 'p.sqsrte-small', 'p.sqsrte-large', 'a', 'li', 'figcaption', 'header a', 'header nav a', 'footer', 'footer a', '.portfolio-title', '.portfolio-overlay', 'button', 'body'];
  for (const q of sel) {
    for (const el of document.querySelectorAll(q)) {
      if (!el.offsetParent && q !== 'body') continue;
      if (!(el.textContent || '').trim() && q !== 'body') continue;
      const p = pick(el); const k = q + '|' + key(p);
      (typeMap[k] ||= { selector: q, ...p, count: 0, sample: (el.textContent || '').trim().slice(0, 50) }).count++;
    }
  }
  // colours
  const colours = {};
  const bump = (m, v) => { if (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent') m[v] = (m[v] || 0) + 1; };
  const bgs = {}; const borders = {};
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if ((el.textContent || '').trim() && el.children.length === 0) bump(colours, s.color);
    bump(bgs, s.backgroundColor);
    if (parseFloat(s.borderTopWidth) > 0) bump(borders, s.borderTopColor);
  }
  const body = getComputedStyle(document.body);
  // CSS custom properties on :root (Squarespace theme variables)
  const rootVars = {};
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules) if (r.selectorText === ':root' || r.selectorText === 'body') for (const n of r.style) if (n.startsWith('--')) rootVars[n] = r.style.getPropertyValue(n).trim();
  }
  // breakpoints from media queries
  const media = {};
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    const walk = (rs) => { for (const r of rs) { if (r.type === 4) { media[r.conditionText] = (media[r.conditionText] || 0) + 1; walk(r.cssRules); } } };
    walk(rules);
  }
  // layout / spacing
  const box = (q) => { const el = document.querySelector(q); if (!el) return null; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { selector: q, x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height), padding: s.padding, margin: s.margin, display: s.display, gap: s.gap, gridTemplateColumns: s.gridTemplateColumns, maxWidth: s.maxWidth, backgroundColor: s.backgroundColor, position: s.position, borderBottom: s.borderBottom }; };
  const layout = ['header', '#header .header-inner', '.header-title-logo', '.header-nav', 'main', '.page-section', '.content-wrapper', '.content', '#gridThumbs', '#gridThumbs .grid-item', '.sqs-block-html', '.gallery-masonry', 'footer', '.sqs-block-image img', '.gallery-masonry-item'].map(box).filter(Boolean);
  const grids = [...document.querySelectorAll('[data-fluid-engine="true"] , .fluid-engine, #gridThumbs')].slice(0, 3).map((el) => { const s = getComputedStyle(el); return { cls: el.className.toString().slice(0, 60), display: s.display, gridTemplateColumns: s.gridTemplateColumns, columnGap: s.columnGap, rowGap: s.rowGap }; });
  const logo = document.querySelector('.header-title-logo img, .header-title-logo a');
  // fonts declared
  const fontFaces = [];
  for (const sheet of document.styleSheets) { let rules; try { rules = sheet.cssRules; } catch { continue; } for (const r of rules) if (r.type === 5) fontFaces.push({ family: r.style.getPropertyValue('font-family'), weight: r.style.getPropertyValue('font-weight'), style: r.style.getPropertyValue('font-style'), src: r.style.getPropertyValue('src').slice(0, 300) }); }
  // head info
  const links = (q, a) => [...document.querySelectorAll(q)].map((e) => e.getAttribute(a));
  const scripts = [...document.scripts].map((s) => ({ src: s.src || null, inline: s.src ? null : s.textContent.trim().slice(0, 300), type: s.type || null }));
  const forms = [...document.forms].map((f) => ({ action: f.action, method: f.method, fields: [...f.elements].map((e) => ({ tag: e.tagName, type: e.type, name: e.name, label: e.getAttribute('aria-label') || e.placeholder || null })) }));
  return {
    typeMap: Object.values(typeMap), colours, bgs, borders, bodyBg: body.backgroundColor, bodyColor: body.color, rootVars, media, layout, grids,
    logo: logo ? { tag: logo.tagName, src: logo.getAttribute('src') || null, w: logo.getBoundingClientRect().width, h: logo.getBoundingClientRect().height } : null,
    fontFaces, favicons: links('link[rel*="icon"]', 'href'), appleTouch: links('link[rel="apple-touch-icon"]', 'href'),
    customCss: [...document.querySelectorAll('style')].map((s) => s.id || s.getAttribute('data-sqs-css') || '').filter(Boolean).slice(0, 50),
    scripts, forms, docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight,
    metaTags: [...document.querySelectorAll('meta')].map((m) => ({ name: m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv'), content: (m.getAttribute('content') || '').slice(0, 200) })).filter((m) => m.name),
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent.slice(0, 1500)),
  };
};

const browser = await chromium.launch();
const out = { generated: new Date().toISOString(), viewports: {}, hover: [], fontRequests: new Set() };
const allRequests = new Map();

for (const vp of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (personal site export by owner)', isMobile: vp.width < 500, hasTouch: vp.width < 500 });
  out.viewports[vp.name] = {};
  for (const p of targets) {
    const page = await ctx.newPage();
    page.on('response', (r) => { const u = r.url(); const t = r.request().resourceType(); if (t === 'font' || /\.(woff2?|ttf|otf)(\?|$)/.test(u) || /typekit|fonts\.(googleapis|gstatic)/.test(u)) out.fontRequests.add(u); });
    page.on('request', (r) => { allRequests.set(r.url(), (allRequests.get(r.url()) || new Set()).add(p.slug)); });
    await page.goto(BASE + (p.route === '/' ? '/' : p.route), { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    // scroll to trigger lazy loading, then return to top
    await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await page.waitForLoadState('networkidle').catch(() => {});
    await sleep(800);
    await page.screenshot({ path: `reference/screenshots/${p.slug}-${vp.name}.png`, fullPage: true, timeout: 120000 }).catch((e) => console.log('shot fail', p.slug, vp.name, e.message.slice(0, 80)));
    out.viewports[vp.name][p.slug] = await page.evaluate(extract);

    if (vp.name === '1440' && ['home', 'about', 'design-motion', 'citi'].includes(p.slug)) {
      // hover states
      const cands = await page.$$('header nav a, header .header-title-logo a, main a[href], #gridThumbs .grid-item');
      const seen = new Set();
      for (const el of cands.slice(0, 40)) {
        const label = ((await el.innerText().catch(() => '')) || (await el.getAttribute('href')) || '').trim().slice(0, 40);
        const k = (await el.evaluate((e) => e.className + '|' + e.closest('header,main,footer')?.tagName)) + label.slice(0, 1);
        if (seen.has(k) || !(await el.isVisible())) continue; seen.add(k);
        const read = () => el.evaluate((e) => { const s = getComputedStyle(e); const ov = e.querySelector('.portfolio-overlay, .grid-image-overlay, [class*="overlay"]'); const os = ov && getComputedStyle(ov); return { color: s.color, bg: s.backgroundColor, opacity: s.opacity, textDecoration: s.textDecorationLine, borderBottom: s.borderBottom, transform: s.transform, overlayOpacity: os?.opacity ?? null, overlayBg: os?.backgroundColor ?? null }; });
        const before = await read();
        await el.hover({ timeout: 3000 }).catch(() => {});
        await sleep(450);
        const after = await read();
        if (JSON.stringify(before) !== JSON.stringify(after)) out.hover.push({ page: p.slug, element: label, className: await el.getAttribute('class'), before, after });
        await page.mouse.move(0, 0);
      }
    }
    // mobile menu state
    if (vp.name === '390' && p.slug === 'home') {
      const burger = await page.$('.header-burger-btn, [data-test="header-burger"], .burger');
      if (burger) { await burger.click().catch(() => {}); await sleep(900); await page.screenshot({ path: 'reference/screenshots/home-390-menu-open.png' }); out.mobileMenu = await page.evaluate(() => [...document.querySelectorAll('.header-menu a, #mobileNavigation a, .header-menu-nav-item a')].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))); }
    }
    await page.close();
    console.log(vp.name, p.slug);
    await sleep(1500);
  }
  await ctx.close();
}
await browser.close();
out.fontRequests = [...out.fontRequests];
out.thirdPartyRequests = [...allRequests.keys()].filter((u) => !/doughindson\.com|squarespace(-cdn)?\.com|sqspcdn\.com/.test(u)).map((u) => ({ url: u, pages: [...allRequests.get(u)].length }));
fs.writeFileSync('reference/capture-raw.json', JSON.stringify(out, null, 2));
console.log('done');
