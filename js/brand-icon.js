(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shooting = document.body.classList.contains('home-page');
  const animationName = shooting ? 'brand-star-shooting' : 'brand-star-crossing';

  document.querySelectorAll('[data-brand-link]').forEach(link => {
    const icon = link.querySelector('.brand-icon');
    const star = icon?.querySelector('.brand-icon__star');
    if (!star) return;
    let finishCurrent;

    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey || link.target === '_blank' || reducedMotion.matches) return;

      event.preventDefault();
      if (finishCurrent) return;

      const destination = new URL(link.href);
      const current = new URL(window.location.href);
      const alreadyHome = destination.origin === current.origin &&
        destination.pathname === current.pathname && destination.search === current.search;
      let timeout;
      const onAnimationEnd = animation => {
        if (animation.target === star && animation.animationName === animationName) finish();
      };
      const finish = () => {
        if (!finishCurrent) return;
        finishCurrent = null;
        clearTimeout(timeout);
        star.removeEventListener('animationend', onAnimationEnd);
        icon.classList.remove('is-launching');
        if (alreadyHome) {
          if (current.hash) history.replaceState(history.state, '', destination.pathname + destination.search);
          window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        } else {
          window.location.assign(destination.href);
        }
      };

      finishCurrent = finish;
      star.addEventListener('animationend', onAnimationEnd);
      icon.classList.add('is-launching');
      timeout = window.setTimeout(finish, shooting ? 1150 : 920);
    });

    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) finishCurrent?.();
    });
  });
})();
