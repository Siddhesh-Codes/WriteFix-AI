import { useState, useEffect } from 'react';
import { ChromeStorage } from '../lib/storage/chrome-storage';

export type ThemeMode = 'dark' | 'light' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    ChromeStorage.get('settings').then((settings) => {
      if (settings?.theme) setTheme(settings.theme);
    });

    return ChromeStorage.watch('settings', (newSettings) => {
      if (newSettings?.theme) setTheme(newSettings.theme);
    });
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setEffectiveTheme(isDark ? 'dark' : 'light');
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  return { theme, effectiveTheme, setTheme };
}
