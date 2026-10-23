import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import JellyRadio from './components/JellyRadio.jsx';
import './weather-switch.css';

const preview = document.querySelector('[data-preview]');
const host = preview?.querySelector('[data-weather-switch]');
const fallback = host ? [...host.querySelectorAll('[data-theme]')] : [];
const placementFallback = document.querySelector('[data-feature="placement"] .feature-switcher--placement');
const placementButtons = placementFallback ? [...placementFallback.querySelectorAll('[data-feature-choice]')] : [];

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

function PlacementSwitch({ items, ariaLabel }) {
  const [value, setValue] = useState(() => placementButtons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.featureChoice || items[0].value);
  useLayoutEffect(() => {
    const sync = event => setValue(event.detail.value);
    placementFallback.addEventListener('wonderfall:placement-change', sync);
    return () => placementFallback.removeEventListener('wonderfall:placement-change', sync);
  }, []);
  return <JellyRadio items={items} value={value}
    onChange={choice => {
      setValue(choice);
      placementButtons.find(button => button.dataset.featureChoice === choice)?.click();
    }}
    chipColor="#ffffff1f" activeColor="#fff" textColor="#fff" activeTextColor="#164eb7"
    size="lg" radius={24} gap={4} barge={2} ariaLabel={ariaLabel} className="placement-jelly" />;
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

if (placementButtons.length) {
  const mount = document.createElement('div');
  mount.className = 'placement-switch';
  mount.setAttribute('data-placement-switch', '');
  placementFallback.after(mount);
  const items = placementButtons.map(button => ({
    value: button.dataset.featureChoice,
    label: button.lastElementChild.textContent,
    icon: <img src={button.querySelector('.feature-placement-icon img').getAttribute('src')} alt="" width="32" height="32" />
  }));
  let root;
  const restore = () => {
    root?.unmount();
    mount.remove();
    placementFallback.hidden = false;
  };
  root = createRoot(mount, { onUncaughtError: () => window.queueMicrotask(restore) });
  try {
    flushSync(() => {
      root.render(<PlacementSwitch items={items} ariaLabel={placementFallback.getAttribute('aria-label')} />);
      placementFallback.hidden = true;
    });
  } catch {
    restore();
  }
}
