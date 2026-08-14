import React, { useState, useEffect } from 'react';
import { WebSettings, HistoryItem } from './types';
import { WebStorage } from './services/storage';
import { Navbar } from './components/Navbar';
import { StudioEditor } from './components/StudioEditor';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [settings, setSettings] = useState<WebSettings>(WebStorage.getSettings());
  const [historyCount, setHistoryCount] = useState<number>(WebStorage.getHistory().length);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [restoredText, setRestoredText] = useState<{ original: string; corrected: string; mode: any } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('writefix_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleRestoreFromHistory = (item: HistoryItem) => {
    setRestoredText({
      original: item.originalText,
      corrected: item.correctedText,
      mode: item.mode,
    });
  };

  return (
    <div className="app-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', transition: 'background-color 0.2s ease' }}>
      {/* Navbar */}
      <Navbar
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyCount}
      />

      {/* Main Studio Editor */}
      <main className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
    </div>
  );
}
