/* The whole desktop screen tips toward the reader as it enters the viewport. */
(() => {
  const preview = document.querySelector('[data-preview]');
  const screen = preview && preview.querySelector('.preview-media');
  if (!screen) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let frame = 0;
  let lastProgress = '';

  function cancelFrame() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    preview.classList.remove('is-perspective-active');
  }

  function update() {
    frame = 0;
    if (motion.matches || document.hidden) return;

    // Measure the untransformed wrapper so the tilt cannot affect its own progress.
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const top = preview.getBoundingClientRect().top;
    const progress = Math.min(1, Math.max(0, (viewport * 1.05 - top) / Math.max(1, viewport * .75)));
    const value = progress.toFixed(5);
    if (value !== lastProgress) {
      preview.style.setProperty('--preview-progress', value);
      lastProgress = value;
    }
    preview.classList.add('has-perspective');
    preview.classList.toggle('is-perspective-active', visible && progress > 0 && progress < 1);
  }

  function schedule() {
    if (!frame && visible && !motion.matches && !document.hidden) {
      frame = window.requestAnimationFrame(update);
    }
  }

  function syncMotion() {
    cancelFrame();
    if (motion.matches) {
      preview.classList.remove('has-perspective');
      preview.style.removeProperty('--preview-progress');
      lastProgress = '';
    } else {
      update();
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', syncMotion);
  window.addEventListener('pagehide', cancelFrame);
  motion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelFrame();
    else syncMotion();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else cancelFrame();
    }, { rootMargin: '100px 0px' }).observe(preview);
  }
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(preview);
  if (document.fonts) document.fonts.ready.then(schedule);
  syncMotion();
})();
