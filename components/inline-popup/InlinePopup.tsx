import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Check,
  Copy,
  Settings,
  Lock,
  BarChart2,
  RefreshCw,
  AlertCircle,
  X,
  CheckCheck,
  Briefcase,
  GraduationCap,
  Minimize2,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react';
import { DOMRectJSON } from '../../lib/selection/detector';
import { CorrectionMode, Mistake } from '../../lib/storage/types';
import { CORRECTION_MODES } from '../../lib/correction/modes';
import { globalOrchestrator } from '../../lib/correction/orchestrator';
import { SettingsStorage } from '../../lib/storage/settings';
import { getThemeColors, ThemeMode } from '../../lib/utils/theme';
import { DiffView } from './DiffView';
import { MistakeExplainer } from './MistakeExplainer';
import { computeTextStats } from '../../lib/utils/text-stats';
import { computeWritingScore } from '../../lib/utils/writing-score';
import { computeChangeMetrics } from '../../lib/utils/confidence';

const MODE_TABS: { id: CorrectionMode; label: string; icon: React.ReactNode }[] = [
  { id: 'grammar_only', label: 'Grammar', icon: <CheckCheck size={12} /> },
  { id: 'professional', label: 'Pro', icon: <Briefcase size={12} /> },
  { id: 'academic', label: 'Academic', icon: <GraduationCap size={12} /> },
  { id: 'concise', label: 'Concise', icon: <Minimize2 size={12} /> },
  { id: 'humanize', label: 'Humanize', icon: <MessageSquareQuote size={12} /> },
];

interface InlinePopupProps {
  originalText: string;
  initialMode?: CorrectionMode;
  rect: DOMRectJSON;
  onReplace: (newText: string) => void;
  onCopy: (text: string) => void;
  onClose: () => void;
}

export const InlinePopup: React.FC<InlinePopupProps> = ({
  originalText,
  initialMode = 'grammar_only',
  rect,
  onReplace,
  onCopy,
  onClose,
}) => {
  const [activeMode, setActiveMode] = useState<CorrectionMode>(initialMode);
  const [correctedText, setCorrectedText] = useState<string>('');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresKeyMsg, setRequiresKeyMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  useEffect(() => {
    SettingsStorage.get().then((s) => setThemeMode(s.theme));
  }, []);

  const themeColors = getThemeColors(themeMode);

  const POPUP_HEIGHT = 460;
  const POPUP_WIDTH = 420;

  let top = rect.bottom + 10;
  if (top + POPUP_HEIGHT > window.innerHeight - 20) {
    top = Math.max(20, rect.top - POPUP_HEIGHT - 10);
    if (top < 20) {
      top = Math.max(20, window.innerHeight - POPUP_HEIGHT - 20);
    }
  }

  const left = Math.max(20, Math.min(window.innerWidth - POPUP_WIDTH - 20, rect.left));

  useEffect(() => {
    fetchCorrection(activeMode);
  }, [activeMode, originalText]);

  const fetchCorrection = async (mode: CorrectionMode) => {
    setLoading(true);
    setError(null);
    setRequiresKeyMsg(null);
    try {
      const response = await globalOrchestrator.correct({
        text: originalText,
        mode,
      });

      if (response.metadata?.requiresKey) {
        setRequiresKeyMsg((response.metadata.message as string) || 'An AI API Key is required for this mode.');
        setCorrectedText(originalText);
      } else {
        setCorrectedText(response.corrected);
        setMistakes(response.mistakes || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process text correction.');
    } finally {
      setLoading(false);
    }
  };

  const openSettings = () => {
    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  const beforeStats = computeTextStats(originalText);
  const afterStats = computeTextStats(correctedText || originalText);

  const grammarErrors = mistakes.filter((m) => m.category === 'grammar').length;
  const spellingErrors = mistakes.filter((m) => m.category === 'spelling').length;
  const punctuationErrors = mistakes.filter((m) => m.category === 'punctuation').length;
  const capitalizationErrors = mistakes.filter((m) => m.category === 'capitalization').length;

  const scoreBefore = computeWritingScore({
    grammarErrors,
    spellingErrors,
    punctuationErrors,
    capitalizationErrors,
    fleschKincaidGrade: beforeStats.fleschKincaidGrade,
  });

  const scoreAfter = computeWritingScore({
    grammarErrors: 0,
    spellingErrors: 0,
    punctuationErrors: 0,
    capitalizationErrors: 0,
    fleschKincaidGrade: afterStats.fleschKincaidGrade,
  });

  const { changePercent } = computeChangeMetrics(originalText, correctedText || originalText);

  const handleCopyClick = () => {
    onCopy(correctedText || originalText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: '420px',
        maxWidth: '92vw',
        maxHeight: 'calc(100vh - 40px)',
        zIndex: 2147483647,
        backgroundColor: themeColors.cardBg,
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(99, 102, 241, 0.3)',
        border: `1px solid ${themeColors.border}`,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: themeColors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'wf-scale-up 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div
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
            style={{ width: '20px', height: '20px', borderRadius: '5px' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#f9fafb', letterSpacing: '-0.01em' }}>
            WriteFix AI
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(99, 102, 241, 0.16)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#818cf8',
              fontWeight: 600,
            }}
          >
            Score: {scoreBefore} → {scoreAfter}
          </span>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: themeColors.textSecondary,
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '6px 10px',
          overflowX: 'auto',
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.bgSecondary,
          flexShrink: 0,
          scrollbarWidth: 'none',
        }}
      >
        {MODE_TABS.map((mode) => {
          const isActive = mode.id === activeMode;

          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              style={{
                padding: '5px 9px',
                borderRadius: '6px',
                border: isActive ? '1px solid #818cf8' : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                color: isActive ? '#818cf8' : themeColors.textSecondary,
                fontWeight: isActive ? 600 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Scrollable Content Area */}
      <div
        onWheel={(e) => e.stopPropagation()}
        style={{
          padding: '14px',
          overflowY: 'auto',
          flex: 1,
          maxHeight: '340px',
          overscrollBehavior: 'contain',
        }}
      >
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: themeColors.textSecondary, fontSize: '13px' }}>
            <div
              style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid #818cf8',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'wf-spin 0.6s linear infinite',
                marginBottom: '8px',
              }}
            />
            <div>Polishing text with WriteFix AI...</div>
          </div>
        ) : requiresKeyMsg ? (
          <div
            style={{
              padding: '18px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <Lock size={22} color="#818cf8" />
            </div>
            <div style={{ fontWeight: 600, color: '#f9fafb', fontSize: '13.5px', marginBottom: '4px' }}>
              AI Mode Requires Free API Key
            </div>
            <div style={{ fontSize: '12px', color: themeColors.textSecondary, marginBottom: '14px', lineHeight: '1.5' }}>
              Add a free Groq or Gemini key in WriteFix options to unlock all rewrites.
            </div>
            <button
              onClick={openSettings}
              style={{
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Settings size={13} /> Open Extension Options
            </button>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              color: '#fb7185',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={15} /> {error}
          </div>
        ) : (
          <>
            {/* Diff View */}
            <DiffView originalText={originalText} correctedText={correctedText} themeMode={themeMode} />

            {/* Stats Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px',
                fontSize: '11px',
                color: themeColors.textMuted,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <BarChart2 size={12} color="#818cf8" /> {afterStats.wordCount} words · {afterStats.readingLevel}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={12} color="#34d399" /> {changePercent}% improved
              </span>
            </div>

            {/* Mistake Explainer Accordion */}
            <MistakeExplainer mistakes={mistakes} themeMode={themeMode} />
          </>
        )}
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderTop: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.bgSecondary,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onReplace(correctedText || originalText)}
          disabled={loading || requiresKeyMsg !== null || !correctedText}
          style={{
            flex: 1,
            marginRight: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '12.5px',
            cursor: loading || requiresKeyMsg ? 'not-allowed' : 'pointer',
            opacity: loading || requiresKeyMsg ? 0.5 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
          }}
        >
          <Sparkles size={14} /> Replace
        </button>

        <button
          onClick={handleCopyClick}
          disabled={loading}
          style={{
            backgroundColor: themeColors.bgTertiary,
            color: themeColors.textPrimary,
            border: `1px solid ${themeColors.border}`,
            padding: '8px 12px',
            borderRadius: '6px',
            fontWeight: 500,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {isCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};
