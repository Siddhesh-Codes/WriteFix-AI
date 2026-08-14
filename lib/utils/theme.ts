/**
 * Theme Manager for WriteFix AI
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  isDark: boolean;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  inputBg: string;
  inputBorder: string;
}

export function getEffectiveTheme(theme: ThemeMode = 'system'): 'dark' | 'light' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function getThemeColors(theme: ThemeMode = 'system'): ThemeColors {
  const isDark = getEffectiveTheme(theme) === 'dark';

  if (isDark) {
    return {
      isDark: true,
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      border: '#334155',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      cardBg: '#1e293b',
      inputBg: '#334155',
      inputBorder: '#475569',
    };
  }

  return {
    isDark: false,
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f5f9',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    cardBg: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
  };
}

export function applyGlobalTheme(theme: ThemeMode = 'system'): void {
  if (typeof document === 'undefined') return;

  const isDark = getEffectiveTheme(theme) === 'dark';
  const colors = getThemeColors(theme);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  document.body.style.backgroundColor = colors.bgPrimary;
  document.body.style.color = colors.textPrimary;
}
