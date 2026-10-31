import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Window } from 'happy-dom';

const root = new URL('../', import.meta.url);
const script = await readFile(new URL('js/closing-screen.js', root), 'utf8');

async function setup(t, { reduced = false, locale = 'en' } = {}) {
  const window = new Window({
    url: 'http://127.0.0.1:8000/',
    settings: {
      enableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true, enableImageFileLoading: false,
      handleDisabledFileLoadingAsSuccess: true, suppressInsecureJavaScriptEnvironmentWarning: true
    }
  });
  t.after(() => window.happyDOM.close());
  const query = new window.EventTarget();
  query.matches = reduced;
  window.matchMedia = () => query;
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) { observers.push(callback); }
    observe() {}
  };
  const frames = [];
  window.requestAnimationFrame = callback => frames.push(callback);
  window.cancelAnimationFrame = () => {};
  window.innerHeight = 800;
  const html = await readFile(new URL(locale === 'uk' ? 'uk/index.html' : 'index.html', root), 'utf8');
  window.document.write(html);
  const section = window.document.querySelector('[data-closing-screen]');
  const video = section.querySelector('[data-closing-video]');
  const calls = { play: 0, pause: 0 };
  video.play = () => { calls.play += 1; return Promise.resolve(); };
  video.pause = () => { calls.pause += 1; };
  let top = 2000;
  section.getBoundingClientRect = () => ({ top, height: 600 });
  window.eval(script);
  return {
    section, video, calls, query, window,
    enter: isIntersecting => observers[0]([{ isIntersecting }]),
    batch: entries => observers[0](entries),
    scrollTo(value) {
      top = value;
      window.dispatchEvent(new window.Event('scroll'));
      while (frames.length) frames.shift()();
    }
  };
}

for (const locale of ['en', 'uk']) {
  test(`${locale}: the closing display holds the call to action and replaces the old banner`, async t => {
    const { section, window } = await setup(t, { locale });
    assert.equal(window.document.querySelector('.final-cta'), null);
    const content = section.querySelector('.closing-screen__content');
    assert.ok(content.querySelector('h2').textContent);
    assert.match(content.querySelector('a.button').href, /apps\.apple\.com/);
    assert.ok(section.querySelector('video').getAttribute('poster'));
    assert.equal(section.nextElementSibling, null, 'The footer follows straight after the display');
  });
}

for (const path of ['blog/index.html', 'blog/mac-desktop-effects/index.html', 'uk/blog/index.html', 'uk/blog/mac-desktop-effects/index.html']) {
  test(`${path} ends with the closing display, with its styles and script`, async () => {
    const html = await readFile(new URL(path, root), 'utf8');
    assert.equal(html.match(/data-closing-screen/g).length, 1);
    assert.equal(html.includes('final-cta'), false);
    assert.match(html, /css\/desktop-preview\.css/);
    assert.match(html, /js\/closing-screen\.js/);
  });
}

test('the display rises with the scroll and settles as its section ends', async t => {
  const { section, enter, scrollTo } = await setup(t);
  enter(true);
  scrollTo(800);
  assert.equal(section.style.getPropertyValue('--closing-progress'), '0.00000');
  assert.ok(section.classList.contains('is-rising'));
  scrollTo(500);
  assert.equal(section.style.getPropertyValue('--closing-progress'), '0.50000');
  scrollTo(200);
  assert.equal(section.style.getPropertyValue('--closing-progress'), '1.00000');
  assert.equal(section.classList.contains('is-rising'), false);
});

test('only the newest visibility state in a batch counts', async t => {
  const { section, batch, scrollTo } = await setup(t);
  batch([{ isIntersecting: false }, { isIntersecting: true }]);
  scrollTo(500);
  assert.equal(section.style.getPropertyValue('--closing-progress'), '0.50000');
});

test('the video plays only in view', async t => {
  const { calls, enter } = await setup(t);
  enter(true);
  assert.equal(calls.play, 1);
  const paused = calls.pause;
  enter(false);
  assert.equal(calls.pause, paused + 1);
});

test('reduced motion keeps the display settled with the video paused', async t => {
  const { section, calls, enter, scrollTo } = await setup(t, { reduced: true });
  enter(true);
  scrollTo(500);
  assert.equal(section.style.getPropertyValue('--closing-progress'), '');
  assert.equal(calls.play, 0);
});
