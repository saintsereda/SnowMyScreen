// Plays muted guide videos while they are on screen; with reduced motion they stay on the poster.
(() => {
  const videos = document.querySelectorAll('video[data-article-video]');
  if (!videos.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting && !document.hidden) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }, { threshold: 0.4 });
  videos.forEach((video) => observer.observe(video));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach((video) => video.pause());
  });
})();
