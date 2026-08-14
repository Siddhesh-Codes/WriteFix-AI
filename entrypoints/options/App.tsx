import * as React from 'react';
import { useState, useEffect } from 'react';
import { Bot, Palette, Zap, Check, AlertTriangle, Keyboard, ExternalLink, RefreshCw } from 'lucide-react';
import { SettingsStorage } from '@/lib/storage/settings';
import { Settings } from '@/lib/storage/types';
import { DEFAULT_MODELS } from '@/lib/ai/model-defaults';
import { getThemeColors, applyGlobalTheme } from '@/lib/utils/theme';
import { GroqProvider } from '@/lib/ai/groq';
import { GeminiProvider } from '@/lib/ai/gemini';
import { OpenAIProvider } from '@/lib/ai/openai';
import { AnthropicProvider } from '@/lib/ai/anthropic';
import { OpenRouterProvider } from '@/lib/ai/openrouter';

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
    return <div style={{ padding: '40px', textAlign: 'center', color: '#8B8F96' }}>Loading settings...</div>;
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
    backgroundColor: themeColors.cardBg,
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    border: `1px solid ${themeColors.border}`,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    color: themeColors.textPrimary,
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  };

  const sectionTitle: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: themeColors.textPrimary,
  };

  const sectionDesc: React.CSSProperties = {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: themeColors.textSecondary,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: themeColors.textSecondary,
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: `1px solid ${themeColors.inputBorder}`,
    backgroundColor: themeColors.inputBg,
    color: themeColors.textPrimary,
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
      {/* Header with Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: `1px solid ${themeColors.border}`, marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={chrome.runtime?.getURL ? chrome.runtime.getURL('icon-32.png') : '/icon-32.png'} alt="WriteFix" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontFamily: 'Fraunces, Georgia, serif', color: themeColors.textPrimary }}>WriteFix AI Settings</h1>
            <div style={{ fontSize: '13px', color: themeColors.textSecondary }}>Configure AI providers, API keys, shortcuts, and themes</div>
          </div>
        </div>

        {savedToast && (
          <div style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(122, 148, 113, 0.15)', border: '1px solid rgba(122, 148, 113, 0.3)', color: '#7A9471', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} /> Settings Saved
          </div>
        )}
      </div>

      {/* Provider Config */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Bot size={20} color="#B08D4F" />
          <h2 style={sectionTitle}>Writing Provider & API Keys</h2>
        </div>
        <p style={sectionDesc}>Choose your active AI engine or use free keyless LanguageTool.</p>

        <label style={labelStyle}>Active Provider:</label>
        <select
          value={settings.activeProvider}
          onChange={(e) => {
            updateSettings({ activeProvider: e.target.value as any });
            setTestStatus({ testing: false });
          }}
          style={inputStyle}
        >
          <option value="languagetool">LanguageTool (Free, No Key Needed)</option>
          <option value="groq">Groq (Llama 3.3 70B - Permanent Free Tier)</option>
          <option value="gemini">Google Gemini ({DEFAULT_MODELS.gemini})</option>
          <option value="openrouter">OpenRouter (Any Model)</option>
          <option value="openai">OpenAI ({DEFAULT_MODELS.openai})</option>
          <option value="anthropic">Anthropic (Claude Sonnet 4)</option>
        </select>

        {settings.activeProvider !== 'languagetool' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>{settings.activeProvider.toUpperCase()} API Key:</label>
              <button
                type="button"
                onClick={() => toggleShowKey(settings.activeProvider)}
                style={{ background: 'none', border: 'none', color: '#B08D4F', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
              >
                {showKeyMap[settings.activeProvider] ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showKeyMap[settings.activeProvider] ? 'text' : 'password'}
              placeholder={`Paste your ${settings.activeProvider.toUpperCase()} API key here...`}
              value={settings.apiKeys[settings.activeProvider] || ''}
              onChange={(e) => handleApiKeyChange(settings.activeProvider, e.target.value)}
              style={{ ...inputStyle, fontFamily: '"IBM Plex Mono", monospace' }}
            />
            {settings.activeProvider === 'gemini' && (
              <div style={{ fontSize: '11px', color: '#B08D4F', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> Free tier data may be used by Google to improve services.
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={testProviderConnection}
            disabled={testStatus.testing}
            style={{
              backgroundColor: '#B08D4F',
              color: '#15171B',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: testStatus.testing ? 'not-allowed' : 'pointer',
              opacity: testStatus.testing ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={14} /> {testStatus.testing ? 'Testing connection...' : 'Test Provider Connection'}
          </button>

          {testStatus.message && (
            <span style={{ fontSize: '13px', fontWeight: 500, color: testStatus.success ? '#7A9471' : '#BE5B3D' }}>
              {testStatus.message}
            </span>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Customization */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Keyboard size={20} color="#B08D4F" />
          <h2 style={sectionTitle}>Custom Keyboard Shortcut</h2>
        </div>
        <p style={sectionDesc}>Select text anywhere on any webpage and press this shortcut key to trigger WriteFix AI.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              readOnly
              value={isRecordingShortcut ? 'Press key combination (e.g. Ctrl+Shift+K)...' : (settings.customShortcut || 'Ctrl+Shift+G')}
              onKeyDown={handleShortcutKeyDown}
              style={{
                ...inputStyle,
                fontFamily: '"IBM Plex Mono", monospace',
                backgroundColor: isRecordingShortcut ? 'rgba(176, 141, 79, 0.12)' : themeColors.inputBg,
                borderColor: isRecordingShortcut ? '#B08D4F' : themeColors.inputBorder,
                color: isRecordingShortcut ? '#B08D4F' : themeColors.textPrimary,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
              onClick={() => setIsRecordingShortcut(true)}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsRecordingShortcut(!isRecordingShortcut)}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              backgroundColor: isRecordingShortcut ? '#BE5B3D' : '#B08D4F',
              color: isRecordingShortcut ? '#ffffff' : '#15171B',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {isRecordingShortcut ? 'Cancel Recording' : 'Record New Shortcut'}
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ customShortcut: 'Ctrl+Shift+G' })}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: themeColors.bgTertiary,
              color: themeColors.textPrimary,
              border: `1px solid ${themeColors.border}`,
              fontWeight: 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Reset to default Ctrl+Shift+G"
          >
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: themeColors.textSecondary }}>Want to customize native Chrome extension shortcuts?</span>
          <button
            type="button"
            onClick={() => {
              if (chrome.tabs?.create) {
                chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
              }
            }}
            style={{ background: 'none', border: 'none', color: '#B08D4F', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Manage Chrome Extension Shortcuts <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Appearance & Trigger Behavior */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Palette size={20} color="#B08D4F" />
          <h2 style={sectionTitle}>Appearance & Trigger Behavior</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div>
            <label style={labelStyle}>Theme Mode:</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as any })}
              style={inputStyle}
            >
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.showFloatingToolbar}
                onChange={(e) => updateSettings({ showFloatingToolbar: e.target.checked })}
              />
              Show Floating Toolbar on text selection
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={settings.autoCopy}
                onChange={(e) => updateSettings({ autoCopy: e.target.checked })}
              />
              Auto-copy corrected text to clipboard
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
