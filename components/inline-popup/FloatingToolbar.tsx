import React from 'react';
import { CheckCheck, MessageSquareQuote, Briefcase, GraduationCap, Minimize2, Copy, X } from 'lucide-react';
import { DOMRectJSON } from '../../lib/selection/detector';
import { CorrectionMode } from '../../lib/storage/types';

interface FloatingToolbarProps {
  rect: DOMRectJSON;
  onSelectMode: (mode: CorrectionMode) => void;
  onCopy: () => void;
  onDismiss: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  rect,
  onSelectMode,
  onCopy,
  onDismiss,
}) => {
  const top = Math.max(10, rect.top - 48);
  const left = Math.max(10, Math.min(window.innerWidth - 380, rect.left));

  return (
    <div
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 2147483646,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: 'rgba(3, 7, 18, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(99, 102, 241, 0.35)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        color: '#f9fafb',
        animation: 'wf-fade-in 0.15s ease-out',
        userSelect: 'none',
      }}
    >
      {/* Brand Icon */}
      <img
        src={chrome.runtime?.getURL ? chrome.runtime.getURL('icon-32.png') : '/icon-32.png'}
        alt="WriteFix"
        style={{ width: '18px', height: '18px', borderRadius: '4px', marginLeft: '4px' }}
        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
      />

      <span
        style={{
          fontWeight: 700,
          fontSize: '11.5px',
          color: '#818cf8',
          margin: '0 4px',
          letterSpacing: '-0.01em',
        }}
      >
        WriteFix
      </span>

      <button
        onClick={() => onSelectMode('grammar_only')}
        style={btnStyle}
        title="Fix Grammar & Spelling"
      >
        <CheckCheck size={13} color="#818cf8" />
        <span>Grammar</span>
      </button>

      <button
        onClick={() => onSelectMode('professional')}
        style={btnStyle}
        title="Executive Professional Tone"
      >
        <Briefcase size={13} color="#818cf8" />
        <span>Pro</span>
      </button>

      <button
        onClick={() => onSelectMode('concise')}
        style={btnStyle}
        title="Concise & Tight"
      >
        <Minimize2 size={13} color="#818cf8" />
        <span>Concise</span>
      </button>

      <button
        onClick={() => onSelectMode('humanize')}
        style={btnStyle}
        title="Humanize Writing"
      >
        <MessageSquareQuote size={13} color="#818cf8" />
        <span>Humanize</span>
      </button>

      <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />

      <button
        onClick={onCopy}
        style={btnStyle}
        title="Copy Selected Text"
      >
        <Copy size={13} />
      </button>

      <button
        onClick={onDismiss}
        style={{ ...btnStyle, padding: '4px 6px', opacity: 0.6 }}
        title="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#f9fafb',
  padding: '4px 8px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '11.5px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.15s ease',
};
