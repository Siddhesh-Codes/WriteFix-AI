import React, { useState } from 'react';
import { computeWordDiff, DiffSegment } from '@writefix/core';
import {
  Copy,
  Check,
  Columns,
  AlignLeft,
  Download,
  Printer,
  CheckCheck,
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
        ? `# WriteFix Output\n\n## Polished Text\n${effectiveCorrected}\n\n## Original Text\n${originalText}\n`
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
        <!DOCTYPE html>
        <html>
          <head>
            <title>WriteFix Document</title>
            <style>
              body { font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; line-height: 1.8; color: #15171B; background: #FCFAF6; }
              h1 { font-family: 'Fraunces', Georgia, serif; font-size: 22px; border-bottom: 1px solid #946E2D; padding-bottom: 8px; color: #15171B; }
              pre { white-space: pre-wrap; font-family: inherit; font-size: 15px; color: #15171B; }
            </style>
          </head>
          <body>
            <h1>WriteFix Polished Output</h1>
            <pre>${effectiveCorrected}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Bespoke Empty State
  if (!hasOutput) {
    return (
      <div
        style={{
          padding: '24px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          height: '100%',
          minHeight: '300px',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Subtle Editorial Ghosted Diff Background Card */}
        <div
          style={{
            maxWidth: '360px',
            width: '100%',
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            opacity: 0.9,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-signet)',
                fontWeight: 600,
              }}
            >
              Editorial Preview Hallmark
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-signet)',
              }}
            />
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '13px',
              lineHeight: '1.7',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            WriteFix clarifies sentences{' '}
            <span
              style={{
                color: 'var(--diff-del-text)',
                backgroundColor: 'var(--diff-del-bg)',
                textDecoration: 'line-through',
                padding: '1px 4px',
                borderRadius: '3px',
              }}
            >
              with noisy clichés
            </span>{' '}
            <span
              style={{
                color: 'var(--diff-add-text)',
                backgroundColor: 'var(--diff-add-bg)',
                fontWeight: 600,
                padding: '1px 4px',
                borderRadius: '3px',
              }}
            >
              with executive precision
            </span>
            .
          </p>
        </div>

        {/* Center Brand Signet Hallmark */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--color-signet-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <img src="/logo.svg" alt="WriteFix Signet" style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Headline & Description */}
        <div style={{ maxWidth: '360px', width: '100%', boxSizing: 'border-box' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
              color: 'var(--text-primary)',
            }}
          >
            Ready to Polish Draft
          </h3>
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.6',
            }}
          >
            Select a mode above and click <strong>Fix & Polish</strong> or press{' '}
            <kbd
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '2px 6px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              Ctrl+↵
            </kbd>{' '}
            to inspect real-time diffs, mistakes, and diagnostics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Diff Toolbar */}
      <div
        style={{
          minHeight: '44px',
          padding: '6px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Left: View Mode Toggle & Diff Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              padding: '2px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <button
              onClick={() => setViewMode('unified')}
              title="Unified Inline Diff View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: viewMode === 'unified' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'unified' ? 'var(--color-signet)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <AlignLeft size={12} />
              <span>Unified</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              title="Side-by-Side Split Diff View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: viewMode === 'split' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'split' ? 'var(--color-signet)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Columns size={12} />
              <span>Split</span>
            </button>
          </div>

          {/* Diff Delta Pills in IBM Plex Mono */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--diff-add-bg)',
                color: 'var(--color-confirmed)',
                fontWeight: 600,
                border: '1px solid var(--success-border)',
              }}
            >
              +{addedWords} additions
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--diff-del-bg)',
                color: 'var(--color-correction)',
                fontWeight: 600,
                border: '1px solid var(--danger-border)',
              }}
            >
              -{deletedWords} deletions
            </span>
          </div>
        </div>

        {/* Right: Export & Copy Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onApplyToInput && (
            <button
              onClick={onApplyToInput}
              title="Apply polished text back to input draft"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-signet-dim)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--color-signet)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCheck size={13} />
              <span>Apply to Draft</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy clean polished text"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 9px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: copied ? 'var(--color-confirmed)' : 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => handleDownload('md')}
            title="Export as Markdown (.md)"
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              cursor: 'pointer',
            }}
          >
            <Download size={12} />
          </button>

          <button
            onClick={handlePrint}
            title="Print or export to PDF"
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              cursor: 'pointer',
            }}
          >
            <Printer size={12} />
          </button>
        </div>
      </div>

      {/* Main Diff Content Container */}
      <div style={{ flex: 1, minHeight: '180px', overflowY: 'auto', padding: '16px' }}>
        {viewMode === 'unified' ? (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              lineHeight: '1.8',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
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
                      fontWeight: 600,
                      borderRadius: '3px',
                      padding: '1px 3px',
                      margin: '0 1px',
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
                      margin: '0 1px',
                      opacity: 0.85,
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
          /* Split View */
          <div className="diff-split-grid">
            {/* Left Original */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                padding: '14px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--color-correction)',
                  marginBottom: '10px',
                }}
              >
                Original Draft
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13.5px',
                  lineHeight: '1.7',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {originalText}
              </div>
            </div>

            {/* Right Polished */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--color-signet-dim)',
                padding: '14px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--color-confirmed)',
                  marginBottom: '10px',
                }}
              >
                Polished Output
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13.5px',
                  lineHeight: '1.7',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
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
