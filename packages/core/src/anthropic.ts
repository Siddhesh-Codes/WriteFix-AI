import { WritingProvider, CorrectionRequest, CorrectionResponse } from './types';
import { buildOptimizedSystemPrompt, buildUserTurn } from './prompt';
import { CorrectionResponseSchema } from './schema';
import { DEFAULT_MODELS } from './model-defaults';

export class AnthropicProvider implements WritingProvider {
  readonly name = 'anthropic';
  readonly requiresApiKey = true;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODELS.anthropic) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODELS.anthropic;
  }

  async correct(request: CorrectionRequest): Promise<CorrectionResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API Key is missing. Please configure it in options.');
    }

    const systemPrompt = buildOptimizedSystemPrompt(request.mode, request.toneModifier, request.preferences);
    const userPrompt = buildUserTurn(request.text);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errStatus = response.status;
      throw new Error(`Anthropic API Error (${errStatus})`);
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text || '';

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
        provider: 'anthropic',
      });
      return validated;
    } catch (e: any) {
      return {
        corrected: rawContent.replace(/^```json\s*/, '').replace(/```$/, '').trim(),
        mistakes: [],
        confidence: 90,
        provider: 'anthropic',
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }
}
