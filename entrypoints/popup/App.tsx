import * as React from 'react';
import { useState, useEffect } from 'react';
import { CheckCircle2, Lightbulb, Settings as SettingsIcon } from 'lucide-react';
import { HistoryStorage } from '@/lib/storage/history';
import { FavoritesStorage } from '@/lib/storage/favorites';
import { SettingsStorage } from '@/lib/storage/settings';
import { HistoryEntry, FavoriteEntry, Settings } from '@/lib/storage/types';
import { getThemeColors, applyGlobalTheme } from '@/lib/utils/theme';

export default function App() {
  const [tab, setTab] = useState<'status' | 'history' | 'favorites'>('status');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const h = await HistoryStorage.getAll();
    const f = await FavoritesStorage.getAll();
    const s = await SettingsStorage.get();
    setHistory(h);
    setFavorites(f);
    setSettings(s);
    applyGlobalTheme(s.theme);
  };

  const openOptions = () => {
    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  const themeColors = getThemeColors(settings?.theme);

  const filteredHistory = history.filter(
    (item) =>
      item.originalText.toLowerCase().includes(search.toLowerCase()) ||
      item.correctedText.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: themeColors.bgPrimary, color: themeColors.textPrimary }}>
      {/* Header with Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${themeColors.border}`, backgroundColor: themeColors.bgSecondary }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={chrome.runtime?.getURL ? chrome.runtime.getURL('logo.png') : ''} alt="WriteFix AI" style={{ width: '26px', height: '26px', borderRadius: '6px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#6366f1', lineHeight: '1.2' }}>WriteFix AI</div>
            <div style={{ fontSize: '11px', color: themeColors.textSecondary }}>Writing Assistant</div>
          </div>
        </div>

        <button
          onClick={openOptions}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeColors.textSecondary, display: 'flex', alignItems: 'center' }}
          title="Open Settings"
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${themeColors.border}`, backgroundColor: themeColors.bgTertiary }}>
        <button
          onClick={() => setTab('status')}
          style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: tab === 'status' ? 600 : 500, color: tab === 'status' ? '#6366f1' : themeColors.textSecondary, borderBottom: tab === 'status' ? '2px solid #6366f1' : 'none', cursor: 'pointer', fontSize: '13px' }}
        >
          Status
        </button>
        <button
          onClick={() => setTab('history')}
          style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: tab === 'history' ? 600 : 500, color: tab === 'history' ? '#6366f1' : themeColors.textSecondary, borderBottom: tab === 'history' ? '2px solid #6366f1' : 'none', cursor: 'pointer', fontSize: '13px' }}
        >
          History ({history.length})
        </button>
        <button
          onClick={() => setTab('favorites')}
          style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontWeight: tab === 'favorites' ? 600 : 500, color: tab === 'favorites' ? '#6366f1' : themeColors.textSecondary, borderBottom: tab === 'favorites' ? '2px solid #6366f1' : 'none', cursor: 'pointer', fontSize: '13px' }}
        >
          Favorites ({favorites.length})
        </button>
      </div>

      {/* Body Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {tab === 'status' && (
          <div>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: themeColors.isDark ? '#064e3b' : '#f0fdf4', border: `1px solid ${themeColors.isDark ? '#065f46' : '#bbf7d0'}`, marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: themeColors.isDark ? '#34d399' : '#166534', fontSize: '13px' }}>
                <CheckCircle2 size={16} color={themeColors.isDark ? '#34d399' : '#166534'} />
                WriteFix AI is Active
              </div>
              <div style={{ fontSize: '12px', color: themeColors.isDark ? '#a7f3d0' : '#15803d', marginTop: '4px' }}>
                Active Provider: {settings?.activeProvider.toUpperCase() || 'LanguageTool'}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: themeColors.textSecondary, lineHeight: '1.6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: themeColors.textPrimary, marginBottom: '6px' }}>
                <Lightbulb size={14} color="#6366f1" /> How to use:
              </div>
              1. Select text on any webpage (Gmail, Twitter, LinkedIn, etc.)<br />
              2. Right-click text and click <strong>Improve Writing with WriteFix AI</strong>.<br />
              3. Or press <strong>{settings?.customShortcut || 'Ctrl+Shift+G'}</strong> to open the Inline Popup.<br />
            </div>

            <button
              onClick={openOptions}
              style={{ width: '100%', marginTop: '20px', backgroundColor: '#6366f1', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Configure Settings & Providers
            </button>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${themeColors.inputBorder}`, backgroundColor: themeColors.inputBg, color: themeColors.textPrimary, fontSize: '12px', marginBottom: '12px', boxSizing: 'border-box' }}
            />

            {filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: themeColors.textSecondary, padding: '24px', fontSize: '13px' }}>No history entries found.</div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} style={{ padding: '10px', borderRadius: '8px', backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, marginBottom: '8px', fontSize: '12px' }}>
                  <div style={{ color: themeColors.isDark ? '#f87171' : '#ef4444', textDecoration: 'line-through' }}>{item.originalText}</div>
                  <div style={{ color: themeColors.isDark ? '#34d399' : '#15803d', fontWeight: 500, marginTop: '2px' }}>{item.correctedText}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: themeColors.textSecondary, fontSize: '10px', marginTop: '6px' }}>
                    <span>{item.mode} · Score {item.scoreBefore} → {item.scoreAfter}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', color: themeColors.textSecondary, padding: '24px', fontSize: '13px' }}>No favorites saved yet.</div>
            ) : (
              favorites.map((fav) => (
                <div key={fav.id} style={{ padding: '10px', borderRadius: '8px', backgroundColor: themeColors.cardBg, border: `1px solid ${themeColors.border}`, marginBottom: '8px', fontSize: '12px' }}>
                  <div style={{ color: themeColors.isDark ? '#34d399' : '#15803d', fontWeight: 600 }}>{fav.correctedText}</div>
                  <div style={{ color: themeColors.textSecondary, fontSize: '11px', marginTop: '4px' }}>Original: "{fav.originalText}"</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
