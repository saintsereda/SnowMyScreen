/* Theme switcher for effect videos; empty slots show a static placeholder. */
(() => {
  const preview = document.querySelector('[data-preview]');
  if (!preview) return;
  const video = preview.querySelector('[data-effect-video]');
  const placeholder = preview.querySelector('[data-video-placeholder]');
  const caption = preview.querySelector('[data-video-caption]');
  const picker = document.querySelector('.theme-picker');
  const panel = preview.querySelector('.control-panel');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const description = document.querySelector('[data-theme-description]');
  let onScreen = true;
  let hasVideo = false;
  let activeTheme = null;
  let panelFrame = 0;

  function fitPanel() {
    if (!preview.closest('[data-immersive]').classList.contains('is-enhanced')) {
      panel.style.removeProperty('width');
      return;
    }
    const options = [...picker.querySelectorAll('[data-theme]')];
    const panelStyle = getComputedStyle(panel);
    const pickerStyle = getComputedStyle(picker);
    const pixels = value => Number.parseFloat(value) || 0;
    const width = options.reduce((sum, option) => sum + option.offsetWidth, 0)
      + (options.length - 1) * pixels(pickerStyle.columnGap)
      + pixels(panelStyle.paddingLeft) + pixels(panelStyle.paddingRight)
      + pixels(panelStyle.borderLeftWidth) + pixels(panelStyle.borderRightWidth);
    panel.style.width = `${Math.ceil(width) + 2}px`;
  }

  function trackPanel() {
    cancelAnimationFrame(panelFrame);
    const until = performance.now() + 300;
    function frame() {
      fitPanel();
      if (performance.now() < until) panelFrame = requestAnimationFrame(frame);
    }
    frame();
  }

  function syncPlayback() {
    if (!hasVideo || motion.matches || document.hidden || !onScreen) {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  }

  function setTheme(theme) {
    const button = picker.querySelector(`[data-theme="${theme}"]`);
    if (!button || theme === activeTheme) return;
    const firstSelection = activeTheme === null;
    activeTheme = theme;
    preview.dataset.effect = theme;
    const source = button.dataset.video || '';
    hasVideo = !!source;
    video.classList.toggle('is-switching', !motion.matches && onScreen);
    video.pause();
    if (source) video.setAttribute('src', source);
    else video.removeAttribute('src');
    if (button.dataset.poster) video.setAttribute('poster', button.dataset.poster);
    else video.removeAttribute('poster');
    video.hidden = !hasVideo;
    placeholder.hidden = hasVideo;
    caption.textContent = button.querySelector('.theme-name').textContent;
    picker.querySelectorAll('[data-theme]').forEach(option => {
      option.setAttribute('aria-pressed', String(option === button));
    });
    if (firstSelection) fitPanel();
    else trackPanel();
    if (picker.scrollWidth > picker.clientWidth) {
      requestAnimationFrame(() => {
        const selected = button.getBoundingClientRect();
        const track = picker.getBoundingClientRect();
        picker.scrollBy({ left: (selected.left + selected.right - track.left - track.right) / 2, behavior: 'smooth' });
      });
    }
    if (description) description.textContent = button.dataset.description;
    video.load();
    syncPlayback();
  }

  video.addEventListener('error', () => {
    video.classList.remove('is-switching');
    hasVideo = false;
    video.hidden = true;
    placeholder.hidden = false;
    syncPlayback();
  });
  video.addEventListener('loadeddata', () => video.classList.remove('is-switching'));
  picker.hidden = false;
  preview.querySelector('.control-panel').hidden = false;
  picker.addEventListener('click', event => {
    const button = event.target.closest('[data-theme]');
    if (button) setTheme(button.dataset.theme);
  });
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', () => {
    syncPlayback();
    requestAnimationFrame(fitPanel);
  });
  window.addEventListener('resize', fitPanel);
  if (document.fonts) document.fonts.ready.then(fitPanel);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; syncPlayback(); }).observe(preview);
  }
  setTheme('snow');
})();
