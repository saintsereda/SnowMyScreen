import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Window } from 'happy-dom';

const root = new URL('../', import.meta.url);
const script = await readFile(new URL('js/brand-icon.js', root), 'utf8');

async function setup(t, path = '/', reduced = false) {
  const window = new Window({ url: `http://127.0.0.1:8000${path}`, settings: {
    enableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true, disableCSSFileLoading: true,
    enableImageFileLoading: false, handleDisabledFileLoadingAsSuccess: true,
    suppressInsecureJavaScriptEnvironmentWarning: true
  } });
  t.after(() => window.happyDOM.close());
  const media = Object.assign(new window.EventTarget(), { matches: reduced });
  window.matchMedia = () => media;
  const scrolls = [];
  window.scrollTo = options => scrolls.push(options);
  const file = path.endsWith('.html') ? path.slice(1) : path.slice(1) + 'index.html';
  window.document.write(await readFile(new URL(file, root), 'utf8'));
  window.eval(script);
  return { window, media, scrolls, links: [...window.document.querySelectorAll('[data-brand-link]')] };
}

function click(window, link, options = {}) {
  const event = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...options });
  link.dispatchEvent(event);
  return event;
}

function finish(window, link, animationName = 'brand-star-shooting') {
  const event = new window.Event('animationend', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  link.querySelector('.brand-icon__star').dispatchEvent(event);
}

for (const locale of ['en', 'uk']) {
  test(`${locale}: navigation and footer logos animate within their own icons`, async t => {
    const { window, links, scrolls } = await setup(t, locale === 'en' ? '/' : '/uk/');
    assert.equal(links.length, 2);
    for (const link of links) {
      const icon = link.querySelector('.brand-icon');
      assert.ok(icon.querySelector('.brand-icon__background'));
      assert.ok(icon.querySelector('.brand-icon__star'));
      assert.equal(click(window, link).defaultPrevented, true);
      assert.equal(icon.classList.contains('is-launching'), true);
      finish(window, link, 'unrelated-animation');
      assert.equal(icon.classList.contains('is-launching'), true, 'The link waits for the shooting-star motion');
      finish(window, link);
      assert.equal(icon.classList.contains('is-launching'), false);
    }
    assert.equal(scrolls.length, 2);
    assert.equal(window.location.pathname, locale === 'en' ? '/' : '/uk/');
  });
}

for (const [locale, path] of [
  ['en', '/support/'], ['uk', '/uk/support/'],
  ['en', '/privacy.html'], ['uk', '/uk/privacy.html']
]) {
  test(`${locale}: logo on ${path} follows its home link after the shared motion`, async t => {
    const { window, links } = await setup(t, path);
    assert.equal(click(window, links[0]).defaultPrevented, true);
    assert.equal(window.location.pathname, path);
    finish(window, links[0], 'unrelated-animation');
    assert.equal(window.location.pathname, path);
    finish(window, links[0]);
    assert.equal(window.location.pathname, locale === 'en' ? '/' : '/uk/');
  });
}

test('reduced motion and modified clicks keep native link behavior', async t => {
  const { window, links, media } = await setup(t, '/');
  assert.equal(click(window, links[0], { metaKey: true }).defaultPrevented, false);
  assert.equal(links[0].querySelector('.brand-icon').classList.contains('is-launching'), false);
  media.matches = true;
  assert.equal(click(window, links[0]).defaultPrevented, false);
  assert.equal(links[0].querySelector('.brand-icon').classList.contains('is-launching'), false);
});
