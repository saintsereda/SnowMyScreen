/* Live countdown to the app update; the static sentence stays for no-JS and screen readers. */
(() => {
  const root = document.querySelector('[data-release-countdown]');
  if (!root) return;
  const target = Date.parse(root.dataset.releaseAt);
  const text = root.querySelector('.hero-update__text');
  const live = root.querySelector('.hero-update__live');
  if (!Number.isFinite(target) || !text || !live) return;
  const values = Object.fromEntries([...live.querySelectorAll('[data-unit]')].map(el => [el.dataset.unit, el]));
  let timer = 0;

  function release() {
    clearInterval(timer);
    live.hidden = true;
    text.className = 'hero-update__text';
    text.textContent = root.dataset.releasedText;
    root.classList.remove('is-counting');
  }

  function tick() {
    const left = Math.floor((target - Date.now()) / 1000);
    if (left <= 0) return release();
    const parts = { d: Math.floor(left / 86400), h: Math.floor(left / 3600) % 24, m: Math.floor(left / 60) % 60, s: left % 60 };
    for (const [key, el] of Object.entries(values)) {
      const value = String(parts[key]).padStart(2, '0');
      if (el.textContent !== value) el.textContent = value;
    }
  }

  if (target - Date.now() <= 0) return release();
  tick();
  text.className = 'visually-hidden';
  live.hidden = false;
  root.classList.add('is-counting');
  timer = setInterval(tick, 1000);
})();
