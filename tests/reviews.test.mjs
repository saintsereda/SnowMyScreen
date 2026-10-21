import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Window } from 'happy-dom';

const root = new URL('../', import.meta.url);
const script = await readFile(new URL('js/reviews.js', root), 'utf8');
const css = await readFile(new URL('css/site.css', root), 'utf8');
const reviewCSS = css.slice(css.indexOf('.reviews-section {'), css.indexOf('.setup-section {'));

async function setup(t, { locale = 'en', reduced = false, viewport = 800 } = {}) {
  const w = new Window({ settings: {
    enableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true, enableImageFileLoading: false,
    handleDisabledFileLoadingAsSuccess: true, suppressInsecureJavaScriptEnvironmentWarning: true
  } });
  const errors = [];
  w.console.error = (...args) => errors.push(args.join(' '));
  w.addEventListener('error', event => errors.push(event.message));
  w.document.write(await readFile(new URL(locale === 'uk' ? 'uk/index.html' : 'index.html', root), 'utf8'));
  const style = w.document.createElement('style');
  style.textContent = reviewCSS + '.reviews-track { column-gap: 20px; }';
  w.document.head.append(style);
  const section = w.document.querySelector('[data-reviews]');
  const marquee = section.querySelector('[data-reviews-marquee]');
  const track = section.querySelector('[data-reviews-track]');
  const originals = [...track.children];
  let cardWidth = 390, offset = 0, scrollWrites = 0, hidden = false, nextId = 1;
  const frames = new Map();
  originals.forEach(card => { card.getBoundingClientRect = () => ({ width: cardWidth }); });
  Object.defineProperties(marquee, {
    clientWidth: { get: () => viewport },
    scrollWidth: { get: () => track.children.length * (cardWidth + 20) - 20 },
    scrollLeft: { get: () => offset, set(value) { offset = value; scrollWrites++; } }
  });
  Object.defineProperty(w.document, 'hidden', { get: () => hidden });
  w.requestAnimationFrame = callback => { const id = nextId++; frames.set(id, callback); return id; };
  w.cancelAnimationFrame = id => frames.delete(id);
  marquee.setPointerCapture = () => assert.fail('The original ribbon must not capture mouse pointers');
  const motion = Object.assign(new w.EventTarget(), { matches: reduced });
  w.matchMedia = () => motion;
  let intersection;
  w.IntersectionObserver = class {
    constructor(callback) { intersection = callback; }
    observe() {}
  };
  async function frame() {
    const callbacks = [...frames.values()]; frames.clear();
    callbacks.forEach(callback => callback(16));
    await Promise.resolve();
  }
  w.eval(script);
  intersection([{ isIntersecting: true }]);
  await frame();
  t.after(async () => {
    await w.happyDOM.close();
    assert.deepEqual(errors, [], 'No review runtime errors');
  });
  return {
    w, section, marquee, track, originals, frame,
    period: () => originals.length * (cardWidth + 20),
    writes: () => scrollWrites,
    queued: () => frames.size,
    visible(value) { intersection([{ isIntersecting: value }]); },
    hidden(value) { hidden = value; w.document.dispatchEvent(new w.Event('visibilitychange')); },
    reduce(value) { motion.matches = value; motion.dispatchEvent(new w.Event('change')); },
    resize(value) { cardWidth = value; w.dispatchEvent(new w.Event('resize')); }
  };
}

for (const locale of ['en', 'uk']) {
  test(`${locale}: the original CSS ribbon runs without a pause button or JS scrolling`, async t => {
    const app = await setup(t, { locale });
    assert.equal(app.section.querySelector('[data-reviews-pause]'), null);
    assert.equal(app.section.classList.contains('is-running'), true);
    assert.equal(app.track.style.getPropertyValue('--review-distance'), `${-app.period()}px`);
    assert.equal(app.track.style.getPropertyValue('--review-duration'), `${app.period() / 28}s`);
    assert.equal(app.w.getComputedStyle(app.track).animationPlayState, 'running');
    assert.equal(app.track.querySelectorAll('[data-review-id]').length, app.originals.length);
    const copies = [...app.track.querySelectorAll('[data-review-clone]')];
    assert.ok(copies.length > 0);
    for (const copy of copies) {
      assert.equal(copy.getAttribute('aria-hidden'), 'true'); assert.equal(copy.inert, true);
    }
    await app.frame(); await app.frame();
    assert.equal(app.writes(), 0);
    assert.equal(app.queued(), 0, 'CSS animates; JavaScript does not run a frame loop');
  });
}

test('wheel and pointer input retain native browser behavior', async t => {
  const app = await setup(t);
  for (const delta of [{ deltaY: 120 }, { deltaY: -120 }, { deltaX: 120 }, { deltaX: -120 }]) {
    const event = new app.w.WheelEvent('wheel', { ...delta, bubbles: true, cancelable: true });
    app.marquee.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
  }
  for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
    const event = new app.w.PointerEvent(type, { clientX: type === 'pointerdown' ? 400 : 200, pointerType: 'mouse', pointerId: 1, button: 0, bubbles: true, cancelable: true });
    app.marquee.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
  }
  app.marquee.dispatchEvent(new app.w.Event('scroll'));
  assert.equal(app.writes(), 0, 'Native scrolling is never recentered by JavaScript');
});

test('offscreen and hidden state pause the CSS ribbon', async t => {
  const app = await setup(t);
  app.visible(false);
  assert.equal(app.section.classList.contains('is-running'), false);
  assert.equal(app.w.getComputedStyle(app.track).animationPlayState, 'paused');
  app.visible(true);
  assert.equal(app.section.classList.contains('is-running'), true);
  app.hidden(true);
  assert.equal(app.section.classList.contains('is-running'), false);
  app.hidden(false);
  assert.equal(app.section.classList.contains('is-running'), true);
});

test('resize rebuilds the ribbon without accumulating copies and reduced motion shows originals', async t => {
  const app = await setup(t);
  app.resize(300); await app.frame();
  const count = app.track.children.length;
  assert.equal(app.track.style.getPropertyValue('--review-distance'), `${-app.period()}px`);
  app.resize(300); await app.frame();
  assert.equal(app.track.children.length, count);
  app.reduce(true); await app.frame();
  assert.equal(app.track.querySelectorAll('[data-review-clone]').length, 0);
  assert.equal(app.section.classList.contains('is-enhanced'), false);
  assert.equal(app.section.classList.contains('is-running'), false);
  assert.deepEqual([...app.track.children], app.originals);
  app.reduce(false); await app.frame();
  assert.equal(app.section.classList.contains('is-running'), true);
  assert.equal(app.writes(), 0);
});
