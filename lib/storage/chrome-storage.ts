import { StorageSchema, Settings, WritingProfile } from './types';
import { isExtensionContextValid } from '../utils/context-check';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en-US',
  activeProvider: 'languagetool',
  apiKeys: {},
  selectedModels: {},
  temperatures: {},
  autoCopy: false,
  autoReplace: false,
  showFloatingToolbar: false, // Default false: Right-click context menu & keyboard shortcut are the primary triggers
  enableShortcut: true,
  customShortcut: 'Ctrl+Shift+G',
  preferences: [],
};

export const DEFAULT_WRITING_PROFILE: WritingProfile = {
  preferredMode: null,
  preferredTone: null,
  averageSentenceLength: 0,
  preferredReadingLevel: null,
  favoriteWords: {},
  avoidedWords: {},
  modeUsage: {},
  totalCorrections: 0,
  lastUpdated: Date.now(),
  confidenceScore: 0,
};

export const DEFAULT_STORAGE: StorageSchema = {
  settings: DEFAULT_SETTINGS,
  history: [],
  favorites: [],
  writingProfile: DEFAULT_WRITING_PROFILE,
  personalDictionary: [],
  customPrompts: [],
  mistakeFrequencies: {},
  dismissedLessons: [],
  schemaVersion: 1,
};

/**
 * Safe Type-safe Chrome Storage Local Wrapper
 */
export class ChromeStorage {
  static async get<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K]> {
    if (!isExtensionContextValid()) {
      return DEFAULT_STORAGE[key];
    }
    try {
      const result = await chrome.storage.local.get(key as string);
      if (result && result[key] !== undefined && result[key] !== null) {
        return result[key] as StorageSchema[K];
      }
      return DEFAULT_STORAGE[key];
    } catch (e) {
      return DEFAULT_STORAGE[key];
    }
  }

  static async set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void> {
    if (!isExtensionContextValid()) return;
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (e) {
      // Suppress invalidation error silently
    }
  }

  static watch<K extends keyof StorageSchema>(
    key: K,
    callback: (newValue: StorageSchema[K], oldValue?: StorageSchema[K]) => void
  ): () => void {
    if (!isExtensionContextValid()) {
      return () => {};
    }
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (!isExtensionContextValid()) return;
      try {
        if (areaName === 'local' && changes[key]) {
          callback(changes[key].newValue as StorageSchema[K], changes[key].oldValue as StorageSchema[K]);
        }
      } catch (e) {
        // Suppress invalidation error silently
      }
    };

    try {
      chrome.storage.onChanged.addListener(listener);
      return () => {
        if (isExtensionContextValid()) {
          try {
            chrome.storage.onChanged.removeListener(listener);
          } catch (e) {}
        }
      };
    } catch (e) {
      return () => {};
    }
  }
}
