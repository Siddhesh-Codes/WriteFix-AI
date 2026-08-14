import { WritingProvider, CorrectionRequest, CorrectionResponse } from './types';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import { CorrectionResponseSchema } from './schema';
import { DEFAULT_MODELS } from './model-defaults';

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

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(request.text, request.mode, request.preferences);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey.trim()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.3,
          responseMimeType: 'application/json',
        }
      }),
    });

    if (!response.ok) {
      const errStatus = response.status;
      throw new Error(`Gemini API Error (${errStatus})`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      const parsed = JSON.parse(rawContent);

      if (Array.isArray(parsed.mistakes)) {
        parsed.mistakes = parsed.mistakes.map((m: any) => ({
          ...m,
          category: m.category && ['grammar', 'spelling', 'punctuation', 'capitalization'].includes(m.category)
            ? m.category
            : 'grammar',
        }));
      }

      const validated = CorrectionResponseSchema.parse({
        ...parsed,
        provider: 'gemini',
      });
      return validated;
    } catch (e: any) {
      return {
        corrected: rawContent.replace(/^```json\s*/, '').replace(/```$/, '').trim(),
        mistakes: [],
        confidence: 90,
        provider: 'gemini',
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }
}
