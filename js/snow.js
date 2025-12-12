// Snow Effect
(function() {
  // Create snow container
  const snowContainer = document.createElement('div');
  snowContainer.id = 'snow-container';
  document.body.appendChild(snowContainer);

  // Configuration
  const snowflakeCount = 50; // Number of snowflakes
  const snowflakeChars = ['❄', '❅', '❆']; // Different snowflake characters

  // Create snowflakes
  function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];

    // Random horizontal position
    snowflake.style.left = Math.random() * 100 + '%';

    // Random size
    const size = Math.random() * 1 + 0.5; // Between 0.5em and 1.5em
    snowflake.style.fontSize = size + 'em';

    // Random animation duration (fall speed)
    const duration = Math.random() * 10 + 10; // Between 10s and 20s
    snowflake.style.animationDuration = duration + 's';

    // Random delay
    const delay = Math.random() * 5;
    snowflake.style.animationDelay = delay + 's';

    // Random opacity
    snowflake.style.opacity = Math.random() * 0.6 + 0.4; // Between 0.4 and 1

    snowContainer.appendChild(snowflake);

    // Remove snowflake after animation completes and create a new one
    setTimeout(() => {
      snowflake.remove();
      createSnowflake();
    }, (duration + delay) * 1000);
  }

  // Initialize snowflakes
  for (let i = 0; i < snowflakeCount; i++) {
    setTimeout(() => {
      createSnowflake();
    }, i * 100); // Stagger the initial creation
  }
})();
