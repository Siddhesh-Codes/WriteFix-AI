import { CorrectionMode, CorrectionResponse } from '@writefix/core';
import { Settings } from '../storage/types';

export type MessageType =
  | 'CORRECT_TEXT'
  | 'CORRECTION_RESULT'
  | 'CORRECTION_ERROR'
  | 'OPEN_POPUP'
  | 'CLOSE_POPUP'
  | 'SETTINGS_CHANGED'
  | 'RUN_SPIKE_TEST';

export type MessagePayloadMap = {
  CORRECT_TEXT: { text: string; mode: CorrectionMode };
  CORRECTION_RESULT: CorrectionResponse;
  CORRECTION_ERROR: { error: string; retryable: boolean };
  OPEN_POPUP: { text: string; rect: DOMRect };
  CLOSE_POPUP: undefined;
  SETTINGS_CHANGED: Partial<Settings>;
  RUN_SPIKE_TEST: undefined;
};

export interface MessageEnvelope<T extends MessageType = MessageType> {
  type: T;
  payload: MessagePayloadMap[T];
}
