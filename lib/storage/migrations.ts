import { ChromeStorage, DEFAULT_STORAGE } from './chrome-storage';

const CURRENT_SCHEMA_VERSION = 1;

export class StorageMigrations {
  static async runMigrations(): Promise<void> {
    try {
      const storedVersion = (await ChromeStorage.get('schemaVersion')) || 0;

      if (storedVersion >= CURRENT_SCHEMA_VERSION) {
        return;
      }

      console.log(`[WriteFix Migrations] Upgrading storage schema from v${storedVersion} to v${CURRENT_SCHEMA_VERSION}`);

      // Version 1 Migration: Ensure all default keys exist
      const keys = Object.keys(DEFAULT_STORAGE) as (keyof typeof DEFAULT_STORAGE)[];
      for (const key of keys) {
        const val = await chrome.storage.local.get(key);
        if (val[key] === undefined) {
          await chrome.storage.local.set({ [key]: DEFAULT_STORAGE[key] });
        }
      }

      await ChromeStorage.set('schemaVersion', CURRENT_SCHEMA_VERSION);
      console.log('[WriteFix Migrations] Storage schema successfully upgraded.');
    } catch (e) {
      console.error('[WriteFix Migrations] Error running storage migrations:', e);
    }
  }
}
