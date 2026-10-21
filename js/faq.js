/* Native details with interruptible height and opacity transitions. */
(() => {
  const list = document.querySelector('.faq-list');
  if (!list) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...list.querySelectorAll('details')].map(details => {
    const summary = details.querySelector('summary');
    const answer = details.querySelector('.faq-answer');
    if (!summary || !answer || typeof answer.animate !== 'function') return null;
    let expanded = details.open;
    let animation = null;

    function cancel() {
      if (!animation) return;
      animation.onfinish = null;
      animation.cancel();
      animation = null;
    }

    function setExpanded(open, animate = true) {
      const moving = animate && !motion.matches;
      const height = moving && details.open ? answer.getBoundingClientRect().height : 0;
      const opacity = moving && details.open ? Number(window.getComputedStyle(answer).opacity) : 0;
      cancel();
      expanded = open;
      summary.setAttribute('aria-expanded', String(open));
      if (!moving) {
        details.open = open;
        answer.inert = false;
        return;
      }

      details.open = true;
      answer.inert = !open;
      const flight = answer.animate([
        { height: `${height}px`, opacity },
        { height: `${open ? answer.scrollHeight : 0}px`, opacity: open ? 1 : 0 }
      ], { duration: 260, easing: 'cubic-bezier(.23, 1, .32, 1)', fill: 'both' });
      animation = flight;
      flight.onfinish = () => {
        if (animation !== flight) return;
        details.open = expanded;
        answer.inert = false;
        cancel();
      };
    }

    summary.setAttribute('aria-expanded', String(expanded));
    summary.addEventListener('click', event => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      setExpanded(!expanded);
    });
    details.addEventListener('toggle', () => {
      // Keep native find-in-page and programmatic opening in sync when idle.
      if (!animation && details.open !== expanded) setExpanded(details.open, false);
    });
    return {
      settle: () => setExpanded(expanded, false),
      resize: () => { if (animation) setExpanded(expanded); }
    };
  }).filter(Boolean);

  motion.addEventListener('change', () => items.forEach(item => item.settle()));
  window.addEventListener('pagehide', () => items.forEach(item => item.settle()));
  window.addEventListener('resize', () => items.forEach(item => item.resize()), { passive: true });
  if (document.fonts) document.fonts.ready.then(() => items.forEach(item => item.resize()));
})();
