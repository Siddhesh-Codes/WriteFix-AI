import { MessageType, MessagePayloadMap, MessageEnvelope } from './messages';

export class ExtensionMessenger {
  static async sendToBackground<K extends MessageType>(
    type: K,
    payload: MessagePayloadMap[K]
  ): Promise<any> {
    try {
      const envelope: MessageEnvelope<K> = { type, payload };
      return await chrome.runtime.sendMessage(envelope);
    } catch (e) {
      console.warn(`[WriteFix Messenger] Failed to send "${type}" to background:`, e);
      throw e;
    }
  }

  static async sendToTab<K extends MessageType>(
    tabId: number,
    type: K,
    payload: MessagePayloadMap[K]
  ): Promise<any> {
    try {
      const envelope: MessageEnvelope<K> = { type, payload };
      return await chrome.tabs.sendMessage(tabId, envelope);
    } catch (e) {
      console.warn(`[WriteFix Messenger] Failed to send "${type}" to tab ${tabId}:`, e);
      throw e;
    }
  }

  static onMessage<K extends MessageType>(
    type: K,
    handler: (payload: MessagePayloadMap[K], sender: chrome.runtime.MessageSender) => Promise<any> | any
  ): () => void {
    const listener = (
      message: MessageEnvelope<K>,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message && message.type === type) {
        const result = handler(message.payload, sender);
        if (result instanceof Promise) {
          result.then(sendResponse).catch((err) => sendResponse({ error: err.message }));
          return true; // Keep channel open for async response
        } else {
          sendResponse(result);
        }
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }
}
