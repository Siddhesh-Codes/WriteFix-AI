import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  CheckCheck,
  Briefcase,
  GraduationCap,
  Minimize2,
  MessageSquareQuote,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Settings as SettingsIcon,
  Copy,
  Check,
  Trash2,
  Clock,
  Zap,
  Lock,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { HistoryStorage } from '@/lib/storage/history';
import { SettingsStorage } from '@/lib/storage/settings';
import { HistoryEntry, Settings, CorrectionMode, Mistake } from '@/lib/storage/types';
import { globalOrchestrator } from '@/lib/correction/orchestrator';
import { getThemeColors, applyGlobalTheme } from '@/lib/utils/theme';
import { computeWordDiff } from '@writefix/core';

const PRIMARY_MODES = [
  { id: 'grammar_only', label: 'Grammar', icon: <CheckCheck size={13} /> },
  { id: 'professional', label: 'Pro', icon: <Briefcase size={13} /> },
  { id: 'academic', label: 'Academic', icon: <GraduationCap size={13} /> },
  { id: 'concise', label: 'Concise', icon: <Minimize2 size={13} /> },
  { id: 'humanize', label: 'Humanize', icon: <MessageSquareQuote size={13} /> },
];

const TONE_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'natural', label: 'Natural' },
  { id: 'simple', label: 'Simple' },
  { id: 'polite', label: 'Polite' },
  { id: 'short', label: 'Shorter' },
  { id: 'indian_professional', label: 'Indian Pro' },
];

export default function App() {
  const [tab, setTab] = useState<'editor' | 'history' | 'status'>('editor');
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [activeMode, setActiveMode] = useState<CorrectionMode>('grammar_only');
  const [activeTone, setActiveTone] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [copied, setCopied] = useState(false);
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const toneMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (toneMenuRef.current && !toneMenuRef.current.contains(e.target as Node)) {
        setToneMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadData = async () => {
    const h = await HistoryStorage.getAll();
    const s = await SettingsStorage.get();
    setHistory(h);
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

  const handleExecuteFix = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await globalOrchestrator.correct({
        text: inputText,
        mode: activeMode,
        toneModifier: activeTone !== 'default' ? activeTone : undefined,
      });

      if (response.metadata?.requiresKey) {
        setError(response.metadata.message as string || 'An API key is required.');
      } else {
        setCorrectedText(response.corrected);
        setMistakes(response.mistakes || []);
        const updated = await HistoryStorage.getAll();
        setHistory(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Correction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeColors = getThemeColors(settings?.theme);
  const diffSegments = computeWordDiff(inputText, correctedText);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: themeColors.bgPrimary,
        color: themeColors.textPrimary,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.bgSecondary,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={chrome.runtime?.getURL ? chrome.runtime.getURL('icon-32.png') : '/icon-32.png'}
            alt="WriteFix"
            style={{ width: '22px', height: '22px', borderRadius: '6px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.02em', color: '#f9fafb' }}>
              WriteFix AI
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(99, 102, 241, 0.18)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                fontWeight: 600,
              }}
            >
              STUDIO
            </span>
          </div>
        </div>

        <button
          onClick={openOptions}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: themeColors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '6px',
            transition: 'color 0.15s ease',
          }}
          title="Open Extension Options"
        >
          <SettingsIcon size={16} />
        </button>
      </header>

      {/* Tabs */}
      <nav
        style={{
          display: 'flex',
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.bgSecondary,
          flexShrink: 0,
        }}
      >
        {[
          { id: 'editor', label: 'Studio Editor', icon: <Sparkles size={12} /> },
          { id: 'history', label: `History (${history.length})`, icon: <Clock size={12} /> },
          { id: 'status', label: 'Provider', icon: <Zap size={12} /> },
        ].map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              style={{
                flex: 1,
                padding: '8px 4px',
                border: 'none',
                background: 'none',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#818cf8' : themeColors.textMuted,
                borderBottom: isActive ? '2px solid #818cf8' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Body */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {tab === 'editor' && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {/* Mode selection row */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
              {PRIMARY_MODES.map((m) => {
                const isSelected = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMode(m.id as any)}
                    style={{
                      flex: '1 0 auto',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #818cf8' : `1px solid ${themeColors.border}`,
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.16)' : themeColors.bgTertiary,
                      color: isSelected ? '#818cf8' : themeColors.textSecondary,
                      fontSize: '11px',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tone selector dropdown */}
            <div ref={toneMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setToneMenuOpen((v) => !v)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${themeColors.border}`,
                  backgroundColor: themeColors.bgTertiary,
                  color: activeTone !== 'default' ? '#818cf8' : themeColors.textMuted,
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <SlidersHorizontal size={11} color="#818cf8" />
                  <span>Tone: {TONE_OPTIONS.find((t) => t.id === activeTone)?.label || 'Default'}</span>
                </div>
                <ChevronDown size={12} />
              </button>

              {toneMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: themeColors.bgTertiary,
                    border: `1px solid ${themeColors.borderStrong}`,
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                    zIndex: 50,
                    overflow: 'hidden',
                  }}
                >
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTone(t.id);
                        setToneMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        border: 'none',
                        backgroundColor: activeTone === t.id ? 'rgba(99, 102, 241, 0.16)' : 'transparent',
                        color: activeTone === t.id ? '#818cf8' : themeColors.textPrimary,
                        fontSize: '12px',
                        fontWeight: activeTone === t.id ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span>{t.label}</span>
                      {activeTone === t.id && <Check size={12} color="#818cf8" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Textarea */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste text to fix grammar and polish tone..."
                style={{
                  width: '100%',
                  height: '110px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${themeColors.inputBorder}`,
                  backgroundColor: themeColors.inputBg,
                  color: themeColors.textPrimary,
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              />
              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setCorrectedText('');
                    setMistakes([]);
                  }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    color: themeColors.textMuted,
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Clear text"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Primary Polish Button */}
            <button
              onClick={handleExecuteFix}
              disabled={loading || !inputText.trim()}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !inputText.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
                transition: 'transform 0.1s ease',
              }}
            >
              <Sparkles size={14} />
              <span>{loading ? 'Polishing Draft...' : 'Fix & Polish Text'}</span>
            </button>

            {/* Error view */}
            {error && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  color: '#fb7185',
                  fontSize: '11.5px',
                }}
              >
                {error}
              </div>
            )}

            {/* Result View */}
            {correctedText && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: themeColors.bgTertiary,
                  border: `1px solid ${themeColors.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>
                    ✓ Polished Output {mistakes.length > 0 && `(${mistakes.length} fixes)`}
                  </span>
                  <button
                    onClick={() => handleCopy(correctedText)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copied ? '#34d399' : themeColors.textSecondary,
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: themeColors.textPrimary,
                    maxHeight: '90px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {diffSegments.map((seg, idx) => {
                    if (seg.type === 'remove') {
                      return (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: 'rgba(244, 63, 94, 0.18)',
                            color: '#fb7185',
                            textDecoration: 'line-through',
                            padding: '0 2px',
                            borderRadius: '2px',
                          }}
                        >
                          {seg.value}
                        </span>
                      );
                    }
                    if (seg.type === 'add') {
                      return (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                            fontWeight: 600,
                            padding: '0 2px',
                            borderRadius: '2px',
                          }}
                        >
                          {seg.value}
                        </span>
                      );
                    }
                    return <span key={idx}>{seg.value}</span>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: themeColors.textMuted, padding: '40px 10px', fontSize: '12px' }}>
                No revisions yet. Polished texts will be stored here.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: themeColors.bgTertiary,
                    border: `1px solid ${themeColors.border}`,
                    fontSize: '11.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ color: '#fb7185', textDecoration: 'line-through' }}>{item.originalText}</div>
                  <div style={{ color: '#34d399', fontWeight: 500 }}>{item.correctedText}</div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: themeColors.textMuted,
                      fontSize: '10px',
                      marginTop: '4px',
                    }}
                  >
                    <span style={{ textTransform: 'uppercase' }}>{item.mode}</span>
                    <button
                      onClick={() => {
                        setInputText(item.originalText);
                        setCorrectedText(item.correctedText);
                        setTab('editor');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'status' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#818cf8', fontSize: '12.5px' }}>
                <Zap size={14} /> Active Provider Engine
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#f9fafb' }}>
                <strong>{settings?.activeProvider.toUpperCase() || 'LANGUAGETOOL'}</strong>
              </div>
              <div style={{ fontSize: '11px', color: themeColors.textMuted, marginTop: '2px' }}>
                {settings?.activeProvider === 'groq' && '⚡ Sub-150ms LPU inference (Llama 3.3 70B)'}
                {settings?.activeProvider === 'gemini' && '🤖 Google Gemini 2.5 Flash'}
                {settings?.activeProvider === 'languagetool' && '📖 Rule-based grammar engine (No API key needed)'}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: themeColors.textSecondary, lineHeight: '1.6' }}>
              <div style={{ fontWeight: 600, color: '#f9fafb', marginBottom: '4px' }}>Keyboard Shortcut</div>
              Press <code style={{ backgroundColor: themeColors.bgTertiary, padding: '2px 6px', borderRadius: '4px', color: '#818cf8', border: `1px solid ${themeColors.border}` }}>{settings?.customShortcut || 'Ctrl+Shift+G'}</code> on any highlighted text in your browser to open the instant inline floating popup.
            </div>

            <button
              onClick={openOptions}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: '6px',
                border: '1px solid #818cf8',
                backgroundColor: 'transparent',
                color: '#818cf8',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>Manage API Keys & Options</span>
              <ExternalLink size={13} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
