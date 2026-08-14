import React, { useState } from 'react';
import { WebSettings, WebProvider } from '../types';
import { WebStorage } from '../services/storage';
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sliders,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Zap,
  Check,
} from 'lucide-react';
import {
  GeminiProvider,
  GroqProvider,
  OpenAIProvider,
  AnthropicProvider,
  OpenRouterProvider,
} from '@writefix/core';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WebSettings;
  onSave: (newSettings: WebSettings) => void;
}

const PROVIDER_INFO: Record<string, { name: string; description: string; link: string; linkText: string; free: boolean }> = {
  languagetool: {
    name: 'LanguageTool Free API',
    description: 'Zero-configuration grammar and typo engine. No API key required.',
    link: 'https://languagetool.org',
    linkText: 'languagetool.org',
    free: true,
  },
  gemini: {
    name: 'Google Gemini',
    description: 'High-speed Gemini 2.5 Flash / Flash Lite with generous free tier.',
    link: 'https://aistudio.google.com/app/apikey',
    linkText: 'Get Gemini API Key (Free)',
    free: true,
  },
  groq: {
    name: 'Groq Cloud',
    description: 'Ultra-low latency LPU inference with Llama 3.3 70B & 8B.',
    link: 'https://console.groq.com/keys',
    linkText: 'Get Groq API Key (Free)',
    free: true,
  },
  openai: {
    name: 'OpenAI',
    description: 'Industry-standard GPT-4o, GPT-4o-mini, and o3 models.',
    link: 'https://platform.openai.com/api-keys',
    linkText: 'Get OpenAI API Key',
    free: false,
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Nuanced writing with Claude 3.5 Sonnet & Claude 3.5 Haiku.',
    link: 'https://console.anthropic.com/settings/keys',
    linkText: 'Get Anthropic API Key',
    free: false,
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Universal gateway to over 100+ open-source and proprietary models.',
    link: 'https://openrouter.ai/keys',
    linkText: 'Get OpenRouter API Key',
    free: false,
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [form, setForm] = useState<WebSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'general'>('providers');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [testMessage, setTestMessage] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleKeyChange = (provider: string, val: string) => {
    setForm({
      ...form,
      apiKeys: {
        ...form.apiKeys,
        [provider]: val,
      },
    });
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleTestConnection = async (provider: WebProvider) => {
    const key = form.apiKeys[provider];
    if (!key && provider !== 'languagetool') {
      setTestStatus({ ...testStatus, [provider]: 'error' });
      setTestMessage({ ...testMessage, [provider]: 'Please enter an API key first.' });
      return;
    }

    setTestStatus({ ...testStatus, [provider]: 'testing' });
    setTestMessage({ ...testMessage, [provider]: 'Pinging endpoint...' });

    const startTime = Date.now();

    try {
      let instance: any;
      if (provider === 'gemini') instance = new GeminiProvider(key, form.selectedModels.gemini);
      else if (provider === 'groq') instance = new GroqProvider(key, form.selectedModels.groq);
      else if (provider === 'openai') instance = new OpenAIProvider(key, form.selectedModels.openai);
      else if (provider === 'anthropic') instance = new AnthropicProvider(key, form.selectedModels.anthropic);
      else if (provider === 'openrouter') instance = new OpenRouterProvider(key, form.selectedModels.openrouter);

      if (instance) {
        const valid = await instance.validateConfig();
        const latency = Date.now() - startTime;
        if (valid) {
          setTestStatus({ ...testStatus, [provider]: 'success' });
          setTestMessage({ ...testMessage, [provider]: `Connected! (${latency}ms)` });
        } else {
          setTestStatus({ ...testStatus, [provider]: 'error' });
          setTestMessage({ ...testMessage, [provider]: 'API key validation returned false.' });
        }
      }
    } catch (e: any) {
      setTestStatus({ ...testStatus, [provider]: 'error' });
      setTestMessage({ ...testMessage, [provider]: e.message || 'Connection failed.' });
    }
  };

  const handleSave = () => {
    WebStorage.saveSettings(form);
    onSave(form);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 190,
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Modal Card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '720px',
          maxWidth: '92vw',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-strong)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'fadeIn 0.18s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Key size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                Studio Preferences & AI Providers
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Configure models, API keys, and writing assistance behaviors.
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <button
            onClick={() => setActiveTab('providers')}
            style={getSettingsTabStyle(activeTab === 'providers')}
          >
            AI Providers & Keys
          </button>
          <button
            onClick={() => setActiveTab('models')}
            style={getSettingsTabStyle(activeTab === 'models')}
          >
            Model Presets
          </button>
          <button
            onClick={() => setActiveTab('general')}
            style={getSettingsTabStyle(activeTab === 'general')}
          >
            Editor & Shortcuts
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'providers' && (
            <>
              {/* Primary Active Provider Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Primary Active Provider
                </label>
                <select
                  value={form.activeProvider}
                  onChange={(e) => setForm({ ...form, activeProvider: e.target.value as WebProvider })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="languagetool">LanguageTool (Free, Zero Setup, Grammar Only)</option>
                  <option value="gemini">Google Gemini (Recommended Free Tier, High Quality)</option>
                  <option value="groq">Groq Cloud (Fastest Inference, Llama 3.3 70B)</option>
                  <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet / Haiku)</option>
                  <option value="openrouter">OpenRouter (100+ Models Aggregated)</option>
                </select>
              </div>

              {/* Provider Key Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(['gemini', 'groq', 'openai', 'anthropic', 'openrouter'] as const).map((providerKey) => {
                  const info = PROVIDER_INFO[providerKey];
                  const keyVal = form.apiKeys[providerKey] || '';
                  const isShown = Boolean(showKeys[providerKey]);
                  const status = testStatus[providerKey] || 'idle';
                  const msg = testMessage[providerKey];
                  const isActive = form.activeProvider === providerKey;

                  return (
                    <div
                      key={providerKey}
                      className="premium-card"
                      style={{
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                        border: `1px solid ${isActive ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {info.name}
                          </span>
                          {info.free && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--success-bg)',
                                color: 'var(--success)',
                              }}
                            >
                              Free Tier
                            </span>
                          )}
                          {isActive && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--primary-subtle)',
                                color: 'var(--primary)',
                              }}
                            >
                              Active
                            </span>
                          )}
                        </div>

                        <a
                          href={info.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: 'var(--primary)',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <span>{info.linkText}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {info.description}
                      </p>

                      {/* Input & Test Button Row */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0 10px',
                          }}
                        >
                          <input
                            type={isShown ? 'text' : 'password'}
                            placeholder={`Enter ${info.name} API Key...`}
                            value={keyVal}
                            onChange={(e) => handleKeyChange(providerKey, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 0',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              fontFamily: 'var(--font-mono)',
                              outline: 'none',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(providerKey)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            {isShown ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTestConnection(providerKey)}
                          disabled={status === 'testing' || !keyVal}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: status === 'testing' || !keyVal ? 'not-allowed' : 'pointer',
                            opacity: !keyVal ? 0.5 : 1,
                          }}
                        >
                          {status === 'testing' && <div className="animate-spin" style={{ width: '11px', height: '11px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />}
                          {status === 'success' && <CheckCircle2 size={13} color="var(--success)" />}
                          {status === 'error' && <AlertCircle size={13} color="var(--danger)" />}
                          <span>Test</span>
                        </button>
                      </div>

                      {msg && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: status === 'success' ? 'var(--success)' : 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{msg}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'models' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Gemini Model
                </label>
                <select
                  value={form.selectedModels.gemini}
                  onChange={(e) => setForm({ ...form, selectedModels: { ...form.selectedModels, gemini: e.target.value } })}
                  style={getSelectStyle()}
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Accurate)</option>
                  <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Ultra Fast)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (High Depth Reasoning)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Groq Model
                </label>
                <select
                  value={form.selectedModels.groq}
                  onChange={(e) => setForm({ ...form, selectedModels: { ...form.selectedModels, groq: e.target.value } })}
                  style={getSelectStyle()}
                >
                  <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Sub-100ms)</option>
                  <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  OpenAI Model
                </label>
                <select
                  value={form.selectedModels.openai}
                  onChange={(e) => setForm({ ...form, selectedModels: { ...form.selectedModels, openai: e.target.value } })}
                  style={getSelectStyle()}
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Economical & Fast)</option>
                  <option value="gpt-4o">gpt-4o (State of the Art)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Anthropic Model
                </label>
                <select
                  value={form.selectedModels.anthropic}
                  onChange={(e) => setForm({ ...form, selectedModels: { ...form.selectedModels, anthropic: e.target.value } })}
                  style={getSelectStyle()}
                >
                  <option value="claude-3-5-haiku-20241022">claude-3-5-haiku (Lightning fast)</option>
                  <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet (Highest writing nuance)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Auto-check typing delay
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Milliseconds of pause before initiating background analysis
                  </div>
                </div>
                <input
                  type="number"
                  min="300"
                  max="3000"
                  step="100"
                  value={form.debounceMs}
                  onChange={(e) => setForm({ ...form, debounceMs: parseInt(e.target.value) || 600 })}
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div
                className="premium-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Studio Keyboard Shortcuts
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Execute Fix & Polish</span>
                  <code style={getCodeStyle()}>⌘ + Enter / Ctrl + Enter</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Chrome Extension Quick Fix</span>
                  <code style={getCodeStyle()}>Ctrl + Shift + G</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
};

function getSettingsTabStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: isActive ? 700 : 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };
}

function getSelectStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  };
}

function getCodeStyle(): React.CSSProperties {
  return {
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-subtle)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-primary)',
  };
}
