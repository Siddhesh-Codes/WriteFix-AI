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
      fontFamily: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
      fontSize: '13.5px',
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
                backgroundColor: 'rgba(190, 91, 61, 0.18)',
                color: '#BE5B3D',
                textDecoration: 'line-through',
                padding: '2px 4px',
                borderRadius: '3px',
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
                backgroundColor: 'rgba(122, 148, 113, 0.18)',
                color: '#7A9471',
                fontWeight: 600,
                padding: '2px 4px',
                borderRadius: '3px',
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
