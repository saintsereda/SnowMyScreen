/* In-page seasonal preview; playback starts only when the video is visible. */
(() => {
  const preview = document.querySelector('[data-preview]');
  if (!preview) return;
  const video = preview.querySelector('[data-effect-video]');
  const placeholder = preview.querySelector('[data-video-placeholder]');
  const caption = preview.querySelector('[data-video-caption]');
  const picker = preview.querySelector('.theme-picker');
  const panel = preview.querySelector('.control-panel');
  const menuIcon = preview.querySelector('[data-desktop-app-icon]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const description = preview.querySelector('[data-theme-description]');
  // Keep media configuration independent of the React radio's rendered buttons.
  const buttons = [...picker.querySelectorAll('[data-theme]')];
  const themes = new Map(buttons.map(button => [button.dataset.theme, button]));
  let onScreen = !('IntersectionObserver' in window);
  let hasVideo = false;
  let activeTheme = null;

  function syncPlayback() {
    if (!hasVideo || motion.matches || document.hidden || !onScreen) {
      video.pause();
      video.classList.remove('is-switching');
    } else {
      video.play().catch(() => video.classList.remove('is-switching'));
    }
  }

  function setTheme(theme) {
    const button = themes.get(theme);
    if (!button || theme === activeTheme) return;
    const firstSelection = activeTheme === null;
    activeTheme = theme;
    preview.dataset.effect = theme;
    if (menuIcon && button.dataset.menuIcon) menuIcon.src = button.dataset.menuIcon;
    const source = button.dataset.video || '';
    hasVideo = !!source;
    video.classList.toggle('is-switching', !motion.matches && onScreen);
    video.pause();
    if (source && video.getAttribute('src') !== source) video.setAttribute('src', source);
    else if (!source) video.removeAttribute('src');
    if (button.dataset.poster) video.setAttribute('poster', button.dataset.poster);
    else video.removeAttribute('poster');
    video.hidden = !hasVideo;
    placeholder.hidden = hasVideo;
    caption.textContent = button.querySelector('.theme-name').textContent;
    buttons.forEach(option => {
      option.setAttribute('aria-pressed', String(option === button));
    });
    video.setAttribute('aria-label', button.dataset.description);
    if (description) description.textContent = button.dataset.description;
    if (!firstSelection) video.load();
    syncPlayback();
    preview.dispatchEvent(new CustomEvent('wonderfall:theme-change', { detail: { theme } }));
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
  panel.hidden = false;
  picker.addEventListener('click', event => {
    const button = event.target.closest('[data-theme]');
    if (button) setTheme(button.dataset.theme);
  });
  preview.addEventListener('wonderfall:theme-request', event => setTheme(event.detail?.theme));
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', syncPlayback);
  window.addEventListener('pageshow', syncPlayback);
  window.addEventListener('pagehide', () => video.pause());
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; syncPlayback(); }).observe(video);
  }
  setTheme('snow');
})();
