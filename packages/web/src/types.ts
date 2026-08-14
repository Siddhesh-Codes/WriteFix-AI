import { CorrectionMode, Mistake } from '@writefix/core';

export type WebCorrectionMode = CorrectionMode;

export type WebProvider = 'gemini' | 'groq' | 'openai' | 'anthropic' | 'openrouter' | 'languagetool' | 'offline-heuristic';

export interface WebSettings {
  activeProvider: WebProvider;
  apiKeys: Record<string, string>;
  selectedModels: Record<string, string>;
  theme: 'dark' | 'light' | 'system';
  autoCheck: boolean;
  debounceMs: number;
  soundEffects: boolean;
  tonePreferences: {
    formality: number; // 0-100
    conciseness: number; // 0-100
    creativity: number; // 0-100
  };
}

export interface HistoryItem {
  id: string;
  originalText: string;
  correctedText: string;
  mode: WebCorrectionMode;
  provider: string;
  timestamp: number;
  scoreBefore: number;
  scoreAfter: number;
  wordCount: number;
  charCount: number;
  mistakesCount: number;
  favorite?: boolean;
}

export interface RateLimitState {
  tokensRemaining: number;
  maxTokens: number;
  cooldownSeconds: number;
  isThrottled: boolean;
  totalRequestsInSession: number;
  lastRequestTime: number;
}
