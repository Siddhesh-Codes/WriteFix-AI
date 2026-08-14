import { WritingProvider, CorrectionRequest, CorrectionResponse } from './types';
import { RATE_LIMITS } from './model-defaults';

interface RateLimitTracker {
  requestsInWindow: number[];
  isExhaustedUntil: number;
}

export class FallbackChain {
  private trackers = new Map<string, RateLimitTracker>();

  async executeWithFallback(
    providers: WritingProvider[],
    request: CorrectionRequest
  ): Promise<CorrectionResponse> {
    const errors: string[] = [];

    for (const provider of providers) {
      if (this.isRateLimited(provider.name)) {
        continue;
      }

      try {
        this.recordRequest(provider.name);
        return await provider.correct(request);
      } catch (err: any) {
        const is429 = err.message && (err.message.includes('429') || err.message.toLowerCase().includes('rate limit'));
        if (is429) {
          this.markRateLimited(provider.name, 60000);
        }
        errors.push(`${provider.name}: ${err.message}`);
      }
    }

    throw new Error(`All providers in fallback chain failed: ${errors.join('; ')}`);
  }

  private isRateLimited(providerName: string): boolean {
    const tracker = this.trackers.get(providerName);
    if (!tracker) return false;

    if (Date.now() < tracker.isExhaustedUntil) {
      return true;
    }

    const limits = (RATE_LIMITS as any)[providerName];
    if (limits && limits.rpm < Infinity) {
      const now = Date.now();
      tracker.requestsInWindow = tracker.requestsInWindow.filter((t) => now - t < 60000);
      if (tracker.requestsInWindow.length >= limits.rpm) {
        return true;
      }
    }

    return false;
  }

  private recordRequest(providerName: string): void {
    let tracker = this.trackers.get(providerName);
    if (!tracker) {
      tracker = { requestsInWindow: [], isExhaustedUntil: 0 };
      this.trackers.set(providerName, tracker);
    }
    tracker.requestsInWindow.push(Date.now());
  }

  private markRateLimited(providerName: string, cooldownMs: number): void {
    let tracker = this.trackers.get(providerName);
    if (!tracker) {
      tracker = { requestsInWindow: [], isExhaustedUntil: 0 };
      this.trackers.set(providerName, tracker);
    }
    tracker.isExhaustedUntil = Date.now() + cooldownMs;
  }
}
