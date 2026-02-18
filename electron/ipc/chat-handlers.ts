/**
 * IPC handlers for chat functionality.
 *
 * Bridges the preload API to the chat session manager,
 * handling session lifecycle and message routing.
 */

import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../utils/ipc-types';
import { chatSessionManager } from '../services/chat-session-manager';
import { claudeAgentClient } from '../services/claude-agent-client';
import type { StreamingInputMessage } from '../services/claude-agent-client';

export function setupChatHandlers(mainWindow: BrowserWindow): void {
  /**
   * Start a new streaming session
   */
  ipcMain.handle(
    IPC_CHANNELS.CHAT_SESSION_START,
    async (): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
      if (!claudeAgentClient.isInitialized()) {
        return { success: false, error: 'Claude Agent client not initialized. Configure API key in Settings.' };
      }

      try {
        const sessionId = `session-${Date.now()}`;

        const chatFn = (
          messageGenerator: AsyncGenerator<StreamingInputMessage, void, unknown>
        ) => {
          return claudeAgentClient.chatStreamWithQuery(messageGenerator);
        };

        await chatSessionManager.createSession(sessionId, mainWindow, chatFn);
        return { success: true, sessionId };
      } catch (error) {
        console.error('[Chat] Failed to start session:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );

  /**
   * Send a message to the active streaming session
   */
  ipcMain.handle(
    IPC_CHANNELS.CHAT_SESSION_MESSAGE,
    async (
      _event,
      content: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!chatSessionManager.hasSession()) {
        return { success: false, error: 'No active session' };
      }

      const trimmed = content.trim();
      if (!trimmed) {
        return { success: false, error: 'Cannot send empty message' };
      }

      try {
        chatSessionManager.pushMessage(trimmed);
        return { success: true };
      } catch (error) {
        console.error('[Chat] Failed to send message:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  );

  /**
   * Interrupt the current streaming session
   */
  ipcMain.handle(IPC_CHANNELS.CHAT_SESSION_STOP, async (): Promise<void> => {
    await chatSessionManager.interruptSession();
  });

  /**
   * Legacy one-shot send (kept for fallback/demo mode)
   */
  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEND,
    async (_event, message: string): Promise<void> => {
      // This is a no-op placeholder. The streaming session pattern is preferred.
      console.log('[Chat] Legacy CHAT_SEND called, message:', message.slice(0, 50));
    }
  );

  ipcMain.handle(IPC_CHANNELS.CHAT_STOP, async (): Promise<void> => {
    await chatSessionManager.interruptSession();
  });
}
