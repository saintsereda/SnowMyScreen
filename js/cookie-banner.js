// Consent UI adapted from the Expensa website, localized for EN/UK pages.
(function () {
    'use strict';
    const STORAGE_KEY = 'snowmyscreen_cookie_consent_v1';
    // Keep these values in sync with analytics.js.
    const CONSENT_VERSION = 1;
    const STRINGS = {
        en: {
            necessary: 'Strictly necessary',
            necessaryDescription: 'Remembers your language and this cookie choice on your device. Always on.',
            analytics: 'Analytics',
            analyticsDescription: 'Optional Google Analytics 4 helps us understand visits and improve the site. Off until you enable it.',
            bannerTitle: 'Cookies & storage',
            bannerText: 'We use essential storage to remember your preferences. You can allow Google Analytics to help us improve the site.',
            policy: 'Privacy & cookies',
            customize: 'Customize',
            reject: 'Only necessary',
            accept: 'Accept all',
            modalTitle: 'Cookie preferences',
            close: 'Close',
            modalIntro: 'Choose what the site may use. Your preference is saved on this device. You can change it at any time.',
            rejectAll: 'Reject optional cookies',
            save: 'Save preferences',
            settings: 'Cookie settings'
        },
        uk: {
            necessary: 'Необхідні',
            necessaryDescription: 'Запам’ятовують мову та ваш вибір щодо cookie на цьому пристрої. Завжди ввімкнені.',
            analytics: 'Аналітика',
            analyticsDescription: 'Google Analytics 4 допомагає зрозуміти, як користуються сайтом, і покращувати його. Вимкнена, доки ви її не дозволите.',
            bannerTitle: 'Cookie та сховище',
            bannerText: 'Зберігаємо необхідне, щоб запам’ятати ваші налаштування. За бажанням ви можете дозволити Google Analytics для покращення сайту.',
            policy: 'Конфіденційність і cookie',
            customize: 'Налаштувати',
            reject: 'Лише необхідні',
            accept: 'Прийняти всі',
            modalTitle: 'Налаштування cookie',
            close: 'Закрити',
            modalIntro: 'Виберіть, що може використовувати сайт. Вибір зберігається на цьому пристрої, і його можна змінити будь-коли.',
            rejectAll: 'Лише необхідні',
            save: 'Зберегти',
            settings: 'Налаштування cookie'
        }
    };
    let language;
    let T;

    function localize() {
        language = /^uk\b/i.test(document.documentElement.lang) ? 'uk' : 'en';
        T = STRINGS[language];
        document.querySelectorAll('[data-cookie-settings]').forEach(el => { el.textContent = T.settings; });
    }

    function loadConsent() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            return stored && stored.version === CONSENT_VERSION && typeof stored.analytics === 'boolean' ? stored : null;
        } catch (_) { return null; }
    }

    function saveConsent(choice) {
        const payload = {
            necessary: true,
            analytics: choice.analytics === true,
            timestamp: new Date().toISOString(),
            version: CONSENT_VERSION
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (_) {}
        window.dispatchEvent(new CustomEvent('snowmyscreen:cookie-consent', { detail: payload }));
    }

    function h(tag, attrs, children) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs || {})) {
            if (key === 'class') el.className = value;
            else if (key === 'text') el.textContent = value;
            else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
            else el.setAttribute(key, value);
        }
        (children || []).forEach(child => { el.appendChild(child); });
        return el;
    }

    function policyText(className, text, id) {
        const paragraph = h('p', { class: className, text });
        if (id) paragraph.id = id;
        paragraph.appendChild(document.createTextNode(' '));
        paragraph.appendChild(h('a', {
            href: (language === 'uk' ? '/uk/' : '/') + 'privacy.html#website-cookies',
            text: T.policy
        }));
        return paragraph;
    }

    function hideBanner() {
        const banner = document.querySelector('.cookie-banner');
        if (!banner) return;
        banner.classList.add('cookie-banner--leaving');
        setTimeout(() => banner.remove(), 200);
    }

    function showBanner() {
        const existing = document.querySelector('.cookie-banner');
        if (existing && !existing.classList.contains('cookie-banner--leaving')) return;
        if (existing) existing.remove();
        const decide = analytics => {
            saveConsent({ analytics });
            hideBanner();
        };
        const banner = h('aside', {
            class: 'cookie-banner', role: 'dialog', 'aria-modal': 'false',
            'aria-labelledby': 'cookie-banner-title', 'aria-describedby': 'cookie-banner-desc'
        }, [h('div', { class: 'cookie-banner__inner' }, [
            h('div', { class: 'cookie-banner__body' }, [
                h('strong', { class: 'cookie-banner__title', id: 'cookie-banner-title', text: T.bannerTitle }),
                policyText('cookie-banner__text', T.bannerText, 'cookie-banner-desc')
            ]),
            h('div', { class: 'cookie-banner__actions' }, [
                h('button', { class: 'cookie-banner__btn cookie-banner__btn--ghost', type: 'button', text: T.customize, onclick: () => { hideBanner(); openPreferences(); } }),
                h('button', { class: 'cookie-banner__btn cookie-banner__btn--secondary', type: 'button', text: T.reject, onclick: () => decide(false) }),
                h('button', { class: 'cookie-banner__btn cookie-banner__btn--primary', type: 'button', text: T.accept, onclick: () => decide(true) })
            ])
        ])]);
        document.body.appendChild(banner);
    }

    function openPreferences(initialChoice) {
        if (document.querySelector('.cookie-modal')) return;
        const current = initialChoice || loadConsent() || { analytics: false };
        const state = { analytics: current.analytics === true };
        const previousOverflow = document.body.style.overflow;
        const rows = ['necessary', 'analytics'].map(id => {
            const checkbox = h('input', { type: 'checkbox', id: 'cookie-cat-' + id, class: 'cookie-modal__checkbox' });
            checkbox.checked = id === 'necessary' || state.analytics;
            checkbox.disabled = id === 'necessary';
            if (id === 'analytics') checkbox.addEventListener('change', () => { state.analytics = checkbox.checked; });
            return h('label', { class: 'cookie-modal__row', for: 'cookie-cat-' + id }, [
                h('div', { class: 'cookie-modal__row-header' }, [h('span', { class: 'cookie-modal__row-label', text: T[id] }), checkbox]),
                h('p', { class: 'cookie-modal__row-desc', text: T[id + 'Description'] })
            ]);
        });
        const modal = h('dialog', {
            class: 'cookie-modal', 'aria-labelledby': 'cookie-modal-title', 'aria-describedby': 'cookie-modal-intro'
        }, [h('div', { class: 'cookie-modal__panel' }, [
            h('div', { class: 'cookie-modal__header' }, [
                h('h2', { class: 'cookie-modal__title', id: 'cookie-modal-title', text: T.modalTitle }),
                h('button', { class: 'cookie-modal__close', type: 'button', 'aria-label': T.close, text: '×', onclick: () => close(false) })
            ]),
            policyText('cookie-modal__intro', T.modalIntro, 'cookie-modal-intro'),
            h('div', { class: 'cookie-modal__rows' }, rows),
            h('div', { class: 'cookie-modal__footer' }, [
                h('button', { class: 'cookie-banner__btn cookie-banner__btn--secondary', type: 'button', text: T.rejectAll, onclick: () => close(true, { analytics: false }) }),
                h('button', { class: 'cookie-banner__btn cookie-banner__btn--primary', type: 'button', text: T.save, onclick: () => close(true, state) })
            ])
        ])]);

        function close(save, choice) {
            modal.close();
            modal.remove();
            document.body.style.overflow = previousOverflow;
            if (save) { saveConsent(choice); hideBanner(); }
            else if (!loadConsent()) showBanner();
            // The original Customize button may have left with the banner.
            if (document.activeElement === document.body) {
                const target = document.querySelector('.cookie-banner__btn--ghost, [data-cookie-settings]');
                if (target) target.focus({ preventScroll: true });
            }
        }
        modal.addEventListener('cancel', event => { event.preventDefault(); close(false); });
        modal.addEventListener('keydown', event => {
            if (event.key !== 'Tab') return;
            const controls = [...modal.querySelectorAll('a[href], button, input:not(:disabled)')];
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        });
        modal.addEventListener('click', event => { if (event.target === modal) close(false); });
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        // Native dialog provides focus containment and makes the background inert.
        modal.showModal();
    }

    function init() {
        localize();
        if (!loadConsent()) showBanner();
        document.querySelectorAll('[data-cookie-settings]').forEach(el => {
            el.addEventListener('click', event => { event.preventDefault(); openPreferences(); });
        });
    }
    window.snowmyscreenCookies = {
        open: () => openPreferences(),
        get: loadConsent,
        reset: () => {
            try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
            window.dispatchEvent(new CustomEvent('snowmyscreen:cookie-consent', { detail: null }));
            showBanner();
        }
    };
    window.addEventListener('languageChanged', () => {
        localize();
        const banner = document.querySelector('.cookie-banner');
        if (banner) { banner.remove(); if (!loadConsent()) showBanner(); }
    });
    window.addEventListener('storage', event => {
        if (event.key !== STORAGE_KEY && event.key !== null) return;
        if (loadConsent()) hideBanner(); else showBanner();
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
