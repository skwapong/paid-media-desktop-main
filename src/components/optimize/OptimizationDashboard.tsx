import { useState, useMemo, useCallback } from 'react';
import { RefreshCw, History, X, Undo2, Sparkles, ChevronLeft, ChevronRight, TrendingUp, Brain } from 'lucide-react';
import HierarchicalTable from './HierarchicalTable';
import type {
  LiveCampaign,
  Ad,
  AdStatus,
} from '../../types/optimize';
// Zustand store available for future integration with live data
// import { useOptimizeStore } from '../../stores/optimizeStore';

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Inline mock data so the dashboard renders with sample content.

const mockCampaigns: LiveCampaign[] = [
  {
    id: 'camp-1',
    name: 'Q1 Brand Awareness',
    status: 'active',
    channel: 'Meta',
    channels: ['Meta', 'Google'],
    budget: 25000,
    spent: 14200,
    pacingStatus: 'on_track',
    metrics: { roas: 3.2, conversions: 412, cpa: 34.46, impressions: 890000, clicks: 24500, ctr: 2.75 },
    trendData: [
      { date: '2026-02-12', value: 2.8 },
      { date: '2026-02-13', value: 3.0 },
      { date: '2026-02-14', value: 3.1 },
      { date: '2026-02-15', value: 3.2 },
      { date: '2026-02-16', value: 3.4 },
      { date: '2026-02-17', value: 3.2 },
      { date: '2026-02-18', value: 3.3 },
    ],
    startDate: '2026-01-15',
    endDate: '2026-03-31',
    daysRemaining: 41,
    adGroups: [
      {
        id: 'ag-1-1',
        name: 'Broad Audience 25-54',
        status: 'active',
        targeting: 'Age 25-54, Interest: Technology',
        metrics: { impressions: 450000, clicks: 12500, conversions: 210, spend: 7200, cpa: 34.29, roas: 3.4 },
        ads: [
          {
            id: 'ad-1-1-1',
            name: 'Hero Video - Brand Story',
            status: 'active',
            creative: { type: 'video' },
            metrics: { impressions: 220000, clicks: 6800, ctr: 3.09, conversions: 125, spend: 4200, cpa: 33.60, roas: 3.8 },
            trendData: [
              { date: '2026-02-12', value: 3.0 },
              { date: '2026-02-18', value: 3.8 },
            ],
            fatigue: { score: 35, reason: 'Healthy performance', recommendation: 'Continue running', daysActive: 14 },
          },
          {
            id: 'ad-1-1-2',
            name: 'Static Banner - CTA Focus',
            status: 'active',
            creative: { type: 'image' },
            metrics: { impressions: 130000, clicks: 3200, ctr: 2.46, conversions: 52, spend: 1800, cpa: 34.62, roas: 2.9 },
            previousMetrics: { impressions: 140000, clicks: 3800, ctr: 2.71, conversions: 58, spend: 1900, cpa: 32.76, roas: 3.1 },
            fatigue: { score: 62, reason: 'CTR declined 9% in 7 days', recommendation: 'Consider creative refresh', daysActive: 28 },
          },
          {
            id: 'ad-1-1-3',
            name: 'Carousel - Product Features',
            status: 'paused',
            creative: { type: 'carousel' },
            metrics: { impressions: 100000, clicks: 2500, ctr: 2.50, conversions: 33, spend: 1200, cpa: 36.36, roas: 2.6 },
            fatigue: { score: 78, reason: 'CTR dropped 23% in 14 days', recommendation: 'Replace creative immediately', daysActive: 42 },
          },
        ],
      },
      {
        id: 'ag-1-2',
        name: 'Retargeting - Site Visitors',
        status: 'active',
        targeting: 'Website visitors last 30d',
        metrics: { impressions: 440000, clicks: 12000, conversions: 202, spend: 7000, cpa: 34.65, roas: 3.0 },
        ads: [
          {
            id: 'ad-1-2-1',
            name: 'Dynamic Product Ad',
            status: 'active',
            creative: { type: 'carousel' },
            metrics: { impressions: 250000, clicks: 7500, ctr: 3.00, conversions: 130, spend: 4500, cpa: 34.62, roas: 3.3 },
          },
          {
            id: 'ad-1-2-2',
            name: 'Testimonial Video',
            status: 'active',
            creative: { type: 'video' },
            metrics: { impressions: 190000, clicks: 4500, ctr: 2.37, conversions: 72, spend: 2500, cpa: 34.72, roas: 2.7 },
            previousMetrics: { impressions: 200000, clicks: 5200, ctr: 2.60, conversions: 80, spend: 2600, cpa: 32.50, roas: 2.9 },
          },
        ],
      },
    ],
  },
  {
    id: 'camp-2',
    name: 'LinkedIn Lead Gen',
    status: 'active',
    channel: 'LinkedIn',
    channels: ['LinkedIn'],
    budget: 15000,
    spent: 8900,
    pacingStatus: 'overspent',
    metrics: { roas: 2.1, conversions: 156, cpa: 57.05, impressions: 320000, clicks: 8400, ctr: 2.63 },
    trendData: [
      { date: '2026-02-12', value: 2.3 },
      { date: '2026-02-18', value: 2.1 },
    ],
    startDate: '2026-02-01',
    endDate: '2026-03-15',
    daysRemaining: 25,
    adGroups: [
      {
        id: 'ag-2-1',
        name: 'Decision Makers',
        status: 'active',
        targeting: 'Job Title: Director+, Company Size: 500+',
        metrics: { impressions: 180000, clicks: 4800, conversions: 89, spend: 5100, cpa: 57.30, roas: 2.2 },
        ads: [
          {
            id: 'ad-2-1-1',
            name: 'Whitepaper Download',
            status: 'active',
            creative: { type: 'image' },
            metrics: { impressions: 100000, clicks: 2800, ctr: 2.80, conversions: 52, spend: 3000, cpa: 57.69, roas: 2.3 },
          },
          {
            id: 'ad-2-1-2',
            name: 'Webinar Registration',
            status: 'active',
            creative: { type: 'video' },
            metrics: { impressions: 80000, clicks: 2000, ctr: 2.50, conversions: 37, spend: 2100, cpa: 56.76, roas: 2.1 },
            fatigue: { score: 45, reason: 'Moderate performance decline', recommendation: 'Monitor closely', daysActive: 18 },
          },
        ],
      },
      {
        id: 'ag-2-2',
        name: 'IT Professionals',
        status: 'paused',
        targeting: 'Job Function: IT, Skills: Data Engineering',
        metrics: { impressions: 140000, clicks: 3600, conversions: 67, spend: 3800, cpa: 56.72, roas: 1.9 },
        ads: [
          {
            id: 'ad-2-2-1',
            name: 'Case Study Ad',
            status: 'paused',
            creative: { type: 'image' },
            metrics: { impressions: 80000, clicks: 1800, ctr: 2.25, conversions: 32, spend: 1900, cpa: 59.38, roas: 1.7 },
            fatigue: { score: 82, reason: 'CTR dropped 30% over 3 weeks', recommendation: 'Replace creative', daysActive: 35 },
          },
          {
            id: 'ad-2-2-2',
            name: 'Demo Request',
            status: 'paused',
            creative: { type: 'image' },
            metrics: { impressions: 60000, clicks: 1800, ctr: 3.00, conversions: 35, spend: 1900, cpa: 54.29, roas: 2.2 },
          },
        ],
      },
    ],
  },
  {
    id: 'camp-3',
    name: 'TikTok Engagement',
    status: 'active',
    channel: 'TikTok',
    channels: ['TikTok'],
    budget: 10000,
    spent: 4300,
    pacingStatus: 'underspent',
    metrics: { roas: 4.1, conversions: 284, cpa: 15.14, impressions: 1200000, clicks: 42000, ctr: 3.50 },
    trendData: [
      { date: '2026-02-12', value: 3.5 },
      { date: '2026-02-18', value: 4.1 },
    ],
    startDate: '2026-02-10',
    endDate: '2026-04-10',
    daysRemaining: 51,
    adGroups: [
      {
        id: 'ag-3-1',
        name: 'Gen Z Creatives',
        status: 'active',
        targeting: 'Age 18-24, Interest: Tech & Gaming',
        metrics: { impressions: 700000, clicks: 25000, conversions: 170, spend: 2500, cpa: 14.71, roas: 4.5 },
        ads: [
          {
            id: 'ad-3-1-1',
            name: 'UGC Style - Trending',
            status: 'active',
            creative: { type: 'video' },
            metrics: { impressions: 400000, clicks: 16000, ctr: 4.00, conversions: 110, spend: 1500, cpa: 13.64, roas: 5.0 },
          },
          {
            id: 'ad-3-1-2',
            name: 'Product Demo - Short',
            status: 'active',
            creative: { type: 'video' },
            metrics: { impressions: 300000, clicks: 9000, ctr: 3.00, conversions: 60, spend: 1000, cpa: 16.67, roas: 3.8 },
          },
        ],
      },
      {
        id: 'ag-3-2',
        name: 'Millennial Professionals',
        status: 'active',
        targeting: 'Age 25-34, Interest: Business & Finance',
        metrics: { impressions: 500000, clicks: 17000, conversions: 114, spend: 1800, cpa: 15.79, roas: 3.6 },
        ads: [
          {
            id: 'ad-3-2-1',
            name: 'Expert Tips Series',
            status: 'active',
            creative: { type: 'video' },
            metrics: { impressions: 300000, clicks: 10000, ctr: 3.33, conversions: 70, spend: 1100, cpa: 15.71, roas: 3.8 },
          },
          {
            id: 'ad-3-2-2',
            name: 'Before/After Results',
            status: 'active',
            creative: { type: 'video' },
            metrics: { impressions: 200000, clicks: 7000, ctr: 3.50, conversions: 44, spend: 700, cpa: 15.91, roas: 3.3 },
            previousMetrics: { impressions: 180000, clicks: 5400, ctr: 3.00, conversions: 36, spend: 600, cpa: 16.67, roas: 3.0 },
          },
        ],
      },
    ],
  },
];

const mockSummary = {
  totalBudget: 50000,
  totalSpent: 27400,
  overallRoas: 3.1,
  totalConversions: 852,
  activeCampaigns: 3,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AIRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number;
  estimatedImpact: string;
  affectedItems: string[];
  action: () => void;
}

interface OptimizationHistoryEntry {
  id: string;
  type: 'pause' | 'activate' | 'auto_pause' | 'bulk_pause' | 'bulk_activate';
  adIds: string[];
  adNames: string[];
  reason: string;
  timestamp: Date;
  isAutomatic: boolean;
  canUndo: boolean;
}

interface FlattenedAd extends Ad {
  campaignId: string;
  campaignName: string;
  campaignChannel: string;
  adGroupId: string;
  adGroupName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenAds(campaigns: LiveCampaign[]): FlattenedAd[] {
  const ads: FlattenedAd[] = [];
  campaigns.forEach(campaign => {
    campaign.adGroups?.forEach(adGroup => {
      adGroup.ads.forEach(ad => {
        ads.push({
          ...ad,
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignChannel: campaign.channel,
          adGroupId: adGroup.id,
          adGroupName: adGroup.name,
        });
      });
    });
  });
  return ads;
}

function updateMultipleAdStatuses(
  campaigns: LiveCampaign[],
  adIds: string[],
  newStatus: AdStatus
): LiveCampaign[] {
  return campaigns.map(campaign => ({
    ...campaign,
    adGroups: campaign.adGroups?.map(adGroup => ({
      ...adGroup,
      ads: adGroup.ads.map(ad =>
        adIds.includes(ad.id) ? { ...ad, status: newStatus } : ad
      ),
    })),
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OptimizationDashboard() {
  const [campaigns, setCampaigns] = useState<LiveCampaign[]>(mockCampaigns);

  // Optimization history
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Semi-autonomous mode
  const [isAutoModeEnabled, setIsAutoModeEnabled] = useState(false);

  // Get all flattened ads
  const allAds = useMemo(() => flattenAds(campaigns), [campaigns]);

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Add to optimization history
  const addToHistory = useCallback((action: Omit<OptimizationHistoryEntry, 'id' | 'timestamp'>) => {
    const newAction: OptimizationHistoryEntry = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setOptimizationHistory(prev => [newAction, ...prev].slice(0, 50));
  }, []);

  // Pause low CTR ads
  const handlePauseLowCTRAds = useCallback(() => {
    const lowCTRAds = allAds.filter(ad => ad.status === 'active' && ad.metrics.ctr < 2.5);
    if (lowCTRAds.length === 0) {
      showToast('No active ads with CTR below 2.5% found', 'info');
      return;
    }
    const adIds = lowCTRAds.map(ad => ad.id);
    const adNames = lowCTRAds.map(ad => ad.name);
    setCampaigns(prev => updateMultipleAdStatuses(prev, adIds, 'paused'));
    addToHistory({
      type: 'bulk_pause',
      adIds,
      adNames,
      reason: 'CTR below 2.5%',
      isAutomatic: false,
      canUndo: true,
    });
    showToast(`Paused ${lowCTRAds.length} ads with CTR below 2.5%`, 'success');
  }, [allAds, showToast, addToHistory]);

  // Boost top performers
  const handleBoostTopPerformers = useCallback(() => {
    const topPerformers = allAds.filter(ad => ad.status === 'paused' && ad.metrics.roas >= 3);
    if (topPerformers.length === 0) {
      showToast('No paused top performers found (ROAS >= 3x)', 'info');
      return;
    }
    const adIds = topPerformers.map(ad => ad.id);
    const adNames = topPerformers.map(ad => ad.name);
    setCampaigns(prev => updateMultipleAdStatuses(prev, adIds, 'active'));
    addToHistory({
      type: 'bulk_activate',
      adIds,
      adNames,
      reason: 'ROAS >= 3x',
      isAutomatic: false,
      canUndo: true,
    });
    showToast(`Activated ${topPerformers.length} top performing ads`, 'success');
  }, [allAds, showToast, addToHistory]);

  // Undo action
  const handleUndo = useCallback((actionId: string) => {
    const action = optimizationHistory.find(a => a.id === actionId);
    if (!action || !action.canUndo) return;
    const newStatus: AdStatus = action.type.includes('pause') ? 'active' : 'paused';
    setCampaigns(prev => updateMultipleAdStatuses(prev, action.adIds, newStatus));
    setOptimizationHistory(prev =>
      prev.map(a => a.id === actionId ? { ...a, canUndo: false } : a)
    );
    showToast(`Undid: ${action.adNames.length} ad(s) ${newStatus}`, 'info');
  }, [optimizationHistory, showToast]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    setCampaigns([...mockCampaigns]);
    showToast('Data refreshed', 'info');
  }, [showToast]);

  // Stats
  const activeAdsCount = allAds.filter(a => a.status === 'active').length;
  const pausedAdsCount = allAds.filter(a => a.status === 'paused').length;
  const lowCTRCount = allAds.filter(a => a.status === 'active' && a.metrics.ctr < 2.5).length;
  const fatiguedAdsCount = allAds.filter(a => a.status === 'active' && a.fatigue && a.fatigue.score >= 50).length;

  // AI Insights
  const aiInsights = useMemo((): AIInsight[] => {
    const insights: AIInsight[] = [];

    if (lowCTRCount > 0) {
      insights.push({
        id: 'low-ctr',
        type: 'warning',
        title: `${lowCTRCount} ads underperforming`,
        description: `Found ${lowCTRCount} active ads with CTR below 2.5%. Pausing these could save budget for better performers.`,
        confidence: 92,
        impact: `~$${(lowCTRCount * 150).toLocaleString()} potential savings`,
        action: {
          label: 'Pause Low CTR Ads',
          onClick: handlePauseLowCTRAds,
        },
      });
    }

    const topPerformers = allAds.filter(ad => ad.status === 'paused' && ad.metrics.roas >= 3);
    if (topPerformers.length > 0) {
      insights.push({
        id: 'top-performers',
        type: 'opportunity',
        title: `${topPerformers.length} top performers paused`,
        description: `These ads have 3x+ ROAS but are currently paused. Reactivating could increase conversions.`,
        confidence: 88,
        impact: `+${Math.round(topPerformers.length * 12)} estimated conversions`,
        action: {
          label: 'Boost Top Performers',
          onClick: handleBoostTopPerformers,
        },
      });
    }

    if (fatiguedAdsCount > 0) {
      insights.push({
        id: 'fatigue',
        type: 'warning',
        title: 'Creative fatigue detected',
        description: `${fatiguedAdsCount} ads showing signs of creative fatigue. Consider refreshing creatives.`,
        confidence: 78,
        impact: 'CTR declining ~15%',
      });
    }

    if (mockSummary.overallRoas > 2.5) {
      insights.push({
        id: 'roas-prediction',
        type: 'prediction',
        title: 'Strong ROAS trajectory',
        description: `Current ${mockSummary.overallRoas.toFixed(1)}x ROAS trending to ${(mockSummary.overallRoas * 1.08).toFixed(1)}x by end of period.`,
        confidence: 85,
        impact: `+$${Math.round(mockSummary.totalSpent * 0.12).toLocaleString()} additional revenue`,
      });
    }

    return insights.slice(0, 3);
  }, [allAds, lowCTRCount, fatiguedAdsCount, handlePauseLowCTRAds, handleBoostTopPerformers]);

  // AI Recommendations
  const aiRecommendations = useMemo((): AIRecommendation[] => {
    const recommendations: AIRecommendation[] = [];

    const sortedCampaigns = [...campaigns].sort((a, b) => b.metrics.roas - a.metrics.roas);
    if (sortedCampaigns.length >= 2) {
      const bestCampaign = sortedCampaigns[0];
      const worstCampaign = sortedCampaigns[sortedCampaigns.length - 1];
      if (bestCampaign.metrics.roas > worstCampaign.metrics.roas * 1.5) {
        recommendations.push({
          id: 'budget-reallocation',
          priority: 'high',
          title: 'Reallocate budget to top performer',
          description: `Shift 20% budget from "${worstCampaign.name}" to "${bestCampaign.name}" for better returns.`,
          confidence: 91,
          estimatedImpact: '+15% overall ROAS',
          affectedItems: [bestCampaign.name, worstCampaign.name],
          action: () => showToast('Budget reallocation applied', 'success'),
        });
      }
    }

    const adGroupsWithIssues: string[] = [];
    campaigns.forEach(c => {
      c.adGroups?.forEach(ag => {
        const avgCtr = ag.ads.reduce((sum, ad) => sum + ad.metrics.ctr, 0) / ag.ads.length;
        if (avgCtr < 2.0) {
          adGroupsWithIssues.push(ag.name);
        }
      });
    });
    if (adGroupsWithIssues.length > 0) {
      recommendations.push({
        id: 'adgroup-optimization',
        priority: 'medium',
        title: 'Optimize underperforming ad groups',
        description: `${adGroupsWithIssues.length} ad groups have below-average CTR. Review targeting and creatives.`,
        confidence: 84,
        estimatedImpact: '+0.5% avg CTR',
        affectedItems: adGroupsWithIssues.slice(0, 3),
        action: () => showToast('Analysis sent to your inbox', 'info'),
      });
    }

    return recommendations;
  }, [campaigns, showToast]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toast Notifications */}
      <div className="fixed top-[90px] right-6 z-[1000] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-5 py-3.5 rounded-xl text-white text-sm font-medium shadow-lg animate-[slideIn_0.3s_ease] flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'warning' ? 'bg-yellow-500' :
              'bg-[#3B6FD4]'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* AI Insights Bar */}
        {aiInsights.length > 0 && (
          <AIInsightsBar insights={aiInsights} />
        )}

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Ad Performance
            </h2>
            <div className="flex gap-4">
              <span className="text-[13px] text-gray-500">
                {allAds.length} ads shown
              </span>
              <span className="text-[13px] text-green-500">
                {activeAdsCount} active
              </span>
              <span className="text-[13px] text-yellow-500">
                {pausedAdsCount} paused
              </span>
              {lowCTRCount > 0 && (
                <span className="text-[13px] text-red-500">
                  {lowCTRCount} low CTR
                </span>
              )}
              {fatiguedAdsCount > 0 && (
                <span className="text-[13px] text-yellow-500">
                  {fatiguedAdsCount} fatigued
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {/* Semi-Autonomous Toggle */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isAutoModeEnabled ? 'bg-indigo-50 border-[#3B6FD4]' : 'bg-[#F7F8FB] border-gray-200'}`}>
              <Sparkles className={`w-3.5 h-3.5 ${isAutoModeEnabled ? 'text-[#3B6FD4]' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isAutoModeEnabled ? 'text-[#3B6FD4]' : 'text-gray-500'}`}>
                Auto
              </span>
              <button
                onClick={() => setIsAutoModeEnabled(!isAutoModeEnabled)}
                className={`w-9 h-5 rounded-full border-none relative cursor-pointer transition-colors duration-200 ${isAutoModeEnabled ? 'bg-[#3B6FD4]' : 'bg-gray-300'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-[left] duration-200 ${isAutoModeEnabled ? 'left-[18px]' : 'left-0.5'}`}
                />
              </button>
            </div>

            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-2 rounded-lg border cursor-pointer flex items-center gap-1.5 text-xs font-medium transition-colors ${
                showHistory
                  ? 'border-[#3B6FD4] bg-indigo-50 text-[#3B6FD4]'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-[#F7F8FB]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
              {optimizationHistory.length > 0 && (
                <span className="bg-[#3B6FD4] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {optimizationHistory.length}
                </span>
              )}
            </button>

            {/* Summary Metrics */}
            <div className="flex gap-5">
              <MetricPill label="ROAS" value={`${mockSummary.overallRoas.toFixed(1)}x`} color="text-green-500" />
              <MetricPill label="Conv." value={mockSummary.totalConversions.toLocaleString()} color="text-[#3B6FD4]" />
              <MetricPill label="Spent" value={`$${(mockSummary.totalSpent / 1000).toFixed(1)}K`} color="text-purple-600" />
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-gray-200 bg-white cursor-pointer text-gray-500 flex items-center justify-center hover:bg-[#F7F8FB] hover:text-[#3B6FD4] transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Recommendations Section */}
        {aiRecommendations.length > 0 && (
          <AIRecommendationsSection recommendations={aiRecommendations} showToast={showToast} />
        )}

        {/* Hierarchical Campaign Tree */}
        <div className="flex-1 overflow-hidden p-3">
          <HierarchicalTable
            campaigns={campaigns}
            onCampaignsChange={setCampaigns}
            showToast={showToast}
          />
        </div>

        {/* AI-Enhanced Quick Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-[#F7F8FB] to-[#F5F3FF] flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span className="text-[13px] font-semibold text-indigo-500">
              AI-Suggested Actions
            </span>
          </div>
          <div className="flex gap-3">
            <AIQuickActionButton
              label={`Pause Low CTR (${lowCTRCount})`}
              onClick={handlePauseLowCTRAds}
              disabled={lowCTRCount === 0}
              confidence={92}
              impact={`Save ~$${(lowCTRCount * 150).toLocaleString()}`}
            />
            <AIQuickActionButton
              label="Boost Top Performers"
              onClick={handleBoostTopPerformers}
              primary
              confidence={88}
              impact="+12 conversions"
            />
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <HistoryPanel
            history={optimizationHistory}
            onUndo={handleUndo}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">{label}:</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function AIQuickActionButton({
  label,
  primary,
  onClick,
  disabled,
  confidence,
  impact,
}: {
  label: string;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  confidence?: number;
  impact?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={`text-[13px] font-semibold px-4 py-2.5 rounded-lg border-none cursor-pointer transition-all duration-200 flex items-center gap-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-px'
        } ${
          primary
            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg'
            : 'bg-white text-gray-800 border border-gray-200 shadow-sm hover:shadow-md'
        }`}
      >
        {primary && <Sparkles className="w-3 h-3" />}
        {label}
        {confidence && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            primary ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-500'
          }`}>
            {confidence}%
          </span>
        )}
      </button>

      {showTooltip && impact && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-800 text-white rounded-md text-[11px] whitespace-nowrap z-[100] shadow-lg">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span>Est. Impact: <strong>{impact}</strong></span>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}

// AI Insights Bar
function AIInsightsBar({ insights }: { insights: AIInsight[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const insight = insights[currentIndex];
  if (!insight) return null;

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      case 'prediction': return 'text-indigo-500';
      default: return 'text-[#3B6FD4]';
    }
  };

  return (
    <div className={`bg-gradient-to-br from-indigo-50 to-white border-b border-indigo-100 ${isExpanded ? 'py-4' : 'py-3'} px-6 transition-all duration-300 flex-shrink-0`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            AI Insights
          </div>

          <div className="flex items-center gap-2 flex-1">
            <span className={`text-[13px] font-semibold text-gray-800`}>
              {insight.title}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              -- {insight.description.slice(0, 60)}...
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
            <span className="text-[10px] font-semibold text-indigo-500">
              {insight.confidence}% confidence
            </span>
          </div>

          {insight.action && (
            <button
              onClick={insight.action.onClick}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-md border-none bg-gradient-to-br from-indigo-500 to-purple-500 text-white cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-md"
            >
              {insight.action.label}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {insights.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : insights.length - 1)}
                className="bg-transparent border-none cursor-pointer p-1 text-gray-500 rounded hover:bg-gray-200"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[11px] text-gray-500">
                {currentIndex + 1}/{insights.length}
              </span>
              <button
                onClick={() => setCurrentIndex(prev => prev < insights.length - 1 ? prev + 1 : 0)}
                className="bg-transparent border-none cursor-pointer p-1 text-gray-500 rounded hover:bg-gray-200"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-transparent border-none cursor-pointer px-2 py-1 text-indigo-500 text-[11px] font-medium rounded hover:bg-indigo-100"
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className="mt-3 pt-3 border-t border-indigo-100 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${insights.length}, 1fr)` }}
        >
          {insights.map((ins, idx) => (
            <div
              key={ins.id}
              onClick={() => setCurrentIndex(idx)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white hover:border-indigo-100 ${
                idx === currentIndex ? 'bg-white border border-indigo-100' : 'bg-transparent border border-transparent'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-xs font-semibold text-gray-800`}>
                  {ins.title}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-1.5 leading-relaxed m-0">
                {ins.description}
              </p>
              {ins.impact && (
                <span className={`text-[10px] font-semibold ${getInsightColor(ins.type)}`}>
                  Impact: {ins.impact}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// AI Recommendations Section
function AIRecommendationsSection({
  recommendations,
  showToast: showToastFn,
}: {
  recommendations: AIRecommendation[];
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleRecs = recommendations.filter(r => !dismissedIds.has(r.id));
  if (visibleRecs.length === 0) return null;

  const getPriorityColor = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  return (
    <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2.5">
        <Brain className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-xs font-semibold text-indigo-500">
          AI Recommendations
        </span>
        <span className="text-[11px] text-gray-500">
          Based on your campaign performance
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {visibleRecs.map(rec => (
          <div
            key={rec.id}
            className="min-w-[280px] p-3 rounded-xl bg-white border border-gray-200 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(rec.priority)}`} />
                <span className="text-xs font-semibold text-gray-800">
                  {rec.title}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 font-semibold">
                {rec.confidence}%
              </span>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed m-0">
              {rec.description}
            </p>

            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-[10px] font-semibold text-green-500">
                Est. Impact: {rec.estimatedImpact}
              </span>
            </div>

            <div className="flex gap-1.5 mt-1">
              <button
                onClick={rec.action}
                className="flex-1 text-[11px] font-semibold px-3 py-1.5 rounded-md border-none bg-gradient-to-br from-indigo-500 to-purple-500 text-white cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-md"
              >
                Apply
              </button>
              <button
                onClick={() => setDismissedIds(prev => new Set([...prev, rec.id]))}
                className="text-[11px] px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-500 cursor-pointer hover:bg-[#F7F8FB]"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// History Panel
function HistoryPanel({
  history,
  onUndo,
  onClose,
}: {
  history: OptimizationHistoryEntry[];
  onUndo: (actionId: string) => void;
  onClose: () => void;
}) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getActionLabel = (action: OptimizationHistoryEntry) => {
    switch (action.type) {
      case 'pause':
      case 'bulk_pause':
        return 'Paused';
      case 'activate':
      case 'bulk_activate':
        return 'Activated';
      case 'auto_pause':
        return 'Auto-paused';
      default:
        return 'Modified';
    }
  };

  const getActionColor = (action: OptimizationHistoryEntry) => {
    if (action.type.includes('pause')) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="absolute top-[60px] right-6 w-80 max-h-[400px] bg-white border border-gray-200 rounded-xl shadow-xl z-[100] flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-800 m-0">
          Optimization History
        </h3>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer text-gray-500 p-1 hover:text-gray-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {history.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-[13px]">
            No optimization actions yet
          </div>
        ) : (
          history.map((action) => (
            <div
              key={action.id}
              className={`p-3 rounded-lg mb-2 last:mb-0 ${action.isAutomatic ? 'bg-yellow-50' : 'bg-[#F7F8FB]'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1.5">
                  {action.isAutomatic && <Sparkles className="w-3 h-3 text-[#3B6FD4]" />}
                  <span className={`text-xs font-semibold ${getActionColor(action)}`}>
                    {getActionLabel(action)}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">
                  {formatTime(action.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-800 m-0 mb-1">
                {action.adNames.length === 1
                  ? action.adNames[0]
                  : `${action.adNames.length} ads`}
              </p>
              <p className="text-[11px] text-gray-500 m-0">
                {action.reason}
              </p>
              {action.canUndo && (
                <button
                  onClick={() => onUndo(action.id)}
                  className="mt-2 text-[11px] font-medium px-2 py-1 rounded border border-gray-200 bg-white text-gray-500 cursor-pointer flex items-center gap-1 hover:bg-[#F7F8FB] hover:text-[#3B6FD4]"
                >
                  <Undo2 className="w-3 h-3" /> Undo
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
