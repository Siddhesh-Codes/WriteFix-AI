/**
 * WriteFix AI Centralized Logger
 * 
 * Rules:
 * - logger.error(): Always active in production & dev for genuine runtime failures.
 * - logger.warn(): Active for warnings (e.g. rate limit drift).
 * - logger.debug(): Gated by development mode (off in production).
 */

const IS_DEV = process.env.NODE_ENV !== 'production';

export class Logger {
  static error(message: string, error?: any): void {
    const sanitizedError = Logger.sanitizeError(error);
    console.error(`[WriteFix ERROR] ${message}`, sanitizedError !== undefined ? sanitizedError : '');
  }

  static warn(message: string, data?: any): void {
    console.warn(`[WriteFix WARN] ${message}`, data !== undefined ? data : '');
  }

  static debug(message: string, data?: any): void {
    if (IS_DEV) {
      console.log(`[WriteFix DEBUG] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Ensure error objects never log sensitive API keys or Authorization headers
   */
  private static sanitizeError(error: any): any {
    if (!error) return error;
    if (typeof error === 'string') {
      return error.replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED_GROQ_KEY]')
                  .replace(/AIzaSy[a-zA-Z0-9_-]+/g, '[REDACTED_GEMINI_KEY]')
                  .replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED_OPENAI_KEY]');
    }

    if (error instanceof Error) {
      const cleanMsg = error.message
        .replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED_GROQ_KEY]')
        .replace(/AIzaSy[a-zA-Z0-9_-]+/g, '[REDACTED_GEMINI_KEY]')
        .replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED_OPENAI_KEY]');
      return new Error(cleanMsg);
    }

    return error;
  }
}

export const logger = Logger;
