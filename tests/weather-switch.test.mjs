import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import test from 'node:test';
import { Window } from 'happy-dom';

const root = new URL('../', import.meta.url);
const playbackScript = await readFile(new URL('js/preview.js', root), 'utf8');
const radioScript = await readFile(new URL('js/weather-switch.js', root), 'utf8');

async function setup(t, { locale = 'en', enhance = true, reduced = false, resizeObserver = true, rows = [] } = {}) {
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
  window.console.error = (...args) => errors.push(args.join(' '));
  window.addEventListener('error', event => errors.push(event.error || event.message));
  window.fetch = () => { throw new Error('The weather switch must not fetch remote resources'); };
  const query = new window.EventTarget();
  query.matches = reduced;
  const nativeMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = text => text.includes('prefers-reduced-motion') ? query : nativeMatchMedia(text);
  let visibilityHidden = false;
  Object.defineProperty(window.document, 'hidden', { get: () => visibilityHidden });
  const intersections = [];
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; intersections.push(this); }
    observe() {}
    disconnect() {}
  };
  window.ResizeObserver = resizeObserver ? class { observe() {} disconnect() {} } : undefined;
  // This DOM runner has no layout engine. Supply only the measurements needed
  // for the upstream spring's spacing; these are not visual/layout assertions.
  Object.defineProperties(window.HTMLElement.prototype, {
    offsetWidth: { configurable: true, get() { return 60 + this.textContent.length * 8; } },
    offsetHeight: { configurable: true, get() { return 48; } },
    offsetTop: { configurable: true, get() {
      const index = this.parentElement ? [...this.parentElement.children].indexOf(this) : -1;
      return rows[index] ?? 0;
    } }
  });
  const html = await readFile(new URL(locale === 'uk' ? 'uk/index.html' : 'index.html', root), 'utf8');
  window.document.write(html);
  const preview = window.document.querySelector('[data-preview]');
  const host = preview.querySelector('[data-weather-switch]');
  const originals = [...host.querySelectorAll('[data-theme]')];
  const options = originals.map(button => ({
    ...button.dataset, label: button.querySelector('.theme-name').textContent
  }));
  const video = preview.querySelector('[data-effect-video]');
  const playback = { paused: true, loads: 0 };
  Object.defineProperty(video, 'paused', { get: () => playback.paused });
  video.play = () => {
    playback.paused = false;
    video.dispatchEvent(new window.Event('play'));
    return Promise.resolve();
  };
  video.pause = () => {
    playback.paused = true;
    video.dispatchEvent(new window.Event('pause'));
  };
  video.load = () => { playback.loads++; };
  window.eval(playbackScript);
  const visible = on => intersections.forEach(observer => observer.callback([{ isIntersecting: on }]));
  visible(true);
  if (enhance) window.eval(radioScript);
  await wait(30);
  t.after(() => assert.deepEqual(errors, [], 'No runtime or React errors'));
  const chips = () => [...host.querySelectorAll('[role="radio"]')];
  const click = index => chips()[index].dispatchEvent(new window.MouseEvent('click', { bubbles: true, detail: 1 }));
  const key = (index, key) => chips()[index].dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  const assertChoice = index => {
    assert.equal(preview.dataset.effect, options[index].theme);
    assert.equal(video.getAttribute('src'), options[index].video);
    assert.equal(video.getAttribute('poster'), options[index].poster);
    assert.equal(video.getAttribute('aria-label'), options[index].description);
    assert.equal(preview.querySelector('[data-desktop-app-icon]').getAttribute('src'), options[index].menuIcon);
    assert.equal(preview.querySelector('[data-video-caption]').textContent, options[index].label);
    assert.equal(preview.querySelector('[data-theme-description]').textContent, options[index].description);
    if (enhance) {
      assert.deepEqual(chips().map(chip => chip.getAttribute('aria-checked')), options.map((_, i) => String(i === index)));
      assert.deepEqual(chips().map(chip => chip.tabIndex), options.map((_, i) => i === index ? 0 : -1));
    } else {
      assert.deepEqual(originals.map(button => button.getAttribute('aria-pressed')), options.map((_, i) => String(i === index)));
    }
  };
  return {
    window, preview, host, video, options, playback, originals, chips, click, key, visible, assertChoice,
    layout(positions) { rows = positions; window.dispatchEvent(new window.Event('resize')); },
    hidden(value) { visibilityHidden = value; window.document.dispatchEvent(new window.Event('visibilitychange')); },
    reduce(value) { query.matches = value; query.dispatchEvent(new window.Event('change')); }
  };
}

for (const locale of ['en', 'uk']) {
  test(`${locale}: JellyRadio switches all five real videos and keeps the accessible labels`, async t => {
    const app = await setup(t, { locale });
    const group = app.host.querySelector('[role="radiogroup"]');
    assert.ok(group, 'The supplied React component mounts');
    assert.equal(group.getAttribute('aria-label'), locale === 'uk' ? 'Виберіть атмосферу' : 'Choose an atmosphere');
    assert.equal(app.chips().length, 5);
    assert.equal(app.preview.querySelector('[data-preview-pause]'), null);
    assert.equal(app.video.hasAttribute('controls'), false);
    assert.deepEqual(app.chips().map(chip => chip.querySelector('.jelly-radio__label').textContent), app.options.map(option => option.label));
    app.assertChoice(0);
    assert.equal(app.playback.loads, 0, 'Mounting the radio does not reload the initial video');
    for (let index = 1; index < 5; index++) {
      app.click(index);
      await wait(20);
      app.assertChoice(index);
    }
    const loads = app.playback.loads;
    app.click(4);
    assert.equal(app.playback.loads, loads, 'Selecting the current choice does not restart playback');
    app.click(0); app.click(2); app.click(1);
    await wait(20);
    app.assertChoice(1);
  });
}

test('placement choices use the same animated radio and forward video selections', async t => {
  const app = await setup(t);
  const fallback = app.window.document.querySelector('[data-feature="placement"] .feature-switcher--placement');
  const group = app.window.document.querySelector('[data-placement-switch] [role="radiogroup"]');
  const radios = [...group.querySelectorAll('[role="radio"]')];
  const native = [...fallback.querySelectorAll('[data-feature-choice]')];
  const choices = [];
  native.forEach(button => button.addEventListener('click', () => choices.push(button.dataset.featureChoice)));

  assert.equal(fallback.hidden, true);
  assert.equal(radios.length, 3);
  assert.deepEqual(radios.map(radio => radio.textContent), native.map(button => button.textContent));
  radios[1].dispatchEvent(new app.window.MouseEvent('click', { bubbles: true, detail: 1 }));
  await wait(60);
  assert.deepEqual(choices, ['desktop']);
  assert.deepEqual(radios.map(radio => radio.getAttribute('aria-checked')), ['false', 'true', 'false']);
  const moving = radios[1].style.transform;
  await wait(60);
  assert.notEqual(radios[1].style.transform, moving, 'Placement clicks run the same spring as season clicks');

  radios[1].dispatchEvent(new app.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  await wait(20);
  assert.deepEqual(choices, ['desktop', 'strip']);
  assert.equal(radios[2].getAttribute('aria-checked'), 'true');
  assert.equal(app.window.document.activeElement, radios[2]);
});

test('keyboard arrows wrap, Home/End focus the selection, and external changes stay in sync', async t => {
  const app = await setup(t);
  for (const [from, key, to] of [[0, 'ArrowLeft', 4], [4, 'ArrowRight', 0], [0, 'End', 4], [4, 'Home', 0], [0, 'ArrowDown', 1], [1, 'ArrowUp', 0]]) {
    app.key(from, key);
    await wait(15);
    app.assertChoice(to);
    assert.equal(app.window.document.activeElement, app.chips()[to]);
  }
  app.preview.dispatchEvent(new app.window.CustomEvent('wonderfall:theme-request', { detail: { theme: 'petals' } }));
  await wait(15);
  app.assertChoice(3);
});

test('selection preserves offscreen and hidden-tab playback rules', async t => {
  const app = await setup(t);
  assert.equal(app.video.paused, false);
  app.click(2);
  await wait(15);
  app.assertChoice(2);
  assert.equal(app.video.paused, false);
  app.visible(false); app.click(3);
  await wait(15);
  app.assertChoice(3);
  assert.equal(app.video.paused, true);
  app.visible(true);
  assert.equal(app.video.paused, false);
  app.hidden(true); app.click(4);
  await wait(15);
  app.assertChoice(4);
  assert.equal(app.video.paused, true);
  app.hidden(false);
  assert.equal(app.video.paused, false);
});

test('springs animate, then settle immediately when reduced motion is enabled live', async t => {
  const app = await setup(t, { resizeObserver: false });
  app.click(2);
  await wait(60);
  const moving = app.chips()[2].style.transform;
  await wait(60);
  assert.notEqual(app.chips()[2].style.transform, moving, 'Pointer selection runs the upstream spring');
  app.reduce(true);
  await wait(40);
  const settled = app.chips().map(chip => chip.style.transform);
  await wait(120);
  assert.deepEqual(app.chips().map(chip => chip.style.transform), settled, 'Live reduced motion stops in-flight springs');
  assert.equal(app.video.paused, true);
  app.click(4);
  await wait(40);
  app.assertChoice(4);
  const instant = app.chips().map(chip => chip.style.transform);
  await wait(120);
  assert.deepEqual(app.chips().map(chip => chip.style.transform), instant);
  app.window.dispatchEvent(new app.window.Event('resize'));
  await wait(20);
  app.assertChoice(4);
});

test('native HTML choices still switch videos when the React bundle is unavailable', async t => {
  const app = await setup(t, { enhance: false, reduced: true });
  assert.equal(app.host.hidden, false);
  app.assertChoice(0);
  app.originals[1].click();
  app.assertChoice(1);
  assert.equal(app.video.paused, true, 'Reduced motion also applies to fallback playback');
  app.reduce(false);
  assert.equal(app.video.paused, false);
});

test('wrapped choices keep neighbour motion in their own row and adjust after resizing', async t => {
  const app = await setup(t, { reduced: true, rows: [0, 0, 68, 68, 136] });
  const positions = () => app.chips().map(chip => Number(chip.style.transform.match(/translateX\(([-\d.]+)px\)/)?.[1]));
  assert.ok(positions()[1] > 0, 'The selected chip makes room within its row');
  assert.deepEqual(positions().slice(2), [0, 0, 0], 'Other rows stay centered');
  app.click(2);
  await wait(20);
  app.assertChoice(2);
  assert.deepEqual(positions().slice(0, 3), [0, 0, 0]);
  assert.ok(positions()[3] > 0);
  assert.equal(positions()[4], 0);
  app.click(4);
  await wait(20);
  app.assertChoice(4);
  assert.deepEqual(positions(), [0, 0, 0, 0, 0], 'A lone choice does not shove other rows sideways');
  app.layout([0, 0, 0, 0, 0]);
  await wait(20);
  assert.ok(positions().slice(0, 4).every(x => x < 0), 'A wider layout restores single-row spacing');
  app.assertChoice(4);
  app.layout([0, 68, 136, 204, 272]);
  await wait(20);
  assert.deepEqual(positions(), [0, 0, 0, 0, 0], 'Narrow layouts can keep every choice on a separate row');
  app.key(4, 'Home');
  await wait(20);
  app.assertChoice(0);
  assert.equal(app.window.document.activeElement, app.chips()[0]);
});
