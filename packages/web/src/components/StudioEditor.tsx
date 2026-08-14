import React, { useState, useEffect, useRef } from 'react';
import { CORRECTION_MODES, CorrectionMode, Mistake } from '@writefix/core';
import { WebSettings } from '../types';
import { globalWebOrchestrator } from '../services/web-orchestrator';
import { DiffViewer } from './DiffViewer';
import { MistakeInspector } from './MistakeInspector';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ToneCustomizer } from './ToneCustomizer';
import {
  Feather,
  Play,
  Upload,
  Clipboard,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  Sliders,
  Sparkles,
  ArrowRight,
  Briefcase,
  Smile,
  Minimize2,
  BookOpen,
  Check,
  Zap,
} from 'lucide-react';

const SAMPLE_PRESETS = [
  {
    category: 'Grammar & Clarity',
    name: 'Logic & Problem Solving Thoughts',
    text: `days again quite what im doing im really fed up with this approach i really want to learn the actual problem solving beyond the syntax world i mean ofc the syntax is necessary in order to write the code but before the logic is very imp i feel

like when i sees the problem my mind literally goes in the blank mode and stops the thinking or panic like what to do now what will happen if i'd not be able to solve the problem then that failure guilt and anxiety hits instead of thinking about the problem`,
  },
  {
    category: 'Professional',
    name: 'Engineering Job Application',
    text: `Dear Hiring Manager,

i am writting to express my deep intrest in the Software Engineer position at your companey. With over 3 years of experiance in react, nodejs, and cloud infrastructer, i have definately delivered high impact features that scale to millions of users. I beleive my problem solving skills would make me a great fit for your team.

Looking forward to hearing from you soon!`,
  },
  {
    category: 'Workplace Email',
    name: 'Production Incident Update',
    text: `hey boss, sorry for late update. we had some wierd bug in production today which occured around noon. the database was locked up and noone could login for like 20 mins. its fixed now and we will make sure it dont happen again tommorrow.`,
  },
  {
    category: 'AI Detection / Humanize',
    name: 'Robotic Corporate Jargon',
    text: `In today's fast-paced digital ecosystem, it is undeniably crucial to utilize cutting-edge methodologies to optimize synergistic workflows. Furthermore, leveraging multifaceted paradigms enables stakeholders to maximize multifaceted efficiency across diverse verticals.`,
  },
  {
    category: 'Academic',
    name: 'Research Paper Introduction',
    text: `The paper discusses about how machine learning algorythms can help in predicting student performance. Many researchers has shown that early warning systems is very helpful for prevent dropout rates in universities.`,
  },
];

const MODE_ICONS: Record<string, React.ReactNode> = {
  grammar_only: <CheckCircle2 size={14} />,
  grammar_punctuation: <Feather size={14} />,
  formal: <Briefcase size={14} />,
  casual: <Smile size={14} />,
  concise: <Minimize2 size={14} />,
  humanize: <Sparkles size={14} />,
  academic: <BookOpen size={14} />,
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
  const [inputText, setInputText] = useState<string>(SAMPLE_PRESETS[0].text);
  const [activeMode, setActiveMode] = useState<CorrectionMode>('grammar_only');
  const [correctedText, setCorrectedText] = useState<string>('');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [requiresKeyModal, setRequiresKeyModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'mistakes' | 'analytics' | 'tone'>('diff');
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
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
      setActiveMode(restoredText.mode);
      showToast('Restored entry from history');
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
  }, [inputText, activeMode, settings]);

  const handleExecuteFix = async () => {
    if (!inputText.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Analyzing draft structure & context...');

    try {
      const response = await globalWebOrchestrator.correct(
        {
          text: inputText,
          mode: activeMode,
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
        setStatusMessage('Polished successfully!');
        onHistoryUpdated();
        showToast('Text enhanced and saved to history');
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
      alert('Clipboard access denied by browser.');
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px 28px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
          }}
        >
          <Check size={15} color="var(--success)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Preset Library & Quick Launch Bar */}
      <div
        className="premium-card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Preset tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Sample Presets:
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SAMPLE_PRESETS.map((preset, idx) => {
              const isSelected = activePresetIndex === idx && inputText === preset.text;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActivePresetIndex(idx);
                    setInputText(preset.text);
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-surface-elevated)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear output indicator */}
        {correctedText && (
          <button
            onClick={() => {
              setCorrectedText('');
              setMistakes([]);
            }}
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Reset Output
          </button>
        )}
      </div>

      {/* AI Correction Mode Segmented Bar */}
      <div
        className="premium-card"
        style={{
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          backgroundColor: 'var(--bg-surface-elevated)',
        }}
      >
        {Object.values(CORRECTION_MODES).map((mode) => {
          const isActive = mode.id === activeMode;
          const icon = MODE_ICONS[mode.id] || <Feather size={14} />;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              title={mode.description}
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                {icon}
              </span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dual Pane Studio Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
          gap: '20px',
          minHeight: '620px',
        }}
      >
        {/* Left Pane: Input Textarea */}
        <div
          className="premium-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={15} color="var(--primary)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 9px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Upload size={12} />
                Upload
              </button>

              <button
                onClick={handlePaste}
                title="Paste from clipboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 9px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Clipboard size={12} />
                Paste
              </button>

              <button
                onClick={() => setInputText('')}
                title="Clear input text"
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--danger)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your content here to inspect, polish, and fix grammar..."
            style={{
              flex: 1,
              padding: '20px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              lineHeight: '1.75',
              resize: 'none',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />

          {/* Footer Toolbar: Stats & CTA */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>{wordCount} words</span>
              <span>·</span>
              <span>{charCount} chars</span>
              <span>·</span>
              <span>~{estimatedReadTimeSecs}s read</span>
            </div>

            <button
              onClick={handleExecuteFix}
              disabled={loading || !inputText.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
                opacity: loading || !inputText.trim() ? 0.6 : 1,
                cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && inputText.trim()) e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
              }}
              onMouseLeave={(e) => {
                if (!loading && inputText.trim()) e.currentTarget.style.backgroundColor = 'var(--primary)';
              }}
            >
              {loading ? (
                <>
                  <div
                    className="animate-spin"
                    style={{
                      width: '13px',
                      height: '13px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Processing Draft...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="#ffffff" />
                  <span>Fix & Polish</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 5px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      marginLeft: '2px',
                    }}
                  >
                    ⌘↵
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Pane: Multi-View Output Studio */}
        <div
          className="premium-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Studio Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
          >
            <button
              onClick={() => setActiveTab('diff')}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'diff' ? 700 : 500,
                color: activeTab === 'diff' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'diff' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Feather size={14} />
              <span>AI Output & Diff</span>
            </button>

            <button
              onClick={() => setActiveTab('mistakes')}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'mistakes' ? 700 : 500,
                color: activeTab === 'mistakes' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'mistakes' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={14} />
              <span>Mistakes</span>
              {mistakes.length > 0 && (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {mistakes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'analytics' ? 700 : 500,
                color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'analytics' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <BarChart3 size={14} />
              <span>Diagnostics</span>
            </button>

            <button
              onClick={() => setActiveTab('tone')}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'tone' ? 700 : 500,
                color: activeTab === 'tone' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'tone' ? '2px solid var(--primary)' : '2px solid transparent',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Sliders size={14} />
              <span>Tone Tuner</span>
            </button>
          </div>

          {/* Status Message or Error Alert */}
          {error && (
            <div
              style={{
                margin: '14px 16px 0',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              {requiresKeyModal && (
                <button
                  onClick={onOpenSettings}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Configure API Key
                </button>
              )}
            </div>
          )}

          {/* Tab Content Body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'diff' && (
              <DiffViewer
                originalText={inputText}
                correctedText={correctedText}
                onApplyToInput={() => {
                  if (correctedText) {
                    setInputText(correctedText);
                    showToast('Applied corrected text to input draft');
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
              <div style={{ padding: '20px' }}>
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
