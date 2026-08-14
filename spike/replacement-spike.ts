/**
 * Phase 0 — Replacement Engine Spike (De-risking)
 * 
 * Standalone harness to test text replacement across 4 tiers:
 * Tier 1: execCommand('insertText')
 * Tier 2: nativeInputValueSetter + synthetic InputEvent (React controlled input workaround)
 * Tier 3: beforeinput + Range API (Range.deleteContents + Range.insertNode)
 * Tier 4: navigator.clipboard.writeText (Clipboard fallback)
 */

export interface SpikeTestResult {
  site: string;
  elementType: 'textarea' | 'input' | 'contenteditable' | 'unknown';
  tierAttempted: 1 | 2 | 3 | 4;
  tierSucceeded: 1 | 2 | 3 | 4 | null;
  logs: string[];
  revertedAfter500ms: boolean;
  error?: string;
}

export function getActiveElementInfo(): { element: HTMLElement | null; type: 'textarea' | 'input' | 'contenteditable' | 'unknown'; selectedText: string } {
  const activeEl = document.activeElement as HTMLElement | null;
  const selection = window.getSelection();
  const selectedText = selection ? selection.toString() : '';

  if (!activeEl) {
    return { element: null, type: 'unknown', selectedText };
  }

  const tagName = activeEl.tagName.toLowerCase();
  if (tagName === 'textarea') {
    const inputEl = activeEl as HTMLTextAreaElement;
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const valText = inputEl.value.substring(start, end);
    return { element: activeEl, type: 'textarea', selectedText: valText || selectedText };
  }
  if (tagName === 'input') {
    const inputEl = activeEl as HTMLInputElement;
    const start = inputEl.selectionStart || 0;
    const end = inputEl.selectionEnd || 0;
    const valText = inputEl.value.substring(start, end);
    return { element: activeEl, type: 'input', selectedText: valText || selectedText };
  }
  if (activeEl.isContentEditable || activeEl.getAttribute('contenteditable') === 'true' || activeEl.closest('[contenteditable="true"]')) {
    const editableContainer = (activeEl.isContentEditable ? activeEl : activeEl.closest('[contenteditable="true"]')) as HTMLElement;
    return { element: editableContainer || activeEl, type: 'contenteditable', selectedText };
  }

  return { element: activeEl, type: 'unknown', selectedText };
}

/**
 * Execute Tier 1: execCommand('insertText')
 */
export function tryTier1(text: string): boolean {
  try {
    return document.execCommand('insertText', false, text);
  } catch (e) {
    console.warn('[WriteFix Spike] Tier 1 failed with error:', e);
    return false;
  }
}

/**
 * Execute Tier 2: nativeInputValueSetter + synthetic InputEvent (for React inputs)
 */
export function tryTier2(element: HTMLElement, replacementText: string): boolean {
  try {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const prototype = element instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      const nativeSetter = descriptor?.set;

      if (!nativeSetter) return false;

      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const originalVal = element.value;
      const newVal = originalVal.substring(0, start) + replacementText + originalVal.substring(end);

      nativeSetter.call(element, newVal);
      element.selectionStart = start + replacementText.length;
      element.selectionEnd = start + replacementText.length;

      // Dispatch bubbles input & change events for React/Vue/Angular
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[WriteFix Spike] Tier 2 failed with error:', e);
    return false;
  }
}

/**
 * Execute Tier 3: Range API + beforeinput Event
 */
export function tryTier3(replacementText: string): boolean {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);

    // Fire synthetic beforeinput event
    const targetEl = range.commonAncestorContainer.parentElement || document.activeElement;
    if (targetEl) {
      const beforeInputEvent = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: replacementText,
        bubbles: true,
        cancelable: true,
      });
      targetEl.dispatchEvent(beforeInputEvent);
    }

    range.deleteContents();
    const textNode = document.createTextNode(replacementText);
    range.insertNode(textNode);

    // Move cursor to end of inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    if (targetEl) {
      targetEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return true;
  } catch (e) {
    console.warn('[WriteFix Spike] Tier 3 failed with error:', e);
    return false;
  }
}

/**
 * Execute Tier 4: Clipboard Fallback
 */
export async function tryTier4(replacementText: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(replacementText);
    console.log('[WriteFix Spike] Tier 4: Copied replacement text to clipboard fallback.');
    return true;
  } catch (e) {
    console.error('[WriteFix Spike] Tier 4 failed:', e);
    return false;
  }
}

/**
 * Run full 4-tier spike test on active text selection
 */
export async function runSpikeTest(replacementText = ' [WriteFix AI Replaced] '): Promise<SpikeTestResult> {
  const logs: string[] = [];
  const site = window.location.hostname;
  const { element, type, selectedText } = getActiveElementInfo();

  logs.push(`Site: ${site}, Element Type: ${type}, Selected: "${selectedText}"`);

  if (!element && !selectedText) {
    return {
      site,
      elementType: type,
      tierAttempted: 1,
      tierSucceeded: null,
      logs,
      revertedAfter500ms: false,
      error: 'No active element or text selection found.',
    };
  }

  const initialText = element ? (element.isContentEditable ? element.innerText : (element as HTMLInputElement).value) : '';

  // Attempt Tier 1
  logs.push('Attempting Tier 1 (execCommand)...');
  const t1Success = tryTier1(replacementText);
  if (t1Success) {
    logs.push('Tier 1 returned true. Verifying persistence in 500ms...');
    const reverted = await verifyPersistence(element, initialText);
    if (!reverted) {
      logs.push('SUCCESS: Tier 1 persisted without framework revert!');
      return { site, elementType: type, tierAttempted: 1, tierSucceeded: 1, logs, revertedAfter500ms: false };
    }
    logs.push('REVERTED: Tier 1 was reverted by site framework.');
  } else {
    logs.push('Tier 1 returned false.');
  }

  // Attempt Tier 2 (for input/textarea)
  if (element && (type === 'input' || type === 'textarea')) {
    logs.push('Attempting Tier 2 (nativeInputValueSetter + InputEvent)...');
    const t2Success = tryTier2(element, replacementText);
    if (t2Success) {
      logs.push('Tier 2 returned true. Verifying persistence in 500ms...');
      const reverted = await verifyPersistence(element, initialText);
      if (!reverted) {
        logs.push('SUCCESS: Tier 2 persisted without framework revert!');
        return { site, elementType: type, tierAttempted: 2, tierSucceeded: 2, logs, revertedAfter500ms: false };
      }
      logs.push('REVERTED: Tier 2 was reverted by site framework.');
    }
  }

  // Attempt Tier 3 (Range API + beforeinput)
  logs.push('Attempting Tier 3 (Range API + beforeinput)...');
  const t3Success = tryTier3(replacementText);
  if (t3Success) {
    logs.push('Tier 3 returned true. Verifying persistence in 500ms...');
    const reverted = await verifyPersistence(element, initialText);
    if (!reverted) {
      logs.push('SUCCESS: Tier 3 persisted without framework revert!');
      return { site, elementType: type, tierAttempted: 3, tierSucceeded: 3, logs, revertedAfter500ms: false };
    }
    logs.push('REVERTED: Tier 3 was reverted by site framework.');
  }

  // Attempt Tier 4 (Clipboard fallback)
  logs.push('Attempting Tier 4 (Clipboard fallback)...');
  const t4Success = await tryTier4(replacementText);
  if (t4Success) {
    logs.push('Tier 4 succeeded (text copied to clipboard).');
    return { site, elementType: type, tierAttempted: 4, tierSucceeded: 4, logs, revertedAfter500ms: false };
  }

  return { site, elementType: type, tierAttempted: 4, tierSucceeded: null, logs, revertedAfter500ms: true, error: 'All 4 tiers failed.' };
}

function verifyPersistence(element: HTMLElement | null, initialText: string): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!element) return resolve(false);
      const currentText = element.isContentEditable ? element.innerText : (element as HTMLInputElement).value;
      // If currentText reverted back to initialText, it failed
      const reverted = currentText === initialText;
      resolve(reverted);
    }, 500);
  });
}
