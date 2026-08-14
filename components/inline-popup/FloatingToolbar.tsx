import React from 'react';
import { CheckCheck, MessageSquareQuote, Briefcase, Copy, X } from 'lucide-react';
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
  const left = Math.max(10, Math.min(window.innerWidth - 340, rect.left));

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
        backgroundColor: '#1C1F24',
        borderRadius: '24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(236, 232, 222, 0.15)',
        fontFamily: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        color: '#ECE8DE',
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

      <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 600, fontSize: '12px', color: '#B08D4F', margin: '0 4px' }}>
        WriteFix
      </span>

      <button
        onClick={() => onSelectMode('grammar_only')}
        style={btnStyle}
        title="Fix Grammar & Spelling"
      >
        <CheckCheck size={13} color="#B08D4F" />
        Grammar
      </button>

      <button
        onClick={() => onSelectMode('humanize')}
        style={btnStyle}
        title="Humanize Writing"
      >
        <MessageSquareQuote size={13} color="#B08D4F" />
        Humanize
      </button>

      <button
        onClick={() => onSelectMode('professional')}
        style={btnStyle}
        title="Make Professional"
      >
        <Briefcase size={13} color="#B08D4F" />
        Pro
      </button>

      <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(236, 232, 222, 0.18)', margin: '0 2px' }} />

      <button
        onClick={onCopy}
        style={btnStyle}
        title="Copy Selected Text"
      >
        <Copy size={13} />
      </button>

      <button
        onClick={onDismiss}
        style={{ ...btnStyle, padding: '4px 6px', opacity: 0.7 }}
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
  color: '#ECE8DE',
  padding: '4px 8px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '11.5px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  transition: 'background-color 0.15s ease',
};
