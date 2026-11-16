// Aggregate site traffic without cookies, browser storage, or visitor IDs.
// Only the page path, a source label, and optional campaign are sent.
(function () {
    'use strict';
    // Local previews are not production traffic and the collector rejects them.
    if (location.hostname !== 'getwonderfall.com' && location.hostname !== 'www.getwonderfall.com') return;
    var ENDPOINT = 'https://expensa-site-analytics.5yjxrnsdbx.workers.dev/event';
    var APP_ID = 'id6755106853';

    function clean(value, max) {
        return /^[a-zA-Z0-9_.-]*$/.test(value || '') ? (value || '').slice(0, max).toLowerCase() : '';
    }

    function source() {
        var utm = clean(new URLSearchParams(location.search).get('utm_source'), 60);
        if (utm) return 'utm:' + utm;
        if (!document.referrer) return 'direct';
        try {
            var host = new URL(document.referrer).hostname.toLowerCase();
            return host === 'getwonderfall.com' || host === 'www.getwonderfall.com'
                ? 'internal' : host.slice(0, 100);
        } catch (_) {
            return 'direct';
        }
    }

    function send(event, campaign) {
        var data = JSON.stringify({
            event: event,
            path: location.pathname,
            source: event === 'pageview' ? source() : '',
            campaign: clean(campaign || '', 80)
        });
        try {
            if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([data], { type: 'text/plain' }))) return;
            fetch(ENDPOINT, { method: 'POST', body: data, headers: { 'Content-Type': 'text/plain' },
                mode: 'cors', credentials: 'omit', keepalive: true, referrerPolicy: 'no-referrer' }).catch(function () {});
        } catch (_) {}
    }

    send('pageview', new URLSearchParams(location.search).get('utm_campaign'));
    document.addEventListener('click', function (event) {
        var link = event.target && event.target.closest && event.target.closest('a[href]');
        if (!link) return;
        try {
            var url = new URL(link.href);
            if (url.hostname !== 'apps.apple.com' || !url.pathname.includes(APP_ID)) return;
            send('app_store_click', url.searchParams.get('ct'));
        } catch (_) {}
    }, true);
})();
