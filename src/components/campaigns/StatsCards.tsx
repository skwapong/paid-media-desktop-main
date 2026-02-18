import { useCampaignStore } from '../../stores/campaignStore';
import type { CampaignStats } from '../../types/campaign';

interface StatCardData {
  label: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

// Mock stats data for initial rendering
const mockStats: CampaignStats = {
  activeCampaigns: 12,
  needsAttention: 3,
  overBudget: 1,
  launchingThisWeek: 2,
  activeCampaignsChange: 2,
  needsAttentionChange: 1,
  overBudgetChange: 0,
  launchingThisWeekChange: 1,
};

const StatsCards: React.FC = () => {
  const storeStats = useCampaignStore((s) => s.stats);

  // Use store stats if populated, otherwise fall back to mock data
  const statsData =
    storeStats.activeCampaigns > 0 ||
    storeStats.needsAttention > 0 ||
    storeStats.overBudget > 0 ||
    storeStats.launchingThisWeek > 0
      ? storeStats
      : mockStats;

  const stats: StatCardData[] = [
    {
      label: 'Active Campaigns',
      value: statsData.activeCampaigns,
      change: statsData.activeCampaignsChange,
      changeType:
        statsData.activeCampaignsChange > 0
          ? 'positive'
          : statsData.activeCampaignsChange < 0
            ? 'negative'
            : 'neutral',
    },
    {
      label: 'Needs Attention',
      value: statsData.needsAttention,
      change: statsData.needsAttentionChange,
      changeType:
        statsData.needsAttentionChange > 0
          ? 'negative'
          : statsData.needsAttentionChange < 0
            ? 'positive'
            : 'neutral',
    },
    {
      label: 'Over Budget',
      value: statsData.overBudget,
      change: statsData.overBudgetChange,
      changeType:
        statsData.overBudgetChange > 0
          ? 'negative'
          : statsData.overBudgetChange < 0
            ? 'positive'
            : 'neutral',
    },
    {
      label: 'Launching this Week',
      value: statsData.launchingThisWeek,
      change: statsData.launchingThisWeekChange,
      changeType:
        statsData.launchingThisWeekChange > 0
          ? 'positive'
          : statsData.launchingThisWeekChange < 0
            ? 'negative'
            : 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2"
        >
          <span className="text-sm text-gray-500">{stat.label}</span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
            {stat.change > 0 && (
              <div
                className={`flex items-center gap-1 ${
                  stat.changeType === 'positive'
                    ? 'text-cyan-500'
                    : stat.changeType === 'negative'
                      ? 'text-red-500'
                      : 'text-gray-500'
                }`}
              >
                <ArrowUpIcon />
                <span className="text-sm font-medium">+{stat.change}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ArrowUpIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 3V13M8 3L4 7M8 3L12 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default StatsCards;
