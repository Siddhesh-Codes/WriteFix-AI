import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import { detectSelection, SelectionInfo } from '@/lib/selection/detector';
import { TextReplacer } from '@/lib/selection/replacer';
import { FloatingToolbar } from '@/components/inline-popup/FloatingToolbar';
import { InlinePopup } from '@/components/inline-popup/InlinePopup';
import { CorrectionMode } from '@/lib/storage/types';
import { SettingsStorage } from '@/lib/storage/settings';
import { logger } from '@/lib/utils/logger';
import { isExtensionContextValid } from '@/lib/utils/context-check';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    logger.debug('Content Script initialized.');

    // 1. Create or reuse Shadow DOM Host safely
    let hostEl = document.getElementById('writefix-ai-shadow-root') as HTMLDivElement | null;
    if (hostEl) {
      hostEl.remove();
    }

    hostEl = document.createElement('div');
    hostEl.id = 'writefix-ai-shadow-root';
    const targetParent = document.body || document.documentElement;
    if (targetParent) {
      targetParent.appendChild(hostEl);
    }

    const shadowRoot = hostEl.attachShadow({ mode: 'open' });

    // Inject CSS keyframe animations into Shadow Root
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes wf-fade-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes wf-scale-up {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes wf-spin {
        to { transform: rotate(360deg); }
      }
      ::-webkit-scrollbar {
        width: 6px;
        height: 4px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    shadowRoot.appendChild(styleEl);

    const containerEl = document.createElement('div');
    containerEl.id = 'writefix-container';
    shadowRoot.appendChild(containerEl);

    const root = createRoot(containerEl);

    let currentSelection: SelectionInfo | null = null;
    let activeMode: CorrectionMode | null = null;
    let showToolbar = false;
    let showPopup = false;
    let configuredShortcut = 'Ctrl+Shift+G';

    // Load initial settings safely
    try {
      if (isExtensionContextValid()) {
        const settings = await SettingsStorage.get();
        configuredShortcut = settings.customShortcut || 'Ctrl+Shift+G';
      }
    } catch (e) {
      // Fallback defaults
    }

    // Watch settings changes safely
    if (isExtensionContextValid()) {
      try {
        SettingsStorage.watch((newSettings) => {
          if (newSettings.customShortcut) {
            configuredShortcut = newSettings.customShortcut;
          }
        });
      } catch (e) {}
    }

    function renderUI() {
      root.render(
        React.createElement(React.Fragment, null, [
          showToolbar && currentSelection
            ? React.createElement(FloatingToolbar, {
                key: 'toolbar',
                rect: currentSelection.rect,
                onSelectMode: (mode: CorrectionMode) => {
                  activeMode = mode;
                  showToolbar = false;
                  showPopup = true;
                  renderUI();
                },
                onCopy: async () => {
                  if (currentSelection) {
                    await navigator.clipboard.writeText(currentSelection.text);
                    showToast('Copied selected text to clipboard', 'info');
                    showToolbar = false;
                    renderUI();
                  }
                },
                onDismiss: () => {
                  showToolbar = false;
                  renderUI();
                },
              })
            : null,

          showPopup && currentSelection
            ? React.createElement(InlinePopup, {
                key: 'popup',
                originalText: currentSelection.text,
                initialMode: activeMode || 'grammar_only',
                rect: currentSelection.rect,
                onReplace: async (newText: string) => {
                  if (currentSelection) {
                    const result = await TextReplacer.replace(currentSelection, newText);
                    if (result.requiresPaste) {
                      showToast('Copied replacement text to clipboard. Press Ctrl+V to paste', 'info');
                    } else {
                      showToast('Text replaced successfully', 'success');
                    }
                  }
                  showPopup = false;
                  renderUI();
                },
                onCopy: async (text: string) => {
                  await navigator.clipboard.writeText(text);
                  showToast('Copied to clipboard', 'info');
                },
                onClose: () => {
                  showPopup = false;
                  renderUI();
                },
              })
            : null,
        ])
      );
    }

    // Note: Text selection auto-popup on mouseup is COMPLETELY REMOVED as requested.
    // Selecting text will NEVER automatically open the extension.

    // Dynamic Keyboard Shortcut Matcher (Trigger 1: Keyboard)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (matchesShortcut(e, configuredShortcut)) {
        e.preventDefault();
        const sel = detectSelection();
        if (sel && sel.text.length > 0) {
          currentSelection = sel;
          activeMode = 'grammar_only';
          showToolbar = false;
          showPopup = true;
          renderUI();
        } else {
          showToast('Please select text first to improve writing', 'info');
        }
      }
    });

    // Background Context Menu Listener (Trigger 2: Right Click -> "Improve Writing with WriteFix AI")
    if (isExtensionContextValid()) {
      try {
        chrome.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
          if (!isExtensionContextValid()) return;
          if (message?.type === 'IMPROVE_SELECTION') {
            const sel = detectSelection(message.selectedText);
            if (sel && sel.text.length > 0) {
              currentSelection = sel;
              activeMode = 'grammar_only';
              showToolbar = false;
              showPopup = true;
              renderUI();
              sendResponse?.({ status: 'ok', handled: true });
            } else {
              showToast('Please select text first to improve writing', 'info');
              sendResponse?.({ status: 'no_selection', handled: false });
            }
          }
          return true; // Keep asynchronous channel open if needed
        });
      } catch (e) {}
    }

    function showToast(message: string, type: 'info' | 'success' | 'error') {
      let toastEl = shadowRoot.getElementById('writefix-toast');
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'writefix-toast';
        toastEl.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2147483647;
          padding: 10px 16px;
          border-radius: 8px;
          font-family: Inter, system-ui, sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          transition: opacity 0.2s ease;
          pointer-events: none;
        `;
        shadowRoot.appendChild(toastEl);
      }

      toastEl.style.backgroundColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1';
      toastEl.innerText = message;
      toastEl.style.opacity = '1';

      setTimeout(() => {
        if (toastEl) toastEl.style.opacity = '0';
      }, 3500);
    }
  },
});

function matchesShortcut(e: KeyboardEvent, shortcutStr: string): boolean {
  if (!shortcutStr) return false;
  const parts = shortcutStr.toUpperCase().split('+').map((p) => p.trim());

  const needsCtrl = parts.includes('CTRL') || parts.includes('CMD');
  const needsAlt = parts.includes('ALT');
  const needsShift = parts.includes('SHIFT');
  const targetKey = parts.find((p) => !['CTRL', 'CMD', 'ALT', 'SHIFT'].includes(p));

  const hasCtrl = e.ctrlKey || e.metaKey;
  const hasAlt = e.altKey;
  const hasShift = e.shiftKey;

  if (needsCtrl !== hasCtrl) return false;
  if (needsAlt !== hasAlt) return false;
  if (needsShift !== hasShift) return false;

  if (targetKey) {
    return e.key.toUpperCase() === targetKey;
  }

  return false;
}
