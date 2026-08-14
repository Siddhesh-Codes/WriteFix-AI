import { ChromeStorage, DEFAULT_SETTINGS } from './chrome-storage';
import { Settings } from './types';

export class SettingsStorage {
  static async get(): Promise<Settings> {
    const settings = await ChromeStorage.get('settings');
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  static async update(partial: Partial<Settings>): Promise<Settings> {
    const current = await SettingsStorage.get();
    const updated: Settings = { ...current, ...partial };
    await ChromeStorage.set('settings', updated);
    return updated;
  }

  static async setApiKey(provider: string, key: string): Promise<void> {
    const current = await SettingsStorage.get();
    const apiKeys = { ...current.apiKeys, [provider]: key };
    await SettingsStorage.update({ apiKeys });
  }

  static async setSelectedModel(provider: string, model: string): Promise<void> {
    const current = await SettingsStorage.get();
    const selectedModels = { ...current.selectedModels, [provider]: model };
    await SettingsStorage.update({ selectedModels });
  }

  static watch(callback: (newSettings: Settings, oldSettings?: Settings) => void): () => void {
    return ChromeStorage.watch('settings', (newSettings, oldSettings) => {
      callback(
        { ...DEFAULT_SETTINGS, ...newSettings },
        oldSettings ? { ...DEFAULT_SETTINGS, ...oldSettings } : undefined
      );
    });
  }
}
