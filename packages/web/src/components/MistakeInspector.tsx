import React, { useState } from 'react';
import { Mistake } from '@writefix/core';
import {
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';

interface MistakeInspectorProps {
  mistakes: Mistake[];
  onAcceptMistake?: (mistake: Mistake) => void;
  onDismissMistake?: (index: number) => void;
}

export const MistakeInspector: React.FC<MistakeInspectorProps> = ({
  mistakes,
  onAcceptMistake,
  onDismissMistake,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'grammar' | 'spelling' | 'punctuation' | 'capitalization' | 'style'>('all');

  const filtered = mistakes.filter((m) => {
    if (activeTab === 'all') return true;
    return m.category === activeTab;
  });

  const grammarCount = mistakes.filter((m) => m.category === 'grammar').length;
  const spellingCount = mistakes.filter((m) => m.category === 'spelling').length;
  const punctCount = mistakes.filter((m) => m.category === 'punctuation').length;
  const capCount = mistakes.filter((m) => m.category === 'capitalization').length;
  const styleCount = mistakes.filter((m) => m.category === 'style').length;

  const handleAcceptAll = () => {
    if (onAcceptMistake) {
      mistakes.forEach((m) => onAcceptMistake(m));
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'grammar':
        return { bg: 'var(--primary-subtle)', text: 'var(--color-signet)', border: 'var(--primary-border)' };
      case 'spelling':
        return { bg: 'var(--danger-bg)', text: 'var(--color-correction)', border: 'var(--danger-border)' };
      case 'punctuation':
        return { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'var(--warning-border)' };
      case 'style':
        return { bg: 'var(--info-bg)', text: 'var(--color-signet-dim)', border: 'var(--info-border)' };
      default:
        return { bg: 'var(--bg-surface-elevated)', text: 'var(--text-secondary)', border: 'var(--border-subtle)' };
    }
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    border: isActive ? '1px solid var(--color-signet-dim)' : '1px solid transparent',
    backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontSize: '11.5px',
    fontWeight: isActive ? 600 : 500,
    cursor: 'pointer',
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
    whiteSpace: 'nowrap',
    minHeight: '32px',
    flex: '0 0 auto',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Category Tabs Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-elevated)',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div className="touch-scroll-x" style={{ display: 'flex', gap: '4px', flex: 1, minWidth: 0 }}>
          <button onClick={() => setActiveTab('all')} style={getTabStyle(activeTab === 'all')}>
            All <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>({mistakes.length})</span>
          </button>
          <button onClick={() => setActiveTab('grammar')} style={getTabStyle(activeTab === 'grammar')}>
            Grammar <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>({grammarCount})</span>
          </button>
          <button onClick={() => setActiveTab('spelling')} style={getTabStyle(activeTab === 'spelling')}>
            Spelling <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>({spellingCount})</span>
          </button>
          <button onClick={() => setActiveTab('punctuation')} style={getTabStyle(activeTab === 'punctuation')}>
            Punctuation <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>({punctCount})</span>
          </button>
          {capCount > 0 && (
            <button onClick={() => setActiveTab('capitalization')} style={getTabStyle(activeTab === 'capitalization')}>
              Casing <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>({capCount})</span>
            </button>
          )}
          {styleCount > 0 && (
            <button onClick={() => setActiveTab('style')} style={getTabStyle(activeTab === 'style')}>
              Style <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>({styleCount})</span>
            </button>
          )}
        </div>

        {mistakes.length > 0 && onAcceptMistake && (
          <button
            onClick={handleAcceptAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-signet-dim)',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--color-signet)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '32px',
              flexShrink: 0,
            }}
          >
            <CheckCheck size={13} />
            <span>Accept All ({mistakes.length})</span>
          </button>
        )}
      </div>

      {/* Mistakes List Body */}
      <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '40px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={32} color="var(--color-confirmed)" />
            <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
              {mistakes.length === 0
                ? 'No mistakes detected. Your draft is clean and accurate.'
                : 'No mistakes found in this category.'}
            </p>
          </div>
        ) : (
          filtered.map((m, idx) => {
            const colors = getCategoryColor(m.category || 'grammar');
            return (
              <div
                key={idx}
                className="premium-card animate-fade-in"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {/* Card Top: Category badge & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {m.category || 'grammar'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {onAcceptMistake && (
                      <button
                        onClick={() => onAcceptMistake(m)}
                        title="Accept this correction"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 9px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--success-border)',
                          backgroundColor: 'var(--success-bg)',
                          color: 'var(--color-confirmed)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={12} />
                        <span>Accept</span>
                      </button>
                    )}

                    {onDismissMistake && (
                      <button
                        onClick={() => onDismissMistake(idx)}
                        title="Dismiss this suggestion"
                        style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          color: 'var(--text-muted)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Diff Comparison Chips */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--diff-del-text)',
                      backgroundColor: 'var(--diff-del-bg)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textDecoration: 'line-through',
                      fontWeight: 500,
                    }}
                  >
                    {m.original}
                  </span>

                  <ArrowRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />

                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--diff-add-text)',
                      backgroundColor: 'var(--diff-add-bg)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {m.replacement}
                  </span>
                </div>

                {/* Explanation */}
                {(m.explanation || m.description) && (
                  <p
                    style={{
                      fontSize: '12px',
                      lineHeight: '1.5',
                      color: 'var(--text-secondary)',
                      margin: 0,
                    }}
                  >
                    {m.explanation || m.description}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
