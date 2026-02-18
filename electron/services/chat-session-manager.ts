/**
 * Chat Session Manager for Claude Agent SDK
 *
 * Manages a single active chat session with:
 * - Query object retention across interruptions
 * - Async generator message passing pattern
 * - Response pumping to renderer via IPC
 */

import type { BrowserWindow } from 'electron';
import { IPC_CHANNELS, type ChatStreamEvent } from '../utils/ipc-types';

// ============ Types ============

export interface StreamingMessage {
  type: 'user';
  message: {
    role: 'user';
    content: string;
  };
}

export interface Query {
  interrupt(): Promise<void>;
}

export interface ChatStreamResult {
  generator: AsyncGenerator<ChatStreamEvent, void, unknown>;
  query: Query | null;
}

export type ChatFunction = (
  messageGenerator: AsyncGenerator<StreamingMessage, void, unknown>
) =>
  | ChatStreamResult
  | AsyncGenerator<ChatStreamEvent, void, unknown>
  | Promise<ChatStreamResult | AsyncGenerator<ChatStreamEvent, void, unknown>>;

enum SessionState {
  IDLE = 'idle',
  STREAMING = 'streaming',
  INTERRUPTED = 'interrupted',
  DISPOSED = 'disposed',
}

interface ChatSession {
  sessionId: string;
  query: Query | null;
  state: SessionState;
  lastActivityAt: number;
  abortController: AbortController;
  mainWindow: BrowserWindow;
  messageQueue: StreamingMessage[];
  resolveNext: ((msg: StreamingMessage | null) => void) | null;
  isEnded: boolean;
  wasInterrupted: boolean;
}

// ============ Session Manager ============

class ChatSessionManager {
  private session: ChatSession | null = null;

  /**
   * Create a new streaming session
   */
  async createSession(
    sessionId: string,
    mainWindow: BrowserWindow,
    chatFn: ChatFunction
  ): Promise<void> {
    // Clean up existing session
    if (this.session) {
      await this.disposeSession();
    }

    this.session = {
      sessionId,
      query: null,
      state: SessionState.IDLE,
      lastActivityAt: Date.now(),
      abortController: new AbortController(),
      mainWindow,
      messageQueue: [],
      resolveNext: null,
      isEnded: false,
      wasInterrupted: false,
    };

    console.log('[ChatSessionManager] Session created:', sessionId);

    // Start the response pump in the background
    this.pumpResponses(chatFn).catch((error) => {
      console.error('[ChatSessionManager] Response pump error:', error);
    });
  }

  /**
   * Push a message to the active session
   */
  pushMessage(content: string): void {
    if (!this.session) {
      console.warn('[ChatSessionManager] No session for pushMessage');
      return;
    }

    if (this.session.isEnded) {
      console.warn('[ChatSessionManager] Cannot push message to ended session');
      return;
    }

    this.session.state = SessionState.STREAMING;
    this.session.lastActivityAt = Date.now();

    const message: StreamingMessage = {
      type: 'user',
      message: {
        role: 'user',
        content: content.trim(),
      },
    };

    // If we have a waiting resolver, resolve immediately
    if (this.session.resolveNext) {
      const resolver = this.session.resolveNext;
      this.session.resolveNext = null;
      resolver(message);
    } else {
      this.session.messageQueue.push(message);
    }
  }

  /**
   * Interrupt the session - retains Query for resumption
   */
  async interruptSession(): Promise<void> {
    if (!this.session) return;

    console.log('[ChatSessionManager] Interrupting session');

    this.session.state = SessionState.INTERRUPTED;
    this.session.wasInterrupted = true;
    this.session.lastActivityAt = Date.now();

    if (this.session.query) {
      try {
        await this.session.query.interrupt();
      } catch (error) {
        console.warn('[ChatSessionManager] Query interrupt error:', error);
      }
    }

    this.session.abortController.abort();

    // Send done event to UI
    if (this.session.mainWindow && !this.session.mainWindow.isDestroyed()) {
      const doneEvent: ChatStreamEvent = { type: 'done' };
      this.session.mainWindow.webContents.send(IPC_CHANNELS.CHAT_STREAM, doneEvent);
    }
  }

  /**
   * Dispose the session completely
   */
  async disposeSession(): Promise<void> {
    if (!this.session) return;

    console.log('[ChatSessionManager] Disposing session');
    this.session.state = SessionState.DISPOSED;
    this.session.isEnded = true;
    this.session.abortController.abort();

    if (this.session.resolveNext) {
      const resolver = this.session.resolveNext;
      this.session.resolveNext = null;
      resolver(null);
    }

    this.session = null;
  }

  /**
   * Check if a session exists and is active
   */
  hasSession(): boolean {
    return this.session !== null && !this.session.isEnded && this.session.state !== SessionState.DISPOSED;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.session?.sessionId ?? null;
  }

  /**
   * Create an async generator that yields messages as they arrive
   */
  private async *createMessageGenerator(
    session: ChatSession
  ): AsyncGenerator<StreamingMessage, void, unknown> {
    while (!session.isEnded) {
      if (session.messageQueue.length > 0) {
        yield session.messageQueue.shift()!;
        continue;
      }

      const message = await new Promise<StreamingMessage | null>((resolve) => {
        if (session.isEnded) {
          resolve(null);
          return;
        }
        session.resolveNext = (msg) => {
          session.resolveNext = null;
          resolve(msg);
        };
      });

      if (!message) break;
      yield message;
    }
  }

  /**
   * Pump SDK response events to IPC
   */
  private async pumpResponses(chatFn: ChatFunction): Promise<void> {
    const session = this.session;
    if (!session) return;

    try {
      const messageGenerator = this.createMessageGenerator(session);
      const chatResultOrPromise = chatFn(messageGenerator);

      const chatResult =
        chatResultOrPromise instanceof Promise
          ? await chatResultOrPromise
          : chatResultOrPromise;

      let responseGenerator: AsyncGenerator<ChatStreamEvent, void, unknown>;
      const isChatStreamResult =
        chatResult !== null &&
        typeof chatResult === 'object' &&
        'generator' in chatResult;

      if (isChatStreamResult) {
        const result = chatResult as ChatStreamResult;
        responseGenerator = result.generator;
        session.query = result.query;
      } else {
        responseGenerator = chatResult as AsyncGenerator<ChatStreamEvent, void, unknown>;
      }

      for await (const event of responseGenerator) {
        if (session.isEnded) break;

        // Skip events while interrupted
        if (session.state === SessionState.INTERRUPTED) {
          if (session.abortController.signal.aborted) {
            session.abortController = new AbortController();
          }
          continue;
        }

        session.lastActivityAt = Date.now();

        if (session.mainWindow && !session.mainWindow.isDestroyed()) {
          session.mainWindow.webContents.send(IPC_CHANNELS.CHAT_STREAM, event);
        }

        if (event.type === 'done') {
          session.state = SessionState.IDLE;
        }
      }
    } catch (error) {
      if (!session.abortController.signal.aborted && !session.isEnded && !session.wasInterrupted) {
        console.error('[ChatSessionManager] Stream error:', error);
        if (session.mainWindow && !session.mainWindow.isDestroyed()) {
          const errorEvent: ChatStreamEvent = {
            type: 'error',
            data: { message: error instanceof Error ? error.message : String(error) },
          };
          session.mainWindow.webContents.send(IPC_CHANNELS.CHAT_STREAM, errorEvent);
        }
      }
    } finally {
      if (this.session === session && !session.isEnded) {
        session.state = SessionState.IDLE;
      }
    }
  }
}

// Export singleton
export const chatSessionManager = new ChatSessionManager();
