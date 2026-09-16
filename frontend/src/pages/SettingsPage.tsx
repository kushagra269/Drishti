import { useEffect, useState } from 'react';
import { Moon, Sun, Settings as SettingsIcon, Monitor } from 'lucide-react';
import { applyTheme, getStoredTheme, type ThemeMode } from '../utils/theme';

export function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setMode = (mode: ThemeMode) => {
    setTheme(mode);
    applyTheme(mode);
  };

  return (
    <div
      className="page-scroll mx-auto w-full"
      style={{
        maxWidth: 720,
        padding: '20px 24px 40px',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <SettingsIcon size={20} color="var(--accent-primary)" />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
      </div>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
        Appearance and workspace preferences
      </p>

      <section
        className="rounded-xl p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 650, color: 'var(--text-primary)' }}>Appearance</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Switch between light and dark layout for the whole dashboard
            </p>
          </div>
          <div
            className="flex items-center gap-1 p-1 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
          >
            <button
              type="button"
              onClick={() => setMode('light')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium"
              style={{
                backgroundColor: theme === 'light' ? 'var(--bg-elevated)' : 'transparent',
                color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: theme === 'light' ? '1px solid var(--border-default)' : '1px solid transparent',
                boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Sun size={15} />
              Light
            </button>
            <button
              type="button"
              onClick={() => setMode('dark')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg-elevated)' : 'transparent',
                color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: theme === 'dark' ? '1px solid var(--border-default)' : '1px solid transparent',
                boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Moon size={15} />
              Dark
            </button>
          </div>
        </div>

        <div
          className="mt-5 rounded-lg px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-soft)' }}
        >
          <Monitor size={16} color="var(--accent-primary)" />
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Current theme:{' '}
            <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{theme}</strong>
            {' · '}Preference is saved on this device
          </div>
        </div>
      </section>
    </div>
  );
}
