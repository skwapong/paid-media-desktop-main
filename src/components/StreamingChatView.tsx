/**
 * StreamingChatView - Renders both finalized messages and live streaming segments.
 *
 * Replaces the inline chat JSX in ChatPage, providing a unified view
 * for both demo mode and SDK-backed streaming conversations.
 */

import { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types/shared';
import type { StreamSegment } from '../types/chat';
import StreamingMessage, { ThinkingBlock } from './StreamingMessage';
import AgentThinking from './AgentThinking';
import ExecutionTrace from './ExecutionTrace';
import { useTraceStore } from '../stores/traceStore';
import { useChatStore } from '../stores/chatStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingChatViewProps {
  messages: ChatMessage[];
  streamingSegments: StreamSegment[];
  isStreaming: boolean;
  isWaitingForResponse: boolean;
}

export default function StreamingChatView({
  messages,
  streamingSegments,
  isStreaming,
  isWaitingForResponse,
}: StreamingChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const traceRuns = useTraceStore((s) => s.runs);
  const activeRunId = useChatStore((s) => s.activeRunId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingSegments]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            {msg.role === 'user' ? (
              <div className="flex justify-end mb-1">
                <div className="bg-gradient-to-b from-[#4e8ecc] to-[#487ec2] text-white rounded-tl-[24px] rounded-tr-[24px] rounded-bl-[24px] p-4 max-w-[90%]">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Render consolidated thinking block from metadata if present */}
                {msg.metadata?.segments && (() => {
                  const thinkingContent = (msg.metadata.segments as StreamSegment[])
                    .filter((seg) => seg.type === 'thinking')
                    .map((seg) => seg.content)
                    .join('\n');
                  return thinkingContent ? (
                    <div className="space-y-1">
                      <ThinkingBlock content={thinkingContent} />
                    </div>
                  ) : null;
                })()}
                {/* Render tool calls from metadata if present (hide internal SDK tools) */}
                {msg.metadata?.segments && (
                  <div className="space-y-1">
                    {(msg.metadata.segments as StreamSegment[])
                      .filter((seg) => seg.type === 'tool_call' && seg.toolCall.name !== 'Skill')
                      .map((seg, idx) => {
                        if (seg.type !== 'tool_call') return null;
                        const tc = seg.toolCall;
                        return (
                          <div
                            key={idx}
                            className={`border rounded-lg px-3 py-2 flex items-center gap-2 ${
                              tc.status === 'completed'
                                ? 'border-green-200 bg-green-50'
                                : tc.status === 'error'
                                  ? 'border-red-200 bg-red-50'
                                  : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            {tc.status === 'completed' ? (
                              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : tc.status === 'error' ? (
                              <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                              </svg>
                            )}
                            <span className="text-xs font-mono text-gray-600">{tc.name}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
                {/* Execution trace for this message */}
                {msg.metadata?.runId && traceRuns[msg.metadata.runId as string] && (
                  <ExecutionTrace run={traceRuns[msg.metadata.runId as string]} />
                )}
                {/* Render message content only if non-empty (after trace) */}
                {msg.content && (
                  <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
            {msg.role === 'user' && (
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Live streaming segments — show only thinking and tool_call, not content */}
        {isStreaming && streamingSegments.length > 0 && (
          <div className="animate-fade-in">
            <StreamingMessage segments={streamingSegments.filter((s) => s.type !== 'content')} />
          </div>
        )}

        {/* Waiting indicator */}
        {isWaitingForResponse && streamingSegments.length === 0 && (
          <div className="animate-fade-in">
            <AgentThinking />
          </div>
        )}

        {/* Live execution trace — shown during streaming before the AI message is finalized */}
        {(isStreaming || isWaitingForResponse) && activeRunId && traceRuns[activeRunId] && (
          <div className="animate-fade-in">
            <ExecutionTrace run={traceRuns[activeRunId]} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
