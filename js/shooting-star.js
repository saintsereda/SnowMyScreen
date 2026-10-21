/* Independent random flights across the visible background, with occasional overlap. */
(() => {
  const sky = document.querySelector('[data-shooting-stars]');
  if (!sky || typeof sky.animate !== 'function') return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const random = (min, max) => min + Math.random() * (max - min);
  const active = new Set();
  let timer = null;

  function canPlay() {
    return !document.hidden && !reducedMotion.matches;
  }

  function stop() {
    window.clearTimeout(timer);
    timer = null;
    active.forEach(({ star, animation }) => {
      animation.cancel();
      star.remove();
    });
    active.clear();
  }

  function schedule(delay) {
    if (!canPlay() || timer !== null) return;
    timer = window.setTimeout(shoot, delay);
  }

  function shoot() {
    timer = null;
    if (!canPlay()) return;
    // Short intervals sometimes create a small cluster; flights never wait for one another.
    schedule(Math.random() < .3 ? random(250, 1100) : random(1800, 6500));
    if (active.size >= 3) return;

    const width = sky.clientWidth;
    const height = sky.clientHeight;
    if (!width || !height) return;
    const direction = Math.random() < .22 ? -1 : 1;
    const startX = width * random(-.08, .92);
    const startY = height * random(-.08, .65);
    const endX = Math.max(-32, Math.min(width + 32, startX + direction * width * random(.2, .5)));
    const endY = Math.min(height + 32, startY + height * random(.25, .55));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    const position = (x, y) => `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
    const star = document.createElement('span');
    star.className = 'shooting-star';
    star.style.width = `${random(12, 22)}px`;
    star.style.setProperty('--star-trail', `${random(90, 220)}px`);
    sky.append(star);
    const brightness = random(.65, 1);

    const animation = star.animate([
      { transform: position(startX, startY), opacity: 0, offset: 0 },
      { opacity: brightness, offset: .12 },
      { opacity: brightness, offset: .6 },
      { transform: position(endX, endY), opacity: 0, offset: 1 },
    ], {
      duration: random(2100, 3600),
      easing: 'cubic-bezier(.32, .12, .65, 1)',
    });
    const record = { star, animation };
    active.add(record);
    const remove = () => { active.delete(record); star.remove(); };
    animation.finished.then(remove, remove);
  }

  function sync() {
    if (canPlay()) schedule(random(600, 1800));
    else stop();
  }

  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  sync();
})();
