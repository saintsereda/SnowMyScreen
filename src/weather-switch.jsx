import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import JellyRadio from './components/JellyRadio.jsx';
import './weather-switch.css';

const preview = document.querySelector('[data-preview]');
const host = preview?.querySelector('[data-weather-switch]');
const fallback = host ? [...host.querySelectorAll('[data-theme]')] : [];

function WeatherSwitch({ items, ariaLabel }) {
  const [value, setValue] = useState(preview.dataset.effect || items[0].value);
  useLayoutEffect(() => {
    const sync = event => setValue(event.detail.theme);
    preview.addEventListener('wonderfall:theme-change', sync);
    return () => preview.removeEventListener('wonderfall:theme-change', sync);
  }, []);
  return <JellyRadio items={items} value={value}
    onChange={theme => preview.dispatchEvent(new CustomEvent('wonderfall:theme-request', { detail: { theme } }))}
    chipColor="#ffffff1f" activeColor="#fff" textColor="#fff" activeTextColor="#164eb7"
    size="lg" radius={24} gap={4} barge={2} ariaLabel={ariaLabel} className="weather-jelly" />;
}

if (host && fallback.length) {
  const ariaLabel = host.getAttribute('aria-label');
  const items = fallback.map(button => ({
    value: button.dataset.theme,
    label: button.querySelector('.theme-name').textContent,
    icon: button.querySelector('.theme-symbol').textContent
  }));
  let root;
  const restore = () => {
    root?.unmount();
    host.classList.remove('weather-switch');
    host.classList.add('theme-picker');
    host.setAttribute('role', 'group');
    host.setAttribute('aria-label', ariaLabel);
    host.replaceChildren(...fallback);
  };
  root = createRoot(host, { onUncaughtError: () => window.queueMicrotask(restore) });
  try {
    flushSync(() => {
      host.classList.remove('theme-picker');
      host.classList.add('weather-switch');
      host.removeAttribute('role');
      host.removeAttribute('aria-label');
      root.render(<WeatherSwitch items={items} ariaLabel={ariaLabel} />);
    });
  } catch {
    restore();
  }
}
