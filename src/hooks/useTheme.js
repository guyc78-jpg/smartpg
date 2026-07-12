import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'theme';
const CHANGE_EVENT = 'smartpg:theme-change';
const validThemes = new Set(['light', 'dark', 'system']);

function getStoredTheme() {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return validThemes.has(stored) ? stored : 'system';
}

function prefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(theme) {
  return theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme;
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content', resolved === 'dark' ? 'hsl(222, 32%, 7%)' : 'hsl(208, 100%, 99%)'
  );
}

function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const notify = () => {
    applyTheme(getStoredTheme());
    callback();
  };
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener('storage', notify);
  media.addEventListener('change', notify);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener('storage', notify);
    media.removeEventListener('change', notify);
  };
}

export function setTheme(theme) {
  const next = validThemes.has(theme) ? theme : 'system';
  window.localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getStoredTheme, () => 'system');
  const resolvedTheme = resolveTheme(theme);
  return {
    theme,
    resolvedTheme,
    dark: resolvedTheme === 'dark',
    setTheme,
    toggle: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
  };
}

applyTheme(getStoredTheme());
