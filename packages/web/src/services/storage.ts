import { WebSettings, HistoryItem } from '../types';

const SETTINGS_KEY = 'writefix_web_settings_v1';
const HISTORY_KEY = 'writefix_web_history_v1';

export const DEFAULT_WEB_SETTINGS: WebSettings = {
  activeProvider: 'languagetool',
  apiKeys: {
    gemini: '',
    groq: '',
    openai: '',
    anthropic: '',
    openrouter: '',
  },
  selectedModels: {
    gemini: 'gemini-1.5-flash',
    groq: 'llama-3.3-70b-versatile',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022',
    openrouter: 'google/gemini-flash-1.5',
  },
  theme: 'dark',
  autoCheck: false,
  debounceMs: 600,
  soundEffects: false,
  tonePreferences: {
    formality: 50,
    conciseness: 50,
    creativity: 50,
  },
};

export class WebStorage {
  static getSettings(): WebSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_WEB_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to parse settings from storage', e);
    }
    return DEFAULT_WEB_SETTINGS;
  }

  static saveSettings(settings: WebSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  static getHistory(): HistoryItem[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse history', e);
    }
    return [];
  }

  static addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
    const list = this.getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: 'wf_h_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };

    // Keep up to 100 most recent history items
    const updated = [newItem, ...list.slice(0, 99)];
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to store history', e);
    }
    return newItem;
  }

  static toggleFavoriteHistory(id: string): HistoryItem[] {
    const list = this.getHistory();
    const updated = list.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item));
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {}
    return updated;
  }

  static deleteHistory(id: string): HistoryItem[] {
    const list = this.getHistory();
    const updated = list.filter((item) => item.id !== id);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {}
    return updated;
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {}
  }
}
