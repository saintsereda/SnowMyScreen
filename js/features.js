(() => {
  const toggle = document.querySelector('[data-placement-toggle]');
  const demo = document.querySelector('[data-placement-demo]');
  const status = document.querySelector('[data-placement-status]');
  if (!toggle || !demo) return;

  toggle.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-mode]');
    if (!button || !toggle.contains(button)) return;

    toggle.querySelectorAll('button[data-mode]').forEach((option) => {
      option.setAttribute('aria-pressed', String(option === button));
    });
    demo.dataset.mode = button.dataset.mode;
    demo.setAttribute('aria-label', button.dataset.description);
    if (status) status.textContent = button.dataset.description;
  });
})();
