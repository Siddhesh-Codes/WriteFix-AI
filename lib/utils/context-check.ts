/**
 * Helper to check if Chrome extension context is still valid.
 * Prevents "Extension context invalidated" uncaught errors when extension is reloaded.
 */
export function isExtensionContextValid(): boolean {
  try {
    return Boolean(typeof chrome !== 'undefined' && chrome?.runtime && chrome?.runtime?.id);
  } catch (e) {
    return false;
  }
}
