/*!
 * Snowfall v0.0.1 beta
 * https://www.Gigoland.com
 * Released under the MIT License
 */
const snowFall = () => {
  let $container = document.querySelector('.snowfall');
  setTimeout(() => {
    for (let i = 0; i < 200; i++) {
      let $div = document.createElement('div');
      $div.classList.add('snowflake');
      $container.appendChild($div)
    }
  }, 100);
};

// Initialize snowfall when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  snowFall();
});
