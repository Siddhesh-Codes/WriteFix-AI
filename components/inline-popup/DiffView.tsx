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
    <div style={{
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      lineHeight: '1.6',
      padding: '14px',
      borderRadius: '8px',
      backgroundColor: themeColors.bgTertiary,
      color: themeColors.textPrimary,
      border: `1px solid ${themeColors.border}`,
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
      maxHeight: '220px',
      overflowY: 'auto'
    }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'remove') {
          return (
            <span
              key={idx}
              style={{
                backgroundColor: themeColors.isDark ? '#7f1d1d' : '#fee2e2',
                color: themeColors.isDark ? '#fca5a5' : '#991b1b',
                textDecoration: 'line-through',
                padding: '2px 4px',
                borderRadius: '4px',
                margin: '0 1px'
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
                backgroundColor: themeColors.isDark ? '#064e3b' : '#dcfce7',
                color: themeColors.isDark ? '#6ee7b7' : '#166534',
                fontWeight: 500,
                padding: '2px 4px',
                borderRadius: '4px',
                margin: '0 1px'
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
