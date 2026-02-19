import { Sparkles, Download, Undo2, Redo2, Loader2 } from 'lucide-react';
import { useBriefEditorStore } from '../../../stores/briefEditorStore';
import { useChatStore } from '../../../stores/chatStore';
import type { CampaignBriefData } from '../../../types/campaignBriefEditor';

interface EditorToolbarProps {
  onGeneratePlan?: (briefData: CampaignBriefData) => void;
}

export default function EditorToolbar({ onGeneratePlan }: EditorToolbarProps) {
  const { state, toggleAISuggestions, startGeneration, undo, redo, canUndo, canRedo } =
    useBriefEditorStore();

  const handleGeneratePlan = () => {
    startGeneration();
    onGeneratePlan?.(state.briefData);
  };

  const handleAISuggestions = () => {
    const wasOn = state.showAISuggestions;
    toggleAISuggestions();

    // When toggling ON, send a review request that produces brief-update-json
    if (!wasOn) {
      const briefJson = JSON.stringify(state.briefData, null, 2);
      const message = [
        'Review my campaign brief below and suggest concrete improvements.',
        'For EVERY section that could be stronger, provide updated values.',
        'Include improvements for as many sections as possible — especially any that are empty or weak.',
        '',
        'IMPORTANT: You MUST output your suggestions inside a brief-update-json code fence.',
        'Include only the fields you want to improve. Example:',
        '',
        '```brief-update-json',
        '{',
        '  "primaryGoals": ["Achieve 4:1 ROAS within 30 days", "Drive 10K conversions"],',
        '  "primaryKpis": ["ROAS", "CPA", "Conversion Rate"],',
        '  "inScope": ["US market", "Google Search", "Meta Ads"],',
        '  "outOfScope": ["Organic social", "Email marketing"]',
        '}',
        '```',
        '',
        'Current brief:',
        '```json',
        briefJson,
        '```',
      ].join('\n');

      useBriefEditorStore.getState().setAISuggestionsLoading(true);
      useBriefEditorStore.getState().setPendingSuggestionRequest(true);

      useChatStore.getState().sendMessage(message).finally(() => {
        useBriefEditorStore.getState().setAISuggestionsLoading(false);
        useBriefEditorStore.getState().setPendingSuggestionRequest(false);
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-[#F7F8FB] rounded flex-shrink-0">
      {/* Left - Title */}
      <div className="flex items-center gap-3 px-2">
        <h2 className="font-normal text-xl text-[#212327] m-0">
          Campaign Brief
        </h2>
      </div>

      {/* Right - Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Undo/Redo */}
        <div className="flex gap-2">
          <IconButton title="Undo" disabled={!canUndo} onClick={undo}>
            <Undo2 size={16} />
          </IconButton>
          <IconButton title="Redo" disabled={!canRedo} onClick={redo}>
            <Redo2 size={16} />
          </IconButton>
        </div>

        {/* AI Suggestions Toggle */}
        <button
          onClick={handleAISuggestions}
          disabled={state.aiSuggestionsLoading}
          className={`flex items-center gap-1.5 h-[47px] px-3 py-2 rounded-lg border text-base font-semibold cursor-pointer transition-all duration-200 ${
            state.showAISuggestions
              ? 'border-[#6F2EFF] bg-[#F3EEFF] text-[#6F2EFF]'
              : 'border-[#878F9E] bg-white text-[#636A77]'
          } hover:border-[#6F2EFF] hover:text-[#6F2EFF] disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {state.aiSuggestionsLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {state.aiSuggestionsLoading ? 'Analyzing...' : 'AI Suggestions'}
        </button>

        {/* Download */}
        <button
          className="flex items-center gap-1.5 h-[47px] px-3 py-2 rounded-lg border border-[#878F9E] bg-white text-base font-semibold text-[#636A77] cursor-pointer transition-all duration-200 hover:border-[#6F2EFF] hover:text-[#6F2EFF]"
          title="Download"
        >
          <Download size={16} />
          Download
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-[27.5px] bg-[#DCE1EA] flex-shrink-0" />

        {/* Generate Plan */}
        <button
          onClick={handleGeneratePlan}
          className="flex items-center gap-1.5 h-[47px] px-[18px] py-2 rounded-lg border-none bg-black text-base font-semibold text-white cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a]"
        >
          Generate Plan
        </button>
      </div>
    </div>
  );
}

function IconButton({
  children,
  title,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-[35px] h-[35px] bg-transparent border-none rounded transition-all duration-200 ${
        disabled
          ? 'cursor-default text-[#C5CAD3]'
          : 'cursor-pointer text-[#636A77] hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
