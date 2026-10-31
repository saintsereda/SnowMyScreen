// Plays muted guide videos while they are on screen; with reduced motion they stay on the poster.
(() => {
  const videos = document.querySelectorAll('video[data-article-video]');
  if (!videos.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const onScreen = new Set();
  const sync = (video) => {
    if (onScreen.has(video) && !document.hidden) video.play().catch(() => {});
    else video.pause();
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) onScreen.add(entry.target);
      else onScreen.delete(entry.target);
      sync(entry.target);
    }
  }, { threshold: 0.4 });
  videos.forEach((video) => observer.observe(video));
  // Without controls nothing else can restart a video after the tab returns.
  document.addEventListener('visibilitychange', () => videos.forEach(sync));
})();
