import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Bot,
  Palette,
  Zap,
  Check,
  AlertTriangle,
  Keyboard,
  ExternalLink,
  RefreshCw,
  Sliders,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { SettingsStorage } from '@/lib/storage/settings';
import { Settings } from '@/lib/storage/types';
import { DEFAULT_MODELS } from '@/lib/ai/model-defaults';
import { getThemeColors, applyGlobalTheme } from '@/lib/utils/theme';
import { GroqProvider } from '@/lib/ai/groq';
import { GeminiProvider } from '@/lib/ai/gemini';
import { OpenAIProvider } from '@/lib/ai/openai';
import { AnthropicProvider } from '@/lib/ai/anthropic';
import { OpenRouterProvider } from '@/lib/ai/openrouter';

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq Cloud',
    model: 'Llama 3.3 70B Versatile',
    badge: 'FREE & FASTEST',
    badgeColor: '#10b981',
    description: 'Sub-150ms ultra-low latency inference. Free forever.',
    keyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    model: 'Gemini 2.5 Flash',
    badge: 'FREE TIER',
    badgeColor: '#818cf8',
    description: 'High intelligence & reasoning with 1,500 free requests/day.',
    keyUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'languagetool',
    name: 'LanguageTool',
    model: 'Rule-Based Engine',
    badge: 'NO KEY NEEDED',
    badgeColor: '#06b6d4',
    description: 'Instant offline/free spell & grammar check out of the box.',
    keyUrl: '',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    model: 'Any Model Route',
    badge: 'FLEXIBLE',
    badgeColor: '#a855f7',
    description: 'Access hundreds of open-source and proprietary models.',
    keyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    model: 'GPT-4o Mini',
    badge: 'POPULAR',
    badgeColor: '#f59e0b',
    description: 'Fast, cost-effective multimodal model from OpenAI.',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    model: 'Claude 3.5 Sonnet',
    badge: 'PREMIUM',
    badgeColor: '#ec4899',
    description: 'Nuanced writing and natural cadence.',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
];

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<{ testing: boolean; success?: boolean; message?: string }>({ testing: false });
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);

  useEffect(() => {
    SettingsStorage.get().then((s) => {
      setSettings(s);
      applyGlobalTheme(s.theme);
    });
  }, []);

  if (!settings) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#030712', minHeight: '100vh' }}>
        Loading WriteFix settings...
      </div>
    );
  }

  const themeColors = getThemeColors(settings.theme);

  const updateSettings = async (partial: Partial<Settings>) => {
    const updated = await SettingsStorage.update(partial);
    setSettings(updated);
    if (partial.theme !== undefined) {
      applyGlobalTheme(partial.theme);
    }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleApiKeyChange = (provider: string, key: string) => {
    const apiKeys = { ...settings.apiKeys, [provider]: key.trim() };
    updateSettings({ apiKeys });
  };

  const toggleShowKey = (provider: string) => {
    setShowKeyMap((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleShortcutKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecordingShortcut) return;
    e.preventDefault();

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    const key = e.key.toUpperCase();
    if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) {
      parts.push(key);
      const newShortcut = parts.join('+');
      updateSettings({ customShortcut: newShortcut });
      setIsRecordingShortcut(false);
    }
  };

  const testProviderConnection = async () => {
    setTestStatus({ testing: true });
    const provider = settings.activeProvider;
    const key = settings.apiKeys[provider] || '';

    if (provider === 'languagetool') {
      setTestStatus({ testing: false, success: true, message: 'LanguageTool free provider is active and working.' });
      return;
    }

    if (!key) {
      setTestStatus({ testing: false, success: false, message: `Please enter an API key for ${provider.toUpperCase()}.` });
      return;
    }

    try {
      let inst;
      if (provider === 'groq') inst = new GroqProvider(key);
      else if (provider === 'gemini') inst = new GeminiProvider(key);
      else if (provider === 'openai') inst = new OpenAIProvider(key);
      else if (provider === 'anthropic') inst = new AnthropicProvider(key);
      else if (provider === 'openrouter') inst = new OpenRouterProvider(key);

      if (inst) {
        await inst.correct({ text: 'Hello world', mode: 'grammar_only' });
        setTestStatus({ testing: false, success: true, message: `Connected to ${provider.toUpperCase()} API successfully.` });
      } else {
        setTestStatus({ testing: false, success: true, message: `API Key saved for ${provider.toUpperCase()}.` });
      }
    } catch (err: any) {
      setTestStatus({ testing: false, success: false, message: `Connection failed: ${err.message}` });
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#0b0f19',
    borderRadius: '12px',
    padding: '22px',
    marginBottom: '18px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
    color: '#f9fafb',
    transition: 'border-color 0.2s ease',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: '#111827',
    color: '#f9fafb',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return (
    <div
      style={{
        backgroundColor: '#030712',
        minHeight: '100vh',
        padding: '30px 20px',
        color: '#f9fafb',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={chrome.runtime?.getURL ? chrome.runtime.getURL('icon-32.png') : '/icon-32.png'}
              alt="WriteFix"
              style={{ width: '36px', height: '36px', borderRadius: '8px' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f9fafb' }}>
                  WriteFix AI Settings
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(99, 102, 241, 0.16)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    fontWeight: 600,
                  }}
                >
                  EXTENSION
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>
                Configure AI providers, free tier keys, keyboard shortcuts, and UI preferences
              </div>
            </div>
          </div>

          {savedToast && (
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontWeight: 600,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Check size={14} /> Auto-Saved
            </div>
          )}
        </div>

        {/* Providers Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Bot size={18} color="#818cf8" />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f9fafb' }}>
              Writing Provider Engine
            </h2>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#94a3b8' }}>
            Select which AI provider powers your extensions text rewrites and grammar checks.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {PROVIDERS.map((prov) => {
              const isSelected = settings.activeProvider === prov.id;
              return (
                <div
                  key={prov.id}
                  onClick={() => {
                    updateSettings({ activeProvider: prov.id as any });
                    setTestStatus({ testing: false });
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : '#111827',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? '#818cf8' : '#f9fafb' }}>
                      {prov.name}
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: 700,
                        backgroundColor: `${prov.badgeColor}22`,
                        color: prov.badgeColor,
                        border: `1px solid ${prov.badgeColor}44`,
                      }}
                    >
                      {prov.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    {prov.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Provider API Key Input */}
          {settings.activeProvider !== 'languagetool' && (
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                  {settings.activeProvider.toUpperCase()} API Key:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {PROVIDERS.find((p) => p.id === settings.activeProvider)?.keyUrl && (
                    <a
                      href={PROVIDERS.find((p) => p.id === settings.activeProvider)?.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#818cf8', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <span>Get Free Key</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleShowKey(settings.activeProvider)}
                    style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    {showKeyMap[settings.activeProvider] ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showKeyMap[settings.activeProvider] ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              <input
                type={showKeyMap[settings.activeProvider] ? 'text' : 'password'}
                placeholder={`Paste your ${settings.activeProvider.toUpperCase()} API key here...`}
                value={settings.apiKeys[settings.activeProvider] || ''}
                onChange={(e) => handleApiKeyChange(settings.activeProvider, e.target.value)}
                style={{ ...inputStyle, fontFamily: '"IBM Plex Mono", monospace' }}
              />

              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={testProviderConnection}
                  disabled={testStatus.testing}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: testStatus.testing ? 'not-allowed' : 'pointer',
                    opacity: testStatus.testing ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Zap size={13} /> {testStatus.testing ? 'Testing Connection...' : 'Test Connection'}
                </button>

                {testStatus.message && (
                  <span style={{ fontSize: '12px', fontWeight: 500, color: testStatus.success ? '#34d399' : '#fb7185' }}>
                    {testStatus.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcut Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Keyboard size={18} color="#818cf8" />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f9fafb' }}>
              Inline Trigger Shortcut
            </h2>
          </div>
          <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: '#94a3b8' }}>
            Select text anywhere on any webpage and press this shortcut to open the inline floating popup.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              readOnly
              value={isRecordingShortcut ? 'Press desired key combination...' : settings.customShortcut || 'Ctrl+Shift+G'}
              onKeyDown={handleShortcutKeyDown}
              onClick={() => setIsRecordingShortcut(true)}
              style={{
                ...inputStyle,
                fontFamily: '"IBM Plex Mono", monospace',
                backgroundColor: isRecordingShortcut ? 'rgba(99, 102, 241, 0.16)' : '#111827',
                borderColor: isRecordingShortcut ? '#818cf8' : 'rgba(255, 255, 255, 0.12)',
                color: isRecordingShortcut ? '#818cf8' : '#f9fafb',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                flex: 1,
              }}
            />

            <button
              type="button"
              onClick={() => setIsRecordingShortcut(!isRecordingShortcut)}
              style={{
                padding: '9px 14px',
                borderRadius: '6px',
                backgroundColor: isRecordingShortcut ? '#f43f5e' : '#6366f1',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              {isRecordingShortcut ? 'Cancel' : 'Record Shortcut'}
            </button>

            <button
              type="button"
              onClick={() => updateSettings({ customShortcut: 'Ctrl+Shift+G' })}
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: '#111827',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontWeight: 500,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Reset to Ctrl+Shift+G"
            >
              <RefreshCw size={12} /> Reset
            </button>
          </div>
        </div>

        {/* Behavior & Appearance Section */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sliders size={18} color="#818cf8" />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f9fafb' }}>
              Behavior & Appearance
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Theme Mode:
              </label>
              <select
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as any })}
                style={inputStyle}
              >
                <option value="dark">Obsidian Dark (Default)</option>
                <option value="light">Light Mode</option>
                <option value="system">Follow System</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#f9fafb' }}>
                <input
                  type="checkbox"
                  checked={settings.showFloatingToolbar}
                  onChange={(e) => updateSettings({ showFloatingToolbar: e.target.checked })}
                />
                Show floating pill when selecting text
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#f9fafb' }}>
                <input
                  type="checkbox"
                  checked={settings.autoCopy}
                  onChange={(e) => updateSettings({ autoCopy: e.target.checked })}
                />
                Auto-copy polished text to clipboard
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
