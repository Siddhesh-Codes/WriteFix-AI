import { CorrectionResponse } from '@writefix/core';
import { computeHash } from '../utils/hash';

const MAX_CACHE_ENTRIES = 50;

export class ResponseCache {
  private cache = new Map<string, CorrectionResponse>();

  async get(text: string, mode: string, provider: string, preferences: any): Promise<CorrectionResponse | null> {
    const key = await this.generateKey(text, mode, provider, preferences);
    const hit = this.cache.get(key);
    if (hit) {
      // Refresh LRU order
      this.cache.delete(key);
      this.cache.set(key, hit);
      return hit;
    }
    return null;
  }

  async set(text: string, mode: string, provider: string, preferences: any, response: CorrectionResponse): Promise<void> {
    const key = await this.generateKey(text, mode, provider, preferences);
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      // Evict oldest entry (LRU)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, response);
  }

  clear(): void {
    this.cache.clear();
  }

  private async generateKey(text: string, mode: string, provider: string, preferences: any): Promise<string> {
    const raw = `${text.trim()}::${mode}::${provider}::${JSON.stringify(preferences || [])}`;
    return computeHash(raw);
  }
}

export const globalResponseCache = new ResponseCache();
