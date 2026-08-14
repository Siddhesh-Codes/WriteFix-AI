import React from 'react';
import { computeTextStats, computeWritingScore, TextStats } from '@writefix/core';
import {
  BarChart3,
  Clock,
  Mic,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
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
    if (grade <= 6) return 'Elementary (Easy reading)';
    if (grade <= 8) return 'Middle School (Standard conversational)';
    if (grade <= 12) return 'High School (Clear business tone)';
    if (grade <= 16) return 'College / Professional';
    return 'Scholarly / Specialized (Complex)';
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Circular Score Gauge */}
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `conic-gradient(var(--success) ${scoreAfter}%, var(--border-subtle) 0)`,
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
                fontWeight: 800,
                fontSize: '18px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {scoreAfter}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                Writing Quality Score
              </span>
              {scoreDelta > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success)',
                  }}
                >
                  +{scoreDelta} pts improved
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Based on grammar precision, sentence flow, and lexical structure.
            </p>
          </div>
        </div>

        {/* Readability Grade Pillar */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Readability Grade
          </div>
          <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--primary)', marginTop: '2px' }}>
            Grade {afterStats.fleschKincaidGrade}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
          icon={<Clock size={13} color="var(--primary)" />}
        />
        <MetricTile
          label="Speaking Time"
          value={formatDuration(speakingTimeSeconds)}
          icon={<Mic size={13} color="var(--accent-amber)" />}
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
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Structural Diagnostics & Clarity
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <DiagnosticRow
            label="Reading Level Assessment"
            score={afterStats.readingLevel}
            rating={afterStats.readingLevel === 'Intermediate' ? 'Optimal for General Audience' : afterStats.readingLevel}
            isPositive={true}
          />
          <DiagnosticRow
            label="Grammar & Syntax Errors"
            score={`${mistakesCount} issues found`}
            rating={mistakesCount === 0 ? 'Flawless' : `${mistakesCount} unaddressed`}
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
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      {icon}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
      <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
        {value}
      </span>
      {delta !== undefined && delta !== 0 && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: delta > 0 ? 'var(--success)' : 'var(--danger)',
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
      padding: '8px 12px',
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
          backgroundColor: isPositive ? 'var(--success)' : 'var(--warning)',
        }}
      />
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {score}
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: isPositive ? 'var(--success-bg)' : 'var(--warning-bg)',
          color: isPositive ? 'var(--success)' : 'var(--warning)',
        }}
      >
        {rating}
      </span>
    </div>
  </div>
);
