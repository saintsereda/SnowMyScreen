/* Independent demos; no location requests or external weather calls. */
(() => {
  const section = document.querySelector('#features');
  if (!section) return;
  const showControls = root => root.querySelectorAll('[data-demo-controls]').forEach(el => { el.hidden = false; });
  const select = (root, selector, button) => root.querySelectorAll(selector).forEach(el => {
    el.setAttribute('aria-pressed', String(el === button));
  });

  function weather() {
    const root = section.querySelector('[data-weather-demo]');
    if (!root) return;
    const scene = root.querySelector('[data-weather-scene]');
    const symbol = root.querySelector('[data-weather-symbol]');
    const status = root.querySelector('[data-weather-status]');
    showControls(root);
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-weather-choice]');
      if (!button || !root.contains(button)) return;
      select(root, '[data-weather-choice]', button);
      root.dataset.weather = button.dataset.weatherChoice;
      symbol.replaceChildren(button.querySelector('svg').cloneNode(true));
      scene.setAttribute('aria-label', button.dataset.description);
      status.textContent = button.dataset.description;
    });
  }

  function cleaning() {
    const root = section.querySelector('[data-cleaning-demo]');
    if (!root) return;
    const image = root.querySelector('[data-cleaning-image]');
    const canvas = root.querySelector('[data-cleaning-canvas]');
    const context = canvas.getContext('2d');
    if (!context) return;
    const scene = root.querySelector('.cleaning-demo__scene');
    const hint = root.querySelector('[data-cleaning-hint]');
    const status = root.querySelector('[data-cleaning-status]');
    let width = 0, height = 0, activePointer = null, last = null, pending = null, frame = 0;
    let cleared = false;
    function draw() {
      if (!image.complete || !image.naturalWidth) return;
      const bounds = scene.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;
      const density = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      context.globalCompositeOperation = 'source-over';
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      context.drawImage(image, (width - image.naturalWidth * scale) / 2,
        (height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
      if (root.dataset.cleaningMode === 'snow') {
        const fill = context.createLinearGradient(0, height * .7, 0, height);
        fill.addColorStop(0, '#ffffff'); fill.addColorStop(1, '#d9eafb');
        context.fillStyle = fill;
        context.beginPath(); context.moveTo(0, height * .85);
        context.bezierCurveTo(width * .16, height * .65, width * .2, height * .97, width * .44, height * .82);
        context.bezierCurveTo(width * .63, height * .68, width * .72, height * .96, width, height * .78);
        context.lineTo(width, height); context.lineTo(0, height); context.closePath(); context.fill();
      }
      if (cleared) context.clearRect(0, 0, width, height);
      root.classList.add('is-ready');
      showControls(root);
    }
    function reset() {
      cleared = false; last = null; pending = null; activePointer = null;
      cancelAnimationFrame(frame); frame = 0;
      root.classList.remove('is-dirty', 'is-clear');
      hint.textContent = root.dataset.hint;
      draw();
    }
    function point(event) {
      const bounds = canvas.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }
    function erase(next) {
      if (!root.classList.contains('is-ready') || cleared) return;
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = Math.max(52, width * .1);
      context.lineCap = 'round'; context.lineJoin = 'round';
      context.beginPath();
      context.moveTo(last ? last.x : next.x - .1, last ? last.y : next.y);
      context.lineTo(next.x, next.y); context.stroke();
      last = next;
      root.classList.add('is-dirty');
    }
    function flush() {
      frame = 0;
      if (pending) erase(pending);
      pending = null;
    }
    canvas.addEventListener('pointerdown', event => {
      if (activePointer !== null || event.button !== 0) return;
      activePointer = event.pointerId; last = null;
      canvas.setPointerCapture(event.pointerId);
      if (event.pointerType === 'mouse') event.preventDefault();
      erase(point(event));
    });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== activePointer) return;
      pending = point(event);
      if (!frame) frame = requestAnimationFrame(flush);
    });
    function finish(event) {
      if (event.pointerId !== activePointer) return;
      if (event.type === 'pointerup') erase(point(event));
      cancelAnimationFrame(frame); frame = 0; pending = null; last = null; activePointer = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    }
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);
    canvas.addEventListener('lostpointercapture', finish);
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-cleaning-choice]');
      if (!button || !root.contains(button)) return;
      select(root, '[data-cleaning-choice]', button);
      root.dataset.cleaningMode = button.dataset.cleaningChoice;
      image.src = button.dataset.source;
      reset();
      status.textContent = button.getAttribute('aria-label');
    });
    root.querySelector('[data-cleaning-clear]').addEventListener('click', () => {
      cancelAnimationFrame(frame); frame = 0; pending = null;
      cleared = true;
      context.clearRect(0, 0, width, height);
      root.classList.add('is-dirty', 'is-clear');
      hint.textContent = root.dataset.cleared;
      status.textContent = root.dataset.cleared;
    });
    root.querySelector('[data-cleaning-reset]').addEventListener('click', event => {
      reset();
      status.textContent = event.currentTarget.getAttribute('aria-label');
    });
    image.addEventListener('load', draw);
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(scene);
    else window.addEventListener('resize', draw);
    draw();
  }

  function lights() {
    const root = section.querySelector('[data-garland-demo]');
    if (!root) return;
    showControls(root);
    root.addEventListener('click', event => {
      const placement = event.target.closest('[data-light-placement]');
      if (placement && root.contains(placement)) {
        const enabled = placement.getAttribute('aria-pressed') !== 'true';
        placement.setAttribute('aria-pressed', String(enabled));
        root.dataset[placement.dataset.lightPlacement] = String(enabled);
      }
      const palette = event.target.closest('[data-light-palette]');
      if (palette && root.contains(palette)) {
        select(root, '[data-light-palette]', palette);
        root.dataset.palette = palette.dataset.lightPalette;
      }
    });
  }

  function placement() {
    const root = section.querySelector('[data-feature="placement"]');
    if (!root) return;
    const toggle = root.querySelector('[data-placement-toggle]');
    const demo = root.querySelector('[data-placement-demo]');
    const strip = root.querySelector('[data-placement-strip]');
    const status = root.querySelector('[data-placement-status]');
    showControls(root);
    function sync() {
      const button = toggle.querySelector('[aria-pressed="true"]');
      demo.dataset.mode = button.dataset.mode;
      demo.dataset.area = strip.checked ? 'strip' : 'full';
      const description = `${button.dataset.description} ${strip.checked ? strip.dataset.description : strip.dataset.fullDescription}`;
      demo.setAttribute('aria-label', description); status.textContent = description;
    }
    toggle.addEventListener('click', event => {
      const button = event.target.closest('button[data-mode]');
      if (!button || !toggle.contains(button)) return;
      select(toggle, 'button[data-mode]', button); sync();
    });
    strip.addEventListener('change', sync);
    sync();
  }

  weather(); cleaning(); lights(); placement();
})();
