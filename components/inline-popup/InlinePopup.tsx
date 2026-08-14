import * as React from 'react';
import { useState, useEffect } from 'react';
import { Check, Copy, Settings, Lock, BarChart2, RefreshCw, AlertCircle, X } from 'lucide-react';
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

  // Position calculation to guarantee popup stays 100% inside viewport bounds
  const POPUP_HEIGHT = 480;
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
        setRequiresKeyMsg(response.metadata.message as string || 'An AI API Key is required for this mode.');
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
        boxShadow: themeColors.isDark ? '0 12px 36px rgba(0, 0, 0, 0.6)' : '0 12px 36px rgba(0, 0, 0, 0.22)',
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
          padding: '12px 16px',
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.bgSecondary,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={chrome.runtime?.getURL ? chrome.runtime.getURL('logo.png') : ''}
            alt="WriteFix AI"
            style={{ width: '22px', height: '22px', borderRadius: '6px' }}
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#6366f1' }}>WriteFix AI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: themeColors.isDark ? '#312e81' : '#e0e7ff', color: themeColors.isDark ? '#c7d2fe' : '#3730a3', fontWeight: 600 }}>
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
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          overflowX: 'auto',
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.bgTertiary,
          flexShrink: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {Object.values(CORRECTION_MODES).map((mode) => {
          const isActive = mode.id === activeMode;

          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#6366f1' : 'transparent',
                color: isActive ? '#ffffff' : themeColors.textSecondary,
                fontWeight: isActive ? 600 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {mode.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Main Scrollable Content Area */}
      <div
        onWheel={(e) => e.stopPropagation()}
        style={{
          padding: '16px',
          overflowY: 'auto',
          flex: 1,
          maxHeight: '360px',
          overscrollBehavior: 'contain',
        }}
      >
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: themeColors.textSecondary, fontSize: '13px' }}>
            <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'wf-spin 0.6s linear infinite', marginBottom: '8px' }} />
            <div>Analyzing writing with WriteFix AI...</div>
          </div>
        ) : requiresKeyMsg ? (
          <div style={{ padding: '20px', backgroundColor: themeColors.isDark ? '#422006' : '#fefce8', border: `1px solid ${themeColors.isDark ? '#713f12' : '#fef08a'}`, borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <Lock size={24} color={themeColors.isDark ? '#fde047' : '#854d0e'} />
            </div>
            <div style={{ fontWeight: 600, color: themeColors.isDark ? '#fef08a' : '#854d0e', fontSize: '14px', marginBottom: '6px' }}>
              AI Mode Requires API Key
            </div>
            <div style={{ fontSize: '12px', color: themeColors.isDark ? '#fde047' : '#a16207', marginBottom: '14px', lineHeight: '1.5' }}>
              The <strong>"{CORRECTION_MODES[activeMode]?.label}"</strong> mode uses AI rewrites. Add a free Groq (Llama 3.3 70B) or Gemini API key in WriteFix AI options to unlock all AI modes.
            </div>
            <button
              onClick={openSettings}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Settings size={14} /> Open Extension Options
            </button>
          </div>
        ) : error ? (
          <div style={{ padding: '16px', backgroundColor: themeColors.isDark ? '#450a0a' : '#fef2f2', color: themeColors.isDark ? '#fca5a5' : '#991b1b', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        ) : (
          <>
            {/* Diff View */}
            <DiffView originalText={originalText} correctedText={correctedText} themeMode={themeMode} />

            {/* Stats Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: themeColors.textSecondary }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <BarChart2 size={12} /> {afterStats.wordCount} words · {afterStats.readingLevel}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={12} /> {changePercent}% change
              </span>
            </div>

            {/* Mistake Explainer Accordion */}
            <MistakeExplainer mistakes={mistakes} themeMode={themeMode} />
          </>
        )}
      </div>

      {/* Action Footer (Always Visible at Bottom) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
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
            backgroundColor: '#6366f1',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: (loading || requiresKeyMsg) ? 'not-allowed' : 'pointer',
            opacity: (loading || requiresKeyMsg) ? 0.5 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Check size={15} /> Replace
        </button>

        <button
          onClick={handleCopyClick}
          disabled={loading}
          style={{
            backgroundColor: themeColors.bgTertiary,
            color: themeColors.textPrimary,
            border: `1px solid ${themeColors.border}`,
            padding: '8px 12px',
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isCopied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};
