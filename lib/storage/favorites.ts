import { ChromeStorage } from './chrome-storage';
import { FavoriteEntry } from './types';

export class FavoritesStorage {
  static async getAll(): Promise<FavoriteEntry[]> {
    return ChromeStorage.get('favorites');
  }

  static async remove(id: string): Promise<void> {
    const favorites = await ChromeStorage.get('favorites');
    const updated = favorites.filter((f) => f.id !== id);
    await ChromeStorage.set('favorites', updated);
  }

  static async clear(): Promise<void> {
    await ChromeStorage.set('favorites', []);
  }
}
