/**
 * Unified Storage Schema Types (Phase 1.2 & Phase 2)
 */

export type CorrectionMode =
  | 'grammar_only'
  | 'grammar_punctuation'
  | 'natural'
  | 'professional'
  | 'humanize'
  | 'simple'
  | 'polite'
  | 'short'
  | 'indian_professional';

export type TonePreset = 'formal' | 'casual' | 'confident' | 'friendly' | 'empathetic';

export interface WritingPreference {
  id: string;
  rule: string;
  enabled: boolean;
}

export interface CustomPrompt {
  id: string;
  title: string;
  promptTemplate: string;
  icon?: string;
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  language: string;
  activeProvider: 'languagetool' | 'gemini' | 'groq' | 'openrouter' | 'openai' | 'anthropic';
  apiKeys: Record<string, string>;
  selectedModels: Record<string, string>;
  temperatures: Record<string, number>;
  autoCopy: boolean;
  autoReplace: boolean;
  showFloatingToolbar: boolean;
  enableShortcut: boolean;
  customShortcut?: string;
  preferences: WritingPreference[];
}

export interface Mistake {
  type: string;
  description: string;
  original: string;
  replacement: string;
  category: 'grammar' | 'spelling' | 'punctuation' | 'capitalization';
}

export interface HistoryEntry {
  id: string;
  originalText: string;
  correctedText: string;
  mode: CorrectionMode;
  provider: string;
  timestamp: number;
  wordCount: number;
  scoreBefore: number;
  scoreAfter: number;
  isFavorite: boolean;
}

export interface FavoriteEntry {
  id: string;
  historyId: string;
  originalText: string;
  correctedText: string;
  mode: CorrectionMode;
  createdAt: number;
}

export interface WritingProfile {
  preferredMode: CorrectionMode | null;
  preferredTone: TonePreset | null;
  averageSentenceLength: number;
  preferredReadingLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  favoriteWords: Record<string, number>;
  avoidedWords: Record<string, number>;
  modeUsage: Record<string, number>;
  totalCorrections: number;
  lastUpdated: number;
  confidenceScore: number;
}

export interface MistakeFrequency {
  ruleId: string;
  ruleLabel: string;
  count: number;
  examples: Array<{
    original: string;
    corrected: string;
    context: string;
  }>;
  firstSeen: number;
  lastSeen: number;
}

export interface StorageSchema {
  settings: Settings;
  history: HistoryEntry[];
  favorites: FavoriteEntry[];
  writingProfile: WritingProfile;
  personalDictionary: string[];
  customPrompts: CustomPrompt[];
  mistakeFrequencies: Record<string, MistakeFrequency>;
  dismissedLessons: string[];
  schemaVersion: number;
}
