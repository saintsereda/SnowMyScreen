/* The closing MacBook display rises with the scroll; its video plays only in view. */
(() => {
  const section = document.querySelector('[data-closing-screen]');
  const video = section && section.querySelector('[data-closing-video]');
  if (!video) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = !('IntersectionObserver' in window);
  let frame = 0;
  let lastProgress = '';

  function syncPlayback() {
    if (visible && !motion.matches && !document.hidden) {
      const playing = video.play();
      if (playing) playing.catch(() => {});
    } else {
      video.pause();
    }
  }

  function update() {
    frame = 0;
    if (motion.matches || document.hidden) return;

    // Reaches its final position just as the section's bottom edge meets the viewport's.
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const { top, height } = section.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (viewport - top) / Math.max(1, height)));
    const value = progress.toFixed(5);
    if (value !== lastProgress) {
      section.style.setProperty('--closing-progress', value);
      lastProgress = value;
    }
    section.classList.toggle('is-rising', visible && progress < 1);
  }

  function schedule() {
    if (!frame && visible && !motion.matches && !document.hidden) {
      frame = window.requestAnimationFrame(update);
    }
  }

  function syncMotion() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    if (motion.matches) {
      section.classList.remove('is-rising');
      section.style.removeProperty('--closing-progress');
      lastProgress = '';
    } else {
      update();
    }
    syncPlayback();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', syncMotion);
  motion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      // A batch can hold older states, so only the last entry is current.
      visible = entries[entries.length - 1].isIntersecting;
      schedule();
      syncPlayback();
    }, { rootMargin: '100px 0px' }).observe(section);
  }
  syncMotion();
})();
