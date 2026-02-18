import type { Campaign } from '../../types/campaign';

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onClick }) => {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-600';
      case 'Draft':
        return 'bg-indigo-100 text-indigo-700';
      case 'Scheduled':
        return 'bg-sky-100 text-sky-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getBudgetBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-400';
    return 'bg-green-500';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:border-blue-600 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Icon */}
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z" stroke="#636A77" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-base text-gray-900 tracking-wide">{campaign.name}</h3>
          <p className="text-xs text-gray-500 tracking-wide">{campaign.description}</p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 mb-4">
        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-medium">
          {campaign.type}
        </span>
        <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusClasses(campaign.status)}`}>
          {campaign.status}
        </span>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="#636A77" strokeWidth="1.2"/>
          <path d="M2 6H14" stroke="#636A77" strokeWidth="1.2"/>
          <path d="M5 1V4" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M11 1V4" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-sm text-gray-500">{campaign.dateRange}</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricItem label="Conversions" value={campaign.conversions} />
        <MetricItem label="Reach" value={campaign.reach} />
        <MetricItem label="Budget" value={campaign.budget} />
        <MetricItem label="Pacing" value={campaign.pacing} />
      </div>

      {/* Budget Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Budget Spent</span>
          <span className="text-base text-gray-900">{campaign.budgetSpent}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${getBudgetBarColor(campaign.budgetSpent)}`}
            style={{ width: `${campaign.budgetSpent}%` }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 mb-4" />

      {/* Channel Tags */}
      <div className="flex gap-2 flex-wrap">
        {campaign.channels.map((channel, idx) => (
          <span
            key={idx}
            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-medium"
          >
            {channel}
          </span>
        ))}
      </div>
    </div>
  );
};

// Internal helper component for metrics
const MetricItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="#636A77" strokeWidth="1.2"/>
        <path d="M8 5V8L10 10" stroke="#636A77" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <p className="text-sm text-gray-900 ml-6 tracking-wide">{value}</p>
  </div>
);

export default CampaignCard;
