import { CorrectionMode } from './types';

export interface ModeMetadata {
  id: CorrectionMode;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  requiresAI: boolean;
}

export const CORRECTION_MODES: Record<CorrectionMode, ModeMetadata> = {
  grammar_only: {
    id: 'grammar_only',
    label: 'Grammar',
    shortLabel: 'Grammar',
    icon: 'check',
    description: 'Fix spelling, grammar, and punctuation mistakes without changing style.',
    requiresAI: false,
  },
  grammar_punctuation: {
    id: 'grammar_punctuation',
    label: 'Grammar+',
    shortLabel: 'Grammar+',
    icon: 'check-check',
    description: 'Fix grammar, spelling, and advanced punctuation structure.',
    requiresAI: false,
  },
  natural: {
    id: 'natural',
    label: 'Natural',
    shortLabel: 'Natural',
    icon: 'message-circle',
    description: 'Rewrite in natural, conversational, fluent everyday English.',
    requiresAI: true,
  },
  professional: {
    id: 'professional',
    label: 'Professional',
    shortLabel: 'Pro',
    icon: 'briefcase',
    description: 'Make tone formal, polished, and suitable for work and business.',
    requiresAI: true,
  },
  humanize: {
    id: 'humanize',
    label: 'Humanize',
    shortLabel: 'Humanize',
    icon: 'heart',
    description: 'Remove artificial AI tone and add authentic human nuance.',
    requiresAI: true,
  },
  simple: {
    id: 'simple',
    label: 'Simple',
    shortLabel: 'Simple',
    icon: 'book-open',
    description: 'Simplify vocabulary and sentence structure for easy reading.',
    requiresAI: true,
  },
  polite: {
    id: 'polite',
    label: 'Polite',
    shortLabel: 'Polite',
    icon: 'smile',
    description: 'Add courtesy and warm polite phrasing.',
    requiresAI: true,
  },
  short: {
    id: 'short',
    label: 'Shorter',
    shortLabel: 'Shorter',
    icon: 'minimize',
    description: 'Condense text to be brief and direct.',
    requiresAI: true,
  },
  indian_professional: {
    id: 'indian_professional',
    label: 'Indian Pro',
    shortLabel: 'Indian Pro',
    icon: 'globe',
    description: 'Adapt to professional Indian workplace English tone.',
    requiresAI: true,
  },
};
