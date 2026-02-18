import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './utils/ipc-types';
import type { ChatStreamEvent } from './utils/ipc-types';

/**
 * Paid Media Suite API exposed to renderer via contextBridge
 * This is the ONLY way the renderer can communicate with the main process
 */
const paidMediaSuiteAPI = {
  /**
   * Settings operations
   */
  settings: {
    get: (): Promise<Record<string, unknown>> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),

    set: (settings: Record<string, unknown>): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),

    testConnection: (): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.TEST_CONNECTION),

    parentSegments: (): Promise<{ success: boolean; data?: any[]; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PARENT_SEGMENTS_LIST),

    parentSegmentChildren: (parentId: string): Promise<{ success: boolean; data?: any[]; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PARENT_SEGMENT_CHILDREN, parentId),
  },

  /**
   * Window controls
   */
  window: {
    minimize: (): void => {
      ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE);
    },
    maximize: (): void => {
      ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE);
    },
    close: (): void => {
      ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE);
    },
  },

  /**
   * Chat operations (Claude Agent SDK streaming)
   */
  chat: {
    startSession: (): Promise<{ success: boolean; sessionId?: string; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_SESSION_START),

    sendToSession: (content: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_SESSION_MESSAGE, content),

    stopSession: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_SESSION_STOP),

    onStream: (callback: (event: ChatStreamEvent) => void): (() => void) => {
      const handler = (_ipcEvent: Electron.IpcRendererEvent, event: ChatStreamEvent) => {
        callback(event);
      };
      ipcRenderer.on(IPC_CHANNELS.CHAT_STREAM, handler);
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.CHAT_STREAM, handler);
      };
    },

    // Legacy one-shot (for demo mode fallback)
    send: (message: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND, message),

    stop: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.CHAT_STOP),
  },

  /**
   * TD CDP extended operations
   */
  td: {
    segmentDetails: (segmentId: string, parentSegmentId: string): Promise<{ success: boolean; data?: any; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.TD_SEGMENT_DETAILS, segmentId, parentSegmentId),

    journeys: (parentSegmentId: string): Promise<{ success: boolean; data?: any[]; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.TD_JOURNEYS, parentSegmentId),

    activations: (parentSegmentId: string, segmentId: string): Promise<{ success: boolean; data?: any[]; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.TD_ACTIVATIONS, parentSegmentId, segmentId),
  },

  /**
   * Campaign operations
   */
  campaigns: {
    list: (): Promise<{ success: boolean; data?: any[]; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.CAMPAIGNS_LIST),

    get: (campaignId: string): Promise<{ success: boolean; data?: any; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.CAMPAIGNS_GET, campaignId),

    metrics: (campaignId: string, dateRange?: { start: string; end: string }): Promise<{ success: boolean; data?: any; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.CAMPAIGNS_METRICS, campaignId, dateRange),
  },

  /**
   * Platform connection operations
   */
  platforms: {
    connect: (platform: string, credentials: Record<string, string>): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_CONNECT, platform, credentials),

    disconnect: (platform: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_DISCONNECT, platform),

    status: (): Promise<{ success: boolean; data?: any[]; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_STATUS),

    syncAudience: (platform: string, segmentId: string, segmentName: string, parentSegmentId: string): Promise<{ success: boolean; platformAudienceId?: string; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_SYNC_AUDIENCE, platform, segmentId, segmentName, parentSegmentId),

    metrics: (platform: string, campaignIds?: string[], dateRange?: { start: string; end: string }): Promise<{ success: boolean; data?: any; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLATFORM_METRICS, platform, campaignIds, dateRange),
  },

  /**
   * Blueprint operations
   */
  blueprints: {
    save: (blueprint: any): Promise<{ success: boolean; id?: string; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLUEPRINT_SAVE, blueprint),

    list: (): Promise<{ success: boolean; data?: any[]; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLUEPRINT_LIST),

    get: (blueprintId: string): Promise<{ success: boolean; data?: any; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLUEPRINT_GET, blueprintId),

    delete: (blueprintId: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLUEPRINT_DELETE, blueprintId),

    export: (blueprintIds: string[], format: 'json' | 'csv' | 'pdf'): Promise<{ success: boolean; filePath?: string; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.BLUEPRINT_EXPORT, blueprintIds, format),
  },

  /**
   * PDF operations
   */
  pdf: {
    extract: (pdfBase64: string, fileName: string): Promise<{ success: boolean; text?: string; error?: string }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PDF_EXTRACT, pdfBase64, fileName),
  },

  /**
   * Platform info
   */
  platform: process.platform as 'darwin' | 'win32' | 'linux',
};

// Expose the API to the renderer
contextBridge.exposeInMainWorld('paidMediaSuite', paidMediaSuiteAPI);

// Type declaration for the renderer
export type PaidMediaSuiteAPI = typeof paidMediaSuiteAPI;
