// Email lists for different languages
const emailsByLanguage = {
  en: [
    'an***da@gmail.com',
    'jo***th@yahoo.com',
    'sa***el@outlook.com',
    'mi***le@hotmail.com',
    'em***ia@gmail.com',
    'da***id@icloud.com',
    'ol***er@gmail.com',
    'so***ia@yahoo.com',
    'ja***es@outlook.com',
    'av***ry@gmail.com',
    'be***mn@hotmail.com',
    'ch***te@icloud.com',
    'et***an@gmail.com',
    'is***la@yahoo.com',
    'li***am@outlook.com',
    'ma***on@gmail.com',
    'no***ah@hotmail.com',
    'wi***am@icloud.com',
    'ab***il@gmail.com',
    'el***ah@yahoo.com'
  ],
  pl: [
    'ka***na@gmail.com',
    'pi***tr@o2.pl',
    'an***ej@wp.pl',
    'ma***ia@gmail.com',
    'ja***ub@interia.pl',
    'al***ia@onet.pl',
    'pa***eł@gmail.com',
    'na***ia@yahoo.com',
    'mi***sz@wp.pl',
    'zo***ia@gmail.com',
    'wi***or@o2.pl',
    'ju***ia@outlook.com',
    'kz***of@interia.pl',
    'ma***na@gmail.com',
    'ad***an@wp.pl',
    'ol***ia@onet.pl',
    'da***id@gmail.com',
    'ni***la@yahoo.com',
    'sz***on@o2.pl',
    'ma***ia@gmail.com'
  ]
};

let currentIndex = 0;
let currentEmails = emailsByLanguage.en;

// Update emails when language changes
function updateEmailLanguage() {
  const lang = window.SnowMyScreenLang ? window.SnowMyScreenLang.getCurrentLanguage() : 'en';
  currentEmails = emailsByLanguage[lang] || emailsByLanguage.en;
  currentIndex = 0;

  // Update the current email immediately
  const emailSpan = document.getElementById('notification-email');
  if (emailSpan) {
    emailSpan.textContent = currentEmails[currentIndex];
  }
}

function rotateEmail() {
  const notification = document.getElementById('notification');
  const emailSpan = document.getElementById('notification-email');

  // Add blur effect
  notification.classList.add('blur');

  // After blur animation (300ms), change email and remove blur
  setTimeout(() => {
    currentIndex = (currentIndex + 1) % currentEmails.length;
    emailSpan.textContent = currentEmails[currentIndex];
    notification.classList.remove('blur');
  }, 300);
}

// Listen for language changes
window.addEventListener('languageChanged', updateEmailLanguage);

// Initialize emails based on current language (after language.js loads)
setTimeout(updateEmailLanguage, 100);

// Start rotation every 10 seconds
setInterval(rotateEmail, 10000);
