import React from 'react';
import { Sliders, Briefcase, Smile, BookOpen, MessageSquare, RotateCcw } from 'lucide-react';
import { WebSettings } from '../types';

interface ToneCustomizerProps {
  preferences: WebSettings['tonePreferences'];
  onChange: (newPreferences: WebSettings['tonePreferences']) => void;
}

const TONE_PRESETS = [
  {
    name: 'Executive Brief',
    icon: <Briefcase size={13} />,
    values: { formality: 85, conciseness: 85, creativity: 30 },
  },
  {
    name: 'Academic Scholar',
    icon: <BookOpen size={13} />,
    values: { formality: 90, conciseness: 45, creativity: 20 },
  },
  {
    name: 'Friendly Colleague',
    icon: <Smile size={13} />,
    values: { formality: 30, conciseness: 60, creativity: 75 },
  },
  {
    name: 'Balanced Natural',
    icon: <MessageSquare size={13} />,
    values: { formality: 50, conciseness: 50, creativity: 50 },
  },
];

export const ToneCustomizer: React.FC<ToneCustomizerProps> = ({
  preferences,
  onChange,
}) => {
  const handleSlider = (key: keyof WebSettings['tonePreferences'], val: number) => {
    onChange({
      ...preferences,
      [key]: val,
    });
  };

  const applyPreset = (presetValues: WebSettings['tonePreferences']) => {
    onChange(presetValues);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--text-primary)',
            }}
          >
            <Sliders size={16} color="var(--color-signet)" />
            <span>Tone & Persona Calibrator</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Fine-tune how the AI shapes phrasing, vocabulary, and sentence cadence.
          </p>
        </div>

        <button
          onClick={() => applyPreset({ formality: 50, conciseness: 50, creativity: 50 })}
          title="Reset sliders to default"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-signet-dim)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Quick Presets */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10.5px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.05em',
          }}
        >
          One-Click Presets:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {TONE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset.values)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-signet)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
              }}
            >
              <span style={{ color: 'var(--color-signet)' }}>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Container */}
      <div
        className="premium-card"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Formality Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Formality & Register
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--color-signet)',
                border: '1px solid var(--primary-border)',
              }}
            >
              {preferences.formality < 35 ? 'Casual / Conversational' : preferences.formality > 65 ? 'Executive / Formal' : 'Balanced'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={preferences.formality}
            onChange={(e) => handleSlider('formality', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>Informal & Relaxed</span>
            <span>Structured & Professional</span>
          </div>
        </div>

        {/* Conciseness Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Conciseness & Length
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--color-signet)',
                border: '1px solid var(--primary-border)',
              }}
            >
              {preferences.conciseness < 35 ? 'Detailed & Descriptive' : preferences.conciseness > 65 ? 'Ultra-Concise' : 'Standard Length'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={preferences.conciseness}
            onChange={(e) => handleSlider('conciseness', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>Comprehensive & Nuanced</span>
            <span>Direct & Punchy</span>
          </div>
        </div>

        {/* Warmth & Expression Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Warmth & Expressiveness
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-subtle)',
                color: 'var(--color-signet)',
                border: '1px solid var(--primary-border)',
              }}
            >
              {preferences.creativity < 35 ? 'Direct & Factual' : preferences.creativity > 65 ? 'Warm & Expressive' : 'Natural'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={preferences.creativity}
            onChange={(e) => handleSlider('creativity', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>Strictly Neutral</span>
            <span>Empathetic & Engaging</span>
          </div>
        </div>
      </div>
    </div>
  );
};
