import { z } from 'zod';

export const MistakeCategorySchema = z.enum([
  'grammar',
  'spelling',
  'punctuation',
  'capitalization',
  'style',
]).or(z.string());

export const MistakeSchema = z.object({
  type: z.string().optional(),
  description: z.string().optional(),
  explanation: z.string().optional(),
  original: z.string(),
  replacement: z.string(),
  category: z.string().default('grammar'),
}).transform((val) => ({
  type: val.type || val.category || 'grammar',
  description: val.explanation || val.description || 'Improvement made.',
  explanation: val.explanation || val.description || 'Improvement made.',
  original: val.original,
  replacement: val.replacement,
  category: (val.category || 'grammar') as 'grammar' | 'spelling' | 'punctuation' | 'capitalization' | 'style' | string,
}));

export const CorrectionResponseSchema = z.object({
  corrected: z.string(),
  mistakes: z.array(MistakeSchema).default([]),
  confidence: z.number().min(0).max(100).default(95),
  provider: z.string().default('ai'),
  metadata: z.record(z.unknown()).optional(),
});

export type CorrectionResponseZod = z.infer<typeof CorrectionResponseSchema>;
