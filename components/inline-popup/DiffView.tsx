import React from 'react';
import { computeWordDiff } from '@writefix/core';
import { getThemeColors, ThemeMode } from '../../lib/utils/theme';

interface DiffViewProps {
  originalText: string;
  correctedText: string;
  themeMode?: ThemeMode;
}

export const DiffView: React.FC<DiffViewProps> = ({ originalText, correctedText, themeMode = 'system' }) => {
  const segments = computeWordDiff(originalText, correctedText);
  const themeColors = getThemeColors(themeMode);

  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        lineHeight: '1.6',
        padding: '12px 14px',
        borderRadius: '10px',
        backgroundColor: themeColors.bgTertiary,
        color: themeColors.textPrimary,
        border: `1px solid ${themeColors.border}`,
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        maxHeight: '220px',
        overflowY: 'auto',
      }}
    >
      {segments.map((seg, idx) => {
        if (seg.type === 'remove') {
          return (
            <span
              key={idx}
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                color: '#fb7185',
                textDecoration: 'line-through',
                padding: '1px 4px',
                borderRadius: '3px',
                margin: '0 1px',
              }}
            >
              {seg.value}
            </span>
          );
        }
        if (seg.type === 'add') {
          return (
            <span
              key={idx}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.22)',
                color: '#34d399',
                fontWeight: 600,
                padding: '1px 4px',
                borderRadius: '3px',
                margin: '0 1px',
              }}
            >
              {seg.value}
            </span>
          );
        }
        return <span key={idx}>{seg.value}</span>;
      })}
    </div>
  );
};
