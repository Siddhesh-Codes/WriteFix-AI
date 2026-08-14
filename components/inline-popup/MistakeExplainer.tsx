import React, { useState } from 'react';
import { Info } from 'lucide-react';
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: themeColors.textSecondary, marginBottom: '8px' }}>
        <Info size={14} color="#6366f1" />
        EXPLANATION ({mistakes.length} issue{mistakes.length > 1 ? 's' : ''} found)
      </div>

      {mistakes.map((mistake, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div
            key={idx}
            style={{
              marginBottom: '6px',
              borderRadius: '6px',
              border: `1px solid ${themeColors.border}`,
              backgroundColor: themeColors.bgSecondary,
              overflow: 'hidden'
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
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <span>
                <strong style={{ color: themeColors.isDark ? '#fca5a5' : '#ef4444' }}>"{mistake.original}"</strong> → <strong style={{ color: themeColors.isDark ? '#6ee7b7' : '#22c55e' }}>"{mistake.replacement}"</strong>
              </span>
              <span style={{ fontSize: '11px', color: themeColors.textSecondary }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div style={{ padding: '8px 12px 12px 12px', fontSize: '12px', color: themeColors.textSecondary, backgroundColor: themeColors.bgTertiary, borderTop: `1px dashed ${themeColors.border}` }}>
                <p style={{ margin: 0, lineHeight: '1.4' }}>{mistake.description}</p>
                <div style={{ marginTop: '6px', fontSize: '11px', textTransform: 'capitalize', color: '#6366f1' }}>
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
