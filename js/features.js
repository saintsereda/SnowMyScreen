/* Feature choices and browser previews. Videos are read from the local media manifest at build time. */
(() => {
  const section = document.querySelector('#features');
  if (!section) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pageActive = true;
  const callbacks = [];
  const watch = (element, callback) => {
    if (!('IntersectionObserver' in window)) { callback(true); return; }
    const observer = new IntersectionObserver(entries => callback(entries[0].isIntersecting));
    observer.observe(element);
  };
  const lifecycle = callback => { callbacks.push(callback); callback(); };
  const syncAll = () => callbacks.forEach(callback => callback());
  document.addEventListener('visibilitychange', syncAll);
  window.addEventListener('pagehide', () => { pageActive = false; syncAll(); });
  window.addEventListener('pageshow', () => { pageActive = true; syncAll(); });
  reduced.addEventListener('change', syncAll);

  for (const root of section.querySelectorAll('[data-feature-media="cleaning"], [data-feature-media="garlands"], [data-feature-media="placement"]')) {
    const article = root.closest('[data-feature]');
    const choices = [...article.querySelectorAll('[data-feature-choice]')];
    const video = root.querySelector('[data-feature-video]');
    const image = root.querySelector('[data-feature-image]');
    const preview = root.querySelector('[data-garland-preview]');
    let visible = false, failed = false;
    let selection = 0;
    const posters = new Map();
    const loadPoster = url => {
      if (!posters.has(url)) {
        posters.set(url, new Promise(resolve => {
          const poster = new Image();
          poster.onload = async () => {
            if (poster.decode) {
              try { await poster.decode(); } catch { /* The loaded image can still be shown. */ }
            }
            resolve(true);
          };
          poster.onerror = () => resolve(false);
          poster.src = url;
        }));
      }
      return posters.get(url);
    };
    if (image) choices.forEach(choice => {
      if (choice.dataset.poster) loadPoster(choice.dataset.poster);
    });
    const sync = () => {
      if (video.hidden || failed || !pageActive || !visible || document.hidden || reduced.matches) {
        video.pause();
      } else {
        const play = video.play();
        if (play && play.catch) play.catch(() => {});
      }
    };
    const syncDemo = () => {
      if (!preview) return;
      const paused = reduced.matches || !pageActive || document.hidden || !visible;
      preview.classList.toggle('is-paused', paused);
    };
    const applySelection = (choice, posterReady) => {
      video.pause();
      failed = false;
      const src = choice.dataset.src;
      const poster = choice.dataset.poster;
      root.classList.toggle('is-switching', !!(image && src && posterReady));
      if (image) {
        image.hidden = !poster || (!!src && !posterReady);
        if (poster) image.src = poster;
        if (choice.dataset.alt) image.alt = choice.dataset.alt;
      }
      if (src) video.setAttribute('src', src);
      else video.removeAttribute('src');
      if (poster) video.setAttribute('poster', poster);
      else video.removeAttribute('poster');
      video.hidden = !src;
      video.load();
      if (choice.dataset.alt) video.setAttribute('aria-label', choice.dataset.alt);
      if (preview) {
        preview.hidden = !!src;
      }
      root.dataset.featureMediaState = src ? 'video' : 'preview';
      sync();
      syncDemo();
    };
    const select = choice => {
      if (choice.getAttribute('aria-pressed') === 'true') return;
      choices.forEach(option => option.setAttribute('aria-pressed', String(option === choice)));
      if (root.dataset.featureMedia === 'placement') {
        choice.parentElement.dispatchEvent(new CustomEvent('wonderfall:placement-change', { detail: { value: choice.dataset.featureChoice } }));
      }
      const current = ++selection;
      const poster = choice.dataset.poster;
      if (image && choice.dataset.src && poster) {
        loadPoster(poster).then(ready => {
          if (current === selection) applySelection(choice, ready);
        });
      } else {
        applySelection(choice, false);
      }
    };
    choices.forEach(choice => choice.addEventListener('click', () => select(choice)));
    video.addEventListener('loadeddata', () => {
      if (!image || !root.classList.contains('is-switching')) return;
      root.classList.remove('is-switching');
      image.hidden = true;
    });
    video.addEventListener('error', () => {
      failed = true;
      video.hidden = true;
      root.classList.remove('is-switching');
      if (image) image.hidden = !image.getAttribute('src');
      if (preview) preview.hidden = false;
      root.dataset.featureMediaState = 'preview';
      sync();
      syncDemo();
    });
    watch(root, value => { visible = value; sync(); syncDemo(); });
    lifecycle(() => { sync(); syncDemo(); });
  }

  const custom = section.querySelector('[data-custom-preview]');
  if (!custom) return;
  const canvas = custom.querySelector('[data-custom-canvas]');
  const context = canvas.getContext('2d');
  if (!context) return;
  const card = custom.closest('[data-feature]');
  const fileInput = card.querySelector('[data-custom-file]');
  const status = card.querySelector('[data-custom-status]');
  let artwork, artworkURL, width = 0, height = 0, motion = 'snow';
  let particles = [], visible = false, frame = 0, lastTime = 0, emission = [0, 0, 0];
  const bases = [
    { accel: 70, births: 32, opacity: .3 },
    { accel: 90, births: 28, opacity: .6 },
    { accel: 110, births: 22, opacity: 1 }
  ];
  const profiles = {
    snow: { speed: .5, size: .63, drift: .8, spin: .25, spinRange: 1 },
    leaves: { speed: .9, size: .63, drift: .8, spin: .65, spinRange: .5 },
    rain: { speed: 1.3, size: .63, drift: 0, spin: 0, spinRange: 0 }
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  // Mirrors CustomImageMotion and WeatherRenderConfiguration in the macOS app.
  const specification = (mode, base) => {
    const settings = profiles[mode];
    const depth = clamp(base.accel / 110, .6, 1.2);
    const progress = clamp((settings.speed - .05) / 3.65, 0, 1);
    const travelHeight = height / scale();
    if (mode === 'rain') {
      const down = (250 + 850 * Math.pow(progress, .7)) * depth;
      const gravity = 25 * depth;
      const distance = Math.max(travelHeight + 80, 80);
      const flight = (Math.sqrt(down * down + 2 * gravity * distance) - down) / gravity;
      return { down, gravity: 25 * depth, size: (12 + 20 * settings.size) * depth,
        birth: (down / 320) * .08, response: .18, driftGain: 0, lifetime: clamp(flight * 1.18, .25, 12) };
    }
    if (mode === 'leaves') {
      const down = (65 + 85 * progress) * depth;
      return { down, gravity: 2, size: (12 + 16 * settings.size) * depth,
        birth: .11, response: .55, driftGain: 9 * depth,
        lifetime: clamp((travelHeight + 60) / down * 1.15, 1, 35) };
    }
    const down = (16 + 40 * progress) * depth;
    const gravity = base.accel * settings.speed;
    const distance = Math.max(travelHeight + 80, 80);
    const flight = (Math.sqrt(down * down + 2 * gravity * distance) - down) / gravity;
    return { down: down + gravity * 5, gravity: 0, size: (12 + 20 * settings.size) * depth,
      birth: .12, response: .8, driftGain: 9 * depth, lifetime: clamp(flight * 1.2, .5, 40) };
  };
  const scale = () => clamp(width / 900, .38, .7);
  const spawn = (layer, anywhere = false) => {
    const spec = specification(motion, bases[layer]);
    const variation = .84 + Math.random() * .32;
    const size = spec.size * variation * scale();
    const phase = Math.random() * Math.PI * 2;
    particles.push({
      layer, x: Math.random() * width, y: anywhere ? Math.random() * height : -size,
      vx: 0, vy: spec.down * variation * scale(),
      size, opacity: bases[layer].opacity, age: anywhere ? Math.random() * Math.min(3, spec.lifetime) : 0,
      phase, frequency: (motion === 'leaves' ? 1.3 : .85) * (.85 + Math.random() * .3),
      angle: 0, variation,
      trait: Math.random() * 2 - 1, spec
    });
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = [];
    for (let layer = 0; layer < bases.length; layer++) for (let n = 0; n < 10; n++) spawn(layer, true);
    draw();
  };
  const draw = () => {
    context.clearRect(0, 0, width, height);
    if (!artwork) return;
    const aspect = artwork.naturalWidth / artwork.naturalHeight;
    for (const particle of particles) {
      const leafTurn = motion === 'leaves' ? .58 + .42 * Math.abs(Math.cos(particle.phase + particle.age * 1.1)) : 1;
      const w = (aspect >= 1 ? particle.size : particle.size * aspect) * leafTurn;
      const h = aspect >= 1 ? particle.size / aspect : particle.size;
      context.save();
      context.globalAlpha = particle.opacity * clamp(particle.age / .16, 0, 1) *
        clamp((particle.spec.lifetime - particle.age) / .3, 0, 1);
      context.translate(particle.x, particle.y);
      context.rotate(particle.angle);
      context.drawImage(artwork, -w / 2, -h / 2, w, h);
      context.restore();
    }
  };
  const tick = now => {
    frame = 0;
    if (!lastTime) lastTime = now;
    const dt = clamp((now - lastTime) / 1000, 0, .05);
    lastTime = now;
    if (artwork && width && height) {
      bases.forEach((base, layer) => {
        const spec = specification(motion, base);
        emission[layer] += dt * 1.68 * base.births * spec.birth * scale();
        while (emission[layer] >= 1 && particles.length < 110) { spawn(layer); emission[layer]--; }
      });
      particles = particles.filter(particle => {
        const { spec } = particle;
        particle.age += dt;
        const air = profiles[motion].drift * spec.driftGain * Math.sin(particle.phase + particle.age * particle.frequency);
        const vertical = (spec.down * particle.variation + spec.gravity * Math.min(particle.age, 5)) * scale();
        const blend = 1 - Math.exp(-dt / spec.response);
        particle.vx += (air * scale() - particle.vx) * blend;
        particle.vy += (vertical - particle.vy) * blend;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.angle += (profiles[motion].spin * Math.sign(particle.trait || 1) + profiles[motion].spinRange * particle.trait) * dt;
        if (motion === 'rain') particle.angle = Math.atan2(-particle.vx, Math.max(particle.vy, 1));
        return particle.age < spec.lifetime && particle.y < height + particle.size &&
          particle.x > -particle.size && particle.x < width + particle.size;
      });
      draw();
    }
    syncAnimation();
  };
  const syncAnimation = () => {
    const active = pageActive && !document.hidden && visible && !reduced.matches && !!artwork;
    if (active && !frame) frame = requestAnimationFrame(tick);
    else if (!active && frame) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; draw(); }
  };
  const setArtwork = (image, url) => {
    if (artworkURL) URL.revokeObjectURL(artworkURL);
    artworkURL = url || null;
    artwork = image;
    particles = [];
    emission = [0, 0, 0];
    resize();
    syncAnimation();
  };
  const upload = file => {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      status.textContent = status.dataset.error;
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { setArtwork(image, url); status.textContent = status.dataset.ready; };
    image.onerror = () => { URL.revokeObjectURL(url); status.textContent = status.dataset.error; };
    image.src = url;
  };
  fileInput.addEventListener('change', () => upload(fileInput.files[0]));
  for (const event of ['dragenter', 'dragover']) custom.addEventListener(event, e => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    custom.classList.add('is-dragging');
  });
  custom.addEventListener('dragleave', () => custom.classList.remove('is-dragging'));
  custom.addEventListener('drop', e => {
    e.preventDefault();
    custom.classList.remove('is-dragging');
    upload(e.dataTransfer?.files[0]);
  });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  watch(custom, value => { visible = value; syncAnimation(); });
  lifecycle(syncAnimation);
  const sample = new Image();
  sample.onload = () => setArtwork(sample, null);
  sample.src = '/images/icon.png';
  window.addEventListener('pagehide', () => {
    if (artworkURL) { URL.revokeObjectURL(artworkURL); artworkURL = null; }
  });
})();
