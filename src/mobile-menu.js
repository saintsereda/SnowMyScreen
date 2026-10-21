/*! BubbleMenu motion adapted from the supplied React Bits component.
 * Copyright (c) 2026 David Haz; see /licenses/react-bits.md.
 * The existing static navigation owns links, focus and open/close state.
 */
import { gsap } from 'gsap';

const header = document.querySelector('[data-site-navigation]');
const menu = header?.querySelector('[data-nav-menu]');
const bubbles = menu ? [...menu.querySelectorAll('.pill-link')] : [];
const labels = bubbles.map(bubble => bubble.querySelector('.pill-label'));

if (bubbles.length) {
  let timeline = null;
  let displayed = !menu.hidden;
  const clear = () => {
    gsap.set(bubbles, { clearProps: 'transform' });
    gsap.set(labels, { clearProps: 'transform,opacity,visibility' });
  };
  header.addEventListener('wonderfall:menu-toggle', event => {
    const { open, instant, complete } = event.detail;
    event.preventDefault();
    timeline?.kill();
    gsap.killTweensOf([...bubbles, ...labels]);
    if (instant) {
      timeline = null;
      displayed = open;
      clear();
      complete();
      return;
    }
    if (open) {
      if (!displayed) {
        gsap.set(bubbles, { scale: 0, transformOrigin: '50% 50%' });
        gsap.set(labels, { y: 24, autoAlpha: 0 });
      }
      displayed = true;
      timeline = gsap.timeline({ onComplete: () => { timeline = null; clear(); complete(); } });
      bubbles.forEach((bubble, index) => {
        const delay = Math.max(0, index * .12 + gsap.utils.random(-.05, .05));
        timeline.to(bubble, { scale: 1, duration: .5, ease: 'back.out(1.5)' }, delay)
          .to(labels[index], { y: 0, autoAlpha: 1, duration: .5, ease: 'power3.out' }, delay + .05);
      });
    } else {
      timeline = gsap.timeline({ onComplete: () => {
        timeline = null;
        displayed = false;
        clear();
        complete();
      } });
      timeline.to(labels, { y: 24, autoAlpha: 0, duration: .2, ease: 'power3.in' }, 0)
        .to(bubbles, { scale: 0, duration: .2, ease: 'power3.in' }, 0);
    }
  });
}
