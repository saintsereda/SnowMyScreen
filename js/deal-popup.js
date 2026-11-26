// Black Friday card on the right side of every page. It shows only from the start of
// 27 November to the end of 29 November in the visitor's own time zone, the way App Store
// Connect starts a scheduled price at the beginning of the day in each country.
// After the end date it never renders, so the file can stay until it is removed.
// ?deal=preview shows it on any date for checking.
(function () {
    'use strict';

    var START = [2026, 10, 27]; // year, month (0-based), day: local midnight
    var END = [2026, 10, 30];   // first local day after the deal
    var STORE = 'https://apps.apple.com/app/apple-store/id6755106853?pt=127454389&ct=black-friday-2026&mt=8';
    var KEY = 'wonderfall_bf2026_closed';

    var preview = /[?&]deal=preview\b/.test(location.search);
    var now = new Date();
    var start = new Date(START[0], START[1], START[2]);
    var end = new Date(END[0], END[1], END[2]);
    if (!preview && (now < start || now >= end)) return;
    try { if (!preview && localStorage.getItem(KEY)) return; } catch (e) {}

    var TEXT = {
        en: { badge: 'Black Friday deal', off: '−30%', dates: '27–29 Nov', line: 'Wonderfall for less, one-time purchase.', cta: 'Get it on the App Store', close: 'Close' },
        uk: { badge: 'Знижка Black Friday', off: '−30%', dates: '27–29 листопада', line: 'Wonderfall дешевше, разова покупка.', cta: 'Завантажити в App Store', close: 'Закрити' }
    };
    var lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
    var t = TEXT[lang] || TEXT.en;

    var css = '' +
        '.bf-deal{position:fixed;right:16px;top:50%;transform:translateY(-50%);z-index:90;width:272px;box-sizing:border-box;' +
        'padding:20px 20px 18px;border-radius:20px;background:#0f2a3a;color:#fff;font-family:inherit;' +
        'box-shadow:0 18px 50px rgba(8,24,34,.35);animation:bf-in .35s ease-out}' +
        '.bf-deal *{box-sizing:border-box}' +
        '.bf-deal__badge{display:inline-block;margin:0 0 10px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.12);' +
        'font-size:12px;font-weight:600;letter-spacing:.02em}' +
        '.bf-deal__off{display:block;margin:0;font-size:44px;line-height:1;font-weight:800;letter-spacing:-.02em}' +
        '.bf-deal__dates{display:block;margin:6px 0 0;font-size:15px;font-weight:600;color:#bfe3ff}' +
        '.bf-deal__line{margin:10px 0 16px;font-size:14px;line-height:1.4;color:rgba(255,255,255,.82)}' +
        '.bf-deal__cta{display:flex;align-items:center;justify-content:center;min-height:44px;padding:10px 14px;border-radius:12px;' +
        'background:#fff;color:#0f2a3a;font-size:15px;font-weight:700;text-decoration:none}' +
        '.bf-deal__cta:hover{background:#e6f3ff}.bf-deal__cta:focus-visible,.bf-deal__close:focus-visible{outline:2px solid #8fd0ff;outline-offset:2px}' +
        '.bf-deal__close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;' +
        'background:transparent;color:rgba(255,255,255,.7);font-size:20px;line-height:1;cursor:pointer}' +
        '.bf-deal__close:hover{background:rgba(255,255,255,.12);color:#fff}' +
        '.bf-deal__mob{display:none}' +
        '@keyframes bf-in{from{opacity:0;transform:translate(16px,-50%)}to{opacity:1;transform:translate(0,-50%)}}' +
        '@media (max-width:600px){.bf-deal{top:auto;bottom:16px;left:16px;right:16px;width:auto;transform:none;padding:12px 44px 12px 14px;' +
        'display:grid;grid-template-columns:auto 1fr;grid-template-areas:"off dates" "cta cta";column-gap:10px;row-gap:10px;align-items:center;animation:bf-up .3s ease-out}' +
        '.bf-deal__badge,.bf-deal__line{display:none}.bf-deal__mob{display:inline;color:#fff}.bf-deal__off{grid-area:off;font-size:28px}' +
        '.bf-deal__dates{grid-area:dates;margin:0;font-size:14px;line-height:1.25}.bf-deal__cta{grid-area:cta;min-height:40px}' +
        '.bf-deal__close{top:8px;right:6px}' +
        '@keyframes bf-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}}' +
        '@media (prefers-reduced-motion:reduce){.bf-deal{animation:none}}';

    function render() {
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        var card = document.createElement('aside');
        card.className = 'bf-deal';
        card.setAttribute('aria-label', t.badge + ' ' + t.off);
        card.innerHTML =
            '<button type="button" class="bf-deal__close" aria-label="' + t.close + '">×</button>' +
            '<p class="bf-deal__badge">' + t.badge + '</p>' +
            '<strong class="bf-deal__off">' + t.off + '</strong>' +
            '<span class="bf-deal__dates"><span class="bf-deal__mob">' + t.badge + '<br></span>' + t.dates + '</span>' +
            '<p class="bf-deal__line">' + t.line + '</p>' +
            '<a class="bf-deal__cta" href="' + STORE + '" target="_blank" rel="noopener">' + t.cta + '</a>';
        card.querySelector('.bf-deal__close').addEventListener('click', function () {
            card.remove();
            try { localStorage.setItem(KEY, '1'); } catch (e) {}
        });
        document.body.appendChild(card);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
    else render();
})();
