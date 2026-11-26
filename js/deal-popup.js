// Black Friday card on the right side of every page. It shows only from the start of
// 27 November to the end of 29 November in the visitor's own time zone, the way App Store
// Connect starts a scheduled price at the beginning of the day in each country.
// After the end date it never renders, so the file can stay until it is removed.
// ?deal=preview shows it on any date for checking.
// The look follows the site: white card like .hero-update, Nunito headings, the site .button.
(function () {
    'use strict';

    var START = [2026, 10, 27]; // year, month (0-based), day: local midnight
    var END = [2026, 10, 30];   // first local day after the deal
    var STORE = 'https://apps.apple.com/app/apple-store/id6755106853?pt=127454389&ct=black-friday-2026&mt=8';
    var KEY = 'wonderfall_bf2026_closed';

    var preview = /[?&]deal=preview\b/.test(location.search);
    var now = new Date();
    if (!preview && (now < new Date(START[0], START[1], START[2]) || now >= new Date(END[0], END[1], END[2]))) return;
    try { if (!preview && localStorage.getItem(KEY)) return; } catch (e) {}

    var TEXT = {
        en: { eyebrow: 'Black Friday', title: 'Wonderfall is 30% off', dates: 'Only 27–29 November', cta: 'Get it on the App Store', close: 'Close' },
        uk: { eyebrow: 'Black Friday', title: 'Wonderfall зі знижкою 30%', dates: 'Лише 27–29 листопада', cta: 'Завантажити в App Store', close: 'Закрити' }
    };
    var t = TEXT[(document.documentElement.lang || 'en').slice(0, 2).toLowerCase()] || TEXT.en;

    var css = '' +
        '.bf-deal{position:fixed;right:24px;bottom:var(--bf-bottom,24px);z-index:110;width:300px;box-sizing:border-box;padding:30px 24px 22px;' +
        'border-radius:28px;background:#fff;color:#283251;font-family:var(--font-body,inherit);text-align:left;' +
        'box-shadow:0 18px 44px #0b287b40,0 0 0 1px #3f66d614;transition:bottom .25s ease;animation:bf-in .4s cubic-bezier(.2,.8,.2,1)}' +
        '.bf-deal *{box-sizing:border-box}' +
        '.bf-deal__tag{position:absolute;top:-22px;left:-14px;display:grid;place-items:center;width:84px;height:84px;border-radius:50%;' +
        'background:radial-gradient(70% 70% at 30% 25%,#ff8ad8 0%,#ff4fae 55%,#e0338f 100%);color:#fff;' +
        'font-family:var(--font-display,Nunito,sans-serif);font-size:25px;font-weight:900;letter-spacing:-.03em;' +
        'transform:rotate(-12deg);box-shadow:0 10px 22px #e0338f59,inset 0 1px 0 #ffffff80}' +
        '.bf-deal__tag::after{content:"";position:absolute;inset:5px;border-radius:50%;border:1.5px dashed #ffffffa6}' +
        '.bf-deal__eyebrow{margin:0 0 6px 64px;color:#e0338f;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}' +
        '.bf-deal__title{margin:14px 0 6px;font-family:var(--font-display,Nunito,sans-serif);font-size:25px;font-weight:900;' +
        'line-height:1.12;letter-spacing:-.02em;color:#124aab;text-wrap:balance}' +
        '.bf-deal__dates{margin:0 0 18px;color:#283251b8;font-size:15px;font-weight:600}' +
        '.bf-deal .bf-deal__cta{display:flex;width:100%;min-height:50px;padding:12px 18px;font-size:16px}' +
        '.bf-deal__close{position:absolute;top:12px;right:12px;width:32px;height:32px;border:0;border-radius:50%;' +
        'background:#eef2fb;color:#283251;font-size:18px;line-height:1;cursor:pointer}' +
        '.bf-deal__close:hover{background:#dfe7f8}.bf-deal__close:focus-visible{outline:2px solid #124aab;outline-offset:2px}' +
        '@keyframes bf-in{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}' +
        '@media (max-width:600px){.bf-deal{bottom:var(--bf-bottom,16px);left:16px;right:16px;width:auto;padding:16px 48px 16px 92px;' +
        'border-radius:24px;transform:none;animation:bf-up .35s ease-out}' +
        '.bf-deal__tag{top:14px;left:14px;width:64px;height:64px;font-size:20px}' +
        '.bf-deal__eyebrow{margin:0 0 2px;font-size:11px}.bf-deal__title{margin:0 0 2px;font-size:18px}' +
        '.bf-deal__dates{margin:0 0 10px;font-size:13px}.bf-deal .bf-deal__cta{min-height:42px;padding:9px 14px;font-size:15px;margin-left:-76px;width:calc(100% + 76px + 32px)}' +
        '.bf-deal__close{top:10px;right:10px;width:28px;height:28px;font-size:16px}' +
        '@keyframes bf-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}}' +
        '@media (prefers-reduced-motion:reduce){.bf-deal{animation:none}}';

    function render() {
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        var card = document.createElement('aside');
        card.className = 'bf-deal';
        card.setAttribute('aria-label', t.eyebrow + ': ' + t.title);
        card.innerHTML =
            '<span class="bf-deal__tag" aria-hidden="true">−30%</span>' +
            '<button type="button" class="bf-deal__close" aria-label="' + t.close + '">×</button>' +
            '<p class="bf-deal__eyebrow">' + t.eyebrow + '</p>' +
            '<p class="bf-deal__title">' + t.title + '</p>' +
            '<p class="bf-deal__dates">' + t.dates + '</p>' +
            '<a class="button bf-deal__cta" href="' + STORE + '" target="_blank" rel="noopener">' + t.cta + '</a>';
        card.querySelector('.bf-deal__close').addEventListener('click', function () {
            card.remove();
            try { localStorage.setItem(KEY, '1'); } catch (e) {}
        });
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
