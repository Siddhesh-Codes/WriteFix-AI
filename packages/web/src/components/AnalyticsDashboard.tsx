import React from 'react';
import { computeTextStats, computeWritingScore, TextStats } from '@writefix/core';
import {
  Clock,
  Mic,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  originalText: string;
  correctedText: string;
  mistakesCount: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  originalText,
  correctedText,
  mistakesCount,
}) => {
  const currentText = correctedText || originalText;
  const beforeStats: TextStats = computeTextStats(originalText);
  const afterStats: TextStats = computeTextStats(currentText);

  const scoreBefore = computeWritingScore({
    grammarErrors: mistakesCount,
    spellingErrors: 0,
    punctuationErrors: 0,
    capitalizationErrors: 0,
    fleschKincaidGrade: beforeStats.fleschKincaidGrade,
  });

  const scoreAfter = computeWritingScore({
    grammarErrors: 0,
    spellingErrors: 0,
    punctuationErrors: 0,
    capitalizationErrors: 0,
    fleschKincaidGrade: afterStats.fleschKincaidGrade,
  });

  const scoreDelta = scoreAfter - scoreBefore;

  const getGradeInterpretation = (grade: number) => {
    if (grade <= 6) return 'Elementary (Accessible)';
    if (grade <= 8) return 'Middle School (Conversational)';
    if (grade <= 12) return 'High School (Clear Business)';
    if (grade <= 16) return 'College / Executive Professional';
    return 'Scholarly / Specialized';
  };

  const avgWordsPerSentence =
    afterStats.sentenceCount > 0
      ? (afterStats.wordCount / afterStats.sentenceCount).toFixed(1)
      : '0.0';

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return remainder > 0 ? `${mins}m ${remainder}s` : `${mins}m`;
  };

  const speakingTimeSeconds = Math.max(1, Math.round((afterStats.wordCount / 130) * 60));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Top Health Score Card */}
      <div
        className="premium-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          backgroundColor: 'var(--bg-surface-elevated)',
          flexWrap: 'wrap',
          gap: '16px',
          border: '1px solid var(--color-signet-dim)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Circular Score Gauge */}
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `conic-gradient(var(--color-signet) ${scoreAfter}%, var(--border-subtle) 0)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '18px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {scoreAfter}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '16px',
                  color: 'var(--text-primary)',
                }}
              >
                Writing Quality Score
              </span>
              {scoreDelta > 0 && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--color-confirmed)',
                    border: '1px solid var(--success-border)',
                  }}
                >
                  +{scoreDelta} pts improved
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Evaluated across grammatical rigor, cadence balance, and readability indices.
            </p>
          </div>
        </div>

        {/* Readability Grade Pillar */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.06em',
            }}
          >
            Readability Grade
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--color-signet)',
              marginTop: '2px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Grade {afterStats.fleschKincaidGrade}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            {getGradeInterpretation(afterStats.fleschKincaidGrade)}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        <MetricTile
          label="Words"
          value={afterStats.wordCount}
          delta={afterStats.wordCount - beforeStats.wordCount}
        />
        <MetricTile
          label="Characters"
          value={afterStats.charCount}
          delta={afterStats.charCount - beforeStats.charCount}
        />
        <MetricTile
          label="Sentences"
          value={afterStats.sentenceCount}
          delta={afterStats.sentenceCount - beforeStats.sentenceCount}
        />
        <MetricTile
          label="Avg Words/Sentence"
          value={avgWordsPerSentence}
        />
        <MetricTile
          label="Silent Reading"
          value={formatDuration(afterStats.readingTimeSec)}
          icon={<Clock size={13} color="var(--color-signet)" />}
        />
        <MetricTile
          label="Speaking Cadence"
          value={formatDuration(speakingTimeSeconds)}
          icon={<Mic size={13} color="var(--color-signet-dim)" />}
        />
      </div>

      {/* Structural Diagnostics Matrix */}
      <div
        className="premium-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Structural Diagnostics & Clarity Index
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <DiagnosticRow
            label="Reading Level Classification"
            score={afterStats.readingLevel}
            rating={afterStats.readingLevel === 'Intermediate' ? 'Optimal for General Readership' : afterStats.readingLevel}
            isPositive={true}
          />
          <DiagnosticRow
            label="Grammar & Syntax Integrity"
            score={`${mistakesCount} issues found`}
            rating={mistakesCount === 0 ? 'Verified Clean' : `${mistakesCount} unaddressed`}
            isPositive={mistakesCount === 0}
          />
        </div>
      </div>
    </div>
  );
};

const MetricTile: React.FC<{
  label: string;
  value: string | number;
  delta?: number;
  icon?: React.ReactNode;
}> = ({ label, value, delta, icon }) => (
  <div
    className="premium-card"
    style={{
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      backgroundColor: 'var(--bg-surface-elevated)',
      border: '1px solid var(--border-subtle)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      {icon}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
      <span
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {value}
      </span>
      {delta !== undefined && delta !== 0 && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            color: delta > 0 ? 'var(--color-confirmed)' : 'var(--color-correction)',
          }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  </div>
);

const DiagnosticRow: React.FC<{
  label: string;
  score: string;
  rating: string;
  isPositive: boolean;
}> = ({ label, score, rating, isPositive }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 14px',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: 'var(--bg-surface-elevated)',
      border: '1px solid var(--border-subtle)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isPositive ? 'var(--color-confirmed)' : 'var(--warning)',
        }}
      />
      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {score}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10.5px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: isPositive ? 'var(--success-bg)' : 'var(--warning-bg)',
          color: isPositive ? 'var(--color-confirmed)' : 'var(--warning)',
          border: `1px solid ${isPositive ? 'var(--success-border)' : 'var(--warning-border)'}`,
        }}
      >
        {rating}
      </span>
    </div>
  </div>
);
