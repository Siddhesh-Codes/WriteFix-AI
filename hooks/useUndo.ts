import { useState, useCallback } from 'react';

export interface UndoItem {
  element: HTMLElement | null;
  originalText: string;
  timestamp: number;
}

export function useUndo() {
  const [stack, setStack] = useState<UndoItem[]>([]);

  const pushUndo = useCallback((element: HTMLElement | null, originalText: string) => {
    setStack((prev) => [...prev, { element, originalText, timestamp: Date.now() }]);
  }, []);

  const popUndo = useCallback((): UndoItem | null => {
    if (stack.length === 0) return null;

    const last = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, prev.length - 1));
    return last;
  }, [stack]);

  return {
    canUndo: stack.length > 0,
    pushUndo,
    popUndo,
    undoCount: stack.length,
  };
}
