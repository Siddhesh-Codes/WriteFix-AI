import { defineBackground } from 'wxt/sandbox';
import { logger } from '@/lib/utils/logger';

export default defineBackground(() => {
  logger.debug('Background Service Worker initialized.');

  // Function to register context menus safely
  const setupContextMenus = () => {
    try {
      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create(
          {
            id: 'writefix-improve',
            title: 'Improve Writing with WriteFix AI',
            contexts: ['selection', 'editable'],
          },
          () => {
            if (chrome.runtime.lastError) {
              logger.debug('Context menu creation warning:', chrome.runtime.lastError.message);
            } else {
              logger.debug('Context menu registered successfully.');
            }
          }
        );
      });
    } catch (e) {
      logger.debug('Failed to initialize context menus', e);
    }
  };

  // Register on install and startup
  chrome.runtime.onInstalled.addListener(() => {
    setupContextMenus();
  });

  chrome.runtime.onStartup.addListener(() => {
    setupContextMenus();
  });

  // Also ensure it is registered on service worker boot
  setupContextMenus();

  // Handle context menu clicks safely
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) return;

    if (info.menuItemId === 'writefix-improve') {
      const payload = {
        type: 'IMPROVE_SELECTION',
        selectedText: info.selectionText || '',
      };
      safeSendMessage(tab.id, payload, true);
    }
  });

  // Handle keyboard shortcut commands safely
  chrome.commands.onCommand.addListener((command, tab) => {
    if (!tab?.id) return;

    if (command === 'improve-writing') {
      safeSendMessage(tab.id, { type: 'IMPROVE_SELECTION' }, true);
    }
  });
});

/**
 * Sends a message to a tab, with automatic fallback injection if the content script is not yet active.
 */
function safeSendMessage(tabId: number, message: any, retryWithInjection = false) {
  try {
    chrome.tabs.sendMessage(tabId, message, async (response) => {
      const err = chrome.runtime.lastError;
      if (err && retryWithInjection) {
        logger.debug('Content script not responsive. Attempting dynamic injection...', err.message);
        try {
          if (chrome.scripting) {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-scripts/content.js'],
            });

            // Wait brief tick for React mount and retry message dispatch
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, message, () => {
                if (chrome.runtime.lastError) {
                  logger.debug('Secondary message attempt failed (expected on protected browser pages):', chrome.runtime.lastError.message);
                }
              });
            }, 120);
          }
        } catch (injectionErr) {
          logger.debug('Could not inject content script (e.g. chrome:// or internal browser URL):', injectionErr);
        }
      }
    });
  } catch (e) {
    logger.debug('Catch block during message dispatch', e);
  }
}

