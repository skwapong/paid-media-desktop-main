/**
 * Claude Agent SDK Client for Paid Media Suite
 *
 * Dynamically loads @anthropic-ai/claude-agent-sdk and exposes
 * chatStreamWithQuery() for long-lived streaming conversations
 * with interruption support via the Query object.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ChatStreamEvent } from '../utils/ipc-types';
import { startAuthProxy, updateProxyTarget, getAuthProxyUrl } from './auth-proxy';

// ============ Types ============

export interface StreamingInputMessage {
  type: 'user';
  message: {
    role: 'user';
    content: string;
  };
}

export interface Query {
  interrupt(): Promise<void>;
  setModel?(model?: string): Promise<void>;
  next: (...args: [] | [unknown]) => Promise<IteratorResult<unknown, void>>;
  return: (value?: void) => Promise<IteratorResult<unknown, void>>;
  throw: (e?: unknown) => Promise<IteratorResult<unknown, void>>;
  [Symbol.asyncIterator](): Query;
}

export interface ChatStreamResult {
  generator: AsyncGenerator<ChatStreamEvent, void, unknown>;
  query: Query;
}

export interface ClaudeAgentConfig {
  apiKey: string;
  llmProxyUrl: string;
  model?: string;
  workingDirectory?: string;
}

interface EventProcessingContext {
  config: ClaudeAgentConfig;
  metadataEmitted: boolean;
  currentSessionId?: string;
}

// ============ SDK Loading ============

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFunction = (opts: any) => AsyncGenerator<any, void, unknown>;

let queryFn: QueryFunction | null = null;

async function loadSDK(): Promise<QueryFunction> {
  if (queryFn) return queryFn;

  try {
    const importFn = new Function('specifier', 'return import(specifier)');
    const sdk = await importFn('@anthropic-ai/claude-agent-sdk');
    queryFn = sdk.query as QueryFunction;
    return queryFn;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load Claude Agent SDK: ${message}`);
  }
}

// ============ SDK Message Processing ============

const MAX_TOOL_RESULT_LENGTH = 50_000;

function* processSDKMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sdkMessage: Record<string, any>,
  ctx: EventProcessingContext,
  fullContent: { value: string }
): Generator<ChatStreamEvent, EventProcessingContext, unknown> {
  if (sdkMessage.type === 'system' && sdkMessage.subtype === 'init') {
    ctx.currentSessionId = sdkMessage.session_id as string;
    if (!ctx.metadataEmitted) {
      yield {
        type: 'metadata',
        data: { sessionId: ctx.currentSessionId, agentId: ctx.config.model || 'sonnet' },
      };
      ctx.metadataEmitted = true;
    }
  } else if (sdkMessage.type === 'assistant') {
    const assistantMsg = sdkMessage.message as { content?: Array<{ type: string; name?: string; input?: Record<string, unknown>; id?: string }> };
    if (assistantMsg?.content) {
      for (const block of assistantMsg.content) {
        if (block.type === 'tool_use') {
          yield {
            type: 'event',
            data: {
              type: 'tool_call',
              tool: block.name || 'unknown',
              toolUseId: block.id,
              input: block.input || {},
            },
          };
        }
      }
    }
  } else if (sdkMessage.type === 'user') {
    // Tool results in message.content
    const userMsg = sdkMessage.message as { content?: Array<{ type: string; tool_use_id?: string; content?: unknown; is_error?: boolean }> };
    if (userMsg?.content) {
      for (const block of userMsg.content) {
        if (block.type === 'tool_result' && block.tool_use_id) {
          let resultContent: string;
          if (typeof block.content === 'string') {
            resultContent = block.content;
          } else if (Array.isArray(block.content)) {
            resultContent = block.content
              .map((item: { text?: string }) => item.text || JSON.stringify(item))
              .join('\n');
          } else if (block.content) {
            resultContent = JSON.stringify(block.content);
          } else {
            resultContent = '';
          }

          yield {
            type: 'event',
            data: {
              type: 'tool_result',
              toolUseId: block.tool_use_id,
              result: resultContent?.slice(0, MAX_TOOL_RESULT_LENGTH) || 'Completed',
              ...(block.is_error && { isError: true }),
            },
          };
        }
      }
    }
  } else if (sdkMessage.type === 'stream_event') {
    const event = sdkMessage.event as {
      type?: string;
      content_block?: { type?: string };
      delta?: { type?: string; text?: string; thinking?: string };
    };
    if (event?.type === 'content_block_start' && event.content_block?.type === 'thinking') {
      yield { type: 'event', data: { type: 'thinking_start' } };
    }
    if (event?.type === 'content_block_delta' && event.delta) {
      if (event.delta.type === 'text_delta' && event.delta.text) {
        fullContent.value += event.delta.text;
        yield { type: 'event', data: { type: 'content', content: event.delta.text } };
      } else if (event.delta.type === 'thinking_delta' && event.delta.thinking) {
        yield { type: 'event', data: { type: 'thinking', content: event.delta.thinking } };
      }
    }
  } else if (sdkMessage.type === 'result') {
    const result = (sdkMessage as { result?: string }).result;
    if (result && !fullContent.value) {
      fullContent.value = result;
      yield { type: 'event', data: { type: 'content', content: result } };
    }
  }

  return ctx;
}

// ============ Skill Loading ============

function loadSkillContent(): string {
  const skillNames = [
    'generate-campaign-brief',
    'refine-campaign-brief',
    'extract-brief-from-pdf',
    'generate-blueprints',
    'refine-blueprint',
    'fetch-td-segments',
    'recommend-audience-segments',
    'analyze-segment-overlap',
    'forecast-campaign-performance',
    'detect-anomalies',
    'detect-creative-fatigue',
    'analyze-attribution',
    'benchmark-performance',
    'recommend-budget-allocation',
    'recommend-ab-tests',
    'generate-optimization-actions',
    'clone-campaign',
    'generate-report',
    'export-blueprints',
    'sync-platform-audiences',
    'fetch-platform-metrics',
  ];

  const allContent: string[] = [];

  for (const skillName of skillNames) {
    const skillRelativePath = path.join(
      'skills', 'paid-media-skills', skillName, 'SKILL.md'
    );

    // Try app root first (production), then cwd (development)
    const candidates: string[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { app } = require('electron');
      candidates.push(path.join(app.getAppPath(), skillRelativePath));
    } catch {
      // electron app not available yet
    }
    candidates.push(path.join(process.cwd(), skillRelativePath));

    let loaded = false;
    for (const filePath of candidates) {
      try {
        allContent.push(fs.readFileSync(filePath, 'utf-8'));
        loaded = true;
        break;
      } catch {
        // try next candidate
      }
    }

    if (!loaded) {
      console.warn(`[ClaudeAgentClient] Could not load ${skillName} SKILL.md`);
    }
  }

  return allContent.join('\n\n---\n\n');
}

// ============ System Prompt ============

const CAMPAIGN_BRIEF_SKILL_CONTENT = loadSkillContent();

const PAID_MEDIA_SYSTEM_PROMPT = `You are an AI assistant for Paid Media Suite, a paid media campaign management platform by Treasure Data.
You help users plan, manage, optimize, and analyze paid media campaigns across Meta, Google, and TikTok.

Your capabilities include:
- Creating structured campaign briefs from natural language descriptions
- Generating campaign blueprint variants (conservative/balanced/aggressive)
- Recommending audience segments from Treasure Data CDP
- Forecasting campaign performance with statistical models
- Detecting anomalies and creative fatigue in live campaigns
- Running multi-touch attribution analysis across channels
- Recommending budget allocation and A/B tests
- Generating performance reports

When creating campaigns, always consider:
1. Clear business objectives and KPIs
2. Audience segmentation using TD CDP data
3. Channel-appropriate budget allocation
4. Creative fatigue and refresh strategies
5. Measurable success criteria

Be concise, actionable, and data-driven in your responses. Emit structured JSON inside named code fences when using skills.${CAMPAIGN_BRIEF_SKILL_CONTENT ? `

## Paid Media Skills
${CAMPAIGN_BRIEF_SKILL_CONTENT}

When a user describes a campaign or makes a request, use the appropriate skill to generate structured output. Each skill has its own code fence format — use the one that matches the user's request context.` : ''}`;

// ============ Client Class ============

export class ClaudeAgentClient {
  private config: ClaudeAgentConfig | null = null;

  async init(config: ClaudeAgentConfig): Promise<void> {
    this.config = config;

    // Start or update the local auth proxy that translates x-api-key → TD1 auth
    try {
      const proxyUrl = getAuthProxyUrl();
      if (proxyUrl) {
        updateProxyTarget(config.llmProxyUrl);
      } else {
        await startAuthProxy(config.llmProxyUrl);
      }
    } catch (err) {
      console.error('[ClaudeAgentClient] Failed to start auth proxy:', err);
    }
  }

  isInitialized(): boolean {
    return this.config !== null && !!this.config.apiKey;
  }

  updateConfig(updates: Partial<ClaudeAgentConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...updates };
    }
  }

  private buildQueryOptions(
    prompt: string | AsyncGenerator<StreamingInputMessage, void, unknown>,
    extraOptions?: Record<string, unknown>
  ) {
    if (!this.config) throw new Error('Config not initialized');

    // Route through local auth proxy if available (translates x-api-key → TD1 auth)
    const proxyUrl = getAuthProxyUrl();
    const baseUrl = proxyUrl || this.config.llmProxyUrl;

    const env: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]
      ),
      ANTHROPIC_API_KEY: this.config.apiKey,
      ANTHROPIC_BASE_URL: baseUrl,
      PATH: process.env.PATH || '',
      CLAUDE_CODE_USE_BEDROCK: 'false',
      CLAUDE_CODE_USE_VERTEX: 'false',
      DEBUG_CLAUDE_AGENT_SDK: '1',
    };

    console.log('[ClaudeAgentClient] SDK env:', {
      ANTHROPIC_BASE_URL: baseUrl,
      AUTH_PROXY: proxyUrl ? `${proxyUrl} → ${this.config.llmProxyUrl}` : 'disabled',
      ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY ? `${env.ANTHROPIC_API_KEY.substring(0, 8)}...` : 'NOT SET',
      model: this.config.model,
    });

    return {
      prompt,
      options: {
        ...(this.config.model ? { model: this.config.model } : {}),
        env,
        cwd: this.config.workingDirectory || process.cwd(),
        allowedTools: [
          'Read', 'Glob', 'Grep', 'Bash',
          'WebFetch', 'WebSearch',
          'ListMcpResourcesTool', 'ReadMcpResourceTool',
        ],
        permissionMode: 'bypassPermissions',
        includePartialMessages: true,
        maxThinkingTokens: 1024,
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: PAID_MEDIA_SYSTEM_PROMPT,
        },
        stderr: (message: string) => {
          console.log('[SDK subprocess]', message.trim());
        },
        ...extraOptions,
      },
    };
  }

  /**
   * Create a streaming chat session with Query object for interruption control.
   */
  chatStreamWithQuery(
    messageGenerator: AsyncGenerator<StreamingInputMessage, void, unknown>,
    options?: { maxTurns?: number }
  ): ChatStreamResult {
    if (!this.config) {
      const errorGen = async function* (): AsyncGenerator<ChatStreamEvent, void, unknown> {
        yield { type: 'error', data: { message: 'Claude Agent client not initialized' } };
      };
      return { generator: errorGen(), query: null as unknown as Query };
    }

    if (!this.config.apiKey) {
      const errorGen = async function* (): AsyncGenerator<ChatStreamEvent, void, unknown> {
        yield { type: 'error', data: { message: 'No API key configured. Go to Settings to set up your API key.' } };
      };
      return { generator: errorGen(), query: null as unknown as Query };
    }

    const config = this.config;
    const buildOpts = () =>
      this.buildQueryOptions(messageGenerator, {
        maxTurns: options?.maxTurns ?? 100,
      });

    let queryInstance: Query | null = null;

    const generator = async function* (): AsyncGenerator<ChatStreamEvent, void, unknown> {
      const queryOptions = buildOpts();
      const fullContent = { value: '' };

      // Track auth errors from stderr to abort early
      let authError: string | null = null;
      const abortController = new AbortController();

      // Wrap the stderr callback to detect auth errors
      const originalStderr = queryOptions.options.stderr;
      queryOptions.options.stderr = (message: string) => {
        if (originalStderr) originalStderr(message);
        // Detect authentication failures from subprocess stderr/debug output
        if (message.includes('401') && (message.includes('Authentication failed') || message.includes('Unauthorized') || message.includes('Failed to Login'))) {
          authError = 'Authentication failed. Your API key was rejected by the LLM proxy. Please check your API key in Settings.';
          console.error('[ClaudeAgentClient] Auth error detected, aborting SDK');
          abortController.abort();
        }
      };

      // Pass abort controller to SDK
      (queryOptions.options as Record<string, unknown>).abortController = abortController;

      try {
        const queryFn = await loadSDK();
        queryInstance = queryFn(queryOptions) as unknown as Query;

        const ctx: EventProcessingContext = {
          config,
          metadataEmitted: false,
        };

        for await (const sdkMessage of queryInstance as unknown as AsyncGenerator<Record<string, unknown>, void, unknown>) {
          // Check for auth error detected via stderr
          if (authError) {
            yield { type: 'error', data: { message: authError } };
            return;
          }

          for (const event of processSDKMessage(sdkMessage, ctx, fullContent)) {
            yield event;
          }

          if (sdkMessage.type === 'result') {
            fullContent.value = '';
            yield { type: 'done' };
          }
        }

        // Check if we exited because of auth error
        if (authError) {
          yield { type: 'error', data: { message: authError } };
          return;
        }

        yield { type: 'done' };
      } catch (error) {
        // If auth error was detected, surface it instead of generic error
        if (authError) {
          yield { type: 'error', data: { message: authError } };
          return;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[ClaudeAgentClient] SDK streaming error:', errorMessage);
        if (error instanceof Error && error.stack) {
          console.error('[ClaudeAgentClient] Stack:', error.stack);
        }
        if (fullContent.value) {
          yield { type: 'done' };
          return;
        }
        // Surface specific errors to user
        if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
          yield { type: 'error', data: { message: 'Authentication failed. Your API key was rejected by the LLM proxy. Check your API key in Settings.' } };
          return;
        }
        throw new Error(`Claude Agent SDK streaming failed: ${errorMessage}`);
      }
    };

    // Proxy Query object that delegates to the real one once available
    const queryProxy = {
      async interrupt() {
        if (queryInstance) {
          return queryInstance.interrupt();
        }
      },
      async setModel(model?: string) {
        if (queryInstance?.setModel) {
          return queryInstance.setModel(model);
        }
      },
      next: (...args: [] | [unknown]) =>
        queryInstance?.next(...args) ?? Promise.resolve({ done: true as const, value: undefined }),
      return: (value?: void) =>
        queryInstance?.return(value) ?? Promise.resolve({ done: true as const, value: undefined }),
      throw: (e?: unknown) =>
        queryInstance?.throw(e) ?? Promise.reject(e),
      [Symbol.asyncIterator]() {
        return this;
      },
    } as unknown as Query;

    return {
      generator: generator(),
      query: queryProxy,
    };
  }

  /**
   * Test the connection to the LLM proxy with the configured API key.
   * Returns { success: true } or { success: false, error: string }.
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.config?.apiKey) {
      return { success: false, error: 'No API key configured.' };
    }

    const baseUrl = (this.config.llmProxyUrl || 'https://llm-proxy.us01.treasuredata.com').trim();

    try {
      // Use TD1 auth format (the proxy expects Authorization: TD1, not x-api-key)
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `TD1 ${this.config.apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-sonnet-4-20250514',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok || response.status === 200) {
        return { success: true };
      }

      const body = await response.text().catch(() => '');
      if (response.status === 401) {
        return { success: false, error: `Authentication failed (401). The proxy rejected your API key. Response: ${body.substring(0, 200)}` };
      }
      if (response.status === 403) {
        return { success: false, error: `Access denied (403). Your API key may not have LLM proxy permissions.` };
      }
      if (response.status === 404) {
        return { success: false, error: `Endpoint not found (404). The proxy URL may be incorrect: ${baseUrl}` };
      }

      // Any non-error response from Anthropic API (like 400 bad request for invalid model)
      // means the auth worked but the request was malformed — that's still a successful connection
      if (response.status === 400 && !body.includes('Authentication') && !body.includes('Unauthorized')) {
        return { success: true };
      }

      return { success: false, error: `Proxy returned HTTP ${response.status}: ${body.substring(0, 200)}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('timeout') || msg.includes('AbortError')) {
        return { success: false, error: `Connection timed out. Cannot reach proxy at ${baseUrl}` };
      }
      return { success: false, error: `Connection failed: ${msg}` };
    }
  }
}

// Export singleton
export const claudeAgentClient = new ClaudeAgentClient();
