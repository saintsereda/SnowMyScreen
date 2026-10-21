import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import test from 'node:test';
import { Window } from 'happy-dom';

const root = new URL('../', import.meta.url);
const script = await readFile(new URL('js/features.js', root), 'utf8');

async function setup(t, locale = 'en') {
  const window = new Window({
    url: `http://127.0.0.1:8000/${locale === 'uk' ? 'uk/' : ''}`,
    settings: {
      enableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true, enableImageFileLoading: false,
      handleDisabledFileLoadingAsSuccess: true, suppressInsecureJavaScriptEnvironmentWarning: true
    }
  });
  t.after(() => window.happyDOM.close());
  const errors = [];
  window.addEventListener('error', event => errors.push(event.error || event.message));
  window.console.error = (...args) => errors.push(args.join(' '));
  const query = new window.EventTarget();
  query.matches = false;
  window.matchMedia = () => query;
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) { observers.push(callback); }
    observe() {}
  };
  window.ResizeObserver = class { observe() {} };
  const frames = new Map();
  let nextFrame = 0;
  window.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  window.cancelAnimationFrame = id => frames.delete(id);
  const revoked = [];
  window.URL.createObjectURL = () => 'blob:local-image';
  window.URL.revokeObjectURL = url => revoked.push(url);
  window.Image = class {
    naturalWidth = 64;
    naturalHeight = 32;
    set src(value) { this.value = value; queueMicrotask(() => this.onload?.()); }
    get src() { return this.value; }
  };
  const canvasCalls = [];
  const context = {
    setTransform() {}, clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {},
    drawImage(...args) { canvasCalls.push(args); }, set globalAlpha(value) { this.alpha = value; }
  };
  window.HTMLCanvasElement.prototype.getContext = () => context;
  const html = await readFile(new URL(locale === 'uk' ? 'uk/index.html' : 'index.html', root), 'utf8');
  window.document.write(html);
  const canvas = window.document.querySelector('[data-custom-canvas]');
  canvas.getBoundingClientRect = () => ({ width: 520, height: 270 });
  for (const video of window.document.querySelectorAll('[data-feature-video]')) {
    let paused = true;
    Object.defineProperty(video, 'paused', { get: () => paused });
    video.play = () => { paused = false; video.dispatchEvent(new window.Event('play')); return Promise.resolve(); };
    video.pause = () => { paused = true; video.dispatchEvent(new window.Event('pause')); };
    video.load = () => { video.dataset.loaded = 'true'; };
  }
  window.eval(script);
  await wait(0);
  t.after(() => assert.deepEqual(errors, [], 'No feature runtime errors'));
  return {
    window, canvas, canvasCalls, frames, revoked,
    visible(value) { observers.forEach(callback => callback([{ isIntersecting: value }])); },
    reduce(value) { query.matches = value; query.dispatchEvent(new window.Event('change')); },
    click(selector) { window.document.querySelector(selector).click(); },
    drop(file) {
      const event = new window.Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: { files: [file], types: ['Files'] } });
      window.document.querySelector('[data-custom-preview]').dispatchEvent(event);
    }
  };
}

for (const locale of ['en', 'uk']) {
  test(`${locale}: all four feature cards switch their real preview states`, async t => {
    const app = await setup(t, locale);
    const doc = app.window.document;
    assert.equal(doc.querySelectorAll('[data-feature-presentation="media"]').length, 4);
    const cleaning = doc.querySelector('[data-feature-media="cleaning"]');
    const image = cleaning.querySelector('[data-feature-image]');
    const toolIcons = [...doc.querySelectorAll('[data-feature="cleaning"] .feature-tool-icon')];
    assert.deepEqual(toolIcons.map(icon => new URL(icon.src).pathname),
      ['/images/features/tools/shovel.png', '/images/features/tools/broom.png', '/images/features/tools/squeegee.png']);
    assert.ok(toolIcons.every(icon => icon.alt === ''));
    assert.equal(doc.querySelectorAll('[data-garland-preview] .garland-preview__lights').length, 1);
    assert.equal(doc.querySelectorAll('[data-garland-preview] .garland-preview__dock').length, 0);
    assert.equal(image.alt, doc.querySelector('[data-feature="cleaning"] [data-feature-choice="snow"]').dataset.alt);
    app.click('[data-feature-choice="leaves"]');
    assert.match(image.src, /leaf-piles\.jpg/);
    assert.equal(image.alt, doc.querySelector('[data-feature="cleaning"] [data-feature-choice="leaves"]').dataset.alt);
    assert.equal(doc.querySelector('[data-feature="cleaning"] [data-feature-choice="leaves"]').getAttribute('aria-pressed'), 'true');
    app.click('[data-feature-choice="rain"]');
    assert.match(image.src, /rain-droplets\.jpg/);
    app.click('[data-feature-choice="cozyEvening"]');
    assert.equal(doc.querySelector('[data-garland-preview]').dataset.scene, 'cozyEvening');
    app.click('[data-feature-choice="celebration"]');
    assert.equal(doc.querySelector('[data-garland-preview]').dataset.scene, 'celebration');
    app.visible(true);
    const garlandPause = doc.querySelector('[data-feature="garlands"] [data-demo-pause]');
    garlandPause.click();
    assert.equal(doc.querySelector('[data-garland-preview]').classList.contains('is-paused'), true);
    garlandPause.click();
    assert.equal(doc.querySelector('[data-garland-preview]').classList.contains('is-paused'), false);
    app.click('[data-placement-choice="desktop"]');
    assert.equal(doc.querySelector('[data-placement-preview]').dataset.layer, 'desktop');
    assert.equal(doc.querySelector('[data-placement-choice="desktop"]').getAttribute('aria-pressed'), 'true');
    app.click('[data-placement-choice="over"]');
    assert.equal(doc.querySelector('[data-placement-preview]').dataset.layer, 'over');
    assert.equal(doc.querySelector('[data-placement-preview]').getAttribute('aria-label'),
      doc.querySelector('[data-placement-choice="over"]').dataset.description);
  });
}

test('a later local recording replaces a poster and obeys playback visibility', async t => {
  const app = await setup(t);
  const doc = app.window.document;
  const choice = doc.querySelector('[data-feature="cleaning"] [data-feature-choice="leaves"]');
  const root = doc.querySelector('[data-feature-media="cleaning"]');
  const video = root.querySelector('[data-feature-video]');
  choice.dataset.src = '/videos/cleaning-leaves.mp4';
  app.visible(true);
  choice.click();
  assert.match(video.src, /cleaning-leaves\.mp4/);
  assert.equal(video.hidden, false);
  assert.equal(root.querySelector('[data-feature-image]').hidden, true);
  assert.equal(video.paused, false);
  app.visible(false);
  assert.equal(video.paused, true);
  app.visible(true);
  assert.equal(video.paused, false);
  app.reduce(true);
  assert.equal(video.paused, true);
});

test('custom artwork stays local, validates files, and switches the app motion profiles', async t => {
  const app = await setup(t);
  const doc = app.window.document;
  assert.ok(app.canvasCalls.length > 0, 'The default artwork makes the preview visible');
  app.visible(true);
  const pause = doc.querySelector('[data-feature="images"] [data-demo-pause]');
  pause.click();
  assert.equal(pause.getAttribute('aria-pressed'), 'true');
  assert.equal(app.frames.size, 0);
  pause.click();
  assert.equal(pause.getAttribute('aria-pressed'), 'false');
  assert.ok(app.frames.size > 0);
  app.drop({ type: 'image/svg+xml', size: 100 });
  assert.equal(doc.querySelector('[data-custom-status]').textContent,
    doc.querySelector('[data-custom-status]').dataset.error);
  app.drop({ type: 'image/png', size: 1024 });
  await wait(0);
  assert.equal(doc.querySelector('[data-custom-status]').textContent,
    doc.querySelector('[data-custom-status]').dataset.ready);
  assert.ok(app.canvasCalls.length > 0);
  app.click('[data-custom-motion="leaves"]');
  assert.equal(doc.querySelector('[data-custom-motion="leaves"]').getAttribute('aria-pressed'), 'true');
  app.click('[data-custom-motion="rain"]');
  assert.equal(doc.querySelector('[data-custom-motion="rain"]').getAttribute('aria-pressed'), 'true');
  app.window.dispatchEvent(new app.window.Event('pagehide'));
  assert.deepEqual(app.revoked, ['blob:local-image']);
});
