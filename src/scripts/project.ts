// Project pages: the header slides away while scrolling down and returns on the way up. The "Projects" link at the end
// of the page slides up into the header of the Projects list when clicked (cross-document view transition).
import { autoHideHeader } from './header-autohide';

autoHideHeader(() => true, () => 0);

const endLink = document.querySelector<HTMLElement>('[data-project-end]');
endLink?.addEventListener('click', () => {
  // the end link becomes the list's header "Projects" label; the page's own header label steps aside for the transition
  document.querySelector<HTMLElement>('.site-nav .nav-projects')?.style.setProperty('view-transition-name', 'none');
  endLink.style.setProperty('view-transition-name', 'nav-projects');
  // a header that has slid away would otherwise fly back in from above: let it simply fade in
  if (document.body.classList.contains('header-hidden')) {
    document.querySelectorAll<HTMLElement>('.site-nav .site-header-bg, .site-nav .nav-about, .site-nav .nav-name').forEach((el) => el.style.setProperty('view-transition-name', 'none'));
  }
});
