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
  test(`${locale}: feature cards render recordings and interactive previews`, async t => {
    const app = await setup(t, locale);
    const doc = app.window.document;
    assert.equal(doc.querySelectorAll('[data-feature-presentation="media"]').length, 4);
    const cleaning = doc.querySelector('[data-feature-media="cleaning"]');
    const cleaningStory = doc.querySelector('[data-feature="cleaning"]');
    const image = cleaning.querySelector('[data-feature-image]');
    const garlands = doc.querySelector('[data-feature-media="garlands"]');
    const images = doc.querySelector('[data-feature-media="images"]');
    const garlandVideo = garlands.querySelector('[data-feature-video]');
    const garlandPreview = garlands.querySelector('[data-garland-preview]');
    const placement = doc.querySelector('[data-feature-media="placement"]');
    const placementVideo = placement.querySelector('[data-feature-video]');
    assert.equal(cleaning.querySelector('.desktop-menu'), null);
    assert.ok(cleaningStory.querySelector('.feature-story__copy > .feature-switcher--tools'));
    assert.equal(cleaningStory.querySelector('.feature-story__visual > .feature-switcher--tools'), null);
    assert.equal(doc.querySelectorAll('#features .desktop-menu').length, 3);
    const toolIcons = [...doc.querySelectorAll('[data-feature="cleaning"] .feature-tool-icon')];
    assert.deepEqual(toolIcons.map(icon => new URL(icon.src).pathname),
      ['/images/features/tools/shovel.png', '/images/features/tools/broom.png', '/images/features/tools/squeegee.png']);
    assert.ok(toolIcons.every(icon => icon.alt === ''));
    assert.equal(doc.querySelectorAll('[data-garland-preview] .garland-preview__lights').length, 1);
    assert.equal(doc.querySelectorAll('[data-garland-preview] .garland-preview__dock').length, 0);
    assert.ok(images.querySelector('[data-custom-preview] .feature-upload [data-custom-file]'));
    assert.equal(images.querySelector('.custom-preview__drop'), null);
    assert.equal(doc.querySelectorAll('[data-custom-motion]').length, 0);
    assert.equal(doc.querySelectorAll('#features [data-feature-pause], #features [data-demo-pause]').length, 0);
    assert.ok([...doc.querySelectorAll('#features video')].every(video => !video.hasAttribute('controls')));
    assert.equal(garlandPreview.hidden, true);
    assert.match(garlandVideo.src, /garland-showcase\.mp4\?v=/);
    assert.match(garlandVideo.getAttribute('poster'), /garland-showcase\.jpg\?v=/);
    assert.match(placementVideo.src, /placement-over-windows\.mp4\?v=/);
    assert.match(placementVideo.getAttribute('poster'), /placement-over-windows\.jpg\?v=/);
    assert.equal(doc.querySelectorAll('[data-feature="garlands"] [data-feature-choice]').length, 0);
    assert.deepEqual([...doc.querySelectorAll('[data-feature="placement"] [data-feature-choice]')].map(button => button.dataset.featureChoice), ['over', 'desktop', 'strip']);
    assert.ok(doc.querySelector('[data-feature="placement"] .feature-story__copy > .feature-switcher'));
    assert.equal(doc.querySelector('[data-feature="placement"] .feature-story__visual > .feature-switcher'), null);
    assert.deepEqual([...doc.querySelectorAll('[data-feature="placement"] .feature-placement-icon img')].map(icon => new URL(icon.src).pathname),
      ['/images/features/placement/over-windows.png', '/images/features/placement/desktop-only.png', '/images/features/placement/top-strip.png']);
    assert.ok([...doc.querySelectorAll('[data-feature="placement"] .feature-placement-icon img')].every(icon => icon.alt === ''));
    assert.equal(image.alt, doc.querySelector('[data-feature="cleaning"] [data-feature-choice="snow"]').dataset.alt);
    assert.equal(image.hidden, true);
    assert.match(cleaning.querySelector('[data-feature-video]').src, /cleaning-snow\.mp4\?v=/);
    app.click('[data-feature-choice="leaves"]');
    assert.match(cleaning.querySelector('[data-feature-video]').src, /cleaning-snow\.mp4\?v=/,
      'The previous video stays visible until the next poster is ready');
    await wait(0);
    assert.match(image.src, /cleaning-leaves\.jpg\?v=/);
    assert.match(cleaning.querySelector('[data-feature-video]').src, /cleaning-leaves\.mp4\?v=/);
    assert.equal(image.alt, doc.querySelector('[data-feature="cleaning"] [data-feature-choice="leaves"]').dataset.alt);
    assert.equal(image.hidden, false);
    assert.equal(cleaning.classList.contains('is-switching'), true);
    cleaning.querySelector('[data-feature-video]').dispatchEvent(new app.window.Event('loadeddata'));
    assert.equal(image.hidden, true);
    assert.equal(cleaning.classList.contains('is-switching'), false);
    assert.equal(doc.querySelector('[data-feature="cleaning"] [data-feature-choice="leaves"]').getAttribute('aria-pressed'), 'true');
    app.click('[data-feature-choice="rain"]');
    await wait(0);
    assert.match(image.src, /cleaning-rain\.jpg\?v=/);
    assert.match(cleaning.querySelector('[data-feature-video]').src, /cleaning-rain\.mp4\?v=/);
    assert.equal(cleaning.dataset.cleaningTool, 'rain', 'The rain recording uses its full-width framing');
    app.click('[data-feature-choice="snow"]');
    await wait(0);
    assert.equal(cleaning.dataset.cleaningTool, 'snow', 'Other tools return to the enlarged framing');
    app.click('[data-feature="placement"] [data-feature-choice="desktop"]');
    await wait(0);
    assert.match(placementVideo.src, /placement-desktop\.mp4\?v=/);
    assert.match(placementVideo.getAttribute('poster'), /placement-desktop\.jpg\?v=/);
    assert.equal(placementVideo.getAttribute('aria-label'), doc.querySelector('[data-feature="placement"] [data-feature-choice="desktop"]').dataset.alt);
    assert.equal(placement.querySelector('[data-feature-image]').hidden, false);
    placementVideo.dispatchEvent(new app.window.Event('loadeddata'));
    assert.equal(placement.querySelector('[data-feature-image]').hidden, true);
    app.click('[data-feature="placement"] [data-feature-choice="strip"]');
    await wait(0);
    assert.match(placementVideo.src, /placement-top-strip\.mp4\?v=/);
    assert.match(placementVideo.getAttribute('poster'), /placement-top-strip\.jpg\?v=/);
    assert.equal(placementVideo.getAttribute('aria-label'), doc.querySelector('[data-feature="placement"] [data-feature-choice="strip"]').dataset.alt);
    assert.equal(doc.querySelector('[data-feature="placement"] [data-feature-choice="strip"]').getAttribute('aria-pressed'), 'true');
    app.click('[data-feature="placement"] [data-feature-choice="over"]');
    await wait(0);
    assert.match(placementVideo.src, /placement-over-windows\.mp4\?v=/);
    assert.equal(doc.querySelector('[data-feature="placement"] [data-feature-choice="over"]').getAttribute('aria-pressed'), 'true');
    app.visible(true);
    assert.equal(garlandVideo.paused, false);
    garlandVideo.dispatchEvent(new app.window.Event('error'));
    assert.equal(garlandVideo.hidden, true);
    assert.equal(garlandPreview.hidden, false);
    assert.equal(garlands.dataset.featureMediaState, 'preview');
    assert.equal(placementVideo.paused, false);
    placementVideo.dispatchEvent(new app.window.Event('error'));
    assert.equal(placementVideo.hidden, true);
    assert.equal(placement.querySelector('[data-feature-image]').hidden, false);
    assert.equal(placement.dataset.featureMediaState, 'preview');
  });
}

test('cleaning recordings obey playback visibility and reduced motion', async t => {
  const app = await setup(t);
  const doc = app.window.document;
  const choice = doc.querySelector('[data-feature="cleaning"] [data-feature-choice="leaves"]');
  const root = doc.querySelector('[data-feature-media="cleaning"]');
  const video = root.querySelector('[data-feature-video]');
  app.visible(true);
  choice.click();
  await wait(0);
  assert.match(video.src, /cleaning-leaves\.mp4/);
  assert.equal(video.hidden, false);
  assert.equal(root.querySelector('[data-feature-image]').hidden, false);
  video.dispatchEvent(new app.window.Event('loadeddata'));
  assert.equal(root.querySelector('[data-feature-image]').hidden, true);
  assert.equal(video.paused, false);
  app.visible(false);
  assert.equal(video.paused, true);
  app.visible(true);
  assert.equal(video.paused, false);
  app.reduce(true);
  assert.equal(video.paused, true);
});

test('automatic garland and placement recordings stop offscreen and for reduced motion', async t => {
  const app = await setup(t);
  const videos = ['garlands', 'placement'].map(name =>
    app.window.document.querySelector(`[data-feature-media="${name}"] [data-feature-video]`));
  assert.ok(videos.every(video => video.paused));
  app.visible(true);
  assert.ok(videos.every(video => !video.paused));
  app.visible(false);
  assert.ok(videos.every(video => video.paused));
  app.visible(true);
  app.reduce(true);
  assert.ok(videos.every(video => video.paused));
  app.reduce(false);
  assert.ok(videos.every(video => !video.paused));
});

test('custom artwork stays local and validates files', async t => {
  const app = await setup(t);
  const doc = app.window.document;
  assert.ok(app.canvasCalls.length > 0, 'The default artwork makes the preview visible');
  app.visible(true);
  assert.ok(app.frames.size > 0);
  app.reduce(true);
  assert.equal(app.frames.size, 0);
  app.reduce(false);
  assert.ok(app.frames.size > 0);
  app.drop({ type: 'image/svg+xml', size: 100 });
  assert.equal(doc.querySelector('[data-custom-status]').textContent,
    doc.querySelector('[data-custom-status]').dataset.error);
  app.drop({ type: 'image/png', size: 1024 });
  await wait(0);
  assert.equal(doc.querySelector('[data-custom-status]').textContent,
    doc.querySelector('[data-custom-status]').dataset.ready);
  assert.ok(app.canvasCalls.length > 0);
  app.window.dispatchEvent(new app.window.Event('pagehide'));
  assert.deepEqual(app.revoked, ['blob:local-image']);
});
