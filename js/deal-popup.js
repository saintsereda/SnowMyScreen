// Black Friday card in the bottom right corner of every page. It shows from 27 November
// 00:00 UTC to 30 November 00:00 UTC: App Store Connect switches scheduled prices at
// 00:00 UTC, the same moment everywhere.
// After the end date it never renders, so the file can stay until it is removed.
// ?deal=preview shows it on any date for checking.
(function () {
    'use strict';

    var START = Date.UTC(2026, 10, 27); // 27 November 00:00 UTC
    var END = Date.UTC(2026, 10, 30);   // 30 November 00:00 UTC
    var STORE = 'https://apps.apple.com/app/apple-store/id6755106853?pt=127454389&ct=black-friday-2026&mt=8';

    var preview = /[?&]deal=preview\b/.test(location.search);
    var now = Date.now();
    if (!preview && (now < START || now >= END)) return;

    var TEXT = {
        en: { eyebrow: 'Black Friday', title: 'Wonderfall', line: 'Only 27–29 November. Pay once, no subscription, every season of effects stays yours.', cta: 'Get the deal' },
        uk: { eyebrow: 'Чорна п’ятниця', title: 'Wonderfall', line: 'Лише 27–29 листопада. Платиш один раз, без підписки, і всі сезони ефектів залишаються з тобою.', cta: 'Забрати знижку' }
    };
    var t = TEXT[(document.documentElement.lang || 'en').slice(0, 2).toLowerCase()] || TEXT.en;

    // A wavy "sale sticker" outline: a circle whose radius ripples 14 times.
    function stickerPath() {
        var d = '', n = 14, steps = 168;
        for (var i = 0; i <= steps; i++) {
            var a = (i / steps) * Math.PI * 2;
            var r = 46 + 3.2 * Math.cos(n * a);
            d += (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(2) + ' ' + (50 + r * Math.sin(a)).toFixed(2);
        }
        return d + 'Z';
    }
    var APPLE = '<svg class="bf-deal__apple" viewBox="0 0 814 1000" aria-hidden="true"><path fill="currentColor" d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-166 41s-106-57-156-127C44 791 0 669 0 553c0-186 121-285 240-285 63 0 116 42 155 42 38 0 97-44 169-44 27 0 126 2 191 75zM552 158c30-35 51-84 51-133 0-7-1-14-2-19-49 2-107 33-142 73-27 31-53 80-53 130 0 8 1 15 2 18 3 1 9 2 14 2 44 0 99-29 130-71z"/></svg>';

    var css = '' +
        '.bf-deal{position:fixed;right:24px;bottom:var(--bf-bottom,24px);z-index:110;width:320px;box-sizing:border-box;' +
        'padding:24px 24px 22px;border-radius:28px;background:#fff;color:#1d2433;font-family:var(--font-body,inherit);text-align:left;' +
        'box-shadow:0 20px 50px #0b1a4a2e,0 0 0 1px #0b1a4a0f;transition:bottom .25s ease;animation:bf-in .4s cubic-bezier(.2,.8,.2,1)}' +
        '.bf-deal *{box-sizing:border-box}' +
        '.bf-deal__sticker{position:absolute;top:-30px;right:-18px;width:96px;height:96px;display:grid;place-items:center;pointer-events:none}' +
        '.bf-deal__sticker svg{position:absolute;inset:0;width:100%;height:100%;animation:bf-spin 14s linear infinite;' +
        'filter:drop-shadow(0 8px 16px #d6302347)}' +
        '.bf-deal__sticker span{position:relative;color:#fff;font-size:24px;font-weight:700;letter-spacing:-.03em}' +
        '.bf-deal__eyebrow{display:inline-block;margin:0 0 14px;padding:7px 14px;border-radius:999px;background:#f1f3f7;' +
        'color:#3a4254;font-size:14px;font-weight:600}' +
        '.bf-deal__title{margin:0 0 8px;font-size:28px;font-weight:600;line-height:1.1;letter-spacing:-.02em;color:#1d2433}' +
        '.bf-deal__line{margin:0 0 20px;color:#6b7383;font-size:15px;line-height:1.45}' +
        '.bf-deal__cta{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;padding:12px 18px;' +
        'border-radius:999px;background:#111;color:#fff;font-size:16px;font-weight:600;text-decoration:none;transition:transform .15s ease,background .2s ease}' +
        '.bf-deal__cta:hover{background:#2a2f3a}.bf-deal__cta:active{transform:scale(.97)}' +
        '.bf-deal__apple{width:15px;height:18px;margin-top:-2px}' +
        '.bf-deal :focus-visible{outline:2px solid #1d2433;outline-offset:2px}' +
        '@keyframes bf-spin{to{transform:rotate(360deg)}}' +
        '@keyframes bf-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' +
        '@media (max-width:600px){.bf-deal{left:16px;right:16px;bottom:var(--bf-bottom,16px);width:auto;padding:18px 18px 16px;border-radius:24px}' +
        '.bf-deal__sticker{top:-26px;right:-6px;width:80px;height:80px}.bf-deal__sticker span{font-size:20px}' +
        '.bf-deal__eyebrow{margin-bottom:10px;padding:6px 12px;font-size:13px}.bf-deal__title{font-size:22px;margin-bottom:6px}' +
        '.bf-deal__line{font-size:14px;margin-bottom:14px}.bf-deal__cta{min-height:46px}}' +
        '@media (prefers-reduced-motion:reduce){.bf-deal,.bf-deal__sticker svg{animation:none}}';

    function render() {
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        var card = document.createElement('aside');
        card.className = 'bf-deal';
        card.setAttribute('aria-label', t.eyebrow + ' −30%');
        card.innerHTML =
            '<div class="bf-deal__sticker" aria-hidden="true"><svg viewBox="0 0 100 100"><path fill="#e0352b" d="' + stickerPath() + '"/></svg><span>−30%</span></div>' +
            '<p class="bf-deal__eyebrow">' + t.eyebrow + '</p>' +
            '<p class="bf-deal__title">' + t.title + '</p>' +
            '<p class="bf-deal__line">' + t.line + '</p>' +
            '<a class="bf-deal__cta" href="' + STORE + '" target="_blank" rel="noopener">' + APPLE + '<span>' + t.cta + '</span></a>';
        document.body.appendChild(card);

        // Sit above the cookie banner while it is on screen.
        var gap = function () { return window.innerWidth <= 600 ? 16 : 24; };
        var place = function () {
            var banner = document.querySelector('.cookie-banner');
            var h = banner && banner.getClientRects().length && !banner.hidden ? banner.getBoundingClientRect().height + 16 : 0;
            var v = (gap() + h) + 'px';
            if (card.style.getPropertyValue('--bf-bottom') !== v) card.style.setProperty('--bf-bottom', v);
        };
        place();
        new MutationObserver(place).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
        window.addEventListener('resize', place);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
    else render();
})();
