// Snow Effect with Realistic Physics
(function() {
  // Create snow container
  const snowContainer = document.createElement('div');
  snowContainer.id = 'snow-container';
  document.body.appendChild(snowContainer);

  // Configuration
  const snowflakeCount = 100; // Number of snowflakes

  // Create snowflakes
  function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';

    // Random horizontal position
    snowflake.style.left = Math.random() * 100 + '%';

    // Random size (small dots between 2px and 5px)
    const size = Math.random() * 3 + 2; // Between 2px and 5px
    snowflake.style.width = size + 'px';
    snowflake.style.height = size + 'px';

    // Random fall speed - smaller particles fall slower
    const duration = Math.random() * 15 + 10; // Between 10s and 25s

    // Horizontal drift (wind effect) - random direction and distance
    const drift = (Math.random() - 0.5) * 100; // -50px to 50px drift
    snowflake.style.setProperty('--drift', drift + 'px');

    // Sway effect (horizontal oscillation while falling)
    const swayDistance = (Math.random() - 0.5) * 30; // -15px to 15px
    const swayDuration = Math.random() * 2 + 2; // 2s to 4s
    snowflake.style.setProperty('--sway-distance', swayDistance + 'px');

    // Apply fall animation
    snowflake.style.animation = `fall ${duration}s linear infinite, sway ${swayDuration}s ease-in-out infinite`;

    // Random delay for staggered start
    const delay = Math.random() * 5;
    snowflake.style.animationDelay = `${delay}s, ${Math.random() * 2}s`;

    // Random opacity - creates depth effect
    snowflake.style.opacity = Math.random() * 0.5 + 0.3; // Between 0.3 and 0.8

    // Add blur to smaller/more distant particles for depth
    if (size < 3.5) {
      snowflake.style.filter = `blur(${0.5}px)`;
    }

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
    }, i * 50); // Stagger the initial creation
  }
})();
