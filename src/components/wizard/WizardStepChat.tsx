import { useState } from 'react';
import type { WizardStep } from '../../types/campaignConfig';
import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import { parseCampaignSetupOutput } from '../../services/campaignSetupParser';
import { parseAudienceSelectionOutput } from '../../services/audienceSelectionParser';
import { parseContentCreationOutput } from '../../services/contentCreationParser';
import { parseCampaignReviewOutput, type CampaignReviewResult } from '../../services/campaignReviewParser';

interface WizardStepChatProps {
  step: WizardStep;
}

const stepSkillLabels: Record<WizardStep, string> = {
  1: 'Refine setup',
  2: 'Suggest segments',
  3: 'Generate content',
  4: 'Review campaign',
};

const stepPlaceholders: Record<WizardStep, string> = {
  1: 'e.g., "Make the objective more specific" or "Change the goal to retention"',
  2: 'e.g., "Suggest segments for cart abandoners" or "Add a VIP segment"',
  3: 'e.g., "Write a more urgent headline for loyalty members"',
  4: 'e.g., "Review my campaign" or "Are there any issues?"',
};

export default function WizardStepChat({ step }: WizardStepChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<CampaignReviewResult | null>(null);
  const [parsedData, setParsedData] = useState<unknown>(null);
  const applySkillOutput = useCampaignConfigStore((s) => s.applySkillOutput);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setIsLoading(true);
    setResponse(null);
    setReviewResult(null);
    setParsedData(null);

    try {
      const api = window.paidMediaSuite?.chat;
      if (!api?.sendToSession) {
        setResponse('AI chat not available. Configure your API key in Settings.');
        setIsLoading(false);
        return;
      }

      // Build context message with step info
      const config = useCampaignConfigStore.getState().config;
      const stepContext = config ? JSON.stringify(
        step === 1 ? config.setup :
        step === 2 ? config.audiences :
        step === 3 ? config.content :
        config
      ) : '';

      const contextMessage = `[Wizard Step ${step}: ${stepSkillLabels[step]}]\nCurrent data: ${stepContext}\n\nUser request: ${message}`;

      const result = await api.sendToSession(contextMessage);
      if (!result.success) {
        setResponse(`Failed: ${result.error}`);
      }
      // Response will come through the stream — for now, show a waiting message
      // In a full implementation, we'd subscribe to stream events here
      setResponse('Request sent to AI. Check the response and click Apply to use suggestions.');
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteAndParse = () => {
    // Allow users to paste AI output directly and parse it
    if (!response) return;

    let parsed: unknown = null;

    switch (step) {
      case 1:
        parsed = parseCampaignSetupOutput(response);
        break;
      case 2:
        parsed = parseAudienceSelectionOutput(response);
        break;
      case 3:
        parsed = parseContentCreationOutput(response);
        break;
      case 4: {
        const review = parseCampaignReviewOutput(response);
        if (review) {
          setReviewResult(review);
          return;
        }
        break;
      }
    }

    if (parsed) {
      setParsedData(parsed);
    }
  };

  const handleApply = () => {
    if (!parsedData) return;
    applySkillOutput(step, parsedData);
    setParsedData(null);
    setResponse('Changes applied successfully.');
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="text-xs font-medium text-gray-500">AI Assistant — {stepSkillLabels[step]}</span>
      </div>

      {/* Response area */}
      {response && (
        <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 max-h-24 overflow-y-auto">
          {response}
          {reviewResult && (
            <div className="mt-2 space-y-1">
              <div className="font-medium">Score: {reviewResult.overallScore}/100</div>
              <div>{reviewResult.summary}</div>
              {reviewResult.issues.map((issue, i) => (
                <div key={i} className={`flex gap-1 ${
                  issue.severity === 'error' ? 'text-red-600' :
                  issue.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  <span>{issue.severity === 'error' ? '!' : issue.severity === 'warning' ? '!' : 'i'}</span>
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parsed data preview + apply */}
      {parsedData !== null && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-green-600">Suggestions parsed</span>
          <button
            onClick={handleApply}
            className="px-3 py-1 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Apply
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={stepPlaceholders[step]}
          className="flex-1 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="px-3 py-2 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
