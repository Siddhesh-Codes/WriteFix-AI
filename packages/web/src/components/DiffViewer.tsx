import React, { useState } from 'react';
import { computeWordDiff, DiffSegment } from '@writefix/core';
import {
  Copy,
  Check,
  Columns,
  AlignLeft,
  Download,
  FileText,
  ArrowRight,
  Sparkles,
  Printer,
} from 'lucide-react';

interface DiffViewerProps {
  originalText: string;
  correctedText: string;
  onApplyToInput?: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalText,
  correctedText,
  onApplyToInput,
}) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);

  const hasOutput = Boolean(correctedText && correctedText.trim());
  const effectiveCorrected = hasOutput ? correctedText : originalText;
  const diffChunks: DiffSegment[] = computeWordDiff(originalText, effectiveCorrected);

  const addedWords = diffChunks
    .filter((c) => c.type === 'add')
    .reduce((acc, c) => acc + c.value.trim().split(/\s+/).filter(Boolean).length, 0);
  const deletedWords = diffChunks
    .filter((c) => c.type === 'remove')
    .reduce((acc, c) => acc + c.value.trim().split(/\s+/).filter(Boolean).length, 0);

  const handleCopy = async () => {
    if (!effectiveCorrected) return;
    await navigator.clipboard.writeText(effectiveCorrected);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const content =
      format === 'md'
        ? `# WriteFix AI Output\n\n## Corrected Text\n${effectiveCorrected}\n\n## Original Text\n${originalText}\n`
        : effectiveCorrected;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `writefix_output_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>WriteFix AI Document</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; line-height: 1.8; color: #111827; }
              h1 { font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
              pre { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body>
            <h1>WriteFix AI Polished Output</h1>
            <pre>${effectiveCorrected}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (!hasOutput) {
    return (
      <div
        style={{
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          height: '100%',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Sparkles size={22} />
        </div>
        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
          Ready to Enhance Your Draft
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', lineHeight: 1.6 }}>
          Select an AI mode above and click <strong>Fix & Polish (⌘↵)</strong> on the left to see instant corrections, diffs, and proofreader analysis.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Diff Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-elevated)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {/* View Mode Toggle & Diff Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setViewMode('unified')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: viewMode === 'unified' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'unified' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <AlignLeft size={13} />
              Inline Diff
            </button>

            <button
              onClick={() => setViewMode('split')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: viewMode === 'split' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'split' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Columns size={13} />
              Side-by-Side
            </button>
          </div>

          {(addedWords > 0 || deletedWords > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
              {addedWords > 0 && (
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--diff-add-bg)',
                    color: 'var(--diff-add-text)',
                  }}
                >
                  +{addedWords} words
                </span>
              )}
              {deletedWords > 0 && (
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--diff-del-bg)',
                    color: 'var(--diff-del-text)',
                  }}
                >
                  -{deletedWords} words
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onApplyToInput && (
            <button
              onClick={onApplyToInput}
              title="Replace original input with this corrected version"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowRight size={13} color="var(--primary)" />
              Apply to Input
            </button>
          )}

          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: copied ? 'var(--success-bg)' : 'var(--bg-surface)',
              color: copied ? 'var(--success)' : 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={() => handleDownload('md')}
            title="Download Markdown"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FileText size={12} />
            MD
          </button>

          <button
            onClick={() => handleDownload('txt')}
            title="Download Plain Text"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={12} />
            TXT
          </button>

          <button
            onClick={handlePrint}
            title="Print / Save as PDF"
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            <Printer size={12} />
          </button>
        </div>
      </div>

      {/* Main Diff Content Container */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {viewMode === 'unified' ? (
          <div
            style={{
              fontSize: '15px',
              lineHeight: '1.85',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-primary)',
            }}
          >
            {diffChunks.map((chunk, idx) => {
              if (chunk.type === 'add') {
                return (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: 'var(--diff-add-bg)',
                      color: 'var(--diff-add-text)',
                      borderRadius: '3px',
                      padding: '1px 3px',
                      fontWeight: 500,
                    }}
                  >
                    {chunk.value}
                  </span>
                );
              }
              if (chunk.type === 'remove') {
                return (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: 'var(--diff-del-bg)',
                      color: 'var(--diff-del-text)',
                      textDecoration: 'line-through',
                      borderRadius: '3px',
                      padding: '1px 3px',
                      marginRight: '2px',
                    }}
                  >
                    {chunk.value}
                  </span>
                );
              }
              return <span key={idx}>{chunk.value}</span>;
            })}
          </div>
        ) : (
          /* Side by Side Split View */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
              height: '100%',
            }}
          >
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  letterSpacing: '0.05em',
                }}
              >
                Original Draft
              </div>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.75',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-secondary)',
                }}
              >
                {originalText}
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--primary)',
                  marginBottom: '10px',
                  letterSpacing: '0.05em',
                }}
              >
                Polished Output
              </div>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.75',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)',
                }}
              >
                {effectiveCorrected}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
