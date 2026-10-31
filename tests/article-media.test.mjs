import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Window } from 'happy-dom';

const root = new URL('../', import.meta.url);
const script = await readFile(new URL('js/article-media.js', root), 'utf8');

async function setup(t, reduced = false) {
  const window = new Window({
    url: 'http://127.0.0.1:8000/blog/mac-desktop-effects/',
    settings: {
      enableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true, enableImageFileLoading: false,
      handleDisabledFileLoadingAsSuccess: true, suppressInsecureJavaScriptEnvironmentWarning: true
    }
  });
  t.after(() => window.happyDOM.close());
  window.matchMedia = () => ({ matches: reduced });
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) { observers.push(callback); }
    observe() {}
  };
  const html = await readFile(new URL('blog/mac-desktop-effects/index.html', root), 'utf8');
  window.document.write(html);
  const videos = [...window.document.querySelectorAll('video[data-article-video]')];
  const calls = new Map(videos.map(video => [video, { play: 0, pause: 0 }]));
  for (const video of videos) {
    video.play = () => { calls.get(video).play += 1; return Promise.resolve(); };
    video.pause = () => { calls.get(video).pause += 1; };
  }
  let hidden = false;
  Object.defineProperty(window.document, 'hidden', { get: () => hidden });
  window.eval(script);
  return {
    videos, calls, observers,
    setHidden(value) {
      hidden = value;
      window.document.dispatchEvent(new window.Event('visibilitychange'));
    }
  };
}

test('guide videos have no controls and differ within the page', async t => {
  const { videos } = await setup(t);
  assert.ok(videos.length > 2);
  assert.ok(videos.every(video => !video.hasAttribute('controls')));
  const sources = videos.map(video => video.getAttribute('src'));
  assert.equal(new Set(sources).size, sources.length);
});

test('a video on screen resumes when the tab returns; one off screen stays paused', async t => {
  const { videos, calls, observers, setHidden } = await setup(t);
  const [shown, other] = videos;
  observers[0]([{ target: shown, isIntersecting: true }]);
  assert.equal(calls.get(shown).play, 1);
  setHidden(true);
  assert.equal(calls.get(shown).pause, 1);
  setHidden(false);
  assert.equal(calls.get(shown).play, 2);
  assert.equal(calls.get(other).play, 0);
});

test('reduced motion leaves every video on its poster', async t => {
  const { videos, calls, observers } = await setup(t, true);
  assert.equal(observers.length, 0);
  assert.equal(calls.get(videos[0]).play, 0);
});
