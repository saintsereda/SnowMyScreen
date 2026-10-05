/* Theme switcher for effect videos; empty slots show a static placeholder. */
(() => {
  const preview = document.querySelector('[data-preview]');
  if (!preview) return;
  const video = preview.querySelector('[data-effect-video]');
  const placeholder = preview.querySelector('[data-video-placeholder]');
  const caption = preview.querySelector('[data-video-caption]');
  const picker = document.querySelector('.theme-picker');
  const pause = preview.querySelector('[data-pause]');
  const panel = preview.querySelector('.control-panel');
  const mobileSlot = document.querySelector('[data-mobile-controls]');
  const mobile = window.matchMedia('(max-width: 640px)');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const description = document.querySelector('[data-theme-description]');
  let manuallyPaused = motion.matches;
  let onScreen = true;
  let hasVideo = false;

  function placeControls() {
    if (panel && mobileSlot) (mobile.matches ? mobileSlot : preview).appendChild(panel);
  }

  function syncPlayback() {
    preview.classList.toggle('is-paused', manuallyPaused);
    pause.hidden = !hasVideo;
    pause.setAttribute('aria-pressed', String(manuallyPaused));
    pause.textContent = manuallyPaused ? pause.dataset.play : pause.dataset.stop;
    if (!hasVideo || manuallyPaused || document.hidden || !onScreen) {
      video.pause();
      return;
    }
    const playback = video.play();
    if (playback) playback.catch(error => {
      if (error.name === 'NotAllowedError') { manuallyPaused = true; syncPlayback(); }
    });
  }

  function setTheme(theme) {
    const button = picker.querySelector(`[data-theme="${theme}"]`);
    if (!button) return;
    preview.dataset.effect = theme;
    const source = button.dataset.video || '';
    hasVideo = !!source;
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
    if (description) description.textContent = button.dataset.description;
    video.load();
    syncPlayback();
  }

  video.addEventListener('error', () => {
    hasVideo = false;
    video.hidden = true;
    placeholder.hidden = false;
    syncPlayback();
  });
  picker.hidden = false;
  panel.hidden = false;
  placeControls();
  mobile.addEventListener('change', placeControls);
  picker.addEventListener('click', event => {
    const button = event.target.closest('[data-theme]');
    if (button) setTheme(button.dataset.theme);
  });
  pause.addEventListener('click', () => { manuallyPaused = !manuallyPaused; syncPlayback(); });
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', event => { manuallyPaused = event.matches; syncPlayback(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; syncPlayback(); }).observe(preview);
  }
  setTheme('snow');
})();
