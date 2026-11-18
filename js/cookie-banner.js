// Consent UI adapted from the Expensa website, localized for every site language.
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
            bannerText: 'We count page views and App Store clicks without cookies. We use essential storage to remember your preferences. You can allow Google Analytics to help us improve the site.',
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
            bannerText: 'Ми рахуємо перегляди та кліки в App Store без cookie. Зберігаємо необхідне, щоб запам’ятати ваші налаштування. За бажанням ви можете дозволити Google Analytics для покращення сайту.',
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
        },
        de: {
            necessary: 'Unbedingt notwendig',
            necessaryDescription: 'Speichert deine Sprache und diese Cookie-Entscheidung auf deinem Gerät. Immer aktiv.',
            analytics: 'Analyse',
            analyticsDescription: 'Das optionale Google Analytics 4 hilft uns, Besuche zu verstehen und die Website zu verbessern. Aus, bis du es einschaltest.',
            bannerTitle: 'Cookies & Speicher',
            bannerText: 'Wir zählen Seitenaufrufe und App-Store-Klicks ohne Cookies. Notwendigen Speicher nutzen wir, um deine Einstellungen zu merken. Du kannst Google Analytics erlauben, damit wir die Website verbessern können.',
            policy: 'Datenschutz & Cookies',
            customize: 'Anpassen',
            reject: 'Nur notwendige',
            accept: 'Alle akzeptieren',
            modalTitle: 'Cookie-Einstellungen',
            close: 'Schließen',
            modalIntro: 'Wähle, was die Website nutzen darf. Deine Entscheidung wird auf diesem Gerät gespeichert und lässt sich jederzeit ändern.',
            rejectAll: 'Optionale Cookies ablehnen',
            save: 'Einstellungen speichern',
            settings: 'Cookie-Einstellungen'
        },
        fr: {
            necessary: "Strictement nécessaires",
            necessaryDescription: "Mémorisent votre langue et ce choix relatif aux cookies sur votre appareil. Toujours actifs.",
            analytics: "Analyse",
            analyticsDescription: "Google Analytics 4, facultatif, nous aide à comprendre les visites et à améliorer le site. Désactivé tant que vous ne l’activez pas.",
            bannerTitle: "Cookies et stockage",
            bannerText: "Nous comptons les pages vues et les clics vers l’App Store sans cookies. Nous utilisons un stockage essentiel pour mémoriser vos préférences. Vous pouvez autoriser Google Analytics pour nous aider à améliorer le site.",
            policy: "Confidentialité et cookies",
            customize: "Personnaliser",
            reject: "Nécessaires uniquement",
            accept: "Tout accepter",
            modalTitle: "Préférences de cookies",
            close: "Fermer",
            modalIntro: "Choisissez ce que le site peut utiliser. Votre préférence est enregistrée sur cet appareil. Vous pouvez la modifier à tout moment.",
            rejectAll: "Refuser les cookies facultatifs",
            save: "Enregistrer les préférences",
            settings: "Réglages des cookies"
        },
        es: {
            necessary: "Estrictamente necesarias",
            necessaryDescription: "Recuerdan tu idioma y esta elección de cookies en tu dispositivo. Siempre activas.",
            analytics: "Analítica",
            analyticsDescription: "Google Analytics 4, opcional, nos ayuda a entender las visitas y a mejorar el sitio. Desactivado hasta que lo actives.",
            bannerTitle: "Cookies y almacenamiento",
            bannerText: "Contamos las páginas vistas y los clics al App Store sin cookies. Usamos almacenamiento esencial para recordar tus preferencias. Puedes permitir Google Analytics para ayudarnos a mejorar el sitio.",
            policy: "Privacidad y cookies",
            customize: "Personalizar",
            reject: "Solo necesarias",
            accept: "Aceptar todas",
            modalTitle: "Preferencias de cookies",
            close: "Cerrar",
            modalIntro: "Elige qué puede usar el sitio. Tu preferencia se guarda en este dispositivo. Puedes cambiarla en cualquier momento.",
            rejectAll: "Rechazar cookies opcionales",
            save: "Guardar preferencias",
            settings: "Ajustes de cookies"
        },
        pt: {
            necessary: "Estritamente necessários",
            necessaryDescription: "Lembram o seu idioma e esta escolha de cookies no seu dispositivo. Sempre ativos.",
            analytics: "Análise",
            analyticsDescription: "O Google Analytics 4, opcional, nos ajuda a entender as visitas e melhorar o site. Fica desativado até você ativá-lo.",
            bannerTitle: "Cookies e armazenamento",
            bannerText: "Contamos visualizações de página e cliques na App Store sem cookies. Usamos armazenamento essencial para lembrar as suas preferências. Você pode permitir o Google Analytics para nos ajudar a melhorar o site.",
            policy: "Privacidade e cookies",
            customize: "Personalizar",
            reject: "Somente necessários",
            accept: "Aceitar todos",
            modalTitle: "Preferências de cookies",
            close: "Fechar",
            modalIntro: "Escolha o que o site pode usar. A sua preferência fica salva neste dispositivo. Você pode mudá-la a qualquer momento.",
            rejectAll: "Recusar cookies opcionais",
            save: "Salvar preferências",
            settings: "Ajustes de cookies"
        },
        pl: {
            necessary: "Niezbędne",
            necessaryDescription: "Zapamiętują język i ten wybór dotyczący cookies na Twoim urządzeniu. Zawsze włączone.",
            analytics: "Analityka",
            analyticsDescription: "Opcjonalne Google Analytics 4 pomaga nam zrozumieć odwiedziny i ulepszać witrynę. Wyłączone, dopóki go nie włączysz.",
            bannerTitle: "Cookies i pamięć",
            bannerText: "Liczymy wyświetlenia stron i kliknięcia w App Store bez cookies. Niezbędnej pamięci używamy, aby zapamiętać Twoje preferencje. Możesz zezwolić na Google Analytics, aby pomóc nam ulepszać witrynę.",
            policy: "Prywatność i cookies",
            customize: "Dostosuj",
            reject: "Tylko niezbędne",
            accept: "Zaakceptuj wszystkie",
            modalTitle: "Preferencje cookies",
            close: "Zamknij",
            modalIntro: "Wybierz, z czego witryna może korzystać. Twój wybór zostanie zapisany na tym urządzeniu i możesz go zmienić w każdej chwili.",
            rejectAll: "Odrzuć opcjonalne cookies",
            save: "Zapisz preferencje",
            settings: "Ustawienia cookies"
        },
        cs: {
            necessary: "Nezbytně nutné",
            necessaryDescription: "Pamatují si jazyk a tuto volbu cookies ve vašem zařízení. Vždy zapnuté.",
            analytics: "Analytika",
            analyticsDescription: "Volitelné Google Analytics 4 nám pomáhá porozumět návštěvám a vylepšovat web. Vypnuté, dokud je nezapnete.",
            bannerTitle: "Cookies a úložiště",
            bannerText: "Zobrazení stránek a kliknutí do App Storu počítáme bez cookies. Nezbytné úložiště používáme k zapamatování vašich předvoleb. Můžete povolit Google Analytics a pomoci nám web vylepšovat.",
            policy: "Soukromí a cookies",
            customize: "Přizpůsobit",
            reject: "Jen nezbytné",
            accept: "Přijmout vše",
            modalTitle: "Předvolby cookies",
            close: "Zavřít",
            modalIntro: "Vyberte, co smí web používat. Vaše volba se uloží v tomto zařízení a můžete ji kdykoli změnit.",
            rejectAll: "Odmítnout volitelné cookies",
            save: "Uložit předvolby",
            settings: "Nastavení cookies"
        },
        tr: {
            necessary: "Kesinlikle gerekli",
            necessaryDescription: "Dilinizi ve bu çerez tercihinizi cihazınızda hatırlar. Her zaman açık.",
            analytics: "Analiz",
            analyticsDescription: "İsteğe bağlı Google Analytics 4, ziyaretleri anlamamıza ve siteyi geliştirmemize yardımcı olur. Siz açana kadar kapalıdır.",
            bannerTitle: "Çerezler ve depolama",
            bannerText: "Sayfa görüntülemelerini ve App Store tıklamalarını çerez kullanmadan sayıyoruz. Tercihlerinizi hatırlamak için gerekli depolamayı kullanıyoruz. Siteyi geliştirmemize yardımcı olmak için Google Analytics'e izin verebilirsiniz.",
            policy: "Gizlilik ve çerezler",
            customize: "Özelleştir",
            reject: "Yalnızca gerekli",
            accept: "Tümünü kabul et",
            modalTitle: "Çerez tercihleri",
            close: "Kapat",
            modalIntro: "Sitenin neleri kullanabileceğini seçin. Tercihiniz bu cihazda kaydedilir ve istediğiniz zaman değiştirebilirsiniz.",
            rejectAll: "İsteğe bağlı çerezleri reddet",
            save: "Tercihleri kaydet",
            settings: "Çerez ayarları"
        },
        ja: {
            necessary: "必須",
            necessaryDescription: "言語とこのCookieの選択をお使いのデバイスに記憶します。常にオンです。",
            analytics: "アナリティクス",
            analyticsDescription: "オプションのGoogle Analytics 4は、訪問状況を把握してサイトを改善するのに役立ちます。有効にするまでオフのままです。",
            bannerTitle: "Cookieとストレージ",
            bannerText: "ページビューとApp Storeへのクリック数は、Cookieを使わずに数えています。設定を記憶するために必須のストレージを使用します。サイトの改善のために、Google Analyticsを許可することもできます。",
            policy: "プライバシーとCookie",
            customize: "カスタマイズ",
            reject: "必要なもののみ",
            accept: "すべて許可",
            modalTitle: "Cookieの設定",
            close: "閉じる",
            modalIntro: "サイトが使用できるものを選んでください。設定はこのデバイスに保存され、いつでも変更できます。",
            rejectAll: "オプションのCookieを拒否",
            save: "設定を保存",
            settings: "Cookieの設定"
        },
        zh: {
            necessary: "必要",
            necessaryDescription: "在你的设备上记住你的语言和本次 Cookie 选择。始终开启。",
            analytics: "分析",
            analyticsDescription: "可选的 Google Analytics 4 帮助我们了解访问情况并改进网站。在你开启前保持关闭。",
            bannerTitle: "Cookie 与存储",
            bannerText: "我们不使用 Cookie 统计页面浏览量和 App Store 点击次数。我们使用必要的存储来记住你的偏好。你可以允许 Google Analytics，帮助我们改进网站。",
            policy: "隐私与 Cookie",
            customize: "自定",
            reject: "仅必要",
            accept: "全部接受",
            modalTitle: "Cookie 偏好设置",
            close: "关闭",
            modalIntro: "选择网站可以使用的内容。你的偏好会保存在此设备上，可随时更改。",
            rejectAll: "拒绝可选 Cookie",
            save: "保存偏好设置",
            settings: "Cookie 设置"
        },
        hi: {
            necessary: "बेहद ज़रूरी",
            necessaryDescription: "आपके डिवाइस पर आपकी भाषा और यह कुकी पसंद याद रखती हैं। हमेशा चालू।",
            analytics: "एनालिटिक्स",
            analyticsDescription: "वैकल्पिक Google Analytics 4 हमें विज़िट समझने और साइट बेहतर बनाने में मदद करता है। जब तक आप इसे चालू न करें, यह बंद रहता है।",
            bannerTitle: "कुकी और स्टोरेज",
            bannerText: "हम पेज व्यू और App Store क्लिक बिना कुकी के गिनते हैं। आपकी प्राथमिकताएँ याद रखने के लिए हम ज़रूरी स्टोरेज इस्तेमाल करते हैं। साइट को बेहतर बनाने में मदद के लिए आप Google Analytics की अनुमति दे सकते हैं।",
            policy: "गोपनीयता और कुकी",
            customize: "अनुकूलित करें",
            reject: "सिर्फ़ ज़रूरी",
            accept: "सभी स्वीकार करें",
            modalTitle: "कुकी प्राथमिकताएँ",
            close: "बंद करें",
            modalIntro: "चुनें कि साइट क्या इस्तेमाल कर सकती है। आपकी पसंद इसी डिवाइस पर सेव होती है। आप इसे कभी भी बदल सकते हैं।",
            rejectAll: "वैकल्पिक कुकी अस्वीकार करें",
            save: "प्राथमिकताएँ सेव करें",
            settings: "कुकी सेटिंग्ज़"
        }
    };
    let language;
    let T;

    function localize() {
        const code = (document.documentElement.lang || '').slice(0, 2).toLowerCase();
        language = STRINGS[code] ? code : 'en';
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
            href: (language === 'en' ? '/' : '/' + language + '/') + 'privacy.html#website-cookies',
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
