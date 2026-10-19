/* One short flight, then a quiet pause. No animation runs outside the hero. */
(() => {
  const star = document.querySelector('[data-shooting-star]');
  if (!star) return;

  const sky = star.parentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const random = (min, max) => min + Math.random() * (max - min);
  let visible = false;
  let timer = null;
  let flight = null;

  function canPlay() {
    return visible && !document.hidden && !reducedMotion.matches;
  }

  function stop() {
    window.clearTimeout(timer);
    timer = null;
    if (flight) flight.cancel();
    flight = null;
  }

  function schedule(delay) {
    if (!canPlay() || timer !== null || flight) return;
    timer = window.setTimeout(shoot, delay);
  }

  function shoot() {
    timer = null;
    if (!canPlay()) return;

    const width = sky.clientWidth;
    const height = Math.min(sky.clientHeight, window.innerHeight);
    const startX = width * random(.08, .28);
    const startY = height * random(.08, .18);
    const endX = Math.min(width - 24, startX + width * random(.4, .56));
    const endY = Math.min(sky.clientHeight - 80, Math.max(startY + 180, height * .8));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    const position = (x, y) => `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;

    const animation = star.animate([
      { transform: position(startX, startY), opacity: 0, offset: 0 },
      { opacity: 1, offset: .12 },
      { opacity: 1, offset: .6 },
      { transform: position(endX, endY), opacity: 0, offset: 1 },
    ], {
      duration: random(2400, 3100),
      easing: 'cubic-bezier(.32, .12, .65, 1)',
    });
    flight = animation;
    animation.finished.then(() => {
      if (flight !== animation) return;
      flight = null;
      schedule(random(5500, 9000));
    }).catch(() => {}); // Cancellation restores the star's invisible base style.
  }

  function sync() {
    if (canPlay()) schedule(900);
    else stop();
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(sky);
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
})();
