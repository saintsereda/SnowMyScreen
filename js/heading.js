// Headline transition reused from the local Expensa site.
// The heading remains readable without JavaScript and with reduced motion.
(function () {
    'use strict';
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var canObserve = 'IntersectionObserver' in window;
    var title = document.querySelector('.hero__title[data-rotator]');
    if (!title) return;
    rotate(title);

    // The second line of the headline cycles through the phrases in
    // data-rotator. This ports muse.ai's hero headline with its timings and
    // curves: the words of the current phrase leave upwards one after another
    // while the next phrase's words rise into place, and after the last phrase
    // the loop swaps back to the first one.
    function rotate(title) {
        var MAIN_HOLD = 3.25;
        var HOLD = 2.5;
        var WORD_DELAY = 0.03;
        var TRAVEL = 0.3;
        var EXIT = { delay: 0, duration: 0.15, ease: bezier(0.75, 0, 1, 1) };
        var ENTER = { delay: 0.15, duration: 0.2, ease: bezier(0, 0, 0.25, 1) };

        var slot = title.querySelector('.hero__slot');
        var first = slot && slot.querySelector('.hero__phrase');
        var items;
        try { items = JSON.parse(title.getAttribute('data-rotator')); } catch (e) { return; }
        if (!first || !items || !items.length) return;
        items.unshift({ text: first.getAttribute('data-text') || first.textContent.trim(), icon: first.getAttribute('data-icon') });

        // Screen readers keep the static headline; the moving copy is hidden from them.
        var label = document.createElement('span');
        label.className = 'visually-hidden';
        label.textContent = title.textContent.replace(/\s+/g, ' ').trim();
        [].slice.call(title.children).forEach(function (child) {
            child.setAttribute('aria-hidden', 'true');
        });
        title.insertBefore(label, title.firstChild);

        // Next to every phrase sits an invisible copy in the same grid cell, so
        // the slot is always as tall as the tallest phrase and nothing below it
        // moves. The copies draw their text from CSS, which keeps it out of the h1.
        slot.textContent = '';
        var phrases = items.map(function (item, index) {
            var measure = document.createElement('span');
            measure.className = 'hero__measure';
            measure.setAttribute('data-text', item.text);
            if (item.icon) measure.setAttribute('data-icon', item.icon);
            slot.appendChild(measure);

            var phrase = document.createElement('span');
            phrase.className = 'hero__phrase';
            phrase.hidden = index > 0;
            var words = item.text.split(/\s+/).map(function (text, i) {
                if (i) phrase.appendChild(document.createTextNode(' '));
                return addWord(phrase, text, 'hero__word');
            });
            if (item.icon) words.push(addWord(phrase, item.icon, 'hero__word hero__emoji'));
            slot.appendChild(phrase);
            return { el: phrase, words: words };
        });

        var current = 0;
        var running = false;
        var onScreen = true;
        var timer = 0;
        var frame = 0;

        function addWord(phrase, text, className) {
            var word = document.createElement('span');
            word.className = className;
            word.textContent = text;
            return phrase.appendChild(word);
        }

        // Eased progress of word k at f seconds into a swap.
        function progress(timing, f, k) {
            var linear = (f - timing.delay - k * WORD_DELAY) / timing.duration;
            return timing.ease(Math.max(0, Math.min(1, linear)));
        }

        function swap() {
            var next = (current + 1) % phrases.length;
            var from = phrases[current];
            var to = phrases[next];
            var duration = Math.max(
                EXIT.delay + EXIT.duration + (from.words.length - 1) * WORD_DELAY,
                ENTER.delay + ENTER.duration + (to.words.length - 1) * WORD_DELAY
            );
            var start = null;
            frame = requestAnimationFrame(function step(now) {
                if (start === null) start = now;
                var f = Math.min((now - start) / 1000, duration);
                from.el.hidden = progress(EXIT, f, from.words.length - 1) >= 1;
                from.words.forEach(function (word, k) {
                    var p = progress(EXIT, f, k);
                    word.style.opacity = 1 - p;
                    word.style.transform = 'translateY(' + -TRAVEL * p + 'em)';
                });
                to.el.hidden = progress(ENTER, f, 0) <= 0;
                to.words.forEach(function (word, k) {
                    var p = progress(ENTER, f, k);
                    word.style.opacity = p;
                    word.style.transform = 'translateY(' + TRAVEL * (1 - p) + 'em)';
                });
                if (f < duration) {
                    frame = requestAnimationFrame(step);
                    return;
                }
                current = next;
                schedule();
            });
        }

        function schedule() {
            timer = setTimeout(swap, (current === 0 ? MAIN_HOLD : HOLD) * 1000);
        }

        // Off screen or in a background tab the loop stops and falls back to
        // the first phrase, as on muse; it starts over once the headline is back.
        function update() {
            var active = onScreen && !document.hidden && !motion.matches;
            if (active === running) return;
            running = active;
            clearTimeout(timer);
            cancelAnimationFrame(frame);
            if (active) {
                schedule();
                return;
            }
            current = 0;
            phrases.forEach(function (phrase, index) {
                phrase.el.hidden = index > 0;
                phrase.words.forEach(function (word) {
                    word.style.opacity = '';
                    word.style.transform = '';
                });
            });
        }

        if (canObserve) {
            new IntersectionObserver(function (entries) {
                onScreen = entries[0].isIntersecting;
                update();
            }).observe(title);
        }
        document.addEventListener('visibilitychange', update);
        motion.addEventListener('change', update);
        update();
    }

    // Cubic Bézier easing solved the way muse's is: Newton steps first,
    // bisection when they stall.
    function bezier(x1, y1, x2, y2) {
        var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
        var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
        function x(t) { return ((ax * t + bx) * t + cx) * t; }
        function y(t) { return ((ay * t + by) * t + cy) * t; }
        function slope(t) { return (3 * ax * t + 2 * bx) * t + cx; }
        return function (target) {
            var t = target, lo = 0, hi = 1, error, d, i;
            for (i = 0; i < 6; i++) {
                error = x(t) - target;
                if (Math.abs(error) < 1e-6) return y(t);
                d = slope(t);
                if (Math.abs(d) < 1e-6) break;
                t = Math.min(1, Math.max(0, t - error / d));
            }
            for (i = 0; i < 12; i++) {
                error = x(t) - target;
                if (Math.abs(error) < 1e-6) break;
                if (error < 0) lo = t;
                else hi = t;
                t = (lo + hi) / 2;
            }
            return y(t);
        };
    }
})();
