/**
 * Theme Manager for WriteFix AI
 * Obsidian Dark Design System
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  isDark: boolean;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  inputBg: string;
  inputBorder: string;
  accent: string;
  accentSubtle: string;
  accentBorder: string;
  success: string;
  successBg: string;
  danger: string;
  dangerBg: string;
}

export function getEffectiveTheme(theme: ThemeMode = 'system'): 'dark' | 'light' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'dark'; // Default to ultra-luxe dark obsidian
}

export function getThemeColors(theme: ThemeMode = 'system'): ThemeColors {
  const isDark = getEffectiveTheme(theme) === 'dark';

  if (isDark) {
    return {
      isDark: true,
      bgPrimary: '#030712',
      bgSecondary: '#0b0f19',
      bgTertiary: '#111827',
      bgElevated: '#1a2234',
      border: 'rgba(255, 255, 255, 0.08)',
      borderStrong: 'rgba(99, 102, 241, 0.35)',
      textPrimary: '#f9fafb',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      cardBg: '#0b0f19',
      inputBg: '#111827',
      inputBorder: 'rgba(255, 255, 255, 0.12)',
      accent: '#818cf8',
      accentSubtle: 'rgba(99, 102, 241, 0.16)',
      accentBorder: 'rgba(99, 102, 241, 0.4)',
      success: '#34d399',
      successBg: 'rgba(16, 185, 129, 0.18)',
      danger: '#fb7185',
      dangerBg: 'rgba(244, 63, 94, 0.18)',
    };
  }

  return {
    isDark: false,
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f5f9',
    bgElevated: '#ffffff',
    border: 'rgba(0, 0, 0, 0.08)',
    borderStrong: 'rgba(99, 102, 241, 0.3)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    cardBg: '#ffffff',
    inputBg: '#f8fafc',
    inputBorder: '#e2e8f0',
    accent: '#6366f1',
    accentSubtle: 'rgba(99, 102, 241, 0.1)',
    accentBorder: 'rgba(99, 102, 241, 0.3)',
    success: '#059669',
    successBg: 'rgba(16, 185, 129, 0.12)',
    danger: '#e11d48',
    dangerBg: 'rgba(244, 63, 94, 0.12)',
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

