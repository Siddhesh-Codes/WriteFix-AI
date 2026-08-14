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
  accent: string;
}

export function getEffectiveTheme(theme: ThemeMode = 'system'): 'dark' | 'light' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'dark'; // Default to dark warm editorial
}

export function getThemeColors(theme: ThemeMode = 'system'): ThemeColors {
  const isDark = getEffectiveTheme(theme) === 'dark';

  if (isDark) {
    return {
      isDark: true,
      bgPrimary: '#15171B',
      bgSecondary: '#1C1F24',
      bgTertiary: '#23262C',
      border: 'rgba(236, 232, 222, 0.12)',
      textPrimary: '#ECE8DE',
      textSecondary: '#8B8F96',
      cardBg: '#1C1F24',
      inputBg: '#23262C',
      inputBorder: 'rgba(236, 232, 222, 0.18)',
      accent: '#B08D4F',
    };
  }

  return {
    isDark: false,
    bgPrimary: '#F6F4EE',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#ECE8DE',
    border: '#D8D3C5',
    textPrimary: '#15171B',
    textSecondary: '#5C6068',
    cardBg: '#FFFFFF',
    inputBg: '#FFFFFF',
    inputBorder: '#D8D3C5',
    accent: '#8A6E3E',
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
