export type WriteFixMode =
  | 'grammar'
  | 'professional'
  | 'humanize'
  | 'concise'
  | 'academic'
  | 'indian-professional';

export type CorrectionMode =
  | WriteFixMode
  | 'grammar_only'
  | 'grammar_punctuation'
  | 'natural'
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

export interface Mistake {
  type: string;
  description: string;
  explanation?: string;
  original: string;
  replacement: string;
  category: 'grammar' | 'spelling' | 'punctuation' | 'capitalization' | 'style' | string;
}

export interface CorrectionRequest {
  text: string;
  mode: CorrectionMode;
  toneModifier?: CorrectionMode | string;
  preferences?: WritingPreference[];
  tone?: TonePreset;
  temperature?: number;
  topP?: number;
}

export interface CorrectionResponse {
  corrected: string;
  mistakes: Mistake[];
  confidence: number;
  provider: string;
  metadata?: Record<string, unknown>;
}

export interface WritingProvider {
  readonly name: string;
  readonly requiresApiKey: boolean;

  correct(request: CorrectionRequest): Promise<CorrectionResponse>;
  validateConfig(): Promise<boolean>;
}
