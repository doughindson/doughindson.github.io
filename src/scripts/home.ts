// Scroll-driven homepage: About (above) ↔ hero sentence ↔ Projects (below).
//  - Scrolling only moves between About, the hero and Projects. In the hero, roles open one at a time as the pointer
//    moves down the page or hovers a role (tap on touch screens, focus with the keyboard).
//  - The hero ↔ About and hero ↔ Projects switches are "magnetic": scroll past a threshold and the page snaps to the
//    other state while things fade / scale on a timer (no half-way overlaps).
//  - The URL, document title and nav follow the active zone; role names are clickable / hoverable / focusable.
import { autoHideHeader } from './header-autohide';

const ZONES = {
  about: { path: '/about', title: 'About — Doug Hindson' },
  hero: { path: '/', title: 'Doug Hindson — Creative Director, Designer, Illustrator & Photographer' },
  projects: { path: '/projects', title: 'Projects — Doug Hindson' },
} as const;
type Zone = keyof typeof ZONES;
type Mode = 'about' | 'hero' | 'projects';

const root = document.documentElement;
const body = document.body;
const track = document.querySelector<HTMLElement>('[data-hero-track]')!;
const sections: Record<Zone, HTMLElement> = {
  about: document.getElementById('about')!,
  hero: document.getElementById('top')!,
  projects: document.getElementById('projects')!,
};
const sentence = document.querySelector<HTMLElement>('[data-sentence]')!;
const nameEl = sentence.querySelector<HTMLElement>('.sentence__name')!;
const navName = document.querySelector<HTMLElement>('.nav-name')!;
const navProjects = document.querySelector<HTMLElement>('.nav-projects')!;
const navAbout = document.querySelector<HTMLElement>('.nav-about')!;
const restEls = [...sentence.querySelectorAll<HTMLElement>('.sentence__is, .role')]; // the sentence apart from the name
const aboutTitle = document.querySelector<HTMLElement>('[data-about-title]')!;
const aboutAside = document.querySelector<HTMLElement>('.about__aside')!;
const bio = document.querySelector<HTMLElement>('.bio')!;
// Two-column About (wide windows): the left column is pinned. Otherwise About is one column that scrolls normally.
const asidePinned = () => getComputedStyle(aboutAside).position === 'sticky';
const roleEls = [...document.querySelectorAll<HTMLElement>('[data-role]')];
const roleButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-role-button]')];
const interactive = root.classList.contains('js-scroll'); // JS on and motion allowed
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SNAP_MS = 1250; // longest transition: sentence scale (0.8s) + its 0.35s delay when leaving About
const FADE_MS = 400; // fade before the page jumps

const bootAt = performance.now();
let header: { show: () => void } | undefined;
let zone: Zone = 'hero';
let mode: Mode = 'hero';
let activeRole = -1;
let locked = false;
let lastY = scrollY;
let lockTimer: number | undefined;
let settleTimer: number | undefined;
let morphTimer: number | undefined;

const maxScroll = () => track.offsetHeight - innerHeight;
const heroTop = () => track.getBoundingClientRect().top + scrollY;
const trackEnd = () => heroTop() + maxScroll();
const scrollToY = (y: number, smooth = true) => scrollTo({ top: y, behavior: smooth && !reduced ? 'smooth' : 'auto' });
// (layout positions, not on-screen ones: the Projects list and the bio are shifted while they are being pulled)
function docTop(el: HTMLElement) {
  let y = 0;
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
  return y;
}
const zoneY = (z: Zone) => (z === 'hero' ? heroTop() : z === 'about' ? 0 : docTop(sections[z]));

// Role slideshows: while a role is open its frames (src/assets/roles/<slug>/) take turns, each on screen for the role's
// hold time (data-hold, from roles.ts), looping, and start again from the first each time it opens. How one gives way to
// the next (fade, zoom, slide, focus, cut) is CSS, keyed on [data-current] / [data-prev]. A frame is skipped until its
// image has loaded, so a transition never lands on a blank. (Reduced motion: the first frame only.)
let slideTimer: number | undefined;
function playSlides(i: number) {
  window.clearTimeout(slideTimer);
  roleEls.forEach((el) => el.querySelectorAll('picture').forEach((p) => ['data-current', 'data-prev', 'data-still'].forEach((at) => p.removeAttribute(at))));
  if (i < 0) return;
  const media = roleEls[i].querySelector<HTMLElement>('.role__media')!;
  const frames = [...media.querySelectorAll<HTMLElement>('picture')];
  if (!frames.length) return;
  frames[0].setAttribute('data-current', '');
  frames[0].setAttribute('data-still', ''); // the first frame opens with the role, without a transition of its own
  if (frames.length < 2 || reduced) return;
  const hold = Number(media.dataset.hold) || 1200;
  let at = 0;
  const advance = () => {
    const next = (at + 1) % frames.length;
    const img = frames[next].querySelector('img');
    if (img && !(img.complete && img.naturalWidth)) { slideTimer = window.setTimeout(advance, 150); return; } // still loading
    frames.forEach((f) => f.removeAttribute('data-prev'));
    frames[at].removeAttribute('data-current');
    frames[at].removeAttribute('data-still');
    frames[at].setAttribute('data-prev', '');
    frames[next].setAttribute('data-current', '');
    at = next;
    slideTimer = window.setTimeout(advance, hold);
  };
  slideTimer = window.setTimeout(advance, hold);
}

function setRole(i: number) {
  if (i === activeRole) return;
  activeRole = i;
  roleEls.forEach((el, k) => (k === i ? el.setAttribute('data-active', '') : el.removeAttribute('data-active')));
  playSlides(i);
}

function setZone(z: Zone) {
  if (z === zone) return;
  // The "Projects" label slides between its place at the bottom of the window and the stacked header (top / bottom
  // positions can't transition, so it is measured before and after and animated across the difference).
  const slide = interactive && performance.now() - bootAt > 300 && (z === 'projects' || zone === 'projects') ? navProjects : null; // (not on load)
  slide?.getAnimations().forEach((a) => a.cancel());
  const from = slide?.getBoundingClientRect().top ?? 0;
  zone = z;
  body.dataset.zone = z;
  if (slide) {
    const dy = from - slide.getBoundingClientRect().top;
    // up: in step with the name landing on its label; down: quick off the mark, so it is clear of the name growing back
    if (dy) slide.animate([{ translate: `0 ${dy}px` }, { translate: '0 0' }], z === 'projects'
      ? { duration: 800, easing: 'cubic-bezier(0.65, 0, 0.25, 1)' }
      : { duration: 800, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
  }
  document.title = ZONES[z].title;
  // (the Projects filter, if any, stays in the URL: /projects?role=…)
  history.replaceState(null, '', ZONES[z].path + (z === 'projects' ? (window as any).projectsFilter?.query() ?? '' : ''));
  document.querySelectorAll<HTMLElement>('[data-zone-link]').forEach((a) => {
    const target = a.dataset.zoneLink === 'top' ? 'hero' : (a.dataset.zoneLink as Zone);
    if (target === z && z !== 'hero') a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

// While About <-> Projects slide into each other the sentence keeps its small About-column pose (frozen, because the page
// scroll position jumps underneath it); null the rest of the time.
let heldTransform: string | null = null;

// Where the sentence has to sit to overlay the (hidden) About placeholder, as a CSS transform.
function aboutPose(): string {
  const target = aboutTitle.getBoundingClientRect(); // follows the sticky / scrolling About column
  const scale = parseFloat(getComputedStyle(aboutTitle).fontSize) / parseFloat(getComputedStyle(sentence).fontSize);
  return `translate(${target.left - sentence.offsetLeft}px, ${target.top - sentence.offsetTop}px) scale(${scale})`;
}

// The About pose as it will be at scroll position 0 (measured with a jump to the top and straight back, never painted).
function aboutPoseAtTop(): string {
  const y = scrollY;
  scrollTo({ top: 0, behavior: 'auto' });
  const pose = aboutPose();
  scrollTo({ top: y, behavior: 'auto' });
  return pose;
}

// Place the (fixed) sentence: big and centred in hero mode, small over the About placeholder in about mode,
// and in projects mode only "Doug Hindson" travels, onto the nav label.
function placeSentence() {
  sentence.style.transform = heldTransform ?? (mode === 'about' ? aboutPose() : 'none');
  if (mode === 'projects' && carrying) nameEl.style.transform = ''; // the whole sentence is carrying it (shrinkOntoLabel)
  else if (mode === 'projects') {
    const nav = navName.getBoundingClientRect();
    const cs = getComputedStyle(navName);
    // The sentence may itself be scaled (About pose): convert the wanted on-screen move into the name's local units.
    const box = sentence.getBoundingClientRect();
    const s = box.width / sentence.offsetWidth || 1;
    const originLeft = box.left + s * nameEl.offsetLeft;
    const originCY = box.top + s * (nameEl.offsetTop + nameEl.offsetHeight / 2);
    const dx = (nav.left + parseFloat(cs.paddingLeft) - originLeft) / s;
    const dy = (nav.top + nav.height / 2 - originCY) / s;
    const k = parseFloat(cs.fontSize) / (parseFloat(getComputedStyle(sentence).fontSize) * s);
    nameEl.style.transform = `translate(${dx}px, ${dy}px) scale(${k})`;
  } else nameEl.style.transform = '';
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  // One-column About (phones, tablets): "Doug Hindson" scrolls up with the column until it reaches the header, then stays
  // anchored there under "About" while the rest of the sentence fades out before it can reach the name.
  const anchor = mode === 'about' && heldTransform === null && !asidePinned();
  root.classList.toggle('about-anchor', anchor);
  if (anchor) {
    const s = sentence.getBoundingClientRect().width / sentence.offsetWidth || 1;
    const top = sentence.getBoundingClientRect().top + s * nameEl.offsetTop; // where the name would be, scrolling freely
    const pin = navAbout.getBoundingClientRect().bottom + 2;
    nameEl.style.transform = top < pin ? `translateY(${(pin - top) / s}px)` : '';
    const rest = String(clamp01((top - pin) / 40));
    restEls.forEach((el) => (el.style.opacity = rest));
    sentence.style.opacity = '1';
    return;
  }
  restEls.forEach((el) => (el.style.opacity = ''));
  // about (two columns): fades as the About column slides under the header
  sentence.style.opacity = mode === 'about' && heldTransform === null ? String(clamp01((aboutTitle.getBoundingClientRect().top - (asidePinned() ? 70 : 40)) / 50)) : '1';
}

// Re-apply the pose with no transitions (used when nothing visible changes, e.g. once the sentence is hidden).
function placeSentenceInstantly() {
  sentence.style.transition = 'none';
  nameEl.style.transition = 'none';
  placeSentence();
  void nameEl.offsetWidth;
  sentence.style.transition = '';
  nameEl.style.transition = '';
}

function setMode(next: Mode, animate: boolean) {
  if (next === mode && body.dataset.mode) return;
  header?.show(); // every change of section starts with the header in view
  const prev = mode;
  if (prev === 'about' && next === 'projects') {
    heldTransform = sentence.style.transform; // stay small while "Doug Hindson" slides to its label
  } else if (prev === 'projects' && next === 'about') {
    // Slide back: first aim "Doug Hindson" at its nav label under the small About pose (no transition), then let it go home.
    heldTransform = aboutPoseAtTop();
    placeSentenceInstantly();
  }
  if (prev === 'projects' && next === 'hero') {
    // Back to the neutral hero (no role open). Closing the open role changes the sentence's layout, so re-aim the name at its
    // nav label under the new layout first (no transition), then let it travel home.
    setRole(-1);
    root.classList.add('settle');
    nameEl.style.transition = 'none';
    placeSentence();
    void nameEl.offsetWidth;
    nameEl.style.transition = '';
  }
  const returnFrom = prev === 'projects' && next === 'hero' && animate ? nameEl.style.transform : '';
  mode = next;
  body.dataset.mode = next;
  // Settle the roles first (no animation) so the sentence's layout - and therefore where "Doug Hindson" sits - is final
  // before we compute where it has to travel to.
  if (next === 'about') setRole(-1); // (entering Projects keeps whatever role is open, so the sentence's layout doesn't change under the travelling name)
  // Move the nav to the new zone straight away (otherwise the stacked Projects label lingers under the travelling name).
  if (interactive) setZone(next === 'hero' ? 'hero' : next);
  root.classList.add('settle');
  window.clearTimeout(settleTimer);
  if (animate) settleTimer = window.setTimeout(() => root.classList.remove('settle'), SNAP_MS);
  else requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('settle')));
  if (animate) {
    root.classList.remove('no-reveal'); // from now on the Projects label waits for the name to land
    sentence.classList.add('is-morphing');
    window.clearTimeout(morphTimer); // a chained transition must not inherit the previous one's end-of-animation cleanup
    morphTimer = window.setTimeout(() => sentence.classList.remove('is-morphing'), SNAP_MS);
  }
  if (next === 'projects' || prev === 'projects') {
    sentence.classList.add('is-fading');
    window.setTimeout(() => sentence.classList.remove('is-fading'), SNAP_MS);
  }
  placeSentence();
  if (returnFrom) growFromLabel(returnFrom);
  else if (prev === 'hero' && next === 'projects' && animate) shrinkOntoLabel();
}

// Into Projects from the hero: the reverse. The whole sentence shrinks onto the nav label with "Doug Hindson" (the rest
// fading out on the way), and once it has landed the move is handed back to the name alone, which stays on the label.
let carrying = false;
// (only ever cancel this one: cancelling the sentence's CSS transitions too would end its timed hide/show at once)
let sentenceMove: Animation | undefined;
function shrinkOntoLabel() {
  const to = nameEl.style.transform; // where placeSentence() aimed the name
  carrying = true;
  nameEl.style.transition = 'none';
  nameEl.style.transform = '';
  void nameEl.offsetWidth;
  nameEl.style.transition = '';
  const origin = `${nameEl.offsetLeft}px ${nameEl.offsetTop + nameEl.offsetHeight / 2}px`;
  sentenceMove?.cancel();
  const anim = sentenceMove = sentence.animate([{ transformOrigin: origin, transform: 'none' }, { transformOrigin: origin, transform: to }], { duration: 800, easing: 'cubic-bezier(0.65, 0, 0.25, 1)', fill: 'forwards' });
  const handBack = () => {
    if (!carrying) return;
    carrying = false;
    anim.cancel(); // (first: the name's aim is measured against the unscaled sentence)
    placeSentenceInstantly();
  };
  anim.finished.then(handBack, () => { carrying = false; });
  window.setTimeout(handBack, 900); // (also when frames aren't being drawn, e.g. a background tab)
}

// Back from Projects to the hero: rather than "Doug Hindson" travelling home alone while the rest of the sentence fades
// in where it stands, the whole sentence grows out of the nav label together. The name's own move is handed to the
// sentence: the same translate + scale, about the same point (the name's left middle), applied to all of it.
function growFromLabel(from: string) {
  carrying = false;
  nameEl.style.transition = 'none';
  nameEl.style.transform = '';
  void nameEl.offsetWidth;
  nameEl.style.transition = '';
  const origin = `${nameEl.offsetLeft}px ${nameEl.offsetTop + nameEl.offsetHeight / 2}px`;
  sentenceMove?.cancel();
  sentenceMove = sentence.animate([{ transformOrigin: origin, transform: from }, { transformOrigin: origin, transform: 'none' }], { duration: 900, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
  sentence.classList.add('is-returning');
  window.setTimeout(() => sentence.classList.remove('is-returning'), SNAP_MS);
}

function lock() {
  locked = true;
  root.classList.add('is-locked');
  window.clearTimeout(lockTimer);
  lockTimer = window.setTimeout(() => { locked = false; root.classList.remove('is-locked'); lastY = scrollY; update(); }, SNAP_MS + 150);
}

function snapTo(next: Mode) {
  const from = mode;
  if (from === 'about' && next === 'hero' && asidePinned()) {
    // pull any overshoot back to the end of About so the text fades out exactly where it was meant to rest
    const footerH = parseFloat(getComputedStyle(root).getPropertyValue('--footer-height'));
    const end = bio.getBoundingClientRect().bottom + scrollY - OVERSHOOT_ROOM() - (innerHeight - footerH);
    if (scrollY > end && end > 0) scrollTo({ top: end, behavior: 'auto' });
  }
  if (from === 'hero' && next === 'projects') scrollTo({ top: Math.min(scrollY, trackEnd()), behavior: 'auto' }); // pull back any overshoot
  lock();
  setMode(next, true);
  // The jump is instant and happens once whatever is leaving has faded: only the (fixed) sentence is ever visible during it.
  const y = next === 'about' ? 0 : next === 'projects' ? zoneY('projects') : heroTop();
  const delay = from === 'about' && next === 'hero' ? 350 : from === 'hero' && next === 'projects' ? FADE_MS : from === 'projects' ? 350 : 0;
  window.setTimeout(() => scrollToY(y, false), delay);
}

function update() {
  const y = scrollY;
  const down = y > lastY;
  lastY = y;
  // (ignore the first moments after load: the tail of the scroll that brought us here from a project page must not snap on)
  if (interactive && !locked && performance.now() - bootAt > 800) {
    // magnetic thresholds
    if (mode === 'hero' && y < heroTop() - 40 && !down && y < trackEnd()) { snapTo('about'); return; }
    // Snap to the hero once the end of About is reached. Desktop: the bio's last line level with the left column's last
    // line (the last moment the sticky column is still pinned). Mobile: the bottom of the About section.
    // If all of About fits in the window, the first scroll down snaps straight away.
    // (wheel and touch pulls there are handled below, with resistance; this catches keys and flings)
    if (mode === 'about' && down && y > aboutEnd() + 150) { snapTo('hero'); return; }
    // Past the last role: snap on to Projects. At the top of Projects, scrolling up snaps back to the last role.
    if (mode === 'hero' && down && y > trackEnd() + 30) { snapTo('projects'); return; }
    // (wheel and touch pulls at the top of Projects are handled below, with resistance; this catches keys and flings)
    if (mode === 'projects' && !down && y < zoneY('projects') - 150) { snapTo('hero'); return; }
  }
  const mid = y + innerHeight / 2;
  const next: Zone = interactive ? (mode === 'about' ? 'about' : mode === 'projects' ? 'projects' : 'hero') : mid < heroTop() ? 'about' : mid >= zoneY('projects') ? 'projects' : 'hero';
  setZone(next);
  if (interactive) {
    if (mode === 'about') setRole(-1);
    placeSentence();
  }
}

const OVERSHOOT_ROOM = () => Math.round(innerHeight * 0.5);
function aboutEnd() {
  const footerH = parseFloat(getComputedStyle(root).getPropertyValue('--footer-height'));
  return Math.max(1, asidePinned() ? docTop(bio) + bio.offsetHeight - OVERSHOOT_ROOM() - (innerHeight - footerH) : heroTop() - innerHeight + 2);
}

// Desktop: the left About column is centred between the About / Projects labels, so start the bio at the same height.
function alignBio() {
  aboutAside.style.justifyContent = '';
  aboutAside.style.paddingTop = '';
  if (!asidePinned()) { bio.style.paddingTop = ''; bio.style.paddingBottom = ''; return; }
  const first = aboutAside.firstElementChild as HTMLElement;
  const last = aboutAside.lastElementChild as HTMLElement;
  const leftH = last.getBoundingClientRect().bottom - first.getBoundingClientRect().top;
  const space = aboutAside.clientHeight; // between the About and Projects labels
  bio.style.paddingTop = '0px';
  bio.style.paddingBottom = '0px';
  // (the bio's own box stretches to the grid row, so measure its content: first to last child)
  const bioH = (bio.lastElementChild as HTMLElement).getBoundingClientRect().bottom - (bio.firstElementChild as HTMLElement).getBoundingClientRect().top;
  if (bioH <= space) {
    // Everything fits: centre both columns together, tops aligned, so the whole About block sits in the middle.
    const offset = (space - Math.max(leftH, bioH)) / 2;
    aboutAside.style.justifyContent = 'flex-start';
    aboutAside.style.paddingTop = `${offset}px`;
    bio.style.paddingTop = `${offset}px`;
    bio.style.paddingBottom = `${offset + OVERSHOOT_ROOM()}px`;
    return;
  }
  // The bio is taller than the window: centre the left column, start the bio level with it, and give the bio the same
  // offset below so its last line reaches the left column's last line at the end of the About scroll.
  const offset = Math.max(0, (space - leftH) / 2);
  bio.style.paddingTop = `${offset}px`;
  // Extra room below keeps the sticky column pinned while a quick scroll overshoots the end of About.
  bio.style.paddingBottom = `${offset + OVERSHOOT_ROOM()}px`;
}
alignBio();
// Exact centring: tell the CSS how wide a classic scrollbar is (0 for overlay scrollbars).
const syncScrollbar = () => root.style.setProperty('--sbw', `${innerWidth - root.clientWidth}px`);
syncScrollbar();
addEventListener('resize', syncScrollbar);

let interacted = false;
['wheel', 'touchstart', 'keydown', 'mousedown'].forEach((t) => addEventListener(t, () => { interacted = true; }, { once: true, passive: true }));
// Web fonts change text metrics (and so the layout) after load: re-measure, and re-land on the starting zone if the
// visitor hasn't started scrolling yet, so a layout shift can never look like a scroll.
document.fonts?.ready.then(() => {
  alignBio();
  if (!interacted && typeof landOnInitialZone === 'function') landOnInitialZone();
});
addEventListener('resize', alignBio);

// While the About <-> hero transition runs the page must not move, so the About text can fade out where it stands.
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
const hold = (e: Event) => { if (locked) e.preventDefault(); };
addEventListener('wheel', hold, { passive: false });
addEventListener('touchmove', hold, { passive: false });
addEventListener('keydown', (e) => { if (locked && SCROLL_KEYS.has(e.key) && !(e.target as HTMLElement)?.closest?.('input, textarea')) e.preventDefault(); });

// The ends that lead back to the homepage resist a little: the top of the Projects list and the end of About. Scrolling
// on past the edge makes the content give (rubber band) and only a pull past PULL_PX lets go and snaps to the homepage;
// a shorter pull springs back. A scroll that arrives at the edge already moving (a short list or bio makes that easy),
// and its momentum, never counts: only a fresh gesture made at the edge.
const PULL_PX = 220, TOUCH_PULL_PX = 140;
function edgeResistance(o: { mode: Mode; dir: 1 | -1; edge: () => number; el: HTMLElement }) {
  // dir: -1 = the edge is a top (pulling up past it), 1 = the edge is a bottom (pulling down past it)
  let pull = 0, pullTimer: number | undefined, lastWheelAt = 0, lastDelta = 0, fresh = false, carried = false, slowing = false;
  const atEdge = () => interactive && mode === o.mode && !locked && (o.dir < 0 ? scrollY <= o.edge() + 1 : scrollY >= o.edge() - 1);
  const setPull = (px: number) => {
    pull = px;
    o.el.classList.remove('pull-release');
    o.el.style.setProperty('--pull', `${Math.round(-o.dir * Math.min(px, PULL_PX) * 0.3)}px`);
  };
  const release = () => {
    window.clearTimeout(pullTimer);
    if (!pull) return;
    pull = 0;
    o.el.classList.add('pull-release');
    o.el.style.setProperty('--pull', '0px');
  };
  const pullFurther = (px: number, threshold: number) => {
    setPull(px);
    if (px >= threshold) { release(); fresh = false; snapTo('hero'); }
  };
  addEventListener('wheel', (e) => {
    const now = performance.now();
    const gap = now - lastWheelAt;
    lastWheelAt = now;
    const d = o.dir * e.deltaY * (e.deltaMode === 1 ? 16 : 1); // > 0: towards the edge
    const prev = lastDelta;
    lastDelta = d;
    // (a scroll still running from before, or during, a transition here counts as carried in)
    if (!interactive || mode !== o.mode || locked) { carried = true; slowing = false; fresh = false; return; }
    if (d <= 0) { fresh = false; release(); unhold(); return; }
    // never let a wheel step carry the page past the edge in one go
    const edge = o.edge();
    if (o.dir < 0 ? scrollY - d < edge : scrollY + d > edge) {
      e.preventDefault();
      if (Math.abs(scrollY - edge) > 1) { scrollTo({ top: edge, behavior: 'auto' }); holdAtEdge(); carried = true; slowing = false; return; }
    }
    if (!atEdge()) { carried = true; slowing = false; return; }
    e.preventDefault();
    holdAtEdge();
    // fresh: after a pause, or speeding up again once the arriving scroll has started slowing (momentum only slows)
    if (gap > 150) { carried = false; fresh = true; }
    // (momentum is noisy, wobbling by a few px as it slows: only a clear jump in speed is a new swipe, or the list would
    // twitch with stray little pulls as the scroll comes to rest)
    if (d < prev - 1) slowing = true;
    if (d > prev * 1.6 + 6 && (!carried || slowing)) { carried = false; fresh = true; }
    if (!fresh) return;
    pullFurther(pull + d, PULL_PX);
    window.clearTimeout(pullTimer);
    pullTimer = window.setTimeout(() => { fresh = false; release(); }, 300);
  }, { passive: false });
  let touchY = 0, touchFromEdge = false;
  addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; touchFromEdge = atEdge(); }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (!touchFromEdge || !atEdge()) return;
    const dy = -o.dir * (e.touches[0].clientY - touchY); // > 0: dragging the content away from the edge
    if (dy <= 0) { release(); return; } // ordinary scrolling
    e.preventDefault();
    pullFurther(dy, TOUCH_PULL_PX);
  }, { passive: false });
  addEventListener('touchend', release, { passive: true });
  // Chrome lets a scroll that started away from the edge run on regardless of preventDefault (its later wheel events
  // can't be cancelled), so it would overshoot and be pulled back every frame: a jitter. Instead, the moment it reaches the
  // edge the page is held still (no scrolling at all) until the wheel goes quiet or turns back.
  addEventListener('scroll', () => {
    if (!interactive || mode !== o.mode || locked || performance.now() - lastWheelAt > 120) return;
    const edge = o.edge();
    if (o.dir < 0 ? scrollY < edge - 1 : scrollY > edge + 1) { scrollTo({ top: edge, behavior: 'auto' }); holdAtEdge(); }
  }, { passive: true });
}
let holdTimer: number | undefined;
function holdAtEdge() {
  root.classList.add('edge-hold');
  window.clearTimeout(holdTimer);
  holdTimer = window.setTimeout(unhold, 160); // released once the wheel (and its momentum) has gone quiet
}
function unhold() {
  window.clearTimeout(holdTimer);
  root.classList.remove('edge-hold');
}
edgeResistance({ mode: 'projects', dir: -1, edge: () => zoneY('projects'), el: document.querySelector<HTMLElement>('.zone-projects')! });
edgeResistance({ mode: 'about', dir: 1, edge: aboutEnd, el: bio });

// Projects list: the header slides away while scrolling down the grid and returns on scroll up / pointer near the top.
header = autoHideHeader(() => interactive && mode === 'projects' && !locked, () => zoneY('projects'));

let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; update(); });
}, { passive: true });
addEventListener('resize', () => { if (interactive) placeSentence(); update(); });

// Start where the URL says: /about, /projects or the hero.
history.scrollRestoration = 'manual';
const initial = (Object.keys(ZONES) as Zone[]).find((z) => ZONES[z].path === location.pathname) ?? 'hero';
zone = initial === 'hero' ? 'about' : 'hero'; // force setZone() to run once
body.dataset.mode = '';
setMode(initial === 'about' ? 'about' : initial === 'projects' ? 'projects' : 'hero', false);
function landOnInitialZone() {
  scrollToY(zoneY(initial), false);
  lastY = scrollY;
}
landOnInitialZone();
setZone(initial);
update();

// Navigation links. Same choreography as the scroll snaps (fade / scale first, then an instant jump). Going straight between
// About and Projects would cross two unrelated layouts, so those clicks pass through the hero (one transition, then the next).
const modeFor = (z: Zone): Mode => (z === 'about' ? 'about' : z === 'projects' ? 'projects' : 'hero');
function navigate(z: Zone) {
  const target = modeFor(z);
  if (target === mode) { scrollToY(zoneY(z), false); return; }
  const from = mode;
  lock();
  setMode(target, true);
  if (from === 'about' && target === 'projects') {
    // "Doug Hindson" slides from the About column to its label; the page jumps once the About text has faded, then the
    // sentence is reset (it is hidden by then) so later transitions start from the normal pose.
    window.setTimeout(() => scrollToY(zoneY('projects'), false), 350);
    window.setTimeout(() => { heldTransform = null; placeSentenceInstantly(); }, 1000);
    return;
  }
  if (from === 'projects' && target === 'about') {
    window.setTimeout(() => { scrollToY(0, false); heldTransform = null; placeSentenceInstantly(); }, 350);
    return;
  }
  const delay = from === 'projects' || from === 'about' ? 350 : target === 'projects' ? FADE_MS : 0;
  window.setTimeout(() => scrollToY(zoneY(z), false), delay);
}
document.querySelectorAll<HTMLAnchorElement>('[data-zone-link]').forEach((a) => {
  a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const z = a.dataset.zoneLink === 'top' ? 'hero' : (a.dataset.zoneLink as Zone);
    if (interactive) navigate(z);
    else scrollToY(zoneY(z));
  });
});
// On About, "Doug Hindson" at the top of the column is a way back to the homepage.
nameEl.addEventListener('click', () => { if (interactive && mode === 'about') navigate('hero'); });

// Roles. With a mouse: the page is split into horizontal bands (top band = the intro line, then one per role) and the band
// under the pointer opens; hovering a role name opens that one. Touch: tap a role to open / close it. Keyboard: focus opens.
if (interactive) {
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let pending: number | undefined;
  const want = (i: number) => {
    window.clearTimeout(pending);
    pending = window.setTimeout(() => { if (mode === 'hero' && !locked) setRole(i); }, 0); // switch as soon as the pointer crosses into a band
  };
  if (canHover) {
    // Opening a role moves the words under a still pointer, which could open another role and flip straight back. So a
    // band holds on a little past its edges, and after each switch the pointer has to really move before the next one.
    const HOLD_BAND = 0.2; // of a band's height
    const MOVE_PX = 12;
    let switchedAtY = NaN;
    addEventListener('mousemove', (e) => {
      if (mode !== 'hero' || locked) return;
      if (Math.abs(e.clientY - switchedAtY) < MOVE_PX) return;
      const over = (e.target as HTMLElement).closest?.<HTMLElement>('[data-role-button]');
      let next: number;
      if (over) next = Number(over.dataset.roleButton);
      else {
        const css = getComputedStyle(root);
        const top = parseFloat(css.getPropertyValue('--header-height'));
        const bottom = innerHeight - parseFloat(css.getPropertyValue('--footer-height'));
        const t = (e.clientY - top) / (bottom - top);
        if (t < 0) return; // over the header: leave things as they are
        const n = roleEls.length + 1;
        const cur = activeRole + 1;
        const band = Math.min(n - 1, Math.floor(t * n));
        next = (t > (cur - HOLD_BAND) / n && t < (cur + 1 + HOLD_BAND) / n ? cur : band) - 1;
        // below the last role (its image too, when open): everything closes again
        if (e.clientY > roleEls[roleEls.length - 1].getBoundingClientRect().bottom + 24) next = -1;
      }
      if (next === activeRole) return;
      switchedAtY = e.clientY;
      want(next);
    }, { passive: true });
    root.addEventListener('mouseleave', () => { switchedAtY = NaN; want(-1); });
  } else {
    addEventListener('click', (e) => { if (mode === 'hero' && !(e.target as HTMLElement).closest('[data-role-button]')) setRole(-1); });
  }
  // Clicking a role goes to the Projects list filtered to it (a role with no projects yet shows them all).
  // Touch: the first tap opens the role's image, tapping the open role again goes to its projects.
  const goToRole = (i: number) => {
    const slug = roleButtons[i].dataset.roleSlug ?? 'all';
    (window as any).projectsFilter?.set(slug);
    navigate('projects');
  };
  roleButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (mode !== 'hero' || locked) return;
      if (canHover || activeRole === i) goToRole(i);
      else setRole(i);
    });
    // the open role's image is a way in too
    roleEls[i].querySelector<HTMLElement>('.role__media')?.addEventListener('click', () => {
      if (mode === 'hero' && !locked && activeRole === i) goToRole(i);
    });
    // keyboard focus only (a tap also focuses the button, and would otherwise open it just before the tap toggles it shut)
    btn.addEventListener('focus', () => { if (mode === 'hero' && btn.matches(':focus-visible')) setRole(i); });
  });
}
