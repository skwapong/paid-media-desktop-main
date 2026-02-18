/**
 * IPC channel constants for main/renderer communication
 */
export const IPC_CHANNELS = {
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Chat - streaming session
  CHAT_SESSION_START: 'chat:session:start',
  CHAT_SESSION_MESSAGE: 'chat:session:message',
  CHAT_SESSION_STOP: 'chat:session:stop',
  CHAT_STREAM: 'chat:stream',

  // Chat - legacy one-shot (fallback)
  CHAT_SEND: 'chat:send',
  CHAT_STOP: 'chat:stop',

  // Connection test
  TEST_CONNECTION: 'settings:test-connection',

  // TD CDP - Parent segments
  PARENT_SEGMENTS_LIST: 'parent-segments:list',
  PARENT_SEGMENT_CHILDREN: 'parent-segments:children',

  // TD CDP - Extended
  TD_SEGMENT_DETAILS: 'td:segment-details',
  TD_JOURNEYS: 'td:journeys',
  TD_ACTIVATIONS: 'td:activations',

  // Campaigns
  CAMPAIGNS_LIST: 'campaigns:list',
  CAMPAIGNS_GET: 'campaigns:get',
  CAMPAIGNS_METRICS: 'campaigns:metrics',

  // Platforms
  PLATFORM_CONNECT: 'platform:connect',
  PLATFORM_DISCONNECT: 'platform:disconnect',
  PLATFORM_STATUS: 'platform:status',
  PLATFORM_SYNC_AUDIENCE: 'platform:sync-audience',
  PLATFORM_METRICS: 'platform:metrics',

  // Blueprints
  BLUEPRINT_SAVE: 'blueprint:save',
  BLUEPRINT_LIST: 'blueprint:list',
  BLUEPRINT_GET: 'blueprint:get',
  BLUEPRINT_DELETE: 'blueprint:delete',
  BLUEPRINT_EXPORT: 'blueprint:export',

  // PDF
  PDF_EXTRACT: 'pdf:extract',
} as const;

/**
 * Application settings
 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  workingDirectory?: string;
  /** API key for the LLM proxy (AI agent) */
  apiKey?: string;
  /** API key for the TDX API endpoint (segments, audiences) */
  tdxApiKey?: string;
  tdxEndpoint?: string;
  tdxDatabase?: string;
  llmProxyUrl?: string;
  model?: string;
  selectedParentSegmentId?: string;
  /** Platform connection configs */
  platformConnections?: {
    meta?: { accessToken?: string; adAccountId?: string; connected: boolean };
    google?: { refreshToken?: string; customerId?: string; connected: boolean };
    tiktok?: { accessToken?: string; advertiserId?: string; connected: boolean };
  };
}

// ============ Chat Stream Types ============

/**
 * Tool call tracked during streaming
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: 'running' | 'completed' | 'error' | 'interrupted';
}

/**
 * A segment of streaming content (content, thinking, or tool call)
 */
export type StreamSegment =
  | { type: 'content'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; toolCall: ToolCall };

/**
 * Events streamed from main process to renderer via IPC
 */
export type ChatStreamEvent =
  | { type: 'metadata'; data: { sessionId?: string; agentId?: string } }
  | { type: 'event'; data: ChatEvent }
  | { type: 'done' }
  | { type: 'error'; data: { message: string } };

/**
 * Inner event data within a ChatStreamEvent of type 'event'
 */
export type ChatEvent =
  | { type: 'content'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'thinking_start' }
  | { type: 'tool_call'; tool: string; toolUseId?: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolUseId: string; result: string; isError?: boolean };

// ============ Blueprint Types ============

export interface Blueprint {
  id: string;
  name: string;
  variant: 'conservative' | 'balanced' | 'aggressive';
  confidence: 'High' | 'Medium' | 'Low';
  channels: string[];
  audiences: string[];
  budget: { amount: string; pacing: string };
  metrics: { reach: string; ctr: string; roas: string; conversions: string };
  messaging: string;
  cta: string;
  creativeBrief?: {
    primaryAngle: string;
    confidence: string;
    supportingMessages: string[];
    recommendedFormats: string[];
    fatigueRisk: string[];
    refreshPlan: string[];
  };
  createdAt: string;
  updatedAt: string;
  briefId?: string;
  version: number;
}

// ============ Platform Types ============

export type PlatformType = 'meta' | 'google' | 'tiktok';

export interface PlatformConnection {
  platform: PlatformType;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  lastSyncedAt?: string;
}
