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

    var NOTES = {
        en: 'This browser won’t open the App Store. Tap ••• at the top and choose “Open in browser”.',
        uk: 'Цей браузер не відкриває App Store. Натисніть ••• угорі й оберіть «Відкрити в браузері».',
        de: 'Dieser Browser öffnet den App Store nicht. Tippe oben auf ••• und wähle „Im Browser öffnen“.',
        fr: "Ce navigateur n’ouvre pas l’App Store. Touchez ••• en haut et choisissez « Ouvrir dans le navigateur ».",
        es: "Este navegador no abre el App Store. Toca ••• arriba y elige «Abrir en el navegador».",
        pt: "Este navegador não abre a App Store. Toque em ••• no topo e escolha “Abrir no navegador”.",
        pl: "Ta przeglądarka nie otworzy App Store. Stuknij ••• u góry i wybierz „Otwórz w przeglądarce”.",
        cs: "Tento prohlížeč App Store neotevře. Klepněte nahoře na ••• a zvolte „Otevřít v prohlížeči“.",
        tr: "Bu tarayıcı App Store'u açmıyor. Üstteki ••• simgesine dokunun ve “Tarayıcıda aç” seçeneğini belirleyin.",
        ja: "このブラウザではApp Storeを開けません。上部の「•••」をタップし、「ブラウザで開く」を選んでください。",
        zh: "此浏览器无法打开 App Store。请轻点顶部的 •••，然后选择“在浏览器中打开”。",
        hi: "यह ब्राउज़र App Store नहीं खोल सकता। ऊपर ••• पर टैप करें और “ब्राउज़र में खोलें” चुनें।"
    };
    var NOTE = NOTES[(document.documentElement.lang || '').slice(0, 2).toLowerCase()] || NOTES.en;

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
