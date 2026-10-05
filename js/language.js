// Language detection and switching for SnowMyScreen
let translations = {};
let currentLanguage = 'en';

// Detect a supported language from an explicit preference or browser language.
function detectUserLanguage() {
  // Check if user has already set a preference
  let savedLanguage;
  try { savedLanguage = localStorage.getItem('snowmyscreen-language'); } catch (_) { /* Storage may be unavailable. */ }
  if (savedLanguage === 'en' || savedLanguage === 'uk') {
    return savedLanguage;
  }

  // Location and timezone do not determine a user's language.
  try {
    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const locale = new Intl.Locale(browserLang || 'en');
    if (locale.language === 'uk') {
      return 'uk';
    }
  } catch (error) {
    console.log('Language detection error:', error);
  }

  // Default to English
  return 'en';
}

// Load translations from JSON file
async function loadTranslations() {
  try {
    const response = await fetch('/js/translations.json');
    if (!response.ok) return false;
    translations = await response.json();
    return true;
  } catch (error) {
    console.error('Failed to load translations:', error);
    return false;
  }
}

// Get translation by key path (e.g., "nav.downloadAppStore")
function getTranslation(keyPath) {
  const keys = keyPath.split('.');
  let value = translations[currentLanguage];

  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return keyPath; // Return key if translation not found
    }
  }

  return value || keyPath;
}

// Apply translations to the page
function applyTranslations() {
  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage;

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getTranslation(key);

    if (translation && typeof translation === 'string') {
      element.textContent = translation;
    }
  });

  // Update all elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = getTranslation(key);

    if (translation && typeof translation === 'string') {
      element.placeholder = translation;
    }
  });

  // Update page title if it has data-i18n-title
  const titleElement = document.querySelector('[data-i18n-title]');
  if (titleElement) {
    const key = titleElement.getAttribute('data-i18n-title');
    const translation = getTranslation(key);
    if (translation && typeof translation === 'string') {
      document.title = translation;
    }
  }

  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && metaDesc.hasAttribute('data-i18n-meta')) {
    metaDesc.setAttribute('content', getTranslation(metaDesc.getAttribute('data-i18n-meta')));
  }

  // Update Open Graph meta tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDesc = document.querySelector('meta[name="twitter:description"]');

  if (ogDesc && metaDesc?.hasAttribute('data-i18n-meta')) ogDesc.setAttribute('content', metaDesc.content);
  if (twitterDesc && metaDesc?.hasAttribute('data-i18n-meta')) twitterDesc.setAttribute('content', metaDesc.content);

  // Update language switcher button text
  updateLanguageSwitcher();

  // Dispatch custom event for other scripts to react to language change
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

// Switch to a specific language
function switchLanguage(lang) {
  if (lang === currentLanguage) return;

  if (translations[lang]) {
    currentLanguage = lang;
    try { localStorage.setItem('snowmyscreen-language', lang); } catch (_) { /* Explicit switching still works. */ }
    applyTranslations();
  }
}

// Update language switcher button
function updateLanguageSwitcher() {
  const switcher = document.getElementById('language-switcher');
  if (switcher) {
    switcher.textContent = currentLanguage === 'en' ? 'Українська' : 'English';
    switcher.setAttribute('aria-label', currentLanguage === 'en' ? 'Switch to Ukrainian' : 'Перемкнути на англійську');
  }
}

// Initialize language system
async function initLanguage() {
  // Load translations
  const loaded = await loadTranslations();
  if (!loaded) {
    console.error('Failed to load translations, using default language');
    return;
  }

  // Detect and set initial language
  currentLanguage = detectUserLanguage();

  // Apply translations
  applyTranslations();

  // Set up language switcher click handler
  const switcher = document.getElementById('language-switcher');
  if (switcher) {
    switcher.addEventListener('click', (e) => {
      e.preventDefault();
      const newLang = currentLanguage === 'en' ? 'uk' : 'en';
      switchLanguage(newLang);
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguage);
} else {
  initLanguage();
}

// Export functions for use in other scripts
window.SnowMyScreenLang = {
  getCurrentLanguage: () => currentLanguage,
  getTranslation,
  switchLanguage
};
