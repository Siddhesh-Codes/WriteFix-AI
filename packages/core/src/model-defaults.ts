export const DEFAULT_MODELS = {
  gemini: 'gemini-3.5-flash-lite',
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  openrouter: '',
} as const;

export const RATE_LIMITS = {
  gemini: { rpm: 15, rpd: 1500 },
  groq: { rpm: 30, rpd: 1000 },
  openai: { rpm: 500, rpd: Infinity },
  anthropic: { rpm: 50, rpd: Infinity },
  openrouter: { rpm: 200, rpd: Infinity },
  languagetool: { rpm: 20, rpd: Infinity },
} as const;
