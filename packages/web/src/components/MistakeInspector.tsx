import React, { useState } from 'react';
import { Mistake } from '@writefix/core';
import {
  CheckCircle2,
  Check,
  X,
  Sparkles,
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
  const [activeTab, setActiveTab] = useState<'all' | 'grammar' | 'spelling' | 'punctuation' | 'capitalization'>('all');

  const filtered = mistakes.filter((m) => {
    if (activeTab === 'all') return true;
    return m.category === activeTab;
  });

  const grammarCount = mistakes.filter((m) => m.category === 'grammar').length;
  const spellingCount = mistakes.filter((m) => m.category === 'spelling').length;
  const punctCount = mistakes.filter((m) => m.category === 'punctuation').length;
  const capCount = mistakes.filter((m) => m.category === 'capitalization').length;

  const handleAcceptAll = () => {
    if (onAcceptMistake) {
      mistakes.forEach((m) => onAcceptMistake(m));
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'grammar':
        return { bg: 'var(--primary-subtle)', text: 'var(--primary)', border: 'var(--primary-border)' };
      case 'spelling':
        return { bg: 'var(--danger-bg)', text: 'var(--danger)', border: 'var(--danger-border)' };
      case 'punctuation':
        return { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'var(--warning-border)' };
      default:
        return { bg: 'var(--info-bg)', text: 'var(--info)', border: 'var(--info-border)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Category Tabs Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-elevated)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={getTabStyle(activeTab === 'all')}
          >
            All ({mistakes.length})
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            style={getTabStyle(activeTab === 'grammar')}
          >
            Grammar ({grammarCount})
          </button>
          <button
            onClick={() => setActiveTab('spelling')}
            style={getTabStyle(activeTab === 'spelling')}
          >
            Spelling ({spellingCount})
          </button>
          <button
            onClick={() => setActiveTab('punctuation')}
            style={getTabStyle(activeTab === 'punctuation')}
          >
            Punctuation ({punctCount})
          </button>
          <button
            onClick={() => setActiveTab('capitalization')}
            style={getTabStyle(activeTab === 'capitalization')}
          >
            Casing ({capCount})
          </button>
        </div>

        {mistakes.length > 1 && onAcceptMistake && (
          <button
            onClick={handleAcceptAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--success-border)',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <CheckCheck size={13} />
            Accept All
          </button>
        )}
      </div>

      {/* Mistake Cards List */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '50px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
                {mistakes.length === 0 ? 'No issues detected' : 'No items in this category'}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {mistakes.length === 0
                  ? 'Your draft appears structurally sound and error-free.'
                  : 'Check the other categories to review suggestions.'}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((item, idx) => {
            const colors = getCategoryColor(item.category);
            return (
              <div
                key={idx}
                className="premium-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {item.category}
                    </span>
                    {item.type && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {item.type}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {onAcceptMistake && (
                      <button
                        onClick={() => onAcceptMistake(item)}
                        title="Accept this correction"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 9px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--success-border)',
                          backgroundColor: 'var(--success-bg)',
                          color: 'var(--success)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={12} />
                        Accept
                      </button>
                    )}

                    {onDismissMistake && (
                      <button
                        onClick={() => onDismissMistake(idx)}
                        title="Dismiss suggestion"
                        style={{
                          padding: '4px 6px',
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

                {/* Diff Chips: Original vs Replacement */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--diff-del-bg)',
                      color: 'var(--diff-del-text)',
                      textDecoration: 'line-through',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {item.original}
                  </span>

                  <ArrowRight size={13} color="var(--text-muted)" />

                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--diff-add-bg)',
                      color: 'var(--diff-add-text)',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    {item.replacement}
                  </span>
                </div>

                {/* Explanation */}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function getTabStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
    fontSize: '12px',
    fontWeight: isActive ? 700 : 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };
}
