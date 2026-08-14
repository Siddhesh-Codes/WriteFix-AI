import {
  LanguageToolProvider,
  OfflineHeuristicProvider,
  GroqProvider,
  GeminiProvider,
  OpenAIProvider,
  AnthropicProvider,
  OpenRouterProvider,
  WritingProvider,
  CorrectionRequest,
  CorrectionResponse,
  computeTextStats,
  computeWritingScore,
} from '@writefix/core';
import { WebSettings, WebProvider } from '../types';
import { WebStorage } from './storage';
import { webRateLimiter } from './rate-limiter';

interface CachedEntry {
  response: CorrectionResponse;
  timestamp: number;
}

class WebOrchestrator {
  private cache = new Map<string, CachedEntry>();
  private languageToolProvider = new LanguageToolProvider();
  private heuristicProvider = new OfflineHeuristicProvider();

  private getCacheKey(text: string, mode: string, toneModifier: string | undefined, provider: string): string {
    return `${provider}::${mode}::${toneModifier || 'none'}::${text.trim()}`;
  }

  async correct(
    request: CorrectionRequest,
    settings: WebSettings,
    onStatusUpdate?: (status: string) => void
  ): Promise<CorrectionResponse> {
    const isGrammarMode = (request.mode === 'grammar' || request.mode === 'grammar_only' || request.mode === 'grammar_punctuation') && !request.toneModifier;
    let targetProvider: WebProvider = settings.activeProvider;

    // Auto-detect if user wants AI mode but active provider is languagetool
    if (!isGrammarMode && targetProvider === 'languagetool') {
      const configuredKey = Object.keys(settings.apiKeys).find((p) => settings.apiKeys[p]?.trim().length > 3);
      if (configuredKey) {
        targetProvider = configuredKey as WebProvider;
      }
    }

    const cacheKey = this.getCacheKey(request.text, request.mode, request.toneModifier, targetProvider);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 30) {
      onStatusUpdate?.('Loaded from instant cache');
      return cached.response;
    }

    // Rate Limiter Check
    if (!webRateLimiter.canExecute()) {
      const state = webRateLimiter.getState();
      if (state.cooldownSeconds > 0) {
        throw new Error(`Rate limit cooldown active. Please wait ${state.cooldownSeconds}s before retrying.`);
      }
      throw new Error('Rate limit exceeded (30 RPM). Please wait a moment.');
    }

    webRateLimiter.consume();
    onStatusUpdate?.(`Processing with ${targetProvider.toUpperCase()}...`);

    let response: CorrectionResponse;

    try {
      if (targetProvider === 'languagetool' || (isGrammarMode && !settings.apiKeys[targetProvider])) {
        try {
          onStatusUpdate?.('Checking grammar via LanguageTool API...');
          response = await this.languageToolProvider.correct(request);
        } catch (ltErr: any) {
          onStatusUpdate?.('LanguageTool API unavailable, falling back to Offline Heuristic Engine...');
          response = await this.heuristicProvider.correct(request);
        }
      } else if (targetProvider === 'offline-heuristic') {
        response = await this.heuristicProvider.correct(request);
      } else {
        const apiKey = settings.apiKeys[targetProvider];
        if (!apiKey) {
          // If no key configured for this provider, try fallback
          if (isGrammarMode) {
            onStatusUpdate?.('No AI key found, checking with LanguageTool...');
            try {
              response = await this.languageToolProvider.correct(request);
            } catch {
              response = await this.heuristicProvider.correct(request);
            }
          } else {
            return {
              corrected: request.text,
              mistakes: [],
              confidence: 0,
              provider: targetProvider,
              metadata: {
                requiresKey: true,
                requestedMode: request.mode,
                message: `Provider "${targetProvider.toUpperCase()}" requires an API key. Please configure it in Settings or switch to Grammar Only mode.`,
              },
            };
          }
        } else {
          const providerInstance = this.createProvider(targetProvider, apiKey, settings.selectedModels[targetProvider]);
          try {
            response = await providerInstance.correct(request);
          } catch (providerErr: any) {
            const msg = providerErr?.message || '';
            const is429 = msg.includes('429') || msg.toLowerCase().includes('rate limit');
            if (is429) {
              webRateLimiter.triggerCooldown(45);
            }

            // If grammar mode, fallback to LanguageTool or Heuristic
            if (isGrammarMode) {
              onStatusUpdate?.('AI Provider failed, falling back to grammar engine...');
              try {
                response = await this.languageToolProvider.correct(request);
              } catch {
                response = await this.heuristicProvider.correct(request);
              }
            } else {
              throw providerErr;
            }
          }
        }
      }
    } catch (err: any) {
      // Last resort fallback
      if (isGrammarMode) {
        response = await this.heuristicProvider.correct(request);
      } else {
        throw err;
      }
    }

    // Cache the response
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    });

    // Record into History
    try {
      const beforeStats = computeTextStats(request.text);
      const afterStats = computeTextStats(response.corrected);

      const grammarErrors = response.mistakes.filter((m) => m.category === 'grammar').length;
      const spellingErrors = response.mistakes.filter((m) => m.category === 'spelling').length;
      const punctuationErrors = response.mistakes.filter((m) => m.category === 'punctuation').length;
      const capitalizationErrors = response.mistakes.filter((m) => m.category === 'capitalization').length;

      const scoreBefore = computeWritingScore({
        grammarErrors,
        spellingErrors,
        punctuationErrors,
        capitalizationErrors,
        fleschKincaidGrade: beforeStats.fleschKincaidGrade,
      });

      const scoreAfter = computeWritingScore({
        grammarErrors: 0,
        spellingErrors: 0,
        punctuationErrors: 0,
        capitalizationErrors: 0,
        fleschKincaidGrade: afterStats.fleschKincaidGrade,
      });

      WebStorage.addHistory({
        originalText: request.text,
        correctedText: response.corrected,
        mode: request.mode,
        provider: response.provider,
        scoreBefore,
        scoreAfter,
        wordCount: afterStats.wordCount,
        charCount: afterStats.charCount,
        mistakesCount: response.mistakes.length,
      });
    } catch (e) {
      console.warn('Failed to record history', e);
    }

    return response;
  }

  private createProvider(provider: WebProvider, apiKey: string, model?: string): WritingProvider {
    switch (provider) {
      case 'gemini':
        return new GeminiProvider(apiKey, model || 'gemini-1.5-flash');
      case 'groq':
        return new GroqProvider(apiKey, model || 'llama-3.3-70b-versatile');
      case 'openai':
        return new OpenAIProvider(apiKey, model || 'gpt-4o-mini');
      case 'anthropic':
        return new AnthropicProvider(apiKey, model || 'claude-3-5-sonnet-20241022');
      case 'openrouter':
        return new OpenRouterProvider(apiKey, model || 'google/gemini-flash-1.5');
      case 'offline-heuristic':
        return this.heuristicProvider;
      case 'languagetool':
      default:
        return this.languageToolProvider;
    }
  }
}

export const globalWebOrchestrator = new WebOrchestrator();
