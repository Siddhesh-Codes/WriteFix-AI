import React, { useState, useEffect } from 'react';
import { WebSettings, HistoryItem } from './types';
import { WebStorage } from './services/storage';
import { Navbar } from './components/Navbar';
import { StudioEditor } from './components/StudioEditor';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ExtensionGuideModal } from './components/ExtensionGuideModal';

export default function App() {
  const [settings, setSettings] = useState<WebSettings>(WebStorage.getSettings());
  const [historyCount, setHistoryCount] = useState<number>(WebStorage.getHistory().length);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExtensionGuideOpen, setIsExtensionGuideOpen] = useState<boolean>(false);
  const [restoredText, setRestoredText] = useState<{ original: string; corrected: string; mode: any } | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme as 'dark' | 'light' };
    setSettings(updated);
    WebStorage.saveSettings(updated);
  };

  const handleRestoreFromHistory = (item: HistoryItem) => {
    setRestoredText({
      original: item.originalText,
      corrected: item.correctedText,
      mode: item.mode,
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Navbar */}
      <Navbar
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExtensionGuide={() => setIsExtensionGuideOpen(true)}
        onToggleTheme={handleToggleTheme}
        historyCount={historyCount}
      />

      {/* Main Studio Editor */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <StudioEditor
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSettingsChange={(newSettings) => {
            setSettings(newSettings);
            WebStorage.saveSettings(newSettings);
          }}
          onHistoryUpdated={() => setHistoryCount(WebStorage.getHistory().length)}
          restoredText={restoredText}
        />
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestore={handleRestoreFromHistory}
        onHistoryChange={() => setHistoryCount(WebStorage.getHistory().length)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => setSettings(newSettings)}
      />

      {/* Extension Installation Guide Modal */}
      <ExtensionGuideModal
        isOpen={isExtensionGuideOpen}
        onClose={() => setIsExtensionGuideOpen(false)}
      />
    </div>
  );
}
