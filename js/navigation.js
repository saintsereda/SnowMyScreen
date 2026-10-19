/* Floating menu behavior adapted from getexpensa.com. */
(() => {
  const header = document.querySelector('[data-site-navigation]');
  if (!header) return;

  const toggle = header.querySelector('[data-nav-toggle]');
  const menu = header.querySelector('[data-nav-menu]');
  const language = header.querySelector('[data-nav-language]');
  const desktop = window.matchMedia('(min-width: 901px)');
  const hero = document.querySelector('.hero');

  if (hero) {
    const updateDownload = () => header.classList.toggle('is-past-hero', hero.getBoundingClientRect().bottom <= 0);
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-past-hero', entry.boundingClientRect.bottom <= 0);
    }).observe(hero);
    window.addEventListener('pageshow', updateDownload);
  }

  function closeMenu(restoreFocus = false) {
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    if (restoreFocus) toggle.focus();
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.hidden = expanded;
    language.open = false;
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  language.addEventListener('toggle', () => {
    language.querySelector('summary').setAttribute('aria-expanded', String(language.open));
    if (language.open) closeMenu();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-navigation__capsule')) closeMenu();
    if (!language.contains(event.target)) language.open = false;
  });
  document.addEventListener('focusin', event => {
    if (!header.contains(event.target)) {
      closeMenu();
      language.open = false;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!menu.hidden) closeMenu(true);
    if (language.open) {
      language.open = false;
      language.querySelector('summary').focus();
    }
  });
  desktop.addEventListener('change', () => closeMenu());
})();
