import { WritingProvider, CorrectionRequest, CorrectionResponse, Mistake } from './types';

export class LanguageToolProvider implements WritingProvider {
  readonly name = 'languagetool';
  readonly requiresApiKey = false;

  async correct(request: CorrectionRequest): Promise<CorrectionResponse> {
    if (request.mode !== 'grammar_only' && request.mode !== 'grammar_punctuation') {
      throw new Error(`LanguageTool only supports grammar modes. Mode "${request.mode}" requires an AI provider key.`);
    }

    const params = new URLSearchParams();
    params.append('text', request.text);
    params.append('language', 'en-US');

    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformResponse(request.text, data);
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  private transformResponse(originalText: string, ltData: any): CorrectionResponse {
    const matches = ltData.matches || [];
    let correctedText = originalText;
    let offsetAdjustment = 0;
    const mistakes: Mistake[] = [];

    matches.sort((a: any, b: any) => a.offset - b.offset);

    for (const match of matches) {
      const originalPiece = originalText.substring(match.offset, match.offset + match.length);
      const replacementPiece = match.replacements?.[0]?.value || '';

      const ruleId = match.rule?.id || '';
      const ruleCategory = match.rule?.category?.id || '';

      let category: 'grammar' | 'spelling' | 'punctuation' | 'capitalization' = 'grammar';
      if (ruleCategory === 'TYPOS' || ruleId.includes('SPELL')) {
        category = 'spelling';
      } else if (ruleCategory === 'PUNCTUATION' || ruleId.includes('PUNCT')) {
        category = 'punctuation';
      } else if (ruleCategory === 'CASING' || ruleId.includes('CAPITALIZATION')) {
        category = 'capitalization';
      }

      mistakes.push({
        type: ruleId || 'grammar_error',
        description: match.message || 'Grammar or spelling issue detected.',
        original: originalPiece,
        replacement: replacementPiece,
        category,
      });

      if (replacementPiece && originalPiece) {
        const start = match.offset + offsetAdjustment;
        const end = start + match.length;
        correctedText = correctedText.substring(0, start) + replacementPiece + correctedText.substring(end);
        offsetAdjustment += replacementPiece.length - match.length;
      }
    }

    const confidence = Math.max(70, Math.min(99, 100 - mistakes.length * 5));

    return {
      corrected: correctedText,
      mistakes,
      confidence,
      provider: this.name,
    };
  }
}
