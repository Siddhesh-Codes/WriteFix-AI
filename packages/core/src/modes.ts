import { CorrectionMode } from './types';

export interface ModeMetadata {
  id: CorrectionMode;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  requiresAI: boolean;
  category: 'primary' | 'tone' | 'alias';
}

export const CANONICAL_PRIMARY_MODES: ModeMetadata[] = [
  {
    id: 'grammar',
    label: 'Grammar',
    shortLabel: 'Grammar',
    icon: 'check-check',
    description: 'Fix spelling, grammar, and punctuation mistakes with proofreader precision.',
    requiresAI: false,
    category: 'primary',
  },
  {
    id: 'professional',
    label: 'Professional',
    shortLabel: 'Professional',
    icon: 'briefcase',
    description: 'Executive formal tone suited for business, client, and leadership communication.',
    requiresAI: true,
    category: 'primary',
  },
  {
    id: 'academic',
    label: 'Academic',
    shortLabel: 'Academic',
    icon: 'graduation-cap',
    description: 'Scholarly precision with rigorous vocabulary, formal syntax, and academic flow.',
    requiresAI: true,
    category: 'primary',
  },
  {
    id: 'concise',
    label: 'Concise',
    shortLabel: 'Concise',
    icon: 'minimize-2',
    description: 'Condense and streamline text to be brief, punchy, and direct without losing substance.',
    requiresAI: true,
    category: 'primary',
  },
  {
    id: 'humanize',
    label: 'Humanize',
    shortLabel: 'Humanize',
    icon: 'message-square-quote',
    description: 'Remove synthetic, robotic patterns and restore authentic human voice and cadence.',
    requiresAI: true,
    category: 'primary',
  },
];

export const CANONICAL_TONE_MODIFIERS: ModeMetadata[] = [
  {
    id: 'natural',
    label: 'Natural',
    shortLabel: 'Natural',
    icon: 'message-circle',
    description: 'Fluid, conversational everyday English tone.',
    requiresAI: true,
    category: 'tone',
  },
  {
    id: 'simple',
    label: 'Simple',
    shortLabel: 'Simple',
    icon: 'book-open',
    description: 'Plain English with simplified vocabulary and shorter sentence structures.',
    requiresAI: true,
    category: 'tone',
  },
  {
    id: 'polite',
    label: 'Polite',
    shortLabel: 'Polite',
    icon: 'smile',
    description: 'Warm courtesy, respectful phrasing, and diplomatic framing.',
    requiresAI: true,
    category: 'tone',
  },
  {
    id: 'short',
    label: 'Shorter',
    shortLabel: 'Shorter',
    icon: 'scissors',
    description: 'Rapid compression for ultra-brief communication.',
    requiresAI: true,
    category: 'tone',
  },
  {
    id: 'indian_professional',
    label: 'Indian Pro',
    shortLabel: 'Indian Pro',
    icon: 'globe',
    description: 'Respectful, polite Indian workplace English communication conventions.',
    requiresAI: true,
    category: 'tone',
  },
];

export const CORRECTION_MODES: Record<CorrectionMode, ModeMetadata> = {
  grammar: CANONICAL_PRIMARY_MODES[0],
  professional: CANONICAL_PRIMARY_MODES[1],
  academic: CANONICAL_PRIMARY_MODES[2],
  concise: CANONICAL_PRIMARY_MODES[3],
  humanize: CANONICAL_PRIMARY_MODES[4],

  natural: CANONICAL_TONE_MODIFIERS[0],
  simple: CANONICAL_TONE_MODIFIERS[1],
  polite: CANONICAL_TONE_MODIFIERS[2],
  short: CANONICAL_TONE_MODIFIERS[3],
  indian_professional: CANONICAL_TONE_MODIFIERS[4],

  // Transparent backward compatibility aliases for stored history & legacy lookups
  grammar_only: {
    ...CANONICAL_PRIMARY_MODES[0],
    id: 'grammar_only',
    category: 'alias',
  },
  grammar_punctuation: {
    ...CANONICAL_PRIMARY_MODES[0],
    id: 'grammar_punctuation',
    label: 'Grammar+',
    shortLabel: 'Grammar+',
    category: 'alias',
  },
  'indian-professional': {
    ...CANONICAL_TONE_MODIFIERS[4],
    id: 'indian-professional',
    category: 'alias',
  },
};

export function getModeMetadata(mode: string): ModeMetadata {
  return (CORRECTION_MODES as Record<string, ModeMetadata>)[mode] || CORRECTION_MODES.grammar;
}
