import React, { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { Mistake } from '../../lib/storage/types';
import { getThemeColors, ThemeMode } from '../../lib/utils/theme';

interface MistakeExplainerProps {
  mistakes: Mistake[];
  themeMode?: ThemeMode;
}

export const MistakeExplainer: React.FC<MistakeExplainerProps> = ({ mistakes, themeMode = 'system' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const themeColors = getThemeColors(themeMode);

  if (!mistakes || mistakes.length === 0) return null;

  return (
    <div style={{ marginTop: '12px', borderTop: `1px solid ${themeColors.border}`, paddingTop: '10px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#818cf8',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <Info size={13} color="#818cf8" />
        EXPLANATIONS ({mistakes.length} improvement{mistakes.length > 1 ? 's' : ''})
      </div>

      {mistakes.map((mistake, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div
            key={idx}
            style={{
              marginBottom: '6px',
              borderRadius: '8px',
              border: `1px solid ${isOpen ? 'rgba(99, 102, 241, 0.35)' : themeColors.border}`,
              backgroundColor: themeColors.bgSecondary,
              overflow: 'hidden',
              transition: 'border-color 0.15s ease',
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: themeColors.textPrimary,
                fontSize: '12.5px',
                fontWeight: 500,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#fb7185', textDecoration: 'line-through' }}>{mistake.original}</span>
                <span style={{ color: themeColors.textMuted }}>→</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{mistake.replacement}</span>
              </div>
              <ChevronDown
                size={13}
                style={{
                  color: themeColors.textMuted,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {isOpen && (
              <div
                style={{
                  padding: '8px 12px 10px 12px',
                  fontSize: '12px',
                  color: themeColors.textSecondary,
                  backgroundColor: themeColors.bgTertiary,
                  borderTop: `1px solid ${themeColors.border}`,
                }}
              >
                <p style={{ margin: 0, lineHeight: '1.5' }}>{mistake.description || mistake.explanation}</p>
                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '10.5px',
                    textTransform: 'capitalize',
                    color: '#818cf8',
                    fontWeight: 600,
                  }}
                >
                  Category: {mistake.category}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
