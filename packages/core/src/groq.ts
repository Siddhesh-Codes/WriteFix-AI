import { WritingProvider, CorrectionRequest, CorrectionResponse } from './types';
import { buildOptimizedSystemPrompt, buildUserTurn } from './prompt';
import { CorrectionResponseSchema } from './schema';
import { DEFAULT_MODELS } from './model-defaults';
import { crossCheckMistakesWithDiff } from './diff-engine';

export class GroqProvider implements WritingProvider {
  readonly name = 'groq';
  readonly requiresApiKey = true;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODELS.groq) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODELS.groq;
  }

  private async callGroqApi(messages: Array<{ role: string; content: string }>, temperature = 0.2, topP = 0.85): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        top_p: topP,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errStatus = response.status;
      const errText = await response.text();
      throw new Error(`Groq API Error (${errStatus}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async correct(request: CorrectionRequest): Promise<CorrectionResponse> {
    if (!this.apiKey) {
      throw new Error('Groq API Key is missing. Please configure it in options.');
    }

    const systemPrompt = buildOptimizedSystemPrompt(request.mode, request.toneModifier, request.preferences);
    const userTurn = buildUserTurn(request.text);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userTurn },
    ];

    let rawContent = await this.callGroqApi(messages, request.temperature ?? 0.2, request.topP ?? 0.85);

    let parsed: any = null;

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Single retry-with-reprompt fallback
      try {
        const retryMessages = [
          ...messages,
          { role: 'assistant', content: rawContent },
          {
            role: 'user',
            content: 'CRITICAL SYNTAX FIX: Your previous response was invalid JSON. Fix all formatting and return ONLY the valid JSON object with keys "corrected", "mistakes", "confidence". Do not include markdown code fences.',
          },
        ];
        const retryContent = await this.callGroqApi(retryMessages, 0.1, 0.8);
        parsed = JSON.parse(retryContent.replace(/^```json\s*/, '').replace(/```$/, '').trim());
      } catch {
        parsed = null;
      }
    }

    if (parsed && typeof parsed === 'object') {
      const rawMistakes = Array.isArray(parsed.mistakes) ? parsed.mistakes : [];
      const crossChecked = crossCheckMistakesWithDiff(
        request.text,
        parsed.corrected || request.text,
        rawMistakes
      );

      return CorrectionResponseSchema.parse({
        corrected: parsed.corrected || request.text,
        mistakes: crossChecked,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 94,
        provider: 'groq',
      });
    }

    // Graceful fallback when JSON cannot be parsed even after retry
    const fallbackCorrected = rawContent.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    const crossChecked = crossCheckMistakesWithDiff(request.text, fallbackCorrected || request.text, []);

    return {
      corrected: fallbackCorrected || request.text,
      mistakes: crossChecked,
      confidence: 80,
      provider: 'groq',
    };
  }

  async validateConfig(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }
}
