import { ChromeStorage } from './chrome-storage';
import { HistoryEntry, FavoriteEntry } from './types';

const MAX_HISTORY_ITEMS = 100;

export class HistoryStorage {
  static async getAll(): Promise<HistoryEntry[]> {
    return ChromeStorage.get('history');
  }

  static async add(entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'isFavorite'>): Promise<HistoryEntry> {
    const history = await ChromeStorage.get('history');
    const newEntry: HistoryEntry = {
      ...entry,
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      isFavorite: false,
    };

    // FIFO eviction if length >= 100
    const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);
    await ChromeStorage.set('history', updatedHistory);
    return newEntry;
  }

  static async remove(id: string): Promise<void> {
    const history = await ChromeStorage.get('history');
    const updated = history.filter((item) => item.id !== id);
    await ChromeStorage.set('history', updated);
  }

  static async clear(): Promise<void> {
    await ChromeStorage.set('history', []);
  }

  static async toggleFavorite(id: string): Promise<boolean> {
    const history = await ChromeStorage.get('history');
    const favorites = await ChromeStorage.get('favorites');
    const target = history.find((h) => h.id === id);

    if (!target) return false;

    target.isFavorite = !target.isFavorite;
    await ChromeStorage.set('history', history);

    if (target.isFavorite) {
      const favEntry: FavoriteEntry = {
        id: `fav_${Date.now()}`,
        historyId: target.id,
        originalText: target.originalText,
        correctedText: target.correctedText,
        mode: target.mode,
        createdAt: Date.now(),
      };
      await ChromeStorage.set('favorites', [favEntry, ...favorites]);
    } else {
      const updatedFavs = favorites.filter((f) => f.historyId !== id);
      await ChromeStorage.set('favorites', updatedFavs);
    }

    return target.isFavorite;
  }
}
