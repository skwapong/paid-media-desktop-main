import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CampaignCard from './CampaignCard';
import CalendarView from './CalendarView';
import StatsCards from './StatsCards';
import { useCampaignStore } from '../../stores/campaignStore';
import type { Campaign, CampaignFilters } from '../../types/campaign';

type TabType = 'search' | 'gallery' | 'calendar';

interface CampaignsPageProps {
  onCampaignClick?: (campaign: Campaign) => void;
}

// AI-powered search suggestions
interface SearchSuggestion {
  icon: 'trending-down' | 'sparkle';
  label: string;
}

const searchSuggestions: SearchSuggestion[] = [
  { icon: 'trending-down', label: 'Underperforming this week' },
  { icon: 'sparkle', label: 'High spend, low ROAS' },
  { icon: 'sparkle', label: 'Scaling candidates' },
  { icon: 'sparkle', label: 'Launching in next 7 days' },
];

// Inline mock campaigns so the UI is always visible
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale 2024',
    description: 'Seasonal promotion campaign',
    type: 'Conversion',
    status: 'Active',
    dateRange: 'Jun 1 - Aug 31, 2024',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    conversions: '12,453',
    reach: '2.4M',
    budget: '$45,000',
    spent: 30150,
    pacing: 'On Track',
    budgetSpent: 67,
    channels: ['Meta', 'Google', 'TikTok'],
    metrics: { impressions: 5200000, clicks: 124000, ctr: 2.38, conversions: 12453, cpa: 2.42, roas: 4.1, spend: 30150 },
  },
  {
    id: '2',
    name: 'Brand Awareness Q3',
    description: 'Brand visibility campaign',
    type: 'Awareness',
    status: 'Active',
    dateRange: 'Jul 1 - Sep 30, 2024',
    startDate: '2024-07-01',
    endDate: '2024-09-30',
    conversions: '8,234',
    reach: '5.1M',
    budget: '$75,000',
    spent: 33750,
    pacing: 'Ahead',
    budgetSpent: 45,
    channels: ['YouTube', 'Meta', 'Display'],
    metrics: { impressions: 12000000, clicks: 310000, ctr: 2.58, conversions: 8234, cpa: 4.1, roas: 3.2, spend: 33750 },
  },
  {
    id: '3',
    name: 'Product V2 Launch',
    description: 'New product launch campaign',
    type: 'Awareness',
    status: 'Scheduled',
    dateRange: 'Oct 1 - Nov 15, 2024',
    startDate: '2024-10-01',
    endDate: '2024-11-15',
    conversions: '-',
    reach: '-',
    budget: '$120,000',
    spent: 0,
    pacing: 'Not Started',
    budgetSpent: 0,
    channels: ['Meta', 'Google', 'LinkedIn', 'TikTok'],
    metrics: { impressions: 0, clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0, spend: 0 },
  },
  {
    id: '4',
    name: 'Retargeting - Cart Abandoners',
    description: 'Re-engage cart abandoners',
    type: 'Retargeting',
    status: 'Active',
    dateRange: 'Jan 1 - Dec 31, 2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    conversions: '3,892',
    reach: '890K',
    budget: '$25,000',
    spent: 22250,
    pacing: 'Behind',
    budgetSpent: 89,
    channels: ['Meta', 'Google'],
    metrics: { impressions: 1800000, clicks: 54000, ctr: 3.0, conversions: 3892, cpa: 5.72, roas: 2.8, spend: 22250 },
  },
  {
    id: '5',
    name: 'Holiday Campaign 2024',
    description: 'End of year holiday push',
    type: 'Conversion',
    status: 'Draft',
    dateRange: 'Nov 15 - Dec 31, 2024',
    startDate: '2024-11-15',
    endDate: '2024-12-31',
    conversions: '-',
    reach: '-',
    budget: '$200,000',
    spent: 0,
    pacing: 'Not Started',
    budgetSpent: 0,
    channels: ['Meta', 'Google', 'TikTok', 'Pinterest'],
    metrics: { impressions: 0, clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0, spend: 0 },
  },
  {
    id: '6',
    name: 'Email Retargeting',
    description: 'Email subscriber engagement',
    type: 'Engagement',
    status: 'Completed',
    dateRange: 'Mar 1 - May 31, 2024',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    conversions: '15,234',
    reach: '1.2M',
    budget: '$30,000',
    spent: 30000,
    pacing: 'Complete',
    budgetSpent: 100,
    channels: ['Email', 'Meta'],
    metrics: { impressions: 3200000, clicks: 96000, ctr: 3.0, conversions: 15234, cpa: 1.97, roas: 6.2, spend: 30000 },
  },
];

const CampaignsPage: React.FC<CampaignsPageProps> = ({ onCampaignClick }) => {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    campaigns: storeCampaigns,
    setCampaigns,
    setFilters,
    getFilteredCampaigns,
  } = useCampaignStore();

  // Seed store with mock data if empty
  useEffect(() => {
    if (storeCampaigns.length === 0) {
      setCampaigns(mockCampaigns);
    }
  }, [storeCampaigns.length, setCampaigns]);

  const campaigns = getFilteredCampaigns();

  // Client-side search filtering
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;

    const query = searchQuery.toLowerCase();
    return campaigns.filter(
      (campaign) =>
        campaign.name.toLowerCase().includes(query) ||
        campaign.description.toLowerCase().includes(query) ||
        campaign.channels.some((c) => c.toLowerCase().includes(query))
    );
  }, [campaigns, searchQuery]);

  const handleSearchSubmit = useCallback(() => {
    if (!searchQuery.trim()) return;
    // In the desktop app this would trigger an IPC call to the Claude agent
    // For now, just apply as a text filter
    setFilters({ search: searchQuery });
  }, [searchQuery, setFilters]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.label);

    switch (suggestion.label) {
      case 'Underperforming this week':
        setFilters({ performance: 'below_target', status: 'Active' });
        break;
      case 'High spend, low ROAS':
        setFilters({ roasThreshold: 2.0, sort: 'spend_desc', status: 'Active' });
        break;
      case 'Scaling candidates':
        setFilters({ performance: 'above_target', status: 'Active' });
        break;
      case 'Launching in next 7 days': {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        setFilters({
          status: 'Scheduled',
          dateFrom: today.toISOString().split('T')[0],
          dateTo: nextWeek.toISOString().split('T')[0],
        });
        break;
      }
      default:
        setFilters({});
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'search', label: 'Search', icon: <SearchIcon /> },
    { id: 'gallery', label: 'Gallery', icon: <GalleryIcon /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon /> },
  ];

  return (
    <div className="flex gap-6 flex-1 min-h-[calc(100vh-101px)]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats Cards Row */}
        <StatsCards />

        {/* Main Card Container */}
        <div className="bg-white border border-gray-200/70 rounded-2xl flex-1 overflow-hidden flex flex-col shadow-sm">
          {/* Header */}
          <div className="pt-6 px-6">
            <h1 className="text-[28px] font-normal text-gray-900 mb-4">Campaigns</h1>

            {/* Tabs */}
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-none rounded-lg text-base cursor-pointer transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-black/5 text-gray-900'
                      : 'bg-transparent text-gray-500 hover:bg-black/5'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="bg-blue-50/40 rounded-xl p-6 flex flex-col gap-6">
                <h2 className="text-2xl font-normal text-gray-900">Search</h2>

                {/* Search Input Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col min-h-[196px] justify-between">
                  <textarea
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    placeholder="Search campaigns or ask: Which campaigns underperformed last week?"
                    className="border-none outline-none resize-none text-base text-gray-900 leading-7 flex-1 placeholder:text-gray-400 bg-transparent"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <IconButton>
                        <PlusIcon />
                      </IconButton>
                      <IconButton>
                        <PaperclipIcon />
                      </IconButton>
                      <IconButton>
                        <DocumentIcon />
                      </IconButton>
                    </div>
                    <button
                      onClick={handleSearchSubmit}
                      className="w-11 h-11 border-none rounded-full bg-gray-900 text-white cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-gray-700"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>

                {/* Search Suggestion Chips */}
                <div className="flex gap-4 flex-wrap">
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-gradient-to-br from-white/30 to-white/50 text-gray-600 text-base cursor-pointer transition-all duration-200 hover:border-gray-900 hover:bg-white"
                    >
                      {suggestion.icon === 'sparkle' ? <SparkleIcon /> : <TrendingDownIcon />}
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onClick={() => onCampaignClick?.(campaign)}
                  />
                ))}
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <CalendarView
                campaigns={filteredCampaigns}
                onCampaignClick={onCampaignClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Assistant - Floating Button */}
      <Link to="/campaign-chat">
        <button
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-none text-white cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all duration-300 z-[1000] hover:scale-110 hover:shadow-[0_6px_30px_rgba(99,102,241,0.6)] active:scale-95"
          aria-label="Open AI Assistant"
        >
          <SparklesIcon />
        </button>
      </Link>
    </div>
  );
};

// ---- Inline icon button helper ----
const IconButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button className="w-11 h-11 border border-gray-200 rounded-full bg-white text-gray-500 cursor-pointer flex items-center justify-center transition-all duration-200 hover:border-gray-900 hover:text-gray-900">
    {children}
  </button>
);

// ---- Icons ----
const SearchIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const GalleryIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="12" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 8H18" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M17 3L3 10L9 12M17 3L9 12M17 3L12 17L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SparkleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1L10.5 6L15.5 7.5L10.5 9L9 14L7.5 9L2.5 7.5L7.5 6L9 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11L14.75 13L17 13.75L14.75 14.5L14 16.5L13.25 14.5L11 13.75L13.25 13L14 11Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrendingDownIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 12L10.5 6.5L7 10L2 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12H16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaperclipIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M16 7.5L8.5 15C7.12 16.38 4.88 16.38 3.5 15C2.12 13.62 2.12 11.38 3.5 10L11 2.5C11.83 1.67 13.17 1.67 14 2.5C14.83 3.33 14.83 4.67 14 5.5L7.5 12C7.22 12.28 6.78 12.28 6.5 12C6.22 11.72 6.22 11.28 6.5 11L12 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DocumentIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M11 2H5C4.45 2 4 2.45 4 3V17C4 17.55 4.45 18 5 18H15C15.55 18 16 17.55 16 17V7M11 2L16 7M11 2V7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SparklesIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 5L18.75 7.25L21 8L18.75 8.75L18 11L17.25 8.75L15 8L17.25 7.25L18 5Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default CampaignsPage;
