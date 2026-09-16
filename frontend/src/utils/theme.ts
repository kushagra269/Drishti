const THEME_KEY = 'drishti_theme';
const LEGACY_THEME_KEY = 'netra_theme';

export type ThemeMode = 'light' | 'dark';

export function getStoredTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  const legacy = localStorage.getItem(LEGACY_THEME_KEY);
  if (legacy === 'light' || legacy === 'dark') {
    localStorage.setItem(THEME_KEY, legacy);
    return legacy;
  }
  return 'dark';
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(THEME_KEY, mode);
  window.dispatchEvent(new CustomEvent('drishti-theme-changed', { detail: mode }));
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = getStoredTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
