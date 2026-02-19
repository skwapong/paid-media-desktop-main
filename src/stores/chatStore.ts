/**
 * Chat Store - Zustand store for streaming-aware chat state.
 *
 * Manages the chat session lifecycle via IPC to the Claude Agent SDK:
 * startSession → sendMessage → handleStreamEvent → finalizeStream
 */

import { create } from 'zustand';
import type { ChatMessage } from '../types/shared';
import type { ChatStreamEvent, StreamSegment, ToolCall } from '../types/chat';
import { useAppStore } from './appStore';
import type { CampaignDraft } from './appStore';
import { detectSkillOutput, parseCampaignBrief as extractBriefFromSkill, parseBriefUpdate, parseBlueprints } from '../services/skillParsers';
import { extractBriefFromContent } from '../services/briefOutputParser';
import { useBriefStore } from './briefStore';
import { useBriefEditorStore } from './briefEditorStore';
import { useBlueprintStore } from './blueprintStore';
import { useTraceStore } from './traceStore';
import { chatHistoryStorage } from '../services/chatHistoryStorage';

interface ChatState {
  // Session
  sessionId: string | null;
  sessionActive: boolean;

  // Messages (finalized)
  messages: ChatMessage[];

  // Streaming state
  isStreaming: boolean;
  isWaitingForResponse: boolean;
  streamingSegments: StreamSegment[];
  pendingThinkingStart: boolean;

  // Demo mode
  isDemoMode: boolean;

  // Trace
  activeRunId: string | null;

  // Actions
  startSession: () => Promise<boolean>;
  sendMessage: (content: string, runId?: string) => Promise<void>;
  stopStreaming: () => Promise<void>;
  resetChat: () => void;
  handleStreamEvent: (event: ChatStreamEvent) => void;
  addSystemMessage: (content: string) => void;
  loadMessages: (messages: ChatMessage[]) => void;

  // Internal streaming actions
  appendStreamContent: (content: string) => void;
  appendThinkingContent: (content: string) => void;
  startNewThinkingBlock: () => void;
  addToolCall: (toolCall: { name: string; arguments: Record<string, unknown>; toolUseId?: string }) => void;
  updateToolCallResult: (toolUseId: string, result: string, isError?: boolean) => void;
  finalizeStream: () => void;
  setWaitingForResponse: (waiting: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: null,
  sessionActive: false,
  messages: [],
  isStreaming: false,
  isWaitingForResponse: false,
  streamingSegments: [],
  pendingThinkingStart: false,
  isDemoMode: false,
  activeRunId: null,

  startSession: async () => {
    const api = window.paidMediaSuite?.chat;
    if (!api?.startSession) {
      console.warn('[ChatStore] Chat API not available, using demo mode');
      set({ isDemoMode: true });
      return false;
    }

    try {
      const result = await api.startSession();
      if (result.success && result.sessionId) {
        set({ sessionId: result.sessionId, sessionActive: true, isDemoMode: false });

        // Unsubscribe any existing listener before creating a new one
        const existingUnsub = (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub;
        if (existingUnsub) {
          existingUnsub();
          (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub = undefined;
        }

        // Subscribe to stream events
        const unsubscribe = api.onStream((event: ChatStreamEvent) => {
          get().handleStreamEvent(event);
        });

        // Store unsubscribe for cleanup
        (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub = unsubscribe;

        return true;
      } else {
        console.error('[ChatStore] Failed to start session:', result.error);
        set({ isDemoMode: true });
        return false;
      }
    } catch (error) {
      console.error('[ChatStore] Error starting session:', error);
      set({ isDemoMode: true });
      return false;
    }
  },

  sendMessage: async (content: string, runId?: string) => {
    // Re-read state fresh to catch isDemoMode set by startSession
    const isDemoMode = get().isDemoMode;

    // Store the active run ID for trace events in finalizeStream
    if (runId) {
      set({ activeRunId: runId });
    }

    // Add user message to display
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: runId ? { runId } : undefined,
    };
    set((s) => ({ messages: [...s.messages, userMsg] }));

    // Always generate a structured campaign draft from the user's message
    // so the wizard Step 1 is pre-populated regardless of demo/SDK mode
    const { draft } = generateCampaignDraft(content);
    useAppStore.getState().setCampaignDraft(draft);

    if (isDemoMode) {
      // Demo mode: simulate progressive thinking steps (no chat content)
      console.log('[ChatStore] Demo mode: generating thinking steps');
      const { thinkingSteps } = generateCampaignDraft(content);
      set({ isStreaming: true, isWaitingForResponse: true });

      let stepIdx = 0;
      const runStep = () => {
        if (stepIdx >= thinkingSteps.length) {
          // All steps done — populate brief editor with keyword-parsed sections
          const parsed = parseCampaignBrief(content);
          useBriefStore.getState().updateBriefFromAI(parsed.sections);

          const state = get();
          const finalSegments = state.streamingSegments.filter(
            (s) => s.type === 'thinking' || s.type === 'tool_call'
          );
          const demoMetadata: Record<string, unknown> = {};
          if (finalSegments.length > 0) demoMetadata.segments = finalSegments;
          if (state.activeRunId) demoMetadata.runId = state.activeRunId;
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: 'Your campaign brief is ready — feel free to edit any section on the right. If you tell me what you want to change, I can update the brief.',
            timestamp: new Date(),
            metadata: Object.keys(demoMetadata).length > 0 ? demoMetadata : undefined,
          };
          set((s) => ({
            messages: [...s.messages, aiMsg],
            isStreaming: false,
            isWaitingForResponse: false,
            streamingSegments: [],
            pendingThinkingStart: false,
            activeRunId: null,
          }));
          return;
        }

        const step = thinkingSteps[stepIdx];
        set((state) => {
          const segments = [...state.streamingSegments];
          const last = segments[segments.length - 1];
          if (last && last.type === 'thinking') {
            segments[segments.length - 1] = { type: 'thinking', content: last.content + '\n' + step };
          } else {
            segments.push({ type: 'thinking', content: step });
          }
          return { isStreaming: true, isWaitingForResponse: false, streamingSegments: segments };
        });

        stepIdx++;
        setTimeout(runStep, 400);
      };

      setTimeout(runStep, 400);
      return;
    }

    // Real SDK mode
    const api = window.paidMediaSuite?.chat;
    if (!api?.sendToSession) {
      console.warn('[ChatStore] sendToSession not available');
      set({ isWaitingForResponse: false });
      return;
    }

    set({ isWaitingForResponse: true });

    try {
      const result = await api.sendToSession(content);
      if (!result.success) {
        console.error('[ChatStore] Failed to send message:', result.error);
        const traceS = runId ? useTraceStore.getState() : null;
        if (runId && traceS) {
          traceS.addEvent(runId, 'error', `SDK send failed: ${result.error}`, { level: 'error' });
          traceS.completeRun(runId, 'failed');
        }
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Failed to reach AI: ${result.error}. Try configuring your API key in Settings.`,
          timestamp: new Date(),
          metadata: runId ? { runId } : undefined,
        };
        set((s) => ({
          messages: [...s.messages, errMsg],
          isWaitingForResponse: false,
          activeRunId: null,
        }));
      } else {
        // Message queued — play progressive thinking steps as immediate
        // visual feedback while the SDK processes in the background
        const { thinkingSteps } = generateCampaignDraft(content);
        let sdkStepIdx = 0;
        let sdkCancelled = false;

        const playStep = () => {
          if (sdkCancelled) return;
          const s = get();
          // Stop if SDK already delivered real events (thinking or content)
          // beyond our injected steps
          if (!s.isStreaming && !s.isWaitingForResponse) return;

          if (sdkStepIdx < thinkingSteps.length) {
            const step = thinkingSteps[sdkStepIdx];
            set((state) => {
              const segments = [...state.streamingSegments];
              const last = segments[segments.length - 1];
              if (last && last.type === 'thinking') {
                segments[segments.length - 1] = { type: 'thinking', content: last.content + '\n' + step };
              } else {
                segments.push({ type: 'thinking', content: step });
              }
              return { isStreaming: true, isWaitingForResponse: false, streamingSegments: segments };
            });
            sdkStepIdx++;
            setTimeout(playStep, 400);
          }
          // After all thinking steps played, just wait for SDK (or timeout)
        };

        setTimeout(playStep, 300);

        // Set a timeout — if SDK doesn't deliver real events within 20s,
        // finalize with demo thinking and show the fallback message
        const capturedRunId = runId;
        const sdkTimeoutId = setTimeout(() => {
          sdkCancelled = true;
          const s = get();
          if (s.isStreaming || s.isWaitingForResponse) {
            const traceS2 = capturedRunId ? useTraceStore.getState() : null;
            if (capturedRunId && traceS2) {
              traceS2.addEvent(capturedRunId, 'error', 'SDK timeout — no response received. Falling back to keyword parser.', { level: 'warn' });
              traceS2.addEvent(capturedRunId, 'skill_result', 'Brief populated via keyword parser (fallback)');
              traceS2.addEvent(capturedRunId, 'ui_update', 'Campaign Brief editor showing keyword-parsed brief');
              traceS2.completeRun(capturedRunId, 'succeeded');
            }
            // Finalize the thinking segments into a proper AI message
            const finalSegments = s.streamingSegments.filter(
              (seg) => seg.type === 'thinking' || seg.type === 'tool_call'
            );
            const metadata: Record<string, unknown> = {};
            if (finalSegments.length > 0) metadata.segments = finalSegments;
            if (capturedRunId) metadata.runId = capturedRunId;
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: 'The AI service did not respond. Your brief was generated using the built-in keyword parser. To get AI-enhanced briefs, configure a valid API key in Settings.',
              timestamp: new Date(),
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            };
            set((prev) => ({
              messages: [...prev.messages, aiMsg],
              isStreaming: false,
              isWaitingForResponse: false,
              streamingSegments: [],
              pendingThinkingStart: false,
              activeRunId: null,
            }));
          }
        }, 60_000);

        (window as { __sdkTimeoutId?: ReturnType<typeof setTimeout> }).__sdkTimeoutId = sdkTimeoutId;
        // Also store the cancel function so handleStreamEvent can stop the animation
        (window as { __sdkStepCancel?: () => void }).__sdkStepCancel = () => { sdkCancelled = true; };
      }
    } catch (error) {
      console.error('[ChatStore] Error sending message:', error);
      const traceS = runId ? useTraceStore.getState() : null;
      if (runId && traceS) {
        traceS.addEvent(runId, 'error', `SDK error: ${error instanceof Error ? error.message : String(error)}`, { level: 'error' });
        traceS.completeRun(runId, 'failed');
      }
      set({ isWaitingForResponse: false, activeRunId: null });
    }
  },

  stopStreaming: async () => {
    const api = window.paidMediaSuite?.chat;
    if (!api?.stopSession) return;

    try {
      await api.stopSession();
    } catch (error) {
      console.error('[ChatStore] Error stopping stream:', error);
    }
    // The done event from the backend will trigger finalizeStream
  },

  resetChat: () => {
    // Unsubscribe from stream events
    const unsub = (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub;
    if (unsub) {
      unsub();
      (window as { __chatStreamUnsub?: () => void }).__chatStreamUnsub = undefined;
    }

    set({
      sessionId: null,
      sessionActive: false,
      messages: [],
      isStreaming: false,
      isWaitingForResponse: false,
      streamingSegments: [],
      pendingThinkingStart: false,
      isDemoMode: false,
      activeRunId: null,
    });
  },

  addSystemMessage: (content: string) => {
    const msg: ChatMessage = {
      id: `system-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    set({ messages: [...get().messages, msg] });
  },

  loadMessages: (messages: ChatMessage[]) => {
    set({ messages });
  },

  handleStreamEvent: (event: ChatStreamEvent) => {
    const state = get();

    // Clear SDK timeout and stop thinking animation on any meaningful event
    if (event.type === 'event' || event.type === 'done' || event.type === 'error') {
      const tid = (window as { __sdkTimeoutId?: ReturnType<typeof setTimeout> }).__sdkTimeoutId;
      if (tid) {
        clearTimeout(tid);
        (window as { __sdkTimeoutId?: ReturnType<typeof setTimeout> }).__sdkTimeoutId = undefined;
      }
      const cancelFn = (window as { __sdkStepCancel?: () => void }).__sdkStepCancel;
      if (cancelFn) {
        cancelFn();
        (window as { __sdkStepCancel?: () => void }).__sdkStepCancel = undefined;
      }
    }

    switch (event.type) {
      case 'metadata':
        // Session initialized
        break;

      case 'event':
        if (event.data && 'type' in event.data) {
          switch (event.data.type) {
            case 'content':
              state.setWaitingForResponse(false);
              state.appendStreamContent(event.data.content);
              break;

            case 'tool_call': {
              state.setWaitingForResponse(false);
              const tcData = event.data as { type: 'tool_call'; tool: string; toolUseId?: string; input: Record<string, unknown> };
              state.addToolCall({
                name: tcData.tool,
                arguments: tcData.input,
                toolUseId: tcData.toolUseId,
              });
              break;
            }

            case 'tool_result': {
              const trData = event.data as { type: 'tool_result'; toolUseId: string; result: string; isError?: boolean };
              state.updateToolCallResult(trData.toolUseId, trData.result, trData.isError);
              break;
            }

            case 'thinking_start':
              state.startNewThinkingBlock();
              break;

            case 'thinking': {
              state.setWaitingForResponse(false);
              const thData = event.data as { type: 'thinking'; content: string };
              state.appendThinkingContent(thData.content);
              break;
            }
          }
        }
        break;

      case 'done':
        state.finalizeStream();
        break;

      case 'error': {
        const errorMsg = typeof event.data === 'object' && 'message' in event.data
          ? event.data.message
          : String(event.data);
        console.error('[ChatStore] Stream error:', errorMsg);

        // Emit trace events for the error
        const currentRunId = get().activeRunId;
        if (currentRunId) {
          const traceStore = useTraceStore.getState();
          traceStore.addEvent(currentRunId, 'error', errorMsg, { level: 'error' });
          traceStore.completeRun(currentRunId, 'failed');
        }

        // Finalize stream and add error as assistant message
        state.finalizeStream();
        const errSegments = get().messages[get().messages.length - 1]?.metadata?.segments;
        const errMetadata: Record<string, unknown> = {};
        if (currentRunId) errMetadata.runId = currentRunId;
        if (errSegments) errMetadata.segments = errSegments;

        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
          metadata: Object.keys(errMetadata).length > 0 ? errMetadata : undefined,
        };
        set((s) => ({ messages: [...s.messages, errMsg] }));
        break;
      }
    }
  },

  appendStreamContent: (content: string) => {
    set((state) => {
      const segments = [...state.streamingSegments];
      const last = segments[segments.length - 1];

      if (last && last.type === 'content') {
        segments[segments.length - 1] = { type: 'content', content: last.content + content };
      } else {
        segments.push({ type: 'content', content });
      }

      return { isStreaming: true, streamingSegments: segments };
    });
  },

  appendThinkingContent: (content: string) => {
    set((state) => {
      const segments = [...state.streamingSegments];
      const last = segments[segments.length - 1];

      if (state.pendingThinkingStart || !last || last.type !== 'thinking') {
        segments.push({ type: 'thinking', content });
      } else {
        segments[segments.length - 1] = { type: 'thinking', content: last.content + content };
      }

      return { isStreaming: true, streamingSegments: segments, pendingThinkingStart: false };
    });
  },

  startNewThinkingBlock: () => {
    set({ pendingThinkingStart: true });
  },

  addToolCall: (toolCall) => {
    const id = toolCall.toolUseId || `tool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const fullToolCall: ToolCall = {
      id,
      name: toolCall.name,
      arguments: toolCall.arguments,
      status: 'running',
    };

    set((state) => ({
      isStreaming: true,
      streamingSegments: [
        ...state.streamingSegments,
        { type: 'tool_call' as const, toolCall: fullToolCall },
      ],
    }));
  },

  updateToolCallResult: (toolUseId: string, result: string, isError?: boolean) => {
    set((state) => {
      const segments = state.streamingSegments.map((seg): StreamSegment => {
        if (seg.type === 'tool_call' && seg.toolCall.id === toolUseId && seg.toolCall.status === 'running') {
          return {
            type: 'tool_call',
            toolCall: {
              ...seg.toolCall,
              result,
              status: isError ? 'error' : 'completed',
            },
          };
        }
        return seg;
      });

      // Fallback: if no exact match, try single running tool call
      const hasMatch = segments.some(
        (seg) => seg.type === 'tool_call' && seg.toolCall.id === toolUseId
      );
      if (!hasMatch) {
        const running = segments.filter(
          (seg) => seg.type === 'tool_call' && seg.toolCall.status === 'running'
        );
        if (running.length === 1) {
          const idx = segments.indexOf(running[0]);
          const tc = running[0] as { type: 'tool_call'; toolCall: ToolCall };
          segments[idx] = {
            type: 'tool_call',
            toolCall: { ...tc.toolCall, result, status: isError ? 'error' : 'completed' },
          };
        }
      }

      return { streamingSegments: segments };
    });
  },

  finalizeStream: () => {
    const state = get();
    const segments = state.streamingSegments;

    if (segments.length === 0) {
      set({
        isStreaming: false,
        isWaitingForResponse: false,
        streamingSegments: [],
        pendingThinkingStart: false,
      });
      return;
    }

    // Mark running tool calls as interrupted, filter empty thinking blocks
    const finalizedSegments: StreamSegment[] = segments
      .filter((seg) => !(seg.type === 'thinking' && !seg.content.trim()))
      .map((seg): StreamSegment => {
        if (seg.type === 'tool_call' && seg.toolCall.status === 'running') {
          return { type: 'tool_call', toolCall: { ...seg.toolCall, status: 'interrupted' } };
        }
        return seg;
      });

    // Multi-parser dispatch: detect any skill output in content segments
    const fullText = finalizedSegments
      .filter((s) => s.type === 'content')
      .map((s) => s.content)
      .join('');
    const runId = state.activeRunId;
    const trace = useTraceStore.getState();

    let skillDetected = false;
    let briefPopulated = false;

    if (fullText) {
      if (runId) {
        trace.addEvent(runId, 'skill_call', 'Scanning response for skill code fences', {
          data: { contentLength: fullText.length },
        });
      }

      // Try multi-parser dispatch first
      const skillResult = detectSkillOutput(fullText);
      if (skillResult) {
        skillDetected = true;

        if (runId) {
          trace.addEvent(runId, 'skill_result', `Skill "${skillResult.skillName}" output detected and parsed`, {
            data: { skillName: skillResult.skillName },
          });
        }

        // Normalize AI skill output (object shapes) to editor store types (flat strings/string[])
        const normalizeForEditor = (data: Record<string, unknown>): Record<string, unknown> => {
          const normalized = { ...data };

          // campaignDetails: {campaignName, campaignType, description} → string
          if (normalized.campaignDetails && typeof normalized.campaignDetails === 'object' && !Array.isArray(normalized.campaignDetails)) {
            const cd = normalized.campaignDetails as Record<string, string>;
            normalized.campaignDetails = [cd.campaignName, cd.campaignType, cd.description].filter(Boolean).join(' — ');
          }

          // primaryAudience / secondaryAudience: [{name, description, estimatedSize}] → string[]
          for (const key of ['primaryAudience', 'secondaryAudience'] as const) {
            if (Array.isArray(normalized[key])) {
              normalized[key] = (normalized[key] as unknown[]).map((item) =>
                typeof item === 'object' && item !== null && 'name' in item
                  ? (item as Record<string, string>).name
                  : String(item)
              );
            }
          }

          // phases: [{name, ...}] → string (editor expects a simple string like "3 phases")
          if (Array.isArray(normalized.phases)) {
            const phaseArr = normalized.phases as Record<string, unknown>[];
            normalized.phases = phaseArr.length > 0
              ? `${phaseArr.length} phase${phaseArr.length > 1 ? 's' : ''}: ${phaseArr.map((p) => (p.name as string) || '').filter(Boolean).join(', ')}`
              : '';
          }

          return normalized;
        };

        // Dispatch to appropriate store based on skill name
        switch (skillResult.skillName) {
          case 'campaign-brief': {
            useBriefStore.getState().updateBriefFromAI(skillResult.data as any);
            useBriefEditorStore.getState().updateBriefData(normalizeForEditor(skillResult.data as Record<string, unknown>) as any);
            briefPopulated = true;
            if (runId) trace.addEvent(runId, 'ui_update', 'Campaign Brief editor updated with AI-generated content');
            break;
          }
          case 'brief-update': {
            const editorState = useBriefEditorStore.getState();
            if (editorState.state.pendingSuggestionRequest) {
              // Route to inline suggestions instead of auto-applying
              const normalizedData = normalizeForEditor(skillResult.data as Record<string, unknown>) as Record<string, unknown>;
              const suggestions: Record<string, any> = {};
              const sectionDataMap: Record<string, string[]> = {
                campaignDetails: ['campaignDetails'],
                brandProduct: ['brandProduct'],
                businessObjective: ['businessObjective', 'businessObjectiveTags'],
                goals: ['primaryGoals', 'secondaryGoals'],
                successMetrics: ['primaryKpis', 'secondaryKpis'],
                campaignScope: ['inScope', 'outOfScope'],
                targetAudience: ['primaryAudience', 'secondaryAudience'],
                audienceSegments: ['prospectingSegments', 'retargetingSegments', 'suppressionSegments'],
                channels: ['mandatoryChannels', 'optionalChannels'],
                budget: ['budgetAmount', 'pacing', 'phases'],
                timeline: ['timelineStart', 'timelineEnd'],
              };
              for (const [sectionKey, dataKeys] of Object.entries(sectionDataMap)) {
                const changedKeys = dataKeys.filter((dk) => dk in normalizedData);
                if (changedKeys.length > 0) {
                  const updates: Record<string, unknown> = {};
                  changedKeys.forEach((dk) => { updates[dk] = normalizedData[dk]; });
                  // Determine if this is a minor tweak or a major suggestion
                  const currentBrief = editorState.state.briefData as unknown as Record<string, unknown>;
                  const sectionHasContent = dataKeys.some((dk) => {
                    const val = currentBrief[dk];
                    if (Array.isArray(val)) return val.length > 0;
                    return !!val;
                  });
                  const isMinor = sectionHasContent && changedKeys.length <= 2;

                  // Build a human-readable description of the suggested changes
                  const friendlyNames: Record<string, string> = {
                    campaignDetails: 'campaign details', brandProduct: 'brand/product',
                    businessObjective: 'objective', businessObjectiveTags: 'objective tags',
                    primaryGoals: 'primary goals', secondaryGoals: 'secondary goals',
                    primaryKpis: 'primary KPIs', secondaryKpis: 'secondary KPIs',
                    inScope: 'in-scope items', outOfScope: 'out-of-scope items',
                    primaryAudience: 'primary audience', secondaryAudience: 'secondary audience',
                    mandatoryChannels: 'mandatory channels', optionalChannels: 'optional channels',
                    budgetAmount: 'budget', pacing: 'pacing', phases: 'phases',
                    timelineStart: 'start date', timelineEnd: 'end date',
                  };
                  const previewParts = changedKeys.map((dk) => {
                    const val = normalizedData[dk];
                    const preview = Array.isArray(val)
                      ? val.slice(0, 3).join(', ') + (val.length > 3 ? ` +${val.length - 3} more` : '')
                      : String(val).slice(0, 80) + (String(val).length > 80 ? '...' : '');
                    return `${friendlyNames[dk] || dk}: ${preview}`;
                  });
                  const description = isMinor
                    ? `Update ${previewParts.join(' and ')}`
                    : `Add ${previewParts.join('; ')}`;

                  suggestions[sectionKey] = {
                    sectionKey,
                    title: isMinor ? 'Try a small change' : 'Suggested',
                    description,
                    isMinor,
                    suggestedUpdates: updates,
                  };
                }
              }
              editorState.setInlineSuggestions(suggestions);
              briefPopulated = true;
              if (runId) trace.addEvent(runId, 'ui_update', 'AI suggestions populated for review');
            } else {
              useBriefStore.getState().updateBriefFromAI(skillResult.data as any);
              editorState.updateBriefData(normalizeForEditor(skillResult.data as Record<string, unknown>) as any);
              briefPopulated = true;
              if (runId) trace.addEvent(runId, 'ui_update', 'Campaign Brief editor updated with refinements');
            }
            break;
          }
          case 'blueprints': {
            // Add blueprints to the blueprint store
            // Handle both { blueprints: [...] } and raw array [...] shapes
            const rawData = skillResult.data as any;
            const blueprintArr = Array.isArray(rawData)
              ? rawData
              : rawData?.blueprints
                ? rawData.blueprints
                : null;
            if (blueprintArr && blueprintArr.length > 0) {
              // Normalize blueprint fields: skill outputs objects but UI expects flat strings
              const normalized = blueprintArr.map((bp: any) => {
                const out = { ...bp };
                // channels: [{name, budgetPercent, ...}] → string[]
                if (Array.isArray(out.channels)) {
                  out.channels = out.channels.map((ch: any) =>
                    typeof ch === 'object' && ch !== null && 'name' in ch ? ch.name : String(ch)
                  );
                }
                // audiences: [{name, type, ...}] → string[]
                if (Array.isArray(out.audiences)) {
                  out.audiences = out.audiences.map((a: any) =>
                    typeof a === 'object' && a !== null && 'name' in a ? a.name : String(a)
                  );
                }
                // messaging: {primaryMessage, supportingMessages, toneAndVoice} → string
                if (out.messaging && typeof out.messaging === 'object' && !Array.isArray(out.messaging)) {
                  const m = out.messaging as Record<string, unknown>;
                  out.messaging = m.primaryMessage || [m.toneAndVoice, ...(Array.isArray(m.supportingMessages) ? m.supportingMessages : [])].filter(Boolean).join('. ') || '';
                }
                // budget: {total, pacing, phases} → {amount, pacing} (flatten)
                if (out.budget && typeof out.budget === 'object' && 'total' in out.budget) {
                  out.budget = { amount: out.budget.total || '', pacing: out.budget.pacing || '' };
                }
                // metrics: {estimatedReach, ...} → {reach, ctr, roas, conversions} (flatten)
                if (out.metrics && typeof out.metrics === 'object') {
                  const mt = out.metrics as Record<string, string>;
                  out.metrics = {
                    reach: mt.estimatedReach || mt.reach || '',
                    ctr: mt.estimatedCtr || mt.ctr || '',
                    roas: mt.estimatedRoas || mt.roas || '',
                    conversions: mt.estimatedConversions || mt.conversions || '',
                  };
                }
                // confidence: number → string
                if (typeof out.confidence === 'number') {
                  out.confidence = out.confidence >= 80 ? 'High' : out.confidence >= 50 ? 'Medium' : 'Low';
                }
                // cta: ensure string
                if (out.cta && typeof out.cta === 'object') {
                  out.cta = String(out.cta.text || out.cta.label || '');
                }
                return out;
              });
              useBlueprintStore.getState().addBlueprints(normalized);
            }
            // Reset editor workflow from 'generating' back to 'editing'
            useBriefEditorStore.getState().setWorkflowState('editing');
            if (runId) trace.addEvent(runId, 'ui_update', 'Blueprint variants generated');
            break;
          }
          case 'media-mix': {
            // Apply media mix recommendation to the selected blueprint
            const mixData = skillResult.data as { channels?: Array<{ name: string; role: string; percentage: number; rationale: string }>; strategy?: string };
            if (mixData.channels && mixData.channels.length > 0) {
              const selectedId = useBlueprintStore.getState().selectedBlueprintId;
              if (selectedId) {
                const channelNames = mixData.channels.map(ch => ch.name);
                useBlueprintStore.getState().updateBlueprint(selectedId, { channels: channelNames });
                // Store the full mix data for the detail view to pick up
                const bp = useBlueprintStore.getState().getBlueprint(selectedId);
                if (bp) {
                  // Trigger re-render by updating with media mix metadata
                  useBlueprintStore.getState().updateBlueprint(selectedId, {
                    channels: channelNames,
                  });
                }
              }
              // Also emit a custom event so BlueprintDetailView can apply allocations
              window.dispatchEvent(new CustomEvent('media-mix-update', { detail: mixData }));
            }
            if (runId) trace.addEvent(runId, 'ui_update', 'Media mix recommendation applied to blueprint');
            break;
          }
          default: {
            // Other skills: store result in message metadata for consuming components
            if (runId) trace.addEvent(runId, 'ui_update', `Skill "${skillResult.skillName}" result available`);
            break;
          }
        }

        if (runId) trace.completeRun(runId, 'succeeded');
      }

      // Fallback: try legacy brief parser if no skill detected
      if (!skillDetected) {
        const briefSections = extractBriefFromContent(fullText);
        if (briefSections) {
          useBriefStore.getState().updateBriefFromAI(briefSections);
          briefPopulated = true;
          skillDetected = true;

          if (runId) {
            trace.addEvent(runId, 'skill_result', 'Campaign brief extracted via legacy parser', {
              data: { skillName: 'campaign-brief', sections: Object.keys(briefSections) },
            });
            trace.addEvent(runId, 'ui_update', 'Campaign Brief editor updated with AI-generated content');
            trace.completeRun(runId, 'succeeded');
          }
        } else if (runId) {
          trace.addEvent(runId, 'skill_result', 'No skill code fences found in response', { level: 'warn' });
          trace.completeRun(runId, 'succeeded');
        }
      }
    } else if (runId) {
      trace.completeRun(runId, 'succeeded');
    }

    // Keep only thinking + tool_call segments for display; content is suppressed
    // (the campaign draft was already set and populates the right panel)
    const displaySegments = finalizedSegments.filter((s) => s.type === 'thinking' || s.type === 'tool_call');

    const aiMsgMetadata: Record<string, unknown> = {};
    if (displaySegments.length > 0) aiMsgMetadata.segments = displaySegments;
    if (runId) aiMsgMetadata.runId = runId;

    if (displaySegments.length > 0 || runId || skillDetected || fullText) {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: briefPopulated
          ? 'Your campaign brief is ready — feel free to edit any section on the right. If you tell me what you want to change, I can update the brief.'
          : skillDetected
            ? 'Done — results are displayed in the corresponding panel.'
            : fullText || '',
        timestamp: new Date(),
        metadata: Object.keys(aiMsgMetadata).length > 0 ? aiMsgMetadata : undefined,
      };

      set((s) => ({
        messages: [...s.messages, aiMsg],
        isStreaming: false,
        isWaitingForResponse: false,
        streamingSegments: [],
        pendingThinkingStart: false,
        activeRunId: null,
      }));
    } else {
      set({
        isStreaming: false,
        isWaitingForResponse: false,
        streamingSegments: [],
        pendingThinkingStart: false,
        activeRunId: null,
      });
    }
  },

  setWaitingForResponse: (waiting: boolean) => {
    set({ isWaitingForResponse: waiting });
  },
}));

// ============ Demo mode helpers ============

/**
 * Parse the user's message and generate a structured CampaignDraft plus a chat response.
 */
function generateCampaignDraft(userMessage: string): { chatResponse: string; draft: CampaignDraft; thinkingSteps: string[] } {
  const lower = userMessage.toLowerCase();

  // --- Extract campaign name ---
  const campaignKeywords = [
    'black friday', 'cyber monday', 'summer sale', 'winter sale', 'spring sale',
    'back to school', 'holiday', 'flash sale', 'clearance', 'labor day',
    'memorial day', 'new year', 'valentine', 'easter', 'halloween',
    'prime day', 'boxing day',
  ];
  let campaignTheme = '';
  for (const kw of campaignKeywords) {
    if (lower.includes(kw)) {
      campaignTheme = kw.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }
  if (!campaignTheme) {
    // Fall back: use first few meaningful words
    campaignTheme = userMessage
      .replace(/^(build|create|make|set up|launch|design|prepare)\s+(a|an|the|my)?\s*/i, '')
      .split(/\s+/)
      .slice(0, 4)
      .join(' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const name = `${campaignTheme} Web Personalization Campaign`;

  // --- Extract audiences ---
  const audiencePatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /new\s*visitor/i, label: 'New Visitors' },
    { pattern: /first[- ]?time/i, label: 'First-Time Visitors' },
    { pattern: /returning\s*(visitor|customer|shopper)?/i, label: 'Returning Customers' },
    { pattern: /loyal\s*(customer|member|shopper)?/i, label: 'Loyal Members' },
    { pattern: /lapsed\s*(customer|buyer|shopper)?/i, label: 'Lapsed Customers' },
    { pattern: /vip/i, label: 'VIP Customers' },
    { pattern: /high[- ]?value/i, label: 'High-Value Customers' },
    { pattern: /cart\s*abandon/i, label: 'Cart Abandoners' },
    { pattern: /bargain|deal[- ]?seek/i, label: 'Bargain Seekers' },
    { pattern: /browse|window\s*shop/i, label: 'Browsers' },
  ];

  const audiences: Array<{ name: string }> = [];
  for (const { pattern, label } of audiencePatterns) {
    if (pattern.test(userMessage)) {
      audiences.push({ name: label });
    }
  }
  // Default audiences if none extracted
  if (audiences.length === 0) {
    audiences.push({ name: 'New Visitors' }, { name: 'Returning Customers' }, { name: 'Loyal Members' });
  }

  const audienceList = audiences.map((a) => a.name).join(', ');

  // --- Generate overview ---
  const overview =
    `This ${campaignTheme || 'web personalization'} campaign is designed to deliver tailored shopping experiences ` +
    `to each audience segment. By leveraging customer data and behavioral signals, we will dynamically personalize ` +
    `on-site content for ${audienceList} — driving higher engagement, conversion rates, and average order value.\n\n` +
    `The strategy moves beyond a one-size-fits-all approach. Each visitor segment will receive curated messaging, ` +
    `product recommendations, and creative assets aligned with their intent and relationship with the brand.`;

  // --- Goal ---
  const goalDescription = 'Increase Conversion Rate';
  const goalMetric = '+15% over non-personalized sessions';

  // --- Conclusion ---
  const conclusion =
    `By implementing this personalization strategy for ${campaignTheme || 'the campaign'}, we expect measurable ` +
    `improvements in conversion rate, average order value, and customer engagement across all targeted segments ` +
    `(${audienceList}).\n\n` +
    `The combination of audience-specific creative assets and dynamic content delivery will create a compelling ` +
    `shopping experience that reinforces brand loyalty and maximizes revenue during this key period.\n\n` +
    `Please review and let me know if you have any questions or require further details.`;

  // --- Audience Segments with targeting rules ---
  const audienceTargetingMap: Record<string, Array<{ rule: string; value: string }>> = {
    'New Visitors': [
      { rule: 'Customer Type', value: 'Prospect' },
      { rule: 'Visit Count', value: '1' },
      { rule: 'Behavior', value: 'Browsing without purchase history' },
      { rule: 'Value Tier', value: 'Unknown' },
    ],
    'First-Time Visitors': [
      { rule: 'Customer Type', value: 'Prospect' },
      { rule: 'Visit Count', value: '1' },
      { rule: 'Behavior', value: 'First session on site' },
      { rule: 'Value Tier', value: 'Unknown' },
    ],
    'Returning Customers': [
      { rule: 'Customer Type', value: 'Existing' },
      { rule: 'Purchase History', value: '2+ orders' },
      { rule: 'Behavior', value: 'Repeat purchaser within 90 days' },
      { rule: 'Value Tier', value: 'Medium' },
    ],
    'Loyal Members': [
      { rule: 'Customer Type', value: 'Loyalty Program Member' },
      { rule: 'Purchase History', value: '5+ orders' },
      { rule: 'Behavior', value: 'Frequent engagement, high repeat rate' },
      { rule: 'Value Tier', value: 'High' },
    ],
    'Lapsed Customers': [
      { rule: 'Customer Type', value: 'Existing — Inactive' },
      { rule: 'Purchase History', value: '1+ orders, none in 90+ days' },
      { rule: 'Behavior', value: 'Previously active, no recent engagement' },
      { rule: 'Value Tier', value: 'Medium-High (winback)' },
    ],
    'VIP Customers': [
      { rule: 'Customer Type', value: 'High-Spend Loyal' },
      { rule: 'Purchase History', value: 'Top 10% by revenue' },
      { rule: 'Behavior', value: 'Frequent purchases, high AOV' },
      { rule: 'Value Tier', value: 'Platinum' },
    ],
    'High-Value Customers': [
      { rule: 'Customer Type', value: 'High-Spend' },
      { rule: 'Purchase History', value: 'AOV in top 20%' },
      { rule: 'Behavior', value: 'Large basket sizes, premium categories' },
      { rule: 'Value Tier', value: 'High' },
    ],
    'Cart Abandoners': [
      { rule: 'Customer Type', value: 'Prospect or Existing' },
      { rule: 'Behavior', value: 'Added to cart but did not complete purchase' },
      { rule: 'Cart Status', value: 'Abandoned within 7 days' },
      { rule: 'Value Tier', value: 'Medium' },
    ],
    'Bargain Seekers': [
      { rule: 'Customer Type', value: 'Price-Sensitive' },
      { rule: 'Behavior', value: 'Browses sale/clearance pages, uses coupons' },
      { rule: 'Purchase History', value: 'Primarily discounted items' },
      { rule: 'Value Tier', value: 'Low-Medium' },
    ],
    'Browsers': [
      { rule: 'Customer Type', value: 'Prospect' },
      { rule: 'Visit Count', value: '2+' },
      { rule: 'Behavior', value: 'Multiple sessions, no purchase' },
      { rule: 'Value Tier', value: 'Low' },
    ],
  };

  const audienceSegmentsData = audiences.map((a, idx) => ({
    name: a.name,
    priority: idx === 0 ? 'Primary' : 'Secondary',
    targetingRules: audienceTargetingMap[a.name] || [
      { rule: 'Customer Type', value: 'General' },
      { rule: 'Behavior', value: 'Standard browsing patterns' },
      { rule: 'Value Tier', value: 'Medium' },
    ],
  }));

  // --- Content Variants ---
  const contentVariants = [
    {
      name: 'Variant A: Urgency-Focused',
      headline: `Don't Miss Our ${campaignTheme || 'Exclusive'} Deals`,
      body: `Time is running out! Shop the best ${campaignTheme || 'seasonal'} offers before they're gone. Exclusive savings on top categories, curated just for you.`,
      cta: 'Shop Now',
    },
    {
      name: 'Variant B: Value-Focused',
      headline: `Discover ${campaignTheme || 'Premium'} Savings Made for You`,
      body: `Unlock personalized picks and unbeatable value this ${campaignTheme || 'season'}. Hand-selected recommendations based on your style and preferences.`,
      cta: 'Explore Deals',
    },
  ];

  // --- Content Spots ---
  const contentSpotsData = [
    {
      page: 'Homepage',
      spots: ['Hero Banner (1920x600)', 'Category Carousel (1080x1080)', 'Promo Strip (1920x80)'],
    },
    {
      page: 'Product Page',
      spots: ['Product Recommendation Rail (350x350)'],
    },
    {
      page: 'Checkout',
      spots: ['Cross-Sell Banner (728x90)'],
    },
  ];

  // --- Duration ---
  const durationMap: Array<{ pattern: RegExp; duration: string }> = [
    { pattern: /black\s*friday/i, duration: 'November 25 - November 30' },
    { pattern: /cyber\s*monday/i, duration: 'November 28 - December 2' },
    { pattern: /summer/i, duration: 'June 1 - August 31' },
    { pattern: /spring/i, duration: 'March 10 - March 31' },
    { pattern: /winter/i, duration: 'December 1 - February 28' },
    { pattern: /holiday/i, duration: 'December 1 - December 31' },
    { pattern: /back\s*to\s*school/i, duration: 'August 1 - September 15' },
    { pattern: /valentine/i, duration: 'February 1 - February 14' },
    { pattern: /easter/i, duration: 'March 15 - April 5' },
    { pattern: /halloween/i, duration: 'October 15 - October 31' },
    { pattern: /new\s*year/i, duration: 'December 26 - January 5' },
    { pattern: /flash\s*sale/i, duration: '48-Hour Flash Event' },
  ];

  let duration = 'March 10 - March 31';
  for (const { pattern, duration: d } of durationMap) {
    if (pattern.test(userMessage)) {
      duration = d;
      break;
    }
  }

  // --- Primary Goal & KPI ---
  let primaryGoal = 'Increase Conversion Rate';
  let kpi = 'Conversion Rate (CR)';
  if (/engag/i.test(lower)) {
    primaryGoal = 'Boost Customer Engagement';
    kpi = 'Pages per Session';
  } else if (/retain|retention|loyal/i.test(lower)) {
    primaryGoal = 'Improve Customer Retention';
    kpi = 'Customer Lifetime Value (CLV)';
  } else if (/revenue|aov|order\s*value/i.test(lower)) {
    primaryGoal = 'Maximize Revenue';
    kpi = 'Revenue per Visitor (RPV)';
  } else if (/awareness|brand/i.test(lower)) {
    primaryGoal = 'Increase Brand Awareness';
    kpi = 'New Visitor Return Rate';
  }

  const draft: CampaignDraft = {
    name,
    description: `AI-generated personalization strategy for ${campaignTheme || 'campaign'} targeting ${audienceList}.`,
    overview,
    audiences,
    goalDescription,
    goalMetric,
    conclusion,
    audienceSegments: audienceSegmentsData,
    contentVariants,
    contentSpots: contentSpotsData,
    duration,
    primaryGoal,
    kpi,
  };

  const chatResponse =
    `I've prepared your **${name}** strategy! Here's a quick summary:\n\n` +
    `- **Audiences:** ${audienceList}\n` +
    `- **Duration:** ${duration}\n` +
    `- **Primary Goal:** ${primaryGoal}\n` +
    `- **KPI:** ${kpi}\n` +
    `- **Content Variants:** ${contentVariants.length} variants (Urgency-Focused & Value-Focused)\n` +
    `- **Content Spots:** ${contentSpotsData.reduce((acc, p) => acc + p.spots.length, 0)} spots across ${contentSpotsData.length} pages\n\n` +
    `You can review the full details in the panel on the right. Click **Create Campaign** to proceed to the wizard, ` +
    `where Step 1 will be pre-populated with the strategy details. Let me know if you'd like any adjustments.`;

  const thinkingSteps = [
    `Analyzing campaign brief... identifying key themes: ${campaignTheme || 'general promotion'}`,
    `Identifying target audiences: ${audienceList}`,
    `Determining campaign duration: ${duration}`,
    `Setting campaign goal and KPI: ${primaryGoal} / ${kpi}`,
    `Generating content variants: Urgency-Focused and Value-Focused`,
    `Mapping content spots across pages`,
    `Building audience segmentation with targeting rules`,
    `Strategy complete — review results in the panel`,
  ];

  return { chatResponse, draft, thinkingSteps };
}

// ============ Auto-persist chat messages ============

let previousMessagesLength = 0;

useChatStore.subscribe((state) => {
  const { messages } = state;

  // Short-circuit: don't overwrite saved history when resetChat clears messages
  if (messages.length === 0) {
    previousMessagesLength = 0;
    return;
  }

  // Avoid unnecessary writes during streaming (length unchanged)
  if (messages.length === previousMessagesLength) return;
  previousMessagesLength = messages.length;

  const briefId = useBriefStore.getState().activeBriefId;
  if (briefId) {
    chatHistoryStorage.saveMessages(briefId, messages);
  }
});
