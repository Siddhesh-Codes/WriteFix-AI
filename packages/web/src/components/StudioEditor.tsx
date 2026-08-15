import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CANONICAL_PRIMARY_MODES,
  CANONICAL_TONE_MODIFIERS,
  CorrectionMode,
  Mistake,
} from '@writefix/core';
import { WebSettings } from '../types';
import { globalWebOrchestrator } from '../services/web-orchestrator';
import { DiffViewer } from './DiffViewer';
import { MistakeInspector } from './MistakeInspector';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ToneCustomizer } from './ToneCustomizer';
import {
  Play,
  Upload,
  Clipboard,
  Trash2,
  CheckCheck,
  Briefcase,
  GraduationCap,
  Minimize2,
  MessageSquareQuote,
  MessageCircle,
  BookOpen,
  Smile,
  Scissors,
  Globe,
  FileText,
  BarChart3,
  Sliders,
  Check,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

const PRIMARY_ICONS: Record<string, React.ReactNode> = {
  grammar: <CheckCheck size={14} strokeWidth={2.2} />,
  professional: <Briefcase size={14} strokeWidth={2} />,
  academic: <GraduationCap size={14} strokeWidth={2} />,
  concise: <Minimize2 size={14} strokeWidth={2} />,
  humanize: <MessageSquareQuote size={14} strokeWidth={2} />,
};

const TONE_ICONS: Record<string, React.ReactNode> = {
  natural: <MessageCircle size={13} strokeWidth={2} />,
  simple: <BookOpen size={13} strokeWidth={2} />,
  polite: <Smile size={13} strokeWidth={2} />,
  short: <Scissors size={13} strokeWidth={2} />,
  indian_professional: <Globe size={13} strokeWidth={2} />,
};

interface StudioEditorProps {
  settings: WebSettings;
  onOpenSettings: () => void;
  onSettingsChange: (newSettings: WebSettings) => void;
  onHistoryUpdated: () => void;
  restoredText?: { original: string; corrected: string; mode: CorrectionMode } | null;
}

export const StudioEditor: React.FC<StudioEditorProps> = ({
  settings,
  onOpenSettings,
  onSettingsChange,
  onHistoryUpdated,
  restoredText,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [toneDropdownOpen, setToneDropdownOpen] = useState<boolean>(false);
  const [modeDropdownOpen, setModeDropdownOpen] = useState<boolean>(false);
  const toneDropdownRef = useRef<HTMLDivElement | null>(null);
  const modeDropdownRef = useRef<HTMLDivElement | null>(null);

  // Track viewport width for responsive tone selector
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!toneDropdownOpen && !modeDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (toneDropdownOpen && toneDropdownRef.current && !toneDropdownRef.current.contains(e.target as Node)) {
        setToneDropdownOpen(false);
      }
      if (modeDropdownOpen && modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [toneDropdownOpen, modeDropdownOpen]);
  const [activeMode, setActiveMode] = useState<CorrectionMode>('grammar');
  const [activeTone, setActiveTone] = useState<CorrectionMode | null>(null);
  const [correctedText, setCorrectedText] = useState<string>('');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [requiresKeyModal, setRequiresKeyModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'mistakes' | 'analytics' | 'tone'>('diff');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    if (restoredText) {
      setInputText(restoredText.original);
      setCorrectedText(restoredText.corrected);
      // Check if restored mode is primary or tone
      const isPrimary = CANONICAL_PRIMARY_MODES.some((m) => m.id === restoredText.mode);
      if (isPrimary) {
        setActiveMode(restoredText.mode);
        setActiveTone(null);
      } else {
        setActiveTone(restoredText.mode);
      }
      showToast('Restored draft from history');
    }
  }, [restoredText]);

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter to trigger fix
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecuteFix();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, activeMode, activeTone, settings]);

  const handleExecuteFix = async () => {
    if (!inputText.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Analyzing draft syntax, tone & context...');

    try {
      const response = await globalWebOrchestrator.correct(
        {
          text: inputText,
          mode: activeMode,
          toneModifier: activeTone || undefined,
        },
        settings,
        (status) => setStatusMessage(status)
      );

      if (response.metadata?.requiresKey) {
        setRequiresKeyModal(true);
        setError(response.metadata.message as string);
        setCorrectedText(inputText);
      } else {
        setCorrectedText(response.corrected);
        setMistakes(response.mistakes || []);
        setStatusMessage('Polished successfully');
        onHistoryUpdated();
        showToast('Text polished and saved to history');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setInputText(text);
          showToast(`Loaded ${file.name}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        showToast('Pasted from clipboard');
      }
    } catch (e) {
      alert('Clipboard access was denied by browser settings.');
    }
  };

  const handleAcceptMistake = (mistake: Mistake) => {
    if (mistake.original && mistake.replacement) {
      setInputText((prev) => prev.replace(mistake.original, mistake.replacement));
      setMistakes((prev) => prev.filter((m) => m !== mistake));
      showToast(`Applied fix: "${mistake.replacement}"`);
    }
  };

  const handleDismissMistake = (idx: number) => {
    setMistakes((prev) => prev.filter((_, i) => i !== idx));
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = inputText.length;
  const estimatedReadTimeSecs = Math.max(1, Math.round((wordCount / 200) * 60));

  return (
    <div className="studio-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--color-signet-dim)',
            color: 'var(--text-primary)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
          }}
        >
          <Check size={16} color="var(--color-confirmed)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mode Selection Hierarchy: Primary Modes + Subordinate Tone Modifiers */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Row 1: Primary Rewrite Modes — Dropdown on mobile, pills on desktop */}
        {isMobile ? (
          /* Mobile: Custom styled dropdown for primary modes */
          <div
            ref={modeDropdownRef}
            style={{
              position: 'relative',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <button
              onClick={() => setModeDropdownOpen((v) => !v)}
              className="premium-card"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '10px 14px',
                minHeight: '44px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-signet)' }}>{PRIMARY_ICONS[activeMode]}</span>
                <span>{CANONICAL_PRIMARY_MODES.find((m) => m.id === activeMode)?.label || 'Grammar'}</span>
              </div>
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: modeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: 'var(--text-muted)',
                }}
              />
            </button>

            {modeDropdownOpen && (
              <div
                className="animate-fade-in"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {CANONICAL_PRIMARY_MODES.map((mode) => {
                  const isSelected = activeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => { setActiveMode(mode.id); setModeDropdownOpen(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        border: 'none',
                        backgroundColor: isSelected ? 'var(--primary-subtle)' : 'transparent',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <span style={{ color: isSelected ? 'var(--color-signet)' : 'var(--text-muted)', width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {PRIMARY_ICONS[mode.id]}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: isSelected ? 600 : 500 }}>{mode.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{mode.description}</div>
                      </div>
                      {isSelected && <span style={{ color: 'var(--color-signet)', fontSize: '13px' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Horizontal pill bar */
          <div
            className="premium-card touch-scroll-x"
            style={{
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {CANONICAL_PRIMARY_MODES.map((mode) => {
              const isSelected = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  title={mode.description}
                  style={{
                    flex: '1 0 auto',
                    minWidth: '110px',
                    minHeight: '38px',
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--color-signet-dim)' : '1px solid transparent',
                    backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    fontSize: '12.5px',
                    fontWeight: isSelected ? 600 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ color: isSelected ? 'var(--color-signet)' : 'var(--text-muted)' }}>
                    {PRIMARY_ICONS[mode.id]}
                  </span>
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Row 2: Secondary Tone Refinements — Dropdown on mobile, pills on desktop */}
        {isMobile ? (
          /* Mobile: Custom styled dropdown */
          <div
            ref={toneDropdownRef}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '2px 4px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              <SlidersHorizontal size={11} color="var(--color-signet)" />
              <span>Tone:</span>
            </div>

            {/* Dropdown trigger button */}
            <button
              onClick={() => setToneDropdownOpen((v) => !v)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 12px',
                minHeight: '40px',
                borderRadius: 'var(--radius-md)',
                border: activeTone ? '1px solid var(--color-signet-dim)' : '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: activeTone ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeTone && TONE_ICONS[activeTone] && (
                  <span style={{ color: 'var(--color-signet)' }}>{TONE_ICONS[activeTone]}</span>
                )}
                <span>
                  {activeTone
                    ? CANONICAL_TONE_MODIFIERS.find((t) => t.id === activeTone)?.label || 'Default'
                    : 'Default (None)'}
                </span>
              </div>
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: toneDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: 'var(--text-muted)',
                }}
              />
            </button>

            {/* Dropdown panel */}
            {toneDropdownOpen && (
              <div
                className="animate-fade-in"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {/* Default / None option */}
                <button
                  onClick={() => { setActiveTone(null); setToneDropdownOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    border: 'none',
                    backgroundColor: !activeTone ? 'var(--primary-subtle)' : 'transparent',
                    color: !activeTone ? 'var(--color-signet)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: !activeTone ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color 0.1s ease',
                  }}
                >
                  <span style={{ width: '16px', textAlign: 'center' }}>{!activeTone ? '✓' : ''}</span>
                  <span>Default (None)</span>
                </button>

                {CANONICAL_TONE_MODIFIERS.map((tone) => {
                  const isToneActive = activeTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      onClick={() => { setActiveTone(tone.id); setToneDropdownOpen(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        border: 'none',
                        backgroundColor: isToneActive ? 'var(--primary-subtle)' : 'transparent',
                        color: isToneActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: isToneActive ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <span style={{ color: isToneActive ? 'var(--color-signet)' : 'var(--text-muted)', width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {TONE_ICONS[tone.id]}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: isToneActive ? 600 : 500 }}>{tone.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{tone.description}</div>
                      </div>
                      {isToneActive && <span style={{ color: 'var(--color-signet)', fontSize: '13px' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Horizontal pill bar */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '2px 4px',
              overflowX: 'auto',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
            className="touch-scroll-x"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                paddingRight: '6px',
                flexShrink: 0,
              }}
            >
              <SlidersHorizontal size={11} color="var(--color-signet)" />
              <span>Tone Modifier:</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flex: 1,
                minWidth: 0,
              }}
            >
              <button
                onClick={() => setActiveTone(null)}
                style={{
                  padding: '6px 12px',
                  minHeight: '34px',
                  borderRadius: 'var(--radius-sm)',
                  border: !activeTone ? '1px solid var(--color-signet-dim)' : '1px solid var(--border-subtle)',
                  backgroundColor: !activeTone ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                  color: !activeTone ? 'var(--color-signet)' : 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontWeight: !activeTone ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Default (Mode Native)
              </button>

              {CANONICAL_TONE_MODIFIERS.map((tone) => {
                const isToneActive = activeTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    onClick={() => setActiveTone(tone.id)}
                    title={tone.description}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      minHeight: '34px',
                      borderRadius: 'var(--radius-sm)',
                      border: isToneActive
                        ? '1px solid var(--color-signet)'
                        : '1px solid var(--border-subtle)',
                      backgroundColor: isToneActive ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                      color: isToneActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: isToneActive ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isToneActive) {
                        e.currentTarget.style.borderColor = 'var(--border-strong)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isToneActive) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <span style={{ color: isToneActive ? 'var(--color-signet)' : 'var(--text-muted)' }}>
                      {TONE_ICONS[tone.id]}
                    </span>
                    <span>{tone.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dual Pane Studio Grid */}
      <div className="studio-grid" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Left Pane: Input Textarea */}
        <div className="premium-card studio-pane" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          {/* Header */}
          <div
            style={{
              minHeight: '44px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
              flexWrap: 'wrap',
              gap: '6px',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={15} color="var(--color-signet)" />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                }}
              >
                Original Draft
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md"
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload .txt or .md file"
                aria-label="Upload document"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  minHeight: '34px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-signet-dim)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Upload size={12} />
                <span>Upload</span>
              </button>

              <button
                onClick={handlePaste}
                title="Paste from clipboard"
                aria-label="Paste text"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  minHeight: '34px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-signet-dim)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Clipboard size={12} />
                <span>Paste</span>
              </button>

              <button
                onClick={() => setInputText('')}
                title="Clear input text"
                aria-label="Clear text"
                style={{
                  padding: '6px 10px',
                  minHeight: '34px',
                  minWidth: '34px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--color-correction)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--danger-border)';
                  e.currentTarget.style.backgroundColor = 'var(--danger-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            className="studio-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your text here to inspect, polish, and fix grammar..."
            style={{
              flex: 1,
              minHeight: 0,
              padding: '14px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              lineHeight: '1.7',
              resize: 'none',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              overflowY: 'auto',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          />

          {/* Footer Toolbar: Stats & Primary Polish CTA */}
          <div
            style={{
              minHeight: '52px',
              flexShrink: 0,
              padding: '8px 12px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
              }}
            >
              <span>{wordCount} words</span>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span>{charCount} chars</span>
              <span className="hide-on-mobile" style={{ color: 'var(--border-strong)' }}>·</span>
              <span className="hide-on-mobile">~{estimatedReadTimeSecs}s read</span>
            </div>

            <button
              onClick={handleExecuteFix}
              disabled={loading || !inputText.trim()}
              className="btn-touch-44"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--color-signet)',
                color: '#15171B',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
                opacity: loading || !inputText.trim() ? 0.6 : 1,
                cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && inputText.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--color-signet-dim)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && inputText.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--color-signet)';
                }
              }}
            >
              {loading ? (
                <>
                  <div
                    className="animate-spin"
                    style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(21,23,27,0.4)',
                      borderTopColor: '#15171B',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="#15171B" />
                  <span>Fix & Polish</span>
                  <span
                    className="hide-on-mobile"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      padding: '2px 5px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(21, 23, 27, 0.15)',
                      marginLeft: '2px',
                      fontWeight: 600,
                    }}
                  >
                    Ctrl+↵
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Pane: Multi-View Output Studio */}
        <div className="premium-card studio-pane" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          {/* Studio Navigation Tabs */}
          <div
            className="touch-scroll-x"
            style={{
              height: '44px',
              minHeight: '44px',
              flexShrink: 0,
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <button
              onClick={() => setActiveTab('diff')}
              style={{
                flex: '1 0 auto',
                minWidth: '100px',
                padding: '0 14px',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'diff' ? 600 : 500,
                color: activeTab === 'diff' ? 'var(--color-signet)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'diff' ? '2px solid var(--color-signet)' : '2px solid transparent',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                minHeight: '44px',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={13} />
              <span>Editorial Output</span>
            </button>

            <button
              onClick={() => setActiveTab('mistakes')}
              style={{
                flex: '1 0 auto',
                minWidth: '100px',
                padding: '0 14px',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'mistakes' ? 600 : 500,
                color: activeTab === 'mistakes' ? 'var(--color-signet)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'mistakes' ? '2px solid var(--color-signet)' : '2px solid transparent',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                minHeight: '44px',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCheck size={13} />
              <span>Flags & Errors</span>
              {mistakes.length > 0 && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--danger-bg)',
                    border: '1px solid var(--danger-border)',
                    color: 'var(--color-correction)',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {mistakes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                flex: '1 0 auto',
                minWidth: '100px',
                padding: '0 14px',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'analytics' ? 600 : 500,
                color: activeTab === 'analytics' ? 'var(--color-signet)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'analytics' ? '2px solid var(--color-signet)' : '2px solid transparent',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                minHeight: '44px',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart3 size={13} />
              <span>Diagnostics</span>
            </button>

            <button
              onClick={() => setActiveTab('tone')}
              style={{
                flex: '1 0 auto',
                minWidth: '100px',
                padding: '0 14px',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'tone' ? 600 : 500,
                color: activeTab === 'tone' ? 'var(--color-signet)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'tone' ? '2px solid var(--color-signet)' : '2px solid transparent',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                minHeight: '44px',
                transition: 'all 0.15s ease',
              }}
            >
              <Sliders size={13} />
              <span>Persona Calibrator</span>
            </button>
          </div>

          {/* Status Message or Error Alert */}
          {error && (
            <div
              style={{
                margin: '10px 14px 0',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--color-correction)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
              {requiresKeyModal && (
                <button
                  onClick={onOpenSettings}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--color-signet)',
                    color: '#15171B',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: '34px',
                  }}
                >
                  Configure Key
                </button>
              )}
            </div>
          )}

          {/* Tab Content Body */}
          <div className="studio-tab-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'diff' && (
              <DiffViewer
                originalText={inputText}
                correctedText={correctedText}
                onApplyToInput={() => {
                  if (correctedText) {
                    setInputText(correctedText);
                    showToast('Applied corrected output to input draft');
                  }
                }}
              />
            )}

            {activeTab === 'mistakes' && (
              <MistakeInspector
                mistakes={mistakes}
                onAcceptMistake={handleAcceptMistake}
                onDismissMistake={handleDismissMistake}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                originalText={inputText}
                correctedText={correctedText}
                mistakesCount={mistakes.length}
              />
            )}

            {activeTab === 'tone' && (
              <div style={{ padding: '16px' }}>
                <ToneCustomizer
                  preferences={settings.tonePreferences}
                  onChange={(newPref) => {
                    const updated = { ...settings, tonePreferences: newPref };
                    onSettingsChange(updated);
                    showToast('Tone preferences updated');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
