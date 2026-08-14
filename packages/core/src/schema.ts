import { z } from 'zod';

export const MistakeCategorySchema = z.enum([
  'grammar',
  'spelling',
  'punctuation',
  'capitalization'
]);

export const MistakeSchema = z.object({
  type: z.string(),
  description: z.string(),
  original: z.string(),
  replacement: z.string(),
  category: MistakeCategorySchema.catch('grammar'),
});

export const CorrectionResponseSchema = z.object({
  corrected: z.string(),
  mistakes: z.array(MistakeSchema),
  confidence: z.number().min(0).max(100),
  provider: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type CorrectionResponseZod = z.infer<typeof CorrectionResponseSchema>;
