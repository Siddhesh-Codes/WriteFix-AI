export interface SelectionInfo {
  text: string;
  rect: DOMRectJSON;
  element: HTMLElement | null;
  elementType: 'textarea' | 'input' | 'contenteditable' | 'static';
}

export interface DOMRectJSON {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

let lastMouseX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
let lastMouseY = typeof window !== 'undefined' ? window.innerHeight / 3 : 300;
let lastActiveEditableElement: HTMLElement | null = null;

if (typeof window !== 'undefined') {
  const recordPointer = (e: MouseEvent | PointerEvent) => {
    if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  };

  window.addEventListener('mousemove', recordPointer, { passive: true });
  window.addEventListener('pointerdown', recordPointer, { passive: true, capture: true });
  window.addEventListener('mousedown', recordPointer, { passive: true, capture: true });

  const trackActiveEditable = (e: Event) => {
    if (e instanceof MouseEvent && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
    const target = (e.target || document.activeElement) as HTMLElement | null;
    if (target) {
      if (
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'INPUT' ||
        target.isContentEditable ||
        target.closest?.('[contenteditable="true"]')
      ) {
        lastActiveEditableElement = (target.closest?.('[contenteditable="true"]') as HTMLElement) || target;
      }
    }
  };

  window.addEventListener('contextmenu', trackActiveEditable, true);
  window.addEventListener('focusin', trackActiveEditable, true);
}

/**
 * Returns viewport-relative bounding box suitable for position: fixed overlay rendering.
 */
function createViewportRect(top: number, left: number, width: number, height: number): DOMRectJSON {
  const clampedTop = Math.max(10, Math.min(window.innerHeight - 50, top));
  const clampedLeft = Math.max(10, Math.min(window.innerWidth - 60, left));
  const w = Math.max(20, width || 160);
  const h = Math.max(20, height || 30);

  return {
    top: clampedTop,
    left: clampedLeft,
    width: w,
    height: h,
    bottom: clampedTop + h,
    right: clampedLeft + w,
  };
}

export function detectSelection(overrideText?: string): SelectionInfo | null {
  let activeEl = document.activeElement as HTMLElement | null;
  const selection = window.getSelection();

  // If activeElement lost focus due to context menu click, restore last captured editable element
  if (
    (!activeEl || activeEl === document.body) &&
    lastActiveEditableElement &&
    document.body.contains(lastActiveEditableElement)
  ) {
    activeEl = lastActiveEditableElement;
  }

  // 1. Check input/textarea selection
  if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
    const inputEl = activeEl as HTMLInputElement | HTMLTextAreaElement;
    const start = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : 0;
    const end = typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : 0;
    let selectedText = inputEl.value.substring(start, end).trim();

    if (!selectedText && overrideText) {
      selectedText = overrideText.trim();
    }

    if (selectedText.length > 0) {
      const rect = inputEl.getBoundingClientRect();
      const rectJSON = createViewportRect(
        rect.height > 0 ? rect.top : lastMouseY,
        rect.width > 0 ? rect.left : lastMouseX,
        rect.width || 200,
        rect.height || 40
      );

      return {
        text: selectedText,
        rect: rectJSON,
        element: activeEl,
        elementType: activeEl.tagName.toLowerCase() as 'textarea' | 'input',
      };
    }
  }

  // 2. Check contenteditable elements
  if (
    activeEl &&
    (activeEl.isContentEditable || activeEl.closest?.('[contenteditable="true"]'))
  ) {
    const editableContainer = (activeEl.closest?.('[contenteditable="true"]') as HTMLElement) || activeEl;
    let selectedText = selection && !selection.isCollapsed ? selection.toString().trim() : '';

    if (!selectedText && overrideText) {
      selectedText = overrideText.trim();
    }

    if (selectedText.length > 0) {
      let rectJSON: DOMRectJSON;
      try {
        const range = selection && !selection.isCollapsed ? selection.getRangeAt(0) : null;
        const rect = range ? range.getBoundingClientRect() : editableContainer.getBoundingClientRect();
        rectJSON = createViewportRect(
          rect.height > 0 ? rect.top : lastMouseY,
          rect.width > 0 ? rect.left : lastMouseX,
          rect.width || 200,
          rect.height || 30
        );
      } catch (e) {
        const rect = editableContainer.getBoundingClientRect();
        rectJSON = createViewportRect(
          rect.height > 0 ? rect.top : lastMouseY,
          rect.width > 0 ? rect.left : lastMouseX,
          rect.width || 200,
          rect.height || 30
        );
      }

      return {
        text: selectedText,
        rect: rectJSON,
        element: editableContainer,
        elementType: 'contenteditable',
      };
    }
  }

  // 3. Check general window selection (static text)
  if (selection && !selection.isCollapsed) {
    let selectedText = selection.toString().trim();
    if (!selectedText && overrideText) {
      selectedText = overrideText.trim();
    }

    if (selectedText.length > 0) {
      let rectJSON: DOMRectJSON;
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        rectJSON = createViewportRect(
          rect.height > 0 ? rect.top : lastMouseY,
          rect.width > 0 ? rect.left : lastMouseX,
          rect.width || 200,
          rect.height || 30
        );
      } catch (e) {
        rectJSON = createViewportRect(lastMouseY, lastMouseX, 200, 30);
      }

      const anchorNode = selection.anchorNode;
      const parentElement = anchorNode ? (anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as HTMLElement) : anchorNode.parentElement) : null;
      const editableContainer = parentElement ? parentElement.closest?.('[contenteditable="true"]') as HTMLElement : null;

      return {
        text: selectedText,
        rect: rectJSON,
        element: editableContainer || parentElement || activeEl,
        elementType: editableContainer ? 'contenteditable' : 'static',
      };
    }
  }

  // 4. Fallback when context menu overrideText is provided but window selection was blurred
  if (overrideText && overrideText.trim().length > 0) {
    const rectJSON = createViewportRect(lastMouseY, lastMouseX, 200, 30);
    const targetEl = lastActiveEditableElement || activeEl;

    return {
      text: overrideText.trim(),
      rect: rectJSON,
      element: targetEl,
      elementType: targetEl?.isContentEditable ? 'contenteditable' : targetEl?.tagName === 'TEXTAREA' ? 'textarea' : targetEl?.tagName === 'INPUT' ? 'input' : 'static',
    };
  }

  return null;
}

