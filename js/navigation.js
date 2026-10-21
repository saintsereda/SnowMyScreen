/* Shared navigation, with a progressive BubbleMenu overlay on mobile. */
(() => {
  const header = document.querySelector('[data-site-navigation]');
  if (!header) return;

  const toggle = header.querySelector('[data-nav-toggle]');
  const menu = header.querySelector('[data-nav-menu]');
  const language = header.querySelector('[data-nav-language]');
  const brand = header.querySelector('.site-navigation__brand');
  const desktop = window.matchMedia('(min-width: 901px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  let expanded = false;
  let renderId = 0;
  let lockedSiblings = null;
  let motionRequested = false;

  if (hero) {
    const updateDownload = () => header.classList.toggle('is-past-hero', hero.getBoundingClientRect().bottom <= 0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        header.classList.toggle('is-past-hero', entry.boundingClientRect.bottom <= 0);
      }).observe(hero);
    } else {
      window.addEventListener('scroll', updateDownload, { passive: true });
      updateDownload();
    }
    window.addEventListener('pageshow', updateDownload);
  }

  function loadMotion() {
    if (motionRequested || desktop.matches || !header.dataset.navMotion) return;
    motionRequested = true;
    const script = document.createElement('script');
    script.src = header.dataset.navMotion;
    script.async = true;
    script.addEventListener('error', () => { motionRequested = false; script.remove(); }, { once: true });
    document.head.append(script);
  }

  function lockPage() {
    if (lockedSiblings) return;
    lockedSiblings = [...document.body.children]
      .filter(element => element !== header && !['SCRIPT', 'STYLE'].includes(element.tagName))
      .map(element => [element, element.inert]);
    lockedSiblings.forEach(([element]) => { element.inert = true; });
    document.documentElement.classList.add('has-bubble-menu');
    header.setAttribute('role', 'dialog');
    header.setAttribute('aria-modal', 'true');
    header.setAttribute('aria-label', toggle.getAttribute('aria-label'));
  }

  function unlockPage() {
    lockedSiblings?.forEach(([element, inert]) => { element.inert = inert; });
    lockedSiblings = null;
    document.documentElement.classList.remove('has-bubble-menu');
    header.removeAttribute('role');
    header.removeAttribute('aria-modal');
    header.removeAttribute('aria-label');
  }

  function renderMenu(instant = false) {
    const request = ++renderId;
    const complete = () => {
      if (request !== renderId) return;
      menu.hidden = !expanded;
      menu.inert = !expanded;
      if (!expanded) unlockPage();
    };
    const event = new CustomEvent('wonderfall:menu-toggle', {
      cancelable: true,
      detail: { open: expanded, instant: instant || reduced.matches || desktop.matches, complete }
    });
    // If motion hasn't loaded, the same navigation works immediately.
    if (header.dispatchEvent(event)) complete();
  }

  function setMenu(open, { instant = false, restoreFocus = false } = {}) {
    if (open && desktop.matches) return;
    if (open === expanded && !instant) {
      if (restoreFocus) toggle.focus({ preventScroll: true });
      return;
    }
    const wasOpen = expanded;
    expanded = open;
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-menu-open', open);
    if (open) {
      loadMotion();
      language.open = false;
      menu.hidden = false;
      menu.inert = false;
      lockPage();
    } else {
      menu.inert = true;
    }
    renderMenu(instant);
    if (open && !wasOpen) menu.querySelector('a')?.focus({ preventScroll: true });
    if (!open && restoreFocus) toggle.focus({ preventScroll: true });
  }

  function focusDestination(link) {
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname !== location.pathname || !destination.hash) return;
    let target;
    try { target = document.getElementById(decodeURIComponent(destination.hash.slice(1))); } catch { return; }
    if (!target) return;
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    target.focus({ preventScroll: true });
  }

  toggle.hidden = false;
  menu.inert = true;
  toggle.addEventListener('click', () => setMenu(!expanded, { restoreFocus: expanded }));
  brand.addEventListener('click', () => setMenu(false, { instant: true }));
  menu.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link) {
      setMenu(false, { instant: true });
      focusDestination(link);
    } else {
      setMenu(false, { restoreFocus: true });
    }
  });
  language.addEventListener('toggle', () => {
    language.querySelector('summary').setAttribute('aria-expanded', String(language.open));
    if (language.open) setMenu(false, { instant: true });
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false, { instant: true });
    if (!language.contains(event.target)) language.open = false;
  });
  document.addEventListener('focusin', event => {
    if (!header.contains(event.target)) {
      setMenu(false, { instant: true });
      language.open = false;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!menu.hidden) {
        event.preventDefault();
        setMenu(false, { restoreFocus: true });
      }
      if (language.open) {
        language.open = false;
        language.querySelector('summary').focus();
      }
    } else if (event.key === 'Tab' && lockedSiblings) {
      const focusable = [brand, toggle, language.querySelector('summary'), ...(!menu.inert ? menu.querySelectorAll('a') : [])];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });
  desktop.addEventListener('change', () => {
    const focused = document.activeElement;
    const needsFocus = menu.contains(focused) || focused === toggle;
    const destination = [...header.querySelectorAll('.site-navigation__links a')]
      .find(link => link.href === focused?.href);
    setMenu(false, { instant: true });
    if (needsFocus) (desktop.matches ? destination || brand : toggle).focus({ preventScroll: true });
    loadMotion();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) renderMenu(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) setMenu(false, { instant: true }); });
  window.addEventListener('pagehide', () => setMenu(false, { instant: true }));
  loadMotion();
})();
