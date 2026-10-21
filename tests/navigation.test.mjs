import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import test from 'node:test';
import { Window } from 'happy-dom';

const root = new URL('../', import.meta.url);
const script = await readFile(new URL('js/navigation.js', root), 'utf8');
const motionScript = await readFile(new URL('js/mobile-menu.js', root), 'utf8');

async function setup(t, { locale = 'en', inner = false, desktop = false, reduced = true, enhance = true } = {}) {
  const prefix = locale === 'uk' ? '/uk/' : '/';
  const pathname = prefix + (inner ? 'support/' : '');
  const w = new Window({ url: 'http://127.0.0.1:8000' + pathname, settings: {
    enableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true, disableCSSFileLoading: true,
    enableImageFileLoading: false, handleDisabledFileLoadingAsSuccess: true,
    suppressInsecureJavaScriptEnvironmentWarning: true
  } });
  t.after(() => w.happyDOM.close());
  const errors = [];
  w.console.error = (...args) => errors.push(args.join(' '));
  w.console.warn = (...args) => errors.push(args.join(' '));
  w.addEventListener('error', event => errors.push(event.error || event.message));
  w.IntersectionObserver = class { observe() {} disconnect() {} };
  const wide = Object.assign(new w.EventTarget(), { matches: desktop });
  const reduce = Object.assign(new w.EventTarget(), { matches: reduced });
  const nativeMatch = w.matchMedia.bind(w);
  w.matchMedia = query => query.includes('901px') ? wide : query.includes('prefers-reduced-motion') ? reduce : nativeMatch(query);
  w.document.write(await readFile(new URL(pathname.slice(1) + 'index.html', root), 'utf8'));
  const header = w.document.querySelector('[data-site-navigation]');
  const toggle = header.querySelector('[data-nav-toggle]');
  const menu = header.querySelector('[data-nav-menu]');
  const links = [...menu.querySelectorAll('a')];
  const language = header.querySelector('[data-nav-language]');
  const brand = header.querySelector('.site-navigation__brand');
  const main = w.document.querySelector('main');
  // Keep link defaults inside the test document while exercising real handlers.
  header.querySelectorAll('a').forEach(link => link.addEventListener('click', event => event.preventDefault()));
  w.eval(script);
  if (enhance && !desktop) w.eval(motionScript);
  t.after(() => assert.deepEqual(errors, [], 'No navigation or GSAP runtime warnings/errors'));
  const assertClosed = () => {
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(menu.hidden, true);
    assert.equal(header.hasAttribute('aria-modal'), false);
    assert.equal(main.inert, false);
    assert.equal(w.document.documentElement.classList.contains('has-bubble-menu'), false);
  };
  return {
    w, header, toggle, menu, links, language, brand, main, prefix, assertClosed,
    key(key, shiftKey = false) { w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })); },
    desktop(value) { wide.matches = value; wide.dispatchEvent(new w.Event('change')); },
    reduce(value) { reduce.matches = value; reduce.dispatchEvent(new w.Event('change')); }
  };
}

for (const locale of ['en', 'uk']) {
  test(`${locale}: the mobile menu keeps localized routes and the App Store link`, async t => {
    const app = await setup(t, { locale, inner: locale === 'uk' });
    app.assertClosed();
    assert.deepEqual(app.links.slice(0, 4).map(link => link.getAttribute('href')), ['effects', 'features', 'faq'].map(id => app.prefix + '#' + id).concat(app.prefix + 'blog/'));
    assert.match(app.links[4].href, /^https:\/\/apps\.apple\.com\/app\/id6755106853$/);
    assert.equal(app.menu.querySelector('[role="menuitem"]'), null, 'Site links retain normal navigation semantics');
    app.toggle.click();
    assert.equal(app.toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(app.menu.hidden, false);
    assert.equal(app.header.getAttribute('role'), 'dialog');
    assert.equal(app.header.getAttribute('aria-modal'), 'true');
    assert.equal(app.main.inert, true);
    assert.equal(app.w.document.activeElement, app.links[0]);
    app.toggle.click();
    app.assertClosed();
    assert.equal(app.w.document.activeElement, app.toggle);
  });
}

test('keyboard focus stays in the overlay and Escape restores the menu button', async t => {
  const app = await setup(t);
  const footer = app.w.document.querySelector('footer');
  footer.inert = true;
  app.toggle.click();
  app.links.at(-1).focus();
  app.key('Tab');
  assert.equal(app.w.document.activeElement, app.brand);
  app.key('Tab', true);
  assert.equal(app.w.document.activeElement, app.links.at(-1));
  app.key('Escape');
  app.assertClosed();
  assert.equal(app.w.document.activeElement, app.toggle);
  assert.equal(footer.inert, true, 'Pre-existing inert state is restored');
});

test('section links, the backdrop and language picker close the overlay', async t => {
  const app = await setup(t);
  app.toggle.click();
  app.links[1].click();
  app.assertClosed();
  assert.equal(app.w.document.activeElement.id, 'features', 'Following an on-page link focuses its destination');
  app.toggle.click();
  app.menu.click();
  app.assertClosed();
  assert.equal(app.w.document.activeElement, app.toggle);
  app.toggle.click();
  app.language.open = true;
  await wait(20);
  app.assertClosed();
  assert.equal(app.language.open, true);
});

test('motion loads only for mobile, and resizing to desktop clears the overlay', async t => {
  const app = await setup(t, { desktop: true });
  const motionRequests = () => [...app.w.document.scripts].filter(script => script.src.includes('/js/mobile-menu.js'));
  assert.equal(motionRequests().length, 0);
  app.desktop(false);
  assert.equal(motionRequests().length, 1);
  app.toggle.click();
  app.links[1].focus();
  app.desktop(true);
  app.assertClosed();
  assert.equal(app.w.document.activeElement.getAttribute('href'), '/#features');
  assert.ok(app.w.document.activeElement.closest('.site-navigation__links'));
  app.desktop(false); app.desktop(true); app.desktop(false);
  assert.equal(motionRequests().length, 1, 'Breakpoint changes do not request duplicate bundles');
});

test('GSAP animates and rapid open/close/open ends in the latest requested state', async t => {
  const app = await setup(t, { reduced: false });
  app.toggle.click();
  await wait(80);
  assert.match(app.links[0].style.transform, /scale/, 'The provided BubbleMenu scale animation is running');
  app.toggle.click();
  assert.equal(app.menu.inert, true);
  assert.equal(app.menu.hidden, false, 'Closing remains visible for the exit motion');
  await wait(40);
  app.toggle.click();
  await wait(1200);
  assert.equal(app.toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(app.menu.hidden, false);
  assert.equal(app.main.inert, true);
  assert.equal(app.links[0].style.transform, '', 'Settled links release inline transform styles');
  app.toggle.click();
  await wait(260);
  app.assertClosed();
});

test('live reduced motion and page exit settle animation and release page state', async t => {
  const app = await setup(t, { reduced: false });
  app.toggle.click();
  await wait(50);
  app.reduce(true);
  assert.equal(app.links[0].style.transform, '');
  app.toggle.click();
  app.assertClosed();
  app.reduce(false); app.toggle.click();
  await wait(30);
  app.toggle.click();
  app.reduce(true);
  app.assertClosed();
  app.toggle.click();
  app.w.dispatchEvent(new app.w.Event('pagehide'));
  app.assertClosed();
});

test('the menu remains usable when the GSAP bundle is unavailable', async t => {
  const app = await setup(t, { enhance: false, reduced: false });
  app.toggle.click();
  assert.equal(app.menu.hidden, false);
  assert.equal(app.w.document.activeElement, app.links[0]);
  app.toggle.click();
  app.assertClosed();
});
