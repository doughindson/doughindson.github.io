// Auto-hiding header (Projects list and project pages): it slides away while you scroll down and comes back as soon as
// you scroll up, move the pointer near the top of the window, or tab into it.
export function autoHideHeader(isActive: () => boolean, topY: () => number) {
  const body = document.body;
  let hidden = false;
  let last = scrollY;
  const set = (h: boolean) => {
    if (h === hidden) return;
    hidden = h;
    body.classList.toggle('header-hidden', h);
  };
  addEventListener('scroll', () => {
    const y = scrollY;
    const dy = y - last;
    last = y;
    if (!isActive() || y <= topY() + 20) { set(false); return; }
    if (dy > 3) set(true);
    else if (dy < -3) set(false);
  }, { passive: true });
  addEventListener('mousemove', (e) => { if (e.clientY < 90) set(false); }, { passive: true });
  document.querySelector('.site-nav')?.addEventListener('focusin', () => set(false));
  return { show: () => set(false) };
}
