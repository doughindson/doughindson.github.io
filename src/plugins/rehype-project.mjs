// Rehype plugin shaping the exported Squarespace Markdown for the project pages:
//  - drops the leading <h1> (the page template renders the title)
//  - groups consecutive images into .image-group[data-count]
//  - groups the credit lines at the top (Role / Studio / Client…), always visible
//  - hides the long "Credits" list at the end of the page behind a "Show all credits" toggle
//  - turns "Video — …" links into video figures (Vimeo/YouTube embeds, or the mapped host for Squarespace-hosted files)
import videoSources from '../data/video-sources.json' with { type: 'json' };

const CREDIT_LABELS = /^(role|studio|client|agency|production|animation|music|sound|design|direction|creative director|art director|credits?)\b/i;

const isWs = (n) => n.type === 'text' && !n.value.trim();
const textOf = (n) => (n.type === 'text' ? n.value : (n.children || []).map(textOf).join(''));
const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });

function isImageGroup(p) {
  const kids = p.children.filter((c) => !isWs(c));
  return kids.length > 0 && kids.every((c) => c.type === 'element' && c.tagName === 'img');
}

function isCredit(p) {
  if (p.tagName !== 'p') return false;
  const first = p.children.find((c) => !isWs(c));
  return !!first && first.type === 'element' && first.tagName === 'em' && CREDIT_LABELS.test(textOf(first).trim());
}

function videoFigure(p) {
  const kids = p.children.filter((c) => !isWs(c));
  if (kids.length !== 1 || kids[0].tagName !== 'a') return null;
  const href = String(kids[0].properties.href || '');
  const label = textOf(kids[0]);
  if (!/^(Video —|vimeo video|youtube video|Embed —)/i.test(label)) return null;
  let src = null;
  if (/player\.vimeo\.com|youtube(-nocookie)?\.com\/embed/i.test(href)) src = href;
  else {
    const key = href.replace(/^\.\//, '');
    src = videoSources[key] || null;
  }
  if (!src) return el('p', { className: ['video-pending'], 'data-video-file': href.replace(/^\.\//, '') });
  const title = label.replace(/^(Video —|vimeo video\s*—?|youtube video\s*—?|Embed —)\s*/i, '').replace(/\s*\(.*\)$/, '') || 'Video';
  return el('figure', { className: ['video'] }, [
    el('iframe', { src, title, loading: 'lazy', allow: 'fullscreen; picture-in-picture', allowFullScreen: true, referrerPolicy: 'strict-origin-when-cross-origin' }),
  ]);
}

export default function rehypeProject() {
  return (tree) => {
    const out = [];
    let firstImage = true;
    const kids = tree.children;
    let seenH1 = false;
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.type !== 'element') { out.push(n); continue; }
      if (n.tagName === 'h1' && !seenH1) { seenH1 = true; continue; }
      if (n.tagName === 'p') {
        if (isImageGroup(n)) {
          const count = n.children.filter((c) => c.type === 'element').length;
          if (firstImage) { const img = n.children.find((c) => c.type === 'element'); img.properties.loading = 'eager'; img.properties.fetchpriority = 'high'; firstImage = false; }
          out.push(el('div', { className: ['image-group'], 'data-count': String(count) }, n.children.filter((c) => !isWs(c))));
          continue;
        }
        const v = videoFigure(n);
        if (v) { out.push(v); continue; }
        if (isCredit(n)) {
          const run = [n];
          let j = i + 1;
          while (j < kids.length && (isWs(kids[j]) || (kids[j].type === 'element' && isCredit(kids[j])))) { if (!isWs(kids[j])) run.push(kids[j]); j++; }
          i = j - 1;
          out.push(el('div', { className: ['credits'] }, run));
          continue;
        }
      }
      out.push(n);
    }
    tree.children = collapseEndCredits(out);
  };
}

// The "## Credits" section at the end of a project: the heading is dropped (the "Show all credits" toggle says it) and
// the entries sit behind the toggle.
const END_CREDITS_VISIBLE = 0;
function collapseEndCredits(nodes) {
  const start = nodes.findIndex((n) => n.type === 'element' && n.tagName === 'h2' && /^\s*credits\s*$/i.test(textOf(n)));
  if (start < 0) return nodes;
  let end = nodes.findIndex((n, i) => i > start && n.type === 'element' && /^h[12]$/.test(n.tagName));
  if (end < 0) end = nodes.length;
  const body = nodes.slice(start + 1, end);
  const entries = body.filter((n) => !isWs(n));
  const shown = entries.slice(0, END_CREDITS_VISIBLE);
  const hidden = entries.slice(END_CREDITS_VISIBLE);
  const section = el('section', { className: ['end-credits'] }, [
    ...shown,
    ...(hidden.length ? [el('details', { className: ['credits__more'] }, [
      el('summary', {}, [el('span', { className: ['credits__label'] }, [])]),
      ...hidden,
    ])] : []),
  ]);
  return [...nodes.slice(0, start), section, ...nodes.slice(end)];
}
