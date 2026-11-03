// Projects list: filter the tiles by role (All / Creative Direction / Design / Illustration …) and "Back to top".
// The active filter lives in the URL as /projects?role=<slug>, so it can be shared and survives a reload.
// The homepage (scripts/home.ts) reads and sets it through window.projectsFilter.
const nav = document.querySelector<HTMLElement>('[data-project-filter]');
const grid = document.querySelector<HTMLElement>('.project-grid');
const zone = document.getElementById('projects');

if (nav && grid && zone) {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('[data-filter]')];
  const items = [...grid.querySelectorAll<HTMLElement>('li[data-roles]')];
  const available = new Set(links.map((a) => a.dataset.filter!));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 'all';

  const fromUrl = () => {
    const role = new URLSearchParams(location.search).get('role') ?? 'all';
    return available.has(role) ? role : 'all';
  };
  const query = () => (current === 'all' ? '' : `?role=${current}`);

  function apply(slug: string, animate = true) {
    current = available.has(slug) ? slug : 'all'; // a role with no projects yet shows everything
    items.forEach((li) => { li.hidden = current !== 'all' && !li.dataset.roles!.split(' ').includes(current); });
    links.forEach((a) => (a.dataset.filter === current ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    if (location.pathname === '/projects') history.replaceState(history.state, '', `/projects${query()}`);
    if (animate && !reduced) grid!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }

  links.forEach((a) => a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    apply(a.dataset.filter!);
  }));
  addEventListener('popstate', () => apply(fromUrl(), false));

  document.querySelector('[data-back-to-top]')?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo({ top: zone.getBoundingClientRect().top + scrollY, behavior: reduced ? 'auto' : 'smooth' });
  });

  (window as any).projectsFilter = { set: (slug: string) => apply(slug, false), query, has: (slug: string) => available.has(slug) };
  apply(fromUrl(), false);
}
