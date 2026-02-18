import { useState, useCallback } from 'react';
import type { Blueprint } from '../../../electron/utils/ipc-types';
import type { CampaignBriefData } from '../../types/campaignBriefEditor';
import { formatMessaging } from '../../utils/messagingHelpers';

interface ChannelAllocation {
  channel: string;
  role: string;
  notes: string[];
  percentage: number;
  spend: string;
}

interface TDSegment {
  id: string;
  name: string;
  audienceSize?: number;
  parentSegmentName?: string;
}

interface BlueprintDetailViewProps {
  blueprint: Blueprint;
  onClose: () => void;
  onDownload?: () => void;
  onUpdate?: (updatedBlueprint: Blueprint) => void;
  editable?: boolean;
  onApprove?: () => void;
  onModify?: (feedback: string) => void;
  onRegenerate?: () => void;
  isApproved?: boolean;
  showApprovalButtons?: boolean;
  currentVersion?: number;
  totalVersions?: number;
  onVersionChange?: (version: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  tdSegments?: TDSegment[];
  onSaveComplete?: (blueprint: Blueprint) => void;
  briefData?: Partial<CampaignBriefData>;
  onSendToChat?: (message: string) => void;
  isRecalculating?: boolean;
}

// Asset URLs
const imgMetaAds = '/assets/meta-ads.png';
const imgGoogleAds = '/assets/google-ads.png';
const imgTikTokAds = '/assets/tiktok-ads.png';
const imgYouTubeAds = '/assets/youtube-ads.svg';
const imgLinkedInAds = '/assets/linkedin-ads.svg';
const imgPinterestAds = '/assets/pinterest-ads.svg';
const imgSnapchatAds = '/assets/snapchat-ads.svg';
const imgXAds = '/assets/x-ads.svg';
const imgProgrammatic = '/assets/programmatic-ads.svg';
const imgConnectedTV = '/assets/connected-tv.svg';
const imgSpotifyAds = '/assets/spotify-ads.svg';
const imgAmazonAds = '/assets/amazon-ads.svg';

// Valid ad platform names
const VALID_CHANNELS = new Set([
  'Meta Ads', 'Google Ads', 'Google Search', 'Google Display', 'Google Shopping',
  'YouTube', 'YouTube Ads', 'YouTube Shorts', 'TikTok Ads', 'LinkedIn Ads',
  'Pinterest Ads', 'Snapchat Ads', 'Programmatic', 'Email', 'Twitter/X Ads',
  'X Ads', 'Connected TV', 'CTV', 'Spotify Ads', 'Amazon Ads', 'Apple Search Ads',
  'Instagram', 'Instagram Ads', 'Facebook Ads', 'Facebook',
]);

// Generate media mix data from blueprint
const generateMediaMix = (blueprint: Blueprint): ChannelAllocation[] => {
  const raw = blueprint.channels.length > 0 ? blueprint.channels : ['Meta Ads', 'Google Ads'];
  // Handle both string and object channel formats
  const channelNames = raw.map(ch => typeof ch === 'string' ? ch : (ch as any)?.name || String(ch));
  const channels = channelNames.filter(ch => VALID_CHANNELS.has(ch));
  if (channels.length === 0) channels.push('Meta Ads', 'Google Ads');

  const budget = parseFloat(blueprint.budget.amount.replace(/[^0-9.]/g, '')) || 0;
  const budgetMultiplier = blueprint.budget.amount.toUpperCase().includes('K') ? 1000 :
    blueprint.budget.amount.toUpperCase().includes('M') ? 1000000 : 1;
  const totalBudget = budget * budgetMultiplier;
  const currencyMatch = blueprint.budget.amount.match(/^([£$€])/);
  const currency = currencyMatch ? currencyMatch[1] : '£';

  const formatSpend = (pct: number): string => {
    const value = Math.round(totalBudget * (pct / 100) / 1000);
    if (value === 0) return '-';
    return `~${currency}${value}k`;
  };

  const roleMap: Record<string, { role: string; notes: string[]; percentage: number }> = {
    'Meta Ads': { role: 'Primary Acquisition', notes: ['Main driver of first-time purchases', 'Retargeting likely to saturate after ~2-3 weeks'], percentage: 50 },
    'Google Ads': { role: 'Demand Capture', notes: ['Captures high-intent demand', 'Scale constrained by search volume'], percentage: 30 },
    'YouTube Shorts': { role: 'Discovery', notes: ['Upper-funnel discovery', 'Test short-form concepts'], percentage: 10 },
    'TikTok Ads': { role: 'Awareness', notes: ['Reach younger demographics', 'Test creative formats'], percentage: 15 },
    'LinkedIn Ads': { role: 'Supporting', notes: ['Supporting channel for additional reach'], percentage: 5 },
    'Programmatic': { role: 'Scale', notes: ['Broad reach programmatic', 'Optimize for viewability'], percentage: 10 },
  };

  const initialAllocations = channels.map(channel => {
    const config = roleMap[channel] || { role: 'Supporting', notes: ['Supporting channel'], percentage: 5 };
    return { channel, role: config.role, notes: config.notes, percentage: config.percentage, spend: '' };
  });

  const totalPct = initialAllocations.reduce((sum, a) => sum + a.percentage, 0);
  const normalized = initialAllocations.map(a => ({
    ...a, percentage: Math.round((a.percentage / totalPct) * 100)
  }));

  const normalizedSum = normalized.reduce((sum, a) => sum + a.percentage, 0);
  if (normalizedSum !== 100 && normalized.length > 0) {
    normalized[0].percentage += (100 - normalizedSum);
  }

  return normalized.map(a => ({ ...a, spend: formatSpend(a.percentage) }));
};

// Generate expected outcomes
const generateOutcomes = (blueprint: Blueprint) => {
  const currencyMatch = blueprint.budget.amount.match(/^([£$€])/);
  const currency = currencyMatch ? currencyMatch[1] : '£';
  const budgetNum = parseFloat(blueprint.budget.amount.replace(/[^0-9.]/g, '')) || 0;
  const budgetMultiplier = blueprint.budget.amount.toUpperCase().includes('K') ? 1000 :
    blueprint.budget.amount.toUpperCase().includes('M') ? 1000000 : 1;
  const totalBudget = budgetNum * budgetMultiplier;
  const roasNum = parseFloat((blueprint.metrics.roas || '').replace(/[^0-9.]/g, '')) || 0;
  const onlineSales = totalBudget * roasNum;

  const convStr = blueprint.metrics.conversions || '';
  const convNum = parseFloat(convStr.replace(/[^0-9.]/g, '')) || 0;
  const convMultiplier = convStr.toUpperCase().includes('K') ? 1000 :
    convStr.toUpperCase().includes('M') ? 1000000 : 1;
  const totalConv = convNum * convMultiplier || 1;
  const cpa = totalBudget / totalConv;

  const fmtCurr = (amount: number) => {
    if (amount <= 0) return '-';
    if (amount >= 1000000) return `~${currency}${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `~${currency}${(amount / 1000).toFixed(0)}K`;
    return `~${currency}${Math.round(amount)}`;
  };

  return {
    onlineSales: fmtCurr(onlineSales),
    conversions: blueprint.metrics.conversions ? `~${blueprint.metrics.conversions}` : '-',
    roas: blueprint.metrics.roas ? `~${blueprint.metrics.roas}` : '-',
    cpa: cpa > 0 && isFinite(cpa) ? fmtCurr(cpa) : '-',
  };
};

// Section Actions toolbar
function SectionActions({ sectionName, onChat, onAIEdit, onEdit, isEditing, isAILoading }: {
  sectionName: string;
  onChat?: (question: string) => void;
  onAIEdit?: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  isAILoading?: boolean;
}) {
  return (
    <div className="bg-white border border-[#EFF2F8] rounded-xl shadow-sm flex items-center px-4 py-2.5 gap-4 overflow-hidden">
      <button
        onClick={() => onChat?.(`Why did you choose this ${sectionName.toLowerCase()} approach?`)}
        className="bg-transparent border-none px-2 py-2 text-base font-normal text-[#212327] cursor-pointer whitespace-nowrap rounded-lg transition-colors duration-200 hover:text-[#3B6FD4]"
      >
        Why this?
      </button>
      <div className="w-px h-8 bg-[#DCE1EA] flex-shrink-0" />
      <button
        onClick={() => onChat?.(`Tell me more about the ${sectionName.toLowerCase()} section`)}
        className="w-8 h-8 p-0 bg-white border-none rounded-lg cursor-pointer flex items-center justify-center text-[#212327] flex-shrink-0 transition-all duration-200 hover:text-[#3B6FD4] hover:bg-gray-100"
        title="Ask AI about this section"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M17.5 9.58C17.5 10.68 17.25 11.77 16.75 12.75C16.16 13.93 15.26 14.92 14.14 15.61C13.02 16.3 11.73 16.67 10.42 16.67C9.32 16.67 8.23 16.41 7.25 15.92L2.5 17.5L4.08 12.75C3.59 11.77 3.33 10.68 3.33 9.58C3.33 8.27 3.7 6.98 4.39 5.86C5.08 4.74 6.07 3.84 7.25 3.25C8.23 2.75 9.32 2.5 10.42 2.5H10.83C12.57 2.6 14.21 3.33 15.44 4.56C16.67 5.79 17.4 7.43 17.5 9.17V9.58Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="w-px h-8 bg-[#DCE1EA] flex-shrink-0" />
      <button
        onClick={onAIEdit}
        disabled={isAILoading}
        className={`w-8 h-8 p-0 bg-white border-none rounded-lg cursor-pointer flex items-center justify-center text-[#212327] flex-shrink-0 transition-all duration-200 hover:text-[#3B6FD4] hover:bg-gray-100 ${
          isAILoading ? 'text-[#3B6FD4] bg-[#EEF2FF]' : ''
        }`}
        title="AI Edit"
      >
        {isAILoading ? (
          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#3B6FD4] rounded-full animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M14.167 2.5L17.5 5.833L6.667 16.667H3.333V13.333L14.167 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 5L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      <button
        onClick={onEdit}
        className={`w-8 h-8 p-0 bg-white border-none rounded-lg cursor-pointer flex items-center justify-center text-[#212327] flex-shrink-0 transition-all duration-200 hover:text-[#3B6FD4] hover:bg-gray-100 ${
          isEditing ? 'text-[#3B6FD4] bg-[#EEF2FF]' : ''
        }`}
        title={isEditing ? 'Stop editing' : 'Edit'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.333 2L14 4.667L5.333 13.333H2.667V10.667L11.333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

// Channel icon helper
const getChannelIcon = (channel: string | unknown): string | null => {
  // Handle both string and object channel formats
  const channelName = typeof channel === 'string' ? channel : (channel as any)?.name || String(channel);
  const lc = channelName.toLowerCase();
  if (lc.includes('meta') || lc.includes('facebook') || lc.includes('instagram')) return imgMetaAds;
  if (lc.includes('youtube')) return imgYouTubeAds;
  if (lc.includes('google')) return imgGoogleAds;
  if (lc.includes('tiktok')) return imgTikTokAds;
  if (lc.includes('pinterest')) return imgPinterestAds;
  if (lc.includes('linkedin')) return imgLinkedInAds;
  if (lc.includes('snapchat')) return imgSnapchatAds;
  if (lc.includes('twitter') || lc === 'x' || lc.includes('x ads')) return imgXAds;
  if (lc.includes('programmatic')) return imgProgrammatic;
  if (lc.includes('connected tv') || lc.includes('ctv')) return imgConnectedTV;
  if (lc.includes('spotify')) return imgSpotifyAds;
  if (lc.includes('amazon')) return imgAmazonAds;
  return null;
};

export const BlueprintDetailView: React.FC<BlueprintDetailViewProps> = ({
  blueprint,
  onClose,
  onDownload,
  onUpdate,
  editable = true,
  onApprove,
  onModify,
  onRegenerate,
  isApproved = false,
  showApprovalButtons = false,
  currentVersion = 1,
  totalVersions = 1,
  onVersionChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  tdSegments = [],
  onSaveComplete,
  briefData,
  onSendToChat,
  isRecalculating = false,
}) => {
  const [allocations, setAllocations] = useState<ChannelAllocation[]>(() => generateMediaMix(blueprint));
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [aiLoadingSection, setAiLoadingSection] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});

  const outcomes = generateOutcomes(blueprint);

  // Currency and budget calculations
  const currencyMatch = blueprint.budget.amount.match(/^([£$€])/);
  const currency = currencyMatch ? currencyMatch[1] : '£';
  const budgetNum = parseFloat(blueprint.budget.amount.replace(/[^0-9.]/g, '')) || 0;
  const budgetMultiplier = blueprint.budget.amount.toUpperCase().includes('K') ? 1000 :
    blueprint.budget.amount.toUpperCase().includes('M') ? 1000000 : 1;
  const totalBudget = budgetNum * budgetMultiplier;

  const formatSpend = useCallback((pct: number): string => {
    const value = Math.round(totalBudget * (pct / 100) / 1000);
    if (value === 0) return '-';
    return `~${currency}${value}k`;
  }, [totalBudget, currency]);

  // Handle "Why this?" actions
  const handleSectionChat = (question: string) => {
    onSendToChat?.(question);
  };

  // Handle AI Edit
  const handleSectionAIEdit = async (sectionName: string) => {
    if (aiLoadingSection) return;
    setAiLoadingSection(sectionName);

    try {
      // Use IPC instead of fetch('/api/...')
      if (window.paidMediaSuite?.chat) {
        const message = `Help me improve the ${sectionName.toLowerCase()} section of this campaign blueprint`;
        onSendToChat?.(message);
      }
    } catch (err) {
      console.warn('[BlueprintDetailView] AI Edit failed:', err);
      onSendToChat?.(`Help me improve the ${sectionName.toLowerCase()} section`);
    } finally {
      setAiLoadingSection(null);
    }
  };

  // Handle section editing
  const handleSectionEdit = (sectionName: string) => {
    if (editingSection === sectionName) {
      setEditingSection(null);
      setEditDraft({});
    } else {
      const drafts: Record<string, string> = {};
      if (sectionName === 'Overview') {
        drafts.description = blueprint.messaging || '';
      }
      setEditDraft(drafts);
      setEditingSection(sectionName);
    }
  };

  // Save changes
  const handleSave = useCallback(() => {
    if (!onUpdate) return;
    setIsSaving(true);

    const updatedBlueprint: Blueprint = { ...blueprint };
    onUpdate(updatedBlueprint);

    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
      if (onSaveComplete) {
        onSaveComplete(updatedBlueprint);
      } else {
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 3000);
      }
    }, 500);
  }, [blueprint, onUpdate, onSaveComplete]);

  // Confidence score
  const confidenceScore = (() => {
    let score = 0;
    if (blueprint.budget?.amount && parseFloat(blueprint.budget.amount.replace(/[^0-9.]/g, '')) > 0) score += 15;
    if (blueprint.channels.length > 0) score += 10;
    if (blueprint.channels.length >= 3) score += 5;
    if (blueprint.audiences.length > 0) score += 10;
    if (blueprint.audiences.length >= 2) score += 5;
    if (blueprint.metrics.roas || blueprint.metrics.ctr) score += 10;
    if (blueprint.metrics.reach) score += 5;
    if (briefData?.primaryGoals?.length) score += 5;
    if (briefData?.primaryKpis?.length) score += 5;
    if (briefData?.primaryAudience?.length) score += 5;
    if (blueprint.budget?.pacing) score += 5;
    if (briefData?.timelineStart) score += 5;
    const mult = blueprint.confidence === 'High' ? 1.0 : blueprint.confidence === 'Medium' ? 0.9 : 0.8;
    return Math.min(Math.round(score * mult), 100);
  })();

  const hasBudget = budgetNum > 0;

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA] overflow-y-auto rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8ECF3] rounded-t-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-2 flex items-center text-gray-500 hover:text-gray-700"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" stroke="#6B7280" strokeWidth="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1" stroke="#6B7280" strokeWidth="1.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1" stroke="#6B7280" strokeWidth="1.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1" stroke="#6B7280" strokeWidth="1.5"/>
            </svg>
          </div>
          <span className="text-sm text-gray-500">Campaign Design Blueprints</span>
          <span className="text-gray-500">/</span>
          <span className="text-sm font-semibold text-gray-900">{blueprint.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-lg ${canUndo ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3.33334 6H10C11.841 6 13.3333 7.49238 13.3333 9.33333C13.3333 11.1743 11.841 12.6667 10 12.6667H6" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.33334 8L3.33334 6L5.33334 4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-lg ${canRedo ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12.6667 6H6C4.15905 6 2.66667 7.49238 2.66667 9.33333C2.66667 11.1743 4.15905 12.6667 6 12.6667H10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.6667 8L12.6667 6L10.6667 4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Download */}
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.66669 6.66667L8.00002 10L11.3334 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download
          </button>
          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 border-none rounded-lg text-sm font-medium text-white cursor-pointer transition-all duration-200 ${
              hasChanges ? 'bg-teal-600 hover:bg-teal-700' : 'bg-[#1957DB] hover:bg-[#1449B8]'
            } ${isSaving ? 'opacity-70' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-5 p-5" style={{ gridTemplateColumns: '240px 1fr' }}>
        {/* Left Sidebar */}
        <div className="flex flex-col gap-5 relative">
          {/* Recalculating overlay */}
          {isRecalculating && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl px-4 py-3 flex items-center gap-2.5 border border-blue-200 shadow-sm animate-pulse">
              <div className="w-4 h-4 border-2 border-[#3B6FD4] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-[#1957DB]">AI is re-evaluating your changes...</span>
            </div>
          )}

          {/* Confidence Score */}
          <div className={`bg-white rounded-xl p-5 shadow-sm transition-opacity duration-300 ${isRecalculating ? 'opacity-50 mt-12' : ''}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-[60px] h-[60px]">
                <svg viewBox="0 0 36 36" className="w-[60px] h-[60px] -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="3" strokeDasharray={`${confidenceScore}, 100`} />
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-green-500">
                  {confidenceScore}%
                </div>
              </div>
              <div className="text-xs text-gray-500">Campaign Confidence Score</div>
            </div>

            {/* Expected Outcomes */}
            <div className="mb-2">
              <div className="text-[13px] font-semibold text-gray-900 mb-3">Expected Outcomes</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Online Sales', value: outcomes.onlineSales },
                  { label: 'Conversions', value: outcomes.conversions },
                  { label: 'ROAS', value: outcomes.roas },
                  { label: 'CPA', value: outcomes.cpa },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[11px] text-gray-500">{item.label}</div>
                    <div className="text-base font-semibold text-gray-900">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blueprint Health */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-[13px] font-semibold text-gray-900 mb-3">Blueprint Health</div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Budget Sufficiency', ok: hasBudget },
                { label: 'Audience Reachability', ok: blueprint.audiences.length > 0 },
                { label: 'Creative Readiness', ok: true },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-700">{item.label}</span>
                  <span className={`text-[13px] font-medium ${item.ok ? 'text-green-500' : 'text-yellow-500'}`}>
                    {item.ok ? 'Good' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6">
          {/* Overview Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900 m-0">Overview</h2>
              <SectionActions
                sectionName="Overview"
                onChat={handleSectionChat}
                onAIEdit={() => handleSectionAIEdit('Overview')}
                onEdit={() => handleSectionEdit('Overview')}
                isEditing={editingSection === 'Overview'}
                isAILoading={aiLoadingSection === 'Overview'}
              />
            </div>

            {/* Campaign snapshot bar */}
            <div className="flex gap-0 mb-6 bg-gray-50 rounded-[10px] overflow-hidden border border-[#F0F1F3]">
              {[
                { label: 'Budget', value: briefData?.budgetAmount || blueprint.budget?.amount || '$200,000' },
                { label: 'Channels', value: `${blueprint.channels.length} channels` },
              ].map((item, i) => (
                <div key={i} className={`flex-1 px-4 py-3 flex flex-col ${i < 1 ? 'border-r border-gray-200' : ''}`}>
                  <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{item.label}</div>
                  <div className="text-[13px] font-semibold text-gray-900 mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {editingSection === 'Overview' ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editDraft.description ?? formatMessaging(blueprint.messaging) ?? ''}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[#3B6FD4] rounded-lg text-sm text-gray-700 leading-relaxed resize-y outline-none bg-[#FAFBFF] focus:ring-2 focus:ring-[#3B6FD4]/10"
                />
                <div className="flex gap-2 justify-end mt-3">
                  <button onClick={() => { setEditingSection(null); setEditDraft({}); }} className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 cursor-pointer hover:bg-gray-50">Cancel</button>
                  <button onClick={() => { if (onUpdate) onUpdate({ ...blueprint, messaging: editDraft.description || formatMessaging(blueprint.messaging) }); setEditingSection(null); }} className="px-3.5 py-1.5 bg-[#212327] border-none rounded-lg text-[13px] text-white cursor-pointer hover:bg-gray-700">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed m-0">
                {formatMessaging(blueprint.messaging) || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Media Mix Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900 m-0">Media Mix</h2>
              <SectionActions
                sectionName="Media Mix"
                onChat={handleSectionChat}
                onAIEdit={() => handleSectionAIEdit('Media Mix')}
                onEdit={() => handleSectionEdit('Media Mix')}
                isEditing={editingSection === 'Media Mix'}
                isAILoading={aiLoadingSection === 'Media Mix'}
              />
            </div>

            <div className="flex flex-col gap-4">
              {allocations.map((alloc, idx) => {
                const icon = getChannelIcon(alloc.channel);
                return (
                  <div key={idx} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {icon ? <img src={icon} alt={alloc.channel} className="w-5 h-5" /> : <span className="text-xs font-bold text-gray-400">{alloc.channel.charAt(0)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{alloc.channel}</span>
                        <span className="text-xs text-gray-500">{alloc.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900">{alloc.percentage}%</span>
                      <span className="text-xs text-gray-500">{alloc.spend}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Targeting Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900 m-0">Targeting</h2>
              <SectionActions
                sectionName="Targeting"
                onChat={handleSectionChat}
                onAIEdit={() => handleSectionAIEdit('Targeting')}
                onEdit={() => handleSectionEdit('Targeting')}
                isEditing={editingSection === 'Targeting'}
                isAILoading={aiLoadingSection === 'Targeting'}
              />
            </div>

            <div className="flex flex-col gap-4">
              {blueprint.audiences.map((audience, idx) => {
                // Handle both string and object audience formats
                const audienceName = typeof audience === 'string' ? audience : (audience as any)?.name || String(audience);
                return (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                      <circle cx="8" cy="8" r="6.5" stroke="#636A77" strokeWidth="1.5"/>
                      <circle cx="8" cy="8" r="3" stroke="#636A77" strokeWidth="1.5"/>
                      <circle cx="8" cy="8" r="1" fill="#636A77"/>
                    </svg>
                    <span className="text-sm text-gray-700">{audienceName}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${idx === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {idx === 0 ? 'Primary' : 'Secondary'}
                    </span>
                  </div>
                );
              })}
              {blueprint.audiences.length === 0 && (
                <p className="text-sm text-gray-400 italic m-0">No audiences defined yet.</p>
              )}

              {/* TD Segments */}
              {tdSegments.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">TD Audience Segments</div>
                  <div className="flex flex-wrap gap-2">
                    {tdSegments.map((seg) => (
                      <span key={seg.id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                        {seg.name}
                        {seg.audienceSize && <span className="ml-1 text-indigo-400">({seg.audienceSize >= 1000 ? `${(seg.audienceSize / 1000).toFixed(0)}K` : seg.audienceSize})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Creative Brief Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900 m-0">Creative Brief</h2>
              <SectionActions
                sectionName="Creative Brief"
                onChat={handleSectionChat}
                onAIEdit={() => handleSectionAIEdit('Creative Brief')}
                onEdit={() => handleSectionEdit('Creative Brief')}
                isEditing={editingSection === 'Creative Brief'}
                isAILoading={aiLoadingSection === 'Creative Brief'}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Primary Messaging</div>
                <p className="text-sm text-gray-700 leading-relaxed m-0 italic">
                  &ldquo;{formatMessaging(blueprint.messaging) || 'Compelling campaign messaging'}&rdquo;
                </p>
              </div>
              {blueprint.cta && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">CTA</div>
                  <span className="text-sm font-medium text-gray-900">{blueprint.cta}</span>
                </div>
              )}
              {blueprint.creativeBrief?.recommendedFormats && blueprint.creativeBrief.recommendedFormats.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommended Formats</div>
                  <div className="flex flex-col gap-1">
                    {blueprint.creativeBrief.recommendedFormats.map((fmt, idx) => (
                      <span key={idx} className="text-sm text-gray-600">• {fmt}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Approval Buttons */}
          {showApprovalButtons && (
            <div className="flex items-center gap-3 justify-end">
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                >
                  Regenerate
                </button>
              )}
              {onModify && (
                <button
                  onClick={() => onModify('Please modify this plan')}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                >
                  Modify
                </button>
              )}
              {onApprove && !isApproved && (
                <button
                  onClick={onApprove}
                  className="px-6 py-2.5 bg-green-600 border-none rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-green-700"
                >
                  Approve Plan
                </button>
              )}
              {isApproved && (
                <span className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg">
                  Approved
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 animate-fade-in">
          Blueprint saved successfully
        </div>
      )}
    </div>
  );
};
