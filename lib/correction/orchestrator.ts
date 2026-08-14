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
  computeWritingScore
} from '@writefix/core';
import { SettingsStorage } from '../storage/settings';
import { HistoryStorage } from '../storage/history';
import { Settings } from '../storage/types';
import { globalResponseCache } from '../cache/response-cache';
import { logger } from '../utils/logger';

export class CorrectionOrchestrator {
  private languageToolProvider = new LanguageToolProvider();

  async correct(request: CorrectionRequest): Promise<CorrectionResponse> {
    const settings = await SettingsStorage.get();
    const isGrammarMode = request.mode === 'grammar_only' || request.mode === 'grammar_punctuation';

    // Auto-detect best available provider if AI mode requested
    let targetProviderName: Settings['activeProvider'] = settings.activeProvider || 'languagetool';

    if (!isGrammarMode) {
      if (targetProviderName === 'languagetool' || !settings.apiKeys?.[targetProviderName]) {
        const availableAIProvider = Object.keys(settings.apiKeys || {}).find(
          (p) => Boolean(settings.apiKeys[p] && settings.apiKeys[p].trim().length > 3)
        ) as Settings['activeProvider'] | undefined;
        if (availableAIProvider) {
          targetProviderName = availableAIProvider;
        }
      }
    }

    // Check response cache hit
    const cached = await globalResponseCache.get(request.text, request.mode, targetProviderName, settings.preferences);
    if (cached) {
      logger.debug('Response cache hit for mode: ' + request.mode);
      return cached;
    }

    let response: CorrectionResponse;

    if (isGrammarMode && targetProviderName === 'languagetool') {
      try {
        response = await this.languageToolProvider.correct(request);
      } catch (ltErr) {
        logger.debug('LanguageTool failed, falling back to OfflineHeuristicProvider:', ltErr);
        const heuristic = new OfflineHeuristicProvider();
        response = await heuristic.correct(request);
      }
    } else {
      const apiKey = settings.apiKeys?.[targetProviderName] || '';

      if (!apiKey && !isGrammarMode) {
        return {
          corrected: request.text,
          mistakes: [],
          confidence: 0,
          provider: 'none',
          metadata: {
            requiresKey: true,
            requestedMode: request.mode,
            message: `Mode "${request.mode}" requires an AI provider API key (Groq, Gemini, OpenAI, etc.).`
          }
        };
      }

      const providerInstance = this.getProviderInstance(targetProviderName, settings);

      try {
        response = await providerInstance.correct(request);
      } catch (error: any) {
        logger.error(`Provider "${targetProviderName}" failed`, error);

        if (isGrammarMode) {
          try {
            response = await this.languageToolProvider.correct(request);
          } catch (ltErr) {
            const heuristic = new OfflineHeuristicProvider();
            response = await heuristic.correct(request);
          }
        } else {
          return {
            corrected: request.text,
            mistakes: [],
            confidence: 0,
            provider: targetProviderName,
            metadata: {
              requiresKey: true,
              requestedMode: request.mode,
              message: error?.message || `Provider "${targetProviderName}" error.`
            }
          };
        }
      }
    }

    // Store response in cache
    await globalResponseCache.set(request.text, request.mode, targetProviderName, settings.preferences, response);

    // Record history entry
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

    await HistoryStorage.add({
      originalText: request.text,
      correctedText: response.corrected,
      mode: request.mode,
      provider: response.provider,
      wordCount: afterStats.wordCount,
      scoreBefore,
      scoreAfter,
    });

    return response;
  }

  private getProviderInstance(providerName: Settings['activeProvider'], settings: any): WritingProvider {
    const apiKey = (settings.apiKeys && settings.apiKeys[providerName]) || '';
    const selectedModel = (settings.selectedModels && settings.selectedModels[providerName]) || '';

    switch (providerName) {
      case 'groq':
        return new GroqProvider(apiKey, selectedModel);
      case 'gemini':
        return new GeminiProvider(apiKey, selectedModel);
      case 'openai':
        return new OpenAIProvider(apiKey, selectedModel);
      case 'anthropic':
        return new AnthropicProvider(apiKey, selectedModel);
      case 'openrouter':
        return new OpenRouterProvider(apiKey, selectedModel);
      case 'languagetool':
      default:
        return this.languageToolProvider;
    }
  }
}

export const globalOrchestrator = new CorrectionOrchestrator();
