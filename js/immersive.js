/* Grow the effect preview during one scroll beat, then hold it for selection. */
(() => {
  const section = document.querySelector('[data-immersive]');
  if (!section) return;

  const media = section.querySelector('.preview-media');
  const controls = section.querySelector('.control-panel');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;

  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => value * value * (3 - 2 * value);
  const mix = (from, to, progress) => from + (to - from) * progress;

  function clear() {
    section.classList.remove('is-enhanced', 'is-expanded');
    for (const name of ('width', 'height', 'border-width', 'border-radius')) {
      media.style.removeProperty(name);
    }
    controls.inert = false;
  }

  function render() {
    frame = 0;
    if (reducedMotion.matches) {
      clear();
      return;
    }

    section.classList.add('is-enhanced');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = viewportWidth <= 640 ? 32 : 48;
    const startWidth = Math.min(1040, viewportWidth - margin, (viewportHeight - 120) * 16 / 9);
    const startHeight = startWidth * 9 / 16;
    const travel = Math.max(1, section.offsetHeight - viewportHeight);
    const progress = clamp(-section.getBoundingClientRect().top / travel);
    const expansion = ease(clamp(progress / 0.52));

    media.style.width = `${Math.round(mix(startWidth, viewportWidth, expansion))}px`;
    media.style.height = `${Math.round(mix(startHeight, viewportHeight, expansion))}px`;
    media.style.borderWidth = `${Math.round(mix(viewportWidth <= 640 ? 6 : 9, 0, expansion))}px`;
    media.style.borderRadius = `${Math.round(mix(viewportWidth <= 640 ? 23 : 30, 0, expansion))}px`;

    const expanded = progress >= 0.56;
    section.classList.toggle('is-expanded', expanded);
    controls.inert = !expanded;
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  reducedMotion.addEventListener('change', schedule);
  render();
})();
