import { SelectionInfo } from './detector';
import { logger } from '../utils/logger';

export interface ReplaceResult {
  success: boolean;
  tier: 1 | 2 | 3 | 4;
  method: string;
  requiresPaste?: boolean;
}

export class TextReplacer {
  static async replace(info: SelectionInfo, newText: string): Promise<ReplaceResult> {
    const element = info.element;

    if (element) {
      try {
        element.focus();
      } catch (e) {
        logger.debug('Focus on element failed or not required', e);
      }
    }

    // Tier 1: Try execCommand ('insertText') - works for rich contenteditables
    try {
      if (document.execCommand('insertText', false, newText)) {
        if (element) {
          element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        }
        logger.debug('Tier 1 execCommand succeeded');
        return { success: true, tier: 1, method: 'execCommand' };
      }
    } catch (e) {
      logger.debug('Tier 1 execCommand failed, falling through to Tier 2', e);
    }

    // Tier 2: Try nativeInputValueSetter for React/Vue controlled input & textarea (Online Notepad Fix)
    if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element.tagName === 'TEXTAREA' || element.tagName === 'INPUT')) {
      try {
        const isTextArea = element.tagName.toLowerCase() === 'textarea' || element instanceof HTMLTextAreaElement;
        const targetPrototype = isTextArea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        
        const descriptor = Object.getOwnPropertyDescriptor(targetPrototype, 'value');
        const nativeSetter = descriptor?.set;

        const inputEl = element as HTMLInputElement | HTMLTextAreaElement;
        const start = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : 0;
        const end = typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : inputEl.value.length;
        const currentVal = inputEl.value || '';
        const updatedVal = currentVal.substring(0, start) + newText + currentVal.substring(end);

        if (nativeSetter) {
          nativeSetter.call(element, updatedVal);
        } else {
          inputEl.value = updatedVal;
        }

        const newCursorPos = start + newText.length;
        try {
          inputEl.setSelectionRange(newCursorPos, newCursorPos);
        } catch (e) {
          // Ignore selection range errors on unsupported input types (e.g. email/number)
        }

        // Dispatch synthetic events with bubbles: true
        inputEl.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        
        logger.debug('Tier 2 nativeInputValueSetter succeeded for ' + element.tagName);
        return { success: true, tier: 2, method: 'nativeInputValueSetter' };
      } catch (e) {
        logger.debug('Tier 2 nativeSetter failed, falling through to Tier 3', e);
      }
    }

    // Tier 3: Range API + beforeinput Event for contenteditable elements
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        if (element) {
          element.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: newText, bubbles: true, cancelable: true }));
        }

        range.deleteContents();
        const textNode = document.createTextNode(newText);
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        if (element) {
          element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        }

        logger.debug('Tier 3 Range API succeeded');
        return { success: true, tier: 3, method: 'RangeAPI' };
      }
    } catch (e) {
      logger.debug('Tier 3 Range API failed, falling through to Tier 4', e);
    }

    // Tier 4: Clipboard Fallback with user paste instruction
    try {
      await navigator.clipboard.writeText(newText);
      logger.debug('Tier 4 Clipboard fallback executed');
      return { success: true, tier: 4, method: 'clipboard', requiresPaste: true };
    } catch (e) {
      logger.error('Tier 4 Clipboard fallback failed', e);
    }

    return { success: false, tier: 4, method: 'failed' };
  }
}
