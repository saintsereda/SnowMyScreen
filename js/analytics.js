// GA4 basic consent mode. The Google tag is requested only after an opt-in.
(function () {
    'use strict';

    const MEASUREMENT_ID = 'G-VB76JMX2B6';
    const STORAGE_KEY = 'snowmyscreen_cookie_consent_v1';
    // Keep these values in sync with cookie-banner.js.
    const CONSENT_VERSION = 1;
    const DISABLE_KEY = 'ga-disable-' + MEASUREMENT_ID;
    let allowed = false;
    let started = false;

    window[DISABLE_KEY] = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        // Do not queue pre-consent events for transmission after an opt-in.
        if (arguments[0] === 'consent' || allowed) window.dataLayer.push(arguments);
    };
    window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    function clearCookies() {
        const domains = [''];
        const parts = location.hostname.split('.');
        // Include the host and parent domains for GA's automatic cookie domain.
        for (let i = 0; i < parts.length - 1; i++) domains.push(parts.slice(i).join('.'));
        document.cookie.split(';').forEach(function (pair) {
            const name = pair.split('=')[0].trim();
            if (name !== '_ga' && !name.startsWith('_ga_')) return;
            domains.forEach(function (domain) {
                document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
            });
        });
    }

    function apply(choice) {
        allowed = !!(choice && choice.version === CONSENT_VERSION && choice.analytics === true);
        window[DISABLE_KEY] = !allowed;
        window.gtag('consent', 'update', {
            analytics_storage: allowed ? 'granted' : 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        if (!allowed) {
            clearCookies();
            // Unload the running tag and its automatic event listeners on withdrawal.
            if (started) location.reload();
            return;
        }
        if (started) return;
        started = true;
        window.gtag('js', new Date());
        window.gtag('config', MEASUREMENT_ID, {
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            cookie_path: '/'
        });
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
        document.head.appendChild(script);
    }

    function storedConsent() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
        catch (_) { return null; }
    }
    apply(storedConsent());
    window.addEventListener('snowmyscreen:cookie-consent', function (event) { apply(event.detail); });
    window.addEventListener('storage', function (event) {
        if (event.key === STORAGE_KEY || event.key === null) apply(storedConsent());
    });
})();
