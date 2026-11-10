// In-app browsers of Instagram, Threads, Facebook and TikTok keep
// apps.apple.com links inside their own webview, where the App Store button
// does nothing. There, a tap on any App Store link goes out through the
// itms-apps:// scheme, which iOS hands straight to the App Store app. If the
// page is still on screen a moment later, the scheme was blocked too, and a
// short note tells the visitor how to open the site in Safari.
// Ported from getexpensa.com (Expensa site, app-store-link.js), plus TikTok.
(function () {
    'use strict';

    // Threads identifies itself as "Barcelona", its internal code name.
    // TikTok's webview uses "musical_ly" (global app) or "BytedanceWebview".
    var ua = navigator.userAgent || '';
    if (!/iPhone|iPad|iPod/.test(ua)) return;
    if (!/Barcelona|Instagram|FBAN|FBAV|FB_IAB|musical_ly|BytedanceWebview|TikTok/.test(ua)) return;

    var uk = (document.documentElement.lang || '').indexOf('uk') === 0;
    var NOTE = uk
        ? 'Цей браузер не відкриває App Store. Натисніть ••• угорі й оберіть «Відкрити в браузері».'
        : 'This browser won’t open the App Store. Tap ••• at the top and choose “Open in browser”.';

    function showNote() {
        if (document.getElementById('iab-note')) return;
        var note = document.createElement('div');
        note.id = 'iab-note';
        note.setAttribute('role', 'status');
        note.textContent = NOTE;
        note.style.cssText = 'position:fixed;left:16px;right:16px;top:16px;z-index:2147483647;' +
            'padding:14px 16px;border-radius:14px;background:#111;color:#fff;' +
            'font:500 15px/20px -apple-system,system-ui,sans-serif;text-align:center;' +
            'box-shadow:0 8px 24px rgba(0,0,0,.25)';
        note.addEventListener('click', function () { note.remove(); });
        document.body.appendChild(note);
        setTimeout(function () { note.remove(); }, 8000);
    }

    // Capture phase, so the webview never follows the https link itself.
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href*="apps.apple.com"]');
        if (!a) return;
        e.preventDefault();
        var left = false;
        function onHide() { if (document.hidden) left = true; }
        document.addEventListener('visibilitychange', onHide);
        window.location.href = a.href.replace(/^https?:\/\//, 'itms-apps://');
        setTimeout(function () {
            document.removeEventListener('visibilitychange', onHide);
            if (!left && !document.hidden) showNote();
        }, 1500);
    }, true);
})();
