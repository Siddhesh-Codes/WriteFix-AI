import { WritingProvider, CorrectionRequest, CorrectionResponse } from './types';
import { buildOptimizedSystemPrompt, buildUserTurn } from './prompt';
import { CorrectionResponseSchema } from './schema';
import { DEFAULT_MODELS } from './model-defaults';
import { crossCheckMistakesWithDiff } from './diff-engine';

export class GeminiProvider implements WritingProvider {
  readonly name = 'gemini';
  readonly requiresApiKey = true;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODELS.gemini) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODELS.gemini;
  }

  async correct(request: CorrectionRequest): Promise<CorrectionResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is missing. Please configure it in options.');
    }

    const systemPrompt = buildOptimizedSystemPrompt(request.mode, request.toneModifier, request.preferences);
    const userTurn = buildUserTurn(request.text);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey.trim()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userTurn }]
          }
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          topP: request.topP ?? 0.85,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              corrected: { type: 'STRING' },
              mistakes: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    original: { type: 'STRING' },
                    replacement: { type: 'STRING' },
                    category: { type: 'STRING' },
                    explanation: { type: 'STRING' }
                  },
                  required: ['original', 'replacement']
                }
              },
              confidence: { type: 'INTEGER' }
            },
            required: ['corrected', 'confidence']
          }
        }
      }),
    });

    if (!response.ok) {
      const errStatus = response.status;
      const errText = await response.text();
      throw new Error(`Gemini API Error (${errStatus}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      const parsed = JSON.parse(rawContent);

      const rawMistakes = Array.isArray(parsed.mistakes) ? parsed.mistakes : [];
      const crossCheckedMistakes = crossCheckMistakesWithDiff(
        request.text,
        parsed.corrected || request.text,
        rawMistakes
      );

      const validated = CorrectionResponseSchema.parse({
        corrected: parsed.corrected || request.text,
        mistakes: crossCheckedMistakes,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 95,
        provider: 'gemini',
      });
      return validated;
    } catch (e: any) {
      const cleaned = rawContent.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      try {
        const fallbackParsed = JSON.parse(cleaned);
        const crossChecked = crossCheckMistakesWithDiff(
          request.text,
          fallbackParsed.corrected || request.text,
          fallbackParsed.mistakes || []
        );
        return CorrectionResponseSchema.parse({
          ...fallbackParsed,
          mistakes: crossChecked,
          provider: 'gemini',
        });
      } catch {
        const crossChecked = crossCheckMistakesWithDiff(request.text, cleaned || request.text, []);
        return {
          corrected: cleaned || request.text,
          mistakes: crossChecked,
          confidence: 85,
          provider: 'gemini',
        };
      }
    }
  }

  async validateConfig(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }
}
