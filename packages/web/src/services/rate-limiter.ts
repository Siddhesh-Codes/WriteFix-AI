import { RateLimitState } from '../types';

type Listener = (state: RateLimitState) => void;

class TokenBucketRateLimiter {
  private maxTokens: number = 30;
  private tokens: number = 30;
  private refillIntervalMs: number = 2000; // 1 token every 2s (~30 RPM)
  private lastRefillTime: number = Date.now();
  private isThrottled: boolean = false;
  private cooldownUntil: number = 0;
  private totalRequests: number = 0;
  private listeners: Set<Listener> = new Set();
  private timerId: any = null;

  constructor() {
    this.startRefillLoop();
  }

  private startRefillLoop() {
    if (typeof window === 'undefined') return;
    this.timerId = setInterval(() => {
      this.refill();
    }, 1000);
  }

  private refill() {
    const now = Date.now();
    if (this.cooldownUntil > 0) {
      if (now >= this.cooldownUntil) {
        this.isThrottled = false;
        this.cooldownUntil = 0;
        this.tokens = Math.max(this.tokens, 5); // grant initial burst tokens after cooldown
      }
    } else {
      const elapsed = now - this.lastRefillTime;
      const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs);
      if (tokensToAdd > 0) {
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefillTime = now;
      }
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): RateLimitState {
    const now = Date.now();
    const cooldownSeconds = this.cooldownUntil > now ? Math.ceil((this.cooldownUntil - now) / 1000) : 0;

    return {
      tokensRemaining: this.tokens,
      maxTokens: this.maxTokens,
      cooldownSeconds,
      isThrottled: this.isThrottled || cooldownSeconds > 0,
      totalRequestsInSession: this.totalRequests,
      lastRequestTime: this.lastRefillTime,
    };
  }

  public canExecute(): boolean {
    this.refill();
    return !this.isThrottled && this.tokens > 0 && this.cooldownUntil <= Date.now();
  }

  public consume(): boolean {
    this.refill();
    if (!this.canExecute()) {
      return false;
    }
    this.tokens -= 1;
    this.totalRequests += 1;
    this.notify();
    return true;
  }

  public triggerCooldown(seconds: number = 30) {
    this.isThrottled = true;
    this.cooldownUntil = Date.now() + seconds * 1000;
    this.tokens = 0;
    this.notify();
  }

  private notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (e) {
        console.error('RateLimiter listener error', e);
      }
    }
  }
}

export const webRateLimiter = new TokenBucketRateLimiter();
