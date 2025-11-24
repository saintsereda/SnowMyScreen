// Generate 20 random masked emails
const emails = [
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
];

let currentIndex = 0;

function rotateEmail() {
  const notification = document.getElementById('notification');
  const emailSpan = document.getElementById('notification-email');

  // Add blur effect
  notification.classList.add('blur');

  // After blur animation (300ms), change email and remove blur
  setTimeout(() => {
    currentIndex = (currentIndex + 1) % emails.length;
    emailSpan.textContent = emails[currentIndex];
    notification.classList.remove('blur');
  }, 300);
}

// Start rotation every 10 seconds
setInterval(rotateEmail, 10000);
