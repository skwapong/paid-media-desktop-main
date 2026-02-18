import { useBriefEditorStore } from '../../stores/briefEditorStore';
import EditorToolbar from './editor/EditorToolbar';
import BriefSection from './editor/BriefSection';
import QualityScoreBar from './editor/QualityScoreBar';
import PlanGenerationLoading from './editor/PlanGenerationLoading';
import { SECTION_CONFIGS } from '../../types/campaignBriefEditor';
import type { CampaignBriefData } from '../../types/campaignBriefEditor';

interface CampaignBriefEditorPanelProps {
  onGeneratePlan?: (briefData: CampaignBriefData) => void;
}

export default function CampaignBriefEditorPanel({ onGeneratePlan }: CampaignBriefEditorPanelProps) {
  const workflowState = useBriefEditorStore((s) => s.state.workflowState);

  if (workflowState === 'generating') {
    return <PlanGenerationLoading />;
  }

  return (
    <div className="flex flex-col h-full bg-[#F7F8FB] rounded-2xl p-6 gap-6 overflow-hidden relative isolate">
      {/* Toolbar */}
      <EditorToolbar onGeneratePlan={onGeneratePlan} />

      {/* White content card with scrollable sections */}
      <div className="flex-1 overflow-y-auto flex justify-center">
        <div className="w-full max-w-[676px] bg-white rounded-xl px-10 pt-8 pb-[100px] flex flex-col gap-6 min-h-min">
          {SECTION_CONFIGS.map((config) => (
            <BriefSection key={config.key} config={config} />
          ))}
        </div>
      </div>

      {/* Quality Score Bar */}
      <QualityScoreBar />
    </div>
  );
}
