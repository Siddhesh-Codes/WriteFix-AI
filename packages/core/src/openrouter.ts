import { WritingProvider, CorrectionRequest, CorrectionResponse } from './types';
import { buildOptimizedSystemPrompt, buildUserTurn } from './prompt';
import { CorrectionResponseSchema } from './schema';

export class OpenRouterProvider implements WritingProvider {
  readonly name = 'openrouter';
  readonly requiresApiKey = true;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'google/gemini-2.5-flash') {
    this.apiKey = apiKey;
    this.model = model || 'google/gemini-2.5-flash';
  }

  async correct(request: CorrectionRequest): Promise<CorrectionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API Key is missing. Please configure it in options.');
    }

    const systemPrompt = buildOptimizedSystemPrompt(request.mode, request.toneModifier, request.preferences);
    const userPrompt = buildUserTurn(request.text);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey.trim()}`,
        'HTTP-Referer': 'https://writefix.ai',
        'X-Title': 'WriteFix AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: request.temperature ?? 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errStatus = response.status;
      throw new Error(`OpenRouter API Error (${errStatus})`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

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
        provider: 'openrouter',
      });
      return validated;
    } catch (e: any) {
      return {
        corrected: rawContent.replace(/^```json\s*/, '').replace(/```$/, '').trim(),
        mistakes: [],
        confidence: 90,
        provider: 'openrouter',
      };
    }
  }

  async validateConfig(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }
}
