/* Original reviews stay in HTML; decorative copies make one continuous row. */
(() => {
  const section = document.querySelector('[data-reviews]');
  if (!section) return;
  const marquee = section.querySelector('[data-reviews-marquee]');
  const track = section.querySelector('[data-reviews-track]');
  const pause = section.querySelector('[data-reviews-pause]');
  const originals = [...track.children];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let onScreen = !('IntersectionObserver' in window);
  let manuallyPaused = false;
  let frame = 0;

  function sync() {
    const paused = manuallyPaused || !onScreen || document.hidden;
    section.classList.toggle('is-running', !motion.matches && !paused);
    section.classList.toggle('is-paused', manuallyPaused);
    pause.setAttribute('aria-pressed', String(manuallyPaused));
    pause.setAttribute('aria-label', manuallyPaused ? pause.dataset.play : pause.dataset.pause);
  }

  function build() {
    frame = 0;
    track.querySelectorAll('[data-review-clone]').forEach(copy => copy.remove());
    section.classList.remove('is-enhanced');
    pause.hidden = motion.matches;
    if (motion.matches || !onScreen) {
      sync();
      return;
    }
    section.classList.add('is-enhanced');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const period = originals.reduce((sum, card) => sum + card.getBoundingClientRect().width + gap, 0);
    if (!period) return;
    let covered = period;
    while (covered < marquee.clientWidth + period) {
      originals.forEach(card => {
        const copy = card.cloneNode(true);
        copy.setAttribute('data-review-clone', '');
        copy.removeAttribute('data-review-id');
        copy.setAttribute('aria-hidden', 'true');
        copy.inert = true;
        copy.querySelectorAll('a').forEach(link => link.tabIndex = -1);
        track.appendChild(copy);
      });
      covered += period;
    }
    track.style.setProperty('--review-distance', `${-period}px`);
    track.style.setProperty('--review-duration', `${period / 28}s`);
    sync();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(build);
  }

  pause.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  if (document.fonts) document.fonts.ready.then(schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting;
      if (onScreen === visible) return;
      onScreen = visible;
      if (onScreen && !section.classList.contains('is-enhanced')) schedule();
      sync();
    }, { rootMargin: '180px 0px' }).observe(section);
  }
  build();
})();
