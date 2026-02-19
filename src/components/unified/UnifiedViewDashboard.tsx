import { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Target,
  TrendingUp,
  Wallet,
  Lightbulb,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Shuffle,
  Users,
  Palette,
  Clock,
  Sparkles,
  BarChart3,
  Trophy,
  AlertTriangle,
  Zap,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const kpiData = [
  {
    label: 'Revenue',
    value: '$482,300',
    change: +12.4,
    icon: DollarSign,
    format: 'currency',
    sparkline: [
      { v: 320 }, { v: 340 }, { v: 335 }, { v: 360 }, { v: 380 }, { v: 410 }, { v: 430 }, { v: 445 }, { v: 460 }, { v: 482 },
    ],
  },
  {
    label: 'Conversions',
    value: '18,740',
    change: +8.2,
    icon: ShoppingCart,
    format: 'number',
    sparkline: [
      { v: 14200 }, { v: 14800 }, { v: 15100 }, { v: 15600 }, { v: 16200 }, { v: 16800 }, { v: 17100 }, { v: 17500 }, { v: 18200 }, { v: 18740 },
    ],
  },
  {
    label: 'CPA',
    value: '$42',
    change: -5.1,
    icon: Target,
    format: 'currency',
    invertColor: true, // lower is better
    sparkline: [
      { v: 52 }, { v: 50 }, { v: 48 }, { v: 47 }, { v: 46 }, { v: 45 }, { v: 44 }, { v: 43 }, { v: 42 }, { v: 42 },
    ],
  },
  {
    label: 'ROAS',
    value: '3.8x',
    change: +15.3,
    icon: TrendingUp,
    format: 'multiplier',
    sparkline: [
      { v: 2.8 }, { v: 2.9 }, { v: 3.0 }, { v: 3.1 }, { v: 3.2 }, { v: 3.3 }, { v: 3.4 }, { v: 3.5 }, { v: 3.7 }, { v: 3.8 },
    ],
  },
  {
    label: 'Spend / Pacing',
    value: '$6,800',
    icon: Wallet,
    format: 'currency',
    pacing: { spent: 6800, budget: 10000 },
  },
];

const budgetAllocationData = [
  { channel: 'Meta', current: 32000, recommended: 35000 },
  { channel: 'Google Search', current: 28000, recommended: 26000 },
  { channel: 'TikTok', current: 18000, recommended: 24000 },
  { channel: 'YouTube', current: 15000, recommended: 12000 },
  { channel: 'Google Shop', current: 10000, recommended: 13000 },
  { channel: 'LinkedIn', current: 6000, recommended: 5000 },
];

const channelPerformanceData = [
  { channel: 'TikTok', cpa: 12.40 },
  { channel: 'Google Shop', cpa: 14.80 },
  { channel: 'Meta Ads', cpa: 18.20 },
  { channel: 'Google Search', cpa: 22.50 },
  { channel: 'YouTube', cpa: 28.10 },
  { channel: 'LinkedIn', cpa: 34.60 },
];

const topChannels = [
  { name: 'TikTok', roas: '4.2x', ctr: '3.8%' },
  { name: 'Google Shop', roas: '3.9x', ctr: '2.1%' },
  { name: 'Meta Ads', roas: '3.5x', ctr: '2.8%' },
];

interface BudgetShift {
  id: string;
  from: string;
  to: string;
  amount: number;
  rationale: string;
}

const budgetShifts: BudgetShift[] = [
  {
    id: 'shift-1',
    from: 'YouTube',
    to: 'TikTok',
    amount: 3000,
    rationale: 'TikTok CPA is 56% lower than YouTube with similar audience reach in the 18-34 demo.',
  },
  {
    id: 'shift-2',
    from: 'Google Search',
    to: 'Google Shop',
    amount: 2000,
    rationale: 'Shopping campaigns are converting at 1.5x the rate of Search with 35% lower CPA.',
  },
  {
    id: 'shift-3',
    from: 'LinkedIn',
    to: 'Meta',
    amount: 1000,
    rationale: 'Meta lookalike audiences outperform LinkedIn interest targeting by 2.1x on ROAS.',
  },
  {
    id: 'shift-4',
    from: 'YouTube',
    to: 'TikTok',
    amount: 3000,
    rationale: 'Short-form video on TikTok drives 40% higher engagement than YouTube pre-roll.',
  },
];

interface StrategyRecommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentColor: string;
}

const strategyRecommendations: StrategyRecommendation[] = [
  {
    id: 'strat-1',
    title: 'Audience Expansion',
    description:
      'Expand lookalike audiences on Meta from 1% to 3% to capture high-intent users currently outside your targeting. Data shows a 2.1x conversion lift in the 2-3% band.',
    impact: '+12% reach, +8% conversions',
    icon: Users,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    accentColor: 'border-l-purple-400',
  },
  {
    id: 'strat-2',
    title: 'Creative Refresh',
    description:
      'Rotate creative assets on TikTok and YouTube. Current top creatives have been running 18+ days and CTR has declined 22%. Fresh variants typically recover performance within 3 days.',
    impact: '+15% CTR, -12% CPA',
    icon: Palette,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    accentColor: 'border-l-amber-400',
  },
  {
    id: 'strat-3',
    title: 'Dayparting Strategy',
    description:
      'Focus 60% of spend during peak conversion hours (6–11 PM). Analysis shows 72% of purchases occur in this window but only 40% of current budget is allocated there.',
    impact: '+0.4x ROAS, -8% wasted spend',
    icon: Clock,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    accentColor: 'border-l-emerald-400',
  },
];

interface ChannelEfficiency {
  channel: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  ctr: number;
  convRate: number;
  color: string;
}

const channelEfficiencyData: ChannelEfficiency[] = [
  { channel: 'Meta Ads',       spend: 32000, revenue: 112000, roas: 3.5, cpa: 18.20, ctr: 2.8, convRate: 4.2, color: '#3b82f6' },
  { channel: 'Google Search',  spend: 28000, revenue: 89600,  roas: 3.2, cpa: 22.50, ctr: 3.1, convRate: 3.8, color: '#f59e0b' },
  { channel: 'TikTok',         spend: 18000, revenue: 75600,  roas: 4.2, cpa: 12.40, ctr: 3.8, convRate: 5.1, color: '#10b981' },
  { channel: 'YouTube',        spend: 15000, revenue: 39000,  roas: 2.6, cpa: 28.10, ctr: 1.4, convRate: 2.2, color: '#ef4444' },
  { channel: 'Google Shop',    spend: 10000, revenue: 39000,  roas: 3.9, cpa: 14.80, ctr: 2.1, convRate: 4.6, color: '#8b5cf6' },
  { channel: 'LinkedIn',       spend: 6000,  revenue: 13800,  roas: 2.3, cpa: 34.60, ctr: 0.9, convRate: 1.8, color: '#6366f1' },
];

function getRoasColor(roas: number) {
  if (roas >= 4.0) return 'text-emerald-600 bg-emerald-50';
  if (roas >= 3.0) return 'text-blue-600 bg-blue-50';
  if (roas >= 2.5) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

function getCpaColor(cpa: number) {
  if (cpa <= 15) return 'text-emerald-600';
  if (cpa <= 22) return 'text-blue-600';
  if (cpa <= 30) return 'text-amber-600';
  return 'text-red-600';
}

interface CampaignPerformance {
  rank: number;
  name: string;
  status: 'Scaling' | 'Stable' | 'Declining' | 'Testing';
  type: 'Retargeting' | 'Prospecting' | 'Testing';
  roas: number;
  cpa: number;
  revenue: number;
  trend: number;
  insights: [string, string];
}

const topCampaigns: CampaignPerformance[] = [
  {
    rank: 1,
    name: 'Spring Drop Cart Recovery',
    status: 'Scaling',
    type: 'Retargeting',
    roas: 5.6,
    cpa: 22,
    revenue: 26900,
    trend: +18.3,
    insights: [
      'High-intent traffic converting at 3x above average',
      'Cart abandoners responding well to 24hr retarget window',
    ],
  },
  {
    rank: 2,
    name: 'High LTV Lookalike Expansion (T2)',
    status: 'Scaling',
    type: 'Prospecting',
    roas: 4.1,
    cpa: 35,
    revenue: 25400,
    trend: +10.5,
    insights: [
      'Scalable audience funnel with consistent CPA under $40',
      'Extended lookalike (3-5%) still outperforming interest targets',
    ],
  },
  {
    rank: 3,
    name: 'Evergreen Retargeting — Discovery (25-40)',
    status: 'Stable',
    type: 'Retargeting',
    roas: 3.8,
    cpa: 40,
    revenue: 13300,
    trend: +5.2,
    insights: [
      'Mid-funnel awareness driving steady conversion volume',
      'Bounce-rate retargeting segment outperforming page-view segment',
    ],
  },
];

const bottomCampaigns: CampaignPerformance[] = [
  {
    rank: 1,
    name: 'Broad Prospecting — Interest Stack (US)',
    status: 'Declining',
    type: 'Prospecting',
    roas: 0.9,
    cpa: 89,
    revenue: 2900,
    trend: -22.0,
    insights: [
      'CPA has doubled over the past 14 days',
      'Audience overlap with 3 other active campaigns detected',
    ],
  },
  {
    rank: 2,
    name: 'B2 Scale Test — S5 LAL Expansion',
    status: 'Testing',
    type: 'Testing',
    roas: 1.2,
    cpa: 72,
    revenue: 2500,
    trend: -15.0,
    insights: [
      'Volatile CPA — insufficient data for stable optimization',
      'Lookalike seed audience too broad (>50k source)',
    ],
  },
  {
    rank: 3,
    name: 'Evergreen Retargeting — Cold (18-25)',
    status: 'Declining',
    type: 'Retargeting',
    roas: 1.5,
    cpa: 65,
    revenue: 2700,
    trend: -8.0,
    insights: [
      'Audience fatigue — frequency at 8.2x over 7 days',
      'Creative has been running unchanged for 30+ days',
    ],
  },
];

interface AudienceSegment {
  id: string;
  demo: string;
  roas: number;
  spend: number;
  revenue: number;
  conversions: number;
  trend: number;
  topChannel: string;
  campaignCount: number;
  insight: string;
}

const audienceSegments: AudienceSegment[] = [
  {
    id: 'aud-1',
    demo: 'Female, 25-34, Urban',
    roas: 5.2,
    spend: 24600,
    revenue: 127900,
    conversions: 4320,
    trend: +12.4,
    topChannel: 'Meta Ads',
    campaignCount: 4,
    insight: 'Strongest ROAS segment across all channels. Meta retargeting + TikTok prospecting driving majority of conversions.',
  },
  {
    id: 'aud-2',
    demo: 'Male, 25-34, Urban',
    roas: 4.0,
    spend: 24600,
    revenue: 47200,
    conversions: 1925,
    trend: +8.2,
    topChannel: 'TikTok',
    campaignCount: 3,
    insight: 'High volume segment. TikTok UGC campaigns outperforming Meta by 1.4x on this demographic.',
  },
  {
    id: 'aud-3',
    demo: 'Female, 35-44, Suburban',
    roas: 4.1,
    spend: 9500,
    revenue: 39000,
    conversions: 1420,
    trend: +5.7,
    topChannel: 'Google Shopping',
    campaignCount: 2,
    insight: 'Search-dominant segment. Google Shopping is capturing 78% of conversions for this cohort.',
  },
  {
    id: 'aud-4',
    demo: 'Male, 35-44, Urban/Metro',
    roas: 3.9,
    spend: 8200,
    revenue: 32000,
    conversions: 1180,
    trend: -2.1,
    topChannel: 'Google Search',
    campaignCount: 3,
    insight: 'Slight decline as LinkedIn B2B campaigns underperform. Google Search remains strong at 4.8x.',
  },
  {
    id: 'aud-5',
    demo: 'Female, 18-24, Urban',
    roas: 3.4,
    spend: 7800,
    revenue: 26500,
    conversions: 1650,
    trend: +15.8,
    topChannel: 'TikTok',
    campaignCount: 4,
    insight: 'Fastest growing segment with high engagement but lower AOV. Upsize creative recommended.',
  },
  {
    id: 'aud-6',
    demo: 'Male, 18-24, Urban',
    roas: 2.8,
    spend: 6500,
    revenue: 18200,
    conversions: 980,
    trend: -5.3,
    topChannel: 'YouTube',
    campaignCount: 2,
    insight: 'Mobile-first segment with top-funnel skew. Currently testing video vs static creative.',
  },
  {
    id: 'aud-7',
    demo: 'Female, 45-54, Suburban',
    roas: 7.5,
    spend: 4200,
    revenue: 31500,
    conversions: 820,
    trend: +22.0,
    topChannel: 'Google Search',
    campaignCount: 2,
    insight: 'Hidden gem segment. Very high ROAS across Search + Shopping. Low reach — scale carefully.',
  },
  {
    id: 'aud-8',
    demo: 'Male, 45-54, Suburban',
    roas: 3.1,
    spend: 3800,
    revenue: 11800,
    conversions: 410,
    trend: +1.2,
    topChannel: 'Google Search',
    campaignCount: 2,
    insight: 'Desktop-dominant segment. Search intent strong — only channel performing above 2x ROAS.',
  },
];

// ─── Creative Data ────────────────────────────────────────────────────────────

interface CreativeBubble {
  name: string;
  ctr: number;
  roas: number;
  spend: number;
  category: 'scale' | 'pause';
}

const creativeBubbleData: CreativeBubble[] = [
  { name: 'Spring Drop — UGC Video', ctr: 3.8, roas: 5.6, spend: 12000, category: 'scale' },
  { name: 'Cart Recovery — Carousel', ctr: 3.2, roas: 4.8, spend: 8500, category: 'scale' },
  { name: 'LTV Lookalike — Static', ctr: 2.9, roas: 4.1, spend: 9200, category: 'scale' },
  { name: 'Retargeting — Product Feed', ctr: 2.6, roas: 3.9, spend: 6800, category: 'scale' },
  { name: 'Evergreen — Testimonial', ctr: 2.4, roas: 3.5, spend: 5400, category: 'scale' },
  { name: 'Brand Awareness — Hero', ctr: 1.8, roas: 2.2, spend: 7200, category: 'pause' },
  { name: 'Prospecting — Interest Stack', ctr: 1.2, roas: 1.4, spend: 6500, category: 'pause' },
  { name: 'Back to Gym — Video', ctr: 0.9, roas: 0.9, spend: 4800, category: 'pause' },
  { name: 'B2 Scale Test — Static', ctr: 1.1, roas: 1.2, spend: 3200, category: 'pause' },
  { name: 'Cold Retarget — Banner', ctr: 1.4, roas: 1.5, spend: 3800, category: 'pause' },
];

interface CreativeCard {
  rank: number;
  name: string;
  type: string;
  roas: number;
  spend: number;
  conversions: number;
  impressions: string;
  recommendation: string;
  impact: string;
}

const scaleCreatives: CreativeCard[] = [
  { rank: 1, name: 'Spring Drop — UGC Video', type: 'Video · Meta', roas: 5.6, spend: 12000, conversions: 545, impressions: '320k', recommendation: 'Increase budget 40% and expand to TikTok', impact: '+$16.8k revenue' },
  { rank: 2, name: 'Cart Recovery — Carousel', type: 'Carousel · Meta', roas: 4.8, spend: 8500, conversions: 386, impressions: '265k', recommendation: 'Add dynamic product variants', impact: '+$8.2k revenue' },
  { rank: 3, name: 'LTV Lookalike — Static', type: 'Static · Meta', roas: 4.1, spend: 9200, conversions: 263, impressions: '312k', recommendation: 'Test video version of this concept', impact: '+0.5x ROAS' },
  { rank: 4, name: 'Retargeting — Product Feed', type: 'Dynamic · Google', roas: 3.9, spend: 6800, conversions: 170, impressions: '185k', recommendation: 'Expand to Shopping campaigns', impact: '+$4.2k revenue' },
  { rank: 5, name: 'Evergreen — Testimonial', type: 'Video · YouTube', roas: 3.5, spend: 5400, conversions: 135, impressions: '210k', recommendation: 'Refresh with new testimonial footage', impact: 'Maintain 3.5x ROAS' },
];

const pauseCreatives: CreativeCard[] = [
  { rank: 1, name: 'Back to Gym — Video', type: 'Video · Meta', roas: 0.9, spend: 4800, conversions: 54, impressions: '520k', recommendation: 'Pause immediately — CPA 62% above average', impact: 'Save $1.8k/week' },
  { rank: 2, name: 'B2 Scale Test — Static', type: 'Static · Meta', roas: 1.2, spend: 3200, conversions: 44, impressions: '180k', recommendation: 'Insufficient data — pause and redesign', impact: 'Save $960/week' },
  { rank: 3, name: 'Prospecting — Interest Stack', type: 'Static · Meta', roas: 1.4, spend: 6500, conversions: 73, impressions: '410k', recommendation: 'Audience too broad — narrow targeting first', impact: 'Save $2.1k/week' },
  { rank: 4, name: 'Cold Retarget — Banner', type: 'Banner · Google', roas: 1.5, spend: 3800, conversions: 58, impressions: '290k', recommendation: 'Creative fatigue at 8.2x frequency', impact: '-12% CPA with refresh' },
  { rank: 5, name: 'Brand Awareness — Hero', type: 'Video · YouTube', roas: 2.2, spend: 7200, conversions: 91, impressions: '680k', recommendation: 'Underperforming vs benchmark — test new hook', impact: '+0.8x ROAS potential' },
];

interface Opportunity {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  channel: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
}

const opportunities: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Pause Ad: "Back to Gym — Free Shipping (Video)"',
    description:
      'This ad has a CPA of $89, which is 62% above the account average. CTR has declined 34% over the last 7 days indicating creative fatigue.',
    confidence: 91,
    impact: 'high',
    channel: 'Meta',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    icon: AlertTriangle,
  },
  {
    id: 'opp-2',
    title: 'Reallocate budget to top-performing campaign',
    description:
      'Spring Drop Cart Recovery is delivering 5.6x ROAS. Shifting $3,000 from underperforming prospecting could yield an estimated $16,800 in additional revenue.',
    confidence: 89,
    impact: 'high',
    channel: 'TikTok',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    icon: Shuffle,
  },
  {
    id: 'opp-3',
    title: 'Exclude recent purchasers from retargeting',
    description:
      '14% of retargeting impressions are being served to users who already converted in the past 7 days. Excluding them could save $1,200/week in wasted spend.',
    confidence: 94,
    impact: 'high',
    channel: 'Google',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    icon: Target,
  },
  {
    id: 'opp-4',
    title: 'Increase Meta Lookalike bid cap by 10%',
    description:
      'Lookalike audiences are converting at 2.1x the rate of interest-based targeting but are losing 30% of auctions due to low bid caps.',
    confidence: 82,
    impact: 'medium',
    channel: 'Meta',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    icon: TrendingUp,
  },
  {
    id: 'opp-5',
    title: 'Enable dayparting for Meta campaigns',
    description:
      'Conversion data shows 72% of purchases occur between 6pm–11pm. Focusing spend on peak hours could improve ROAS by ~0.4x.',
    confidence: 78,
    impact: 'low',
    channel: 'Meta',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    icon: Clock,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  invertColor?: boolean;
  pacing?: { spent: number; budget: number };
  sparkline?: { v: number }[];
}

function KPICardComponent({
  label,
  value,
  change,
  icon: Icon,
  invertColor,
  pacing,
  sparkline,
}: KPICardProps) {
  const isPositive = change !== undefined ? change > 0 : undefined;
  // For metrics where lower is better (like CPA), invert the color logic
  const isGood =
    invertColor !== undefined && change !== undefined
      ? !isPositive
      : isPositive;

  const sparkColor = isGood === undefined ? '#3b82f6' : isGood ? '#10b981' : '#ef4444';

  return (
    <div className="flex-1 min-w-[160px] bg-gray-50/80 rounded-xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-semibold text-gray-900 font-mono">{value}</div>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <ArrowUpRight
                  className={`w-3.5 h-3.5 ${isGood ? 'text-emerald-500' : 'text-red-500'}`}
                />
              ) : (
                <ArrowDownRight
                  className={`w-3.5 h-3.5 ${isGood ? 'text-emerald-500' : 'text-red-500'}`}
                />
              )}
              <span
                className={`text-sm font-medium font-mono ${isGood ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        {sparkline && (
          <div className="w-20 h-10 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`sparkGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor}
                  strokeWidth={1.5}
                  fill={`url(#sparkGrad-${label})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {pacing && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1 font-mono">
            <span>
              ${pacing.spent.toLocaleString()} / $
              {pacing.budget.toLocaleString()}
            </span>
            <span>{Math.round((pacing.spent / pacing.budget) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{
                width: `${Math.min((pacing.spent / pacing.budget) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OpportunityCard({
  opportunity,
  onApply,
  onDismiss,
}: {
  opportunity: Opportunity;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = opportunity.icon;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Top row: icon + title + confidence */}
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${opportunity.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${opportunity.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] font-semibold text-gray-900 leading-snug">
              {opportunity.title}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 font-mono">
              {opportunity.confidence}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mt-1.5">
            {expanded ? opportunity.description : opportunity.description.slice(0, 80) + '...'}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-blue-500 hover:text-blue-700 font-medium bg-transparent border-none cursor-pointer p-0 mt-1"
          >
            {expanded ? 'Hide details' : 'View details'}
          </button>
        </div>
      </div>
      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={() => onDismiss(opportunity.id)}
          className="px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border-none cursor-pointer"
        >
          Dismiss
        </button>
        <button
          onClick={() => onApply(opportunity.id)}
          className="px-3 py-1.5 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors border-none cursor-pointer"
        >
          Review
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UnifiedViewDashboard() {
  const [visibleOpportunities, setVisibleOpportunities] =
    useState<Opportunity[]>(opportunities);
  const [activeTab, setActiveTab] = useState<'orchestration' | 'campaigns' | 'audience' | 'creative'>('orchestration');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const tabs = [
    { id: 'orchestration' as const, label: 'Cross Channel Orchestration' },
    { id: 'campaigns' as const, label: 'Campaigns' },
    { id: 'audience' as const, label: 'Audience' },
    { id: 'creative' as const, label: 'Creative' },
  ];

  const handleApply = (id: string) => {
    setVisibleOpportunities((prev) => prev.filter((o) => o.id !== id));
  };

  const handleDismiss = (id: string) => {
    setVisibleOpportunities((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className="flex h-full overflow-hidden p-4 gap-4">
      {/* Left column — white rounded canvas */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100">
        {/* Fixed header: daily briefing + KPI cards + tabs */}
        <div className="shrink-0 px-6 pt-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
              Daily Briefing
            </span>
            <span className="text-[11px] text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-[10px] text-gray-300 ml-auto">
              Updated {lastRefreshed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <h1 className="text-2xl font-semibold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #4BC8FE 0%, #94D056 50%)' }}>
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, Alexandra!
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Performance on track. Spend pacing aligned, CPA below target.
            <br />
            Two campaigns need attention due to rising costs.
          </p>

          {/* KPI Cards */}
          <div className="flex gap-4 mt-5">
            {kpiData.map((kpi) => (
              <KPICardComponent
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                change={kpi.change}
                icon={kpi.icon}
                invertColor={kpi.invertColor}
                pacing={kpi.pacing}
                sparkline={kpi.sparkline}
              />
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-5 border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer bg-transparent ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable tab content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5 space-y-6">

      {/* ── Cross Channel Orchestration Tab ── */}
      {activeTab === 'orchestration' && (<>
      {/* Row 1: Budget Allocation Chart + Budget Shifts */}
      <div className="grid grid-cols-[3fr_2fr] gap-6">
        {/* Current vs. Recommended Budget Allocation */}
        <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Current vs. Recommended Budget Allocation
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={budgetAllocationData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="channel"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                }
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  `$${(value ?? 0).toLocaleString()}`,
                  undefined,
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Bar
                dataKey="current"
                name="Current Spend"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="recommended"
                name="Recommended"
                fill="#67e8f9"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Total Spend</div>
              <div className="text-lg font-semibold text-gray-900 font-mono">$109k</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Efficient ROAS</div>
              <div className="text-lg font-semibold text-gray-900 font-mono">$115k</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Delta</div>
              <div className="text-lg font-semibold text-emerald-600 font-mono">+5%</div>
            </div>
          </div>
        </div>

        {/* Recommended Budget Shifts */}
        <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Shuffle className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Recommended Budget Shifts
            </h2>
          </div>
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto min-h-0">
            {budgetShifts.map((shift) => (
              <div
                key={shift.id}
                className="bg-gray-50/80 rounded-lg p-3.5 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {shift.from}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {shift.to}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 font-mono">
                    +${shift.amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {shift.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Channel Performance Metrics + Top Channels */}
      <div className="grid grid-cols-[3fr_2fr] gap-6">
        {/* Channel Performance Metrics */}
        <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Channel Performance Metrics
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={channelPerformanceData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <YAxis
                type="category"
                dataKey="channel"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                formatter={(value: number | undefined) => [
                  `$${(value ?? 0).toFixed(2)}`,
                  'CPA',
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Bar
                dataKey="cpa"
                name="CPA"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Channels Summary */}
        <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100 flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Top Performing Channels
          </h2>
          <div className="flex-1 flex flex-col gap-3">
            {topChannels.map((ch) => (
              <div key={ch.name} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{ch.name}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-semibold text-blue-600 font-mono">{ch.roas} <span className="text-[10px] font-normal text-gray-400">ROAS</span></span>
                    <span className="text-sm font-semibold text-gray-700 font-mono">{ch.ctr} <span className="text-[10px] font-normal text-gray-400">CTR</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Efficiency */}
      <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">
            Channel Efficiency
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">Channel</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 px-4">Spend</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 px-4">Revenue</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 px-4">ROAS</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 px-4">CPA</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 px-4">CTR</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-3 pl-4">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {channelEfficiencyData.map((row) => (
                <tr key={row.channel} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="text-sm font-medium text-gray-800">{row.channel}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-700 font-mono">${(row.spend / 1000).toFixed(0)}k</td>
                  <td className="text-right py-3 px-4 text-sm text-gray-700 font-mono">${(row.revenue / 1000).toFixed(0)}k</td>
                  <td className="text-right py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${getRoasColor(row.roas)}`}>
                      {row.roas.toFixed(1)}x
                    </span>
                  </td>
                  <td className={`text-right py-3 px-4 text-sm font-medium font-mono ${getCpaColor(row.cpa)}`}>
                    ${row.cpa.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-700 font-mono">{row.ctr.toFixed(1)}%</td>
                  <td className="text-right py-3 pl-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min((row.convRate / 6) * 100, 100)}%`, backgroundColor: row.color }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 w-10 text-right font-mono">{row.convRate.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Strategy Recommendations */}
      <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">
            AI Strategy Recommendations
          </h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Actionable strategies generated from cross-channel performance analysis
        </p>
        <div className="grid grid-cols-3 gap-4">
          {strategyRecommendations.map((rec) => {
            const Icon = rec.icon;
            return (
              <div
                key={rec.id}
                className={`bg-white rounded-lg p-4 border border-gray-100 border-l-[3px] ${rec.accentColor} shadow-sm`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${rec.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${rec.iconColor}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{rec.title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  {rec.description}
                </p>
                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600">
                    Estimated Impact:
                  </span>
                  <span className="text-xs font-medium text-gray-700">
                    {rec.impact}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      </>)}

      {/* ── Campaigns Tab ── */}
      {activeTab === 'campaigns' && (<>
      {/* Top Performing Campaigns */}
      <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-900">
            Top Performing Campaigns
          </h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Highest efficiency campaigns driving the best ROAS and conversion volume
        </p>
        <div className="grid grid-cols-3 gap-4">
          {topCampaigns.map((c) => (
            <div key={c.rank} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
              {/* Header pills */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-emerald-500 w-6 h-6 rounded-full flex items-center justify-center">
                    #{c.rank}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    c.status === 'Scaling' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {c.type}
                </span>
              </div>
              {/* Campaign name */}
              <div className="px-4 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug">{c.name}</h3>
              </div>
              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-px bg-gray-100 mx-4 rounded-lg overflow-hidden mb-3">
                <div className="bg-white p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">ROAS</div>
                  <div className="text-sm font-semibold text-emerald-600 font-mono">{c.roas.toFixed(1)}x</div>
                </div>
                <div className="bg-white p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">CPA</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono">${c.cpa}</div>
                </div>
                <div className="bg-white p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">Revenue</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono">${(c.revenue / 1000).toFixed(1)}k</div>
                </div>
                <div className="bg-white p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">Trend</div>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-600 font-mono">{c.trend}%</span>
                  </div>
                </div>
              </div>
              {/* Insights */}
              <div className="px-4 pb-4 space-y-1.5">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-gray-500 leading-relaxed">{c.insights[0]}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-gray-500 leading-relaxed">{c.insights[1]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Performing Campaigns */}
      <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-base font-semibold text-gray-900">
            Bottom Performing Campaigns
          </h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Bottom 3 of 24 active campaigns — candidates for pausing or budget reallocation
        </p>
        <div className="grid grid-cols-3 gap-4">
          {bottomCampaigns.map((c) => (
            <div key={c.rank + c.name} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
              {/* Header pills */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-red-400 w-6 h-6 rounded-full flex items-center justify-center">
                    #{c.rank}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    c.status === 'Declining' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {c.type}
                </span>
              </div>
              {/* Campaign name */}
              <div className="px-4 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug">{c.name}</h3>
              </div>
              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-px bg-gray-100 mx-4 rounded-lg overflow-hidden mb-3">
                <div className="bg-white p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">ROAS</div>
                  <div className="text-sm font-semibold text-red-600 font-mono">{c.roas.toFixed(1)}x</div>
                </div>
                <div className="bg-white p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">CPA</div>
                  <div className="text-sm font-semibold text-red-600 font-mono">${c.cpa}</div>
                </div>
                <div className="bg-white p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">Revenue</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono">${(c.revenue / 1000).toFixed(1)}k</div>
                </div>
                <div className="bg-white p-2.5">
                  <div className="text-[10px] text-gray-400 mb-0.5">Trend</div>
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-sm font-semibold text-red-600 font-mono">{c.trend}%</span>
                  </div>
                </div>
              </div>
              {/* Insights */}
              <div className="px-4 pb-4 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-gray-500 leading-relaxed">{c.insights[0]}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-gray-500 leading-relaxed">{c.insights[1]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>)}

      {/* ── Audience Tab ── */}
      {activeTab === 'audience' && (<>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">Audience Performance Analysis</h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Segment-level performance across all active campaigns and channels
        </p>
        <div className="grid grid-cols-4 gap-4">
          {audienceSegments.map((seg) => {
            const roasBg = seg.roas >= 4.0 ? 'bg-emerald-50 text-emerald-700' : seg.roas >= 3.0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700';
            const trendPositive = seg.trend > 0;

            return (
              <div key={seg.id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <span className="text-xs font-semibold text-gray-800">{seg.demo}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roasBg}`}>
                    {seg.roas.toFixed(1)}x
                  </span>
                </div>
                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-px bg-gray-100 mx-4 rounded-lg overflow-hidden mb-3">
                  <div className="bg-white p-2">
                    <div className="text-[10px] text-gray-400">Spend</div>
                    <div className="text-xs font-semibold text-gray-900 font-mono">${(seg.spend / 1000).toFixed(1)}k</div>
                  </div>
                  <div className="bg-white p-2">
                    <div className="text-[10px] text-gray-400">Revenue</div>
                    <div className="text-xs font-semibold text-gray-900 font-mono">${(seg.revenue / 1000).toFixed(1)}k</div>
                  </div>
                  <div className="bg-white p-2">
                    <div className="text-[10px] text-gray-400">Conversions</div>
                    <div className="text-xs font-semibold text-gray-900 font-mono">{seg.conversions.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-2">
                    <div className="text-[10px] text-gray-400">Trend</div>
                    <div className="flex items-center gap-0.5">
                      {trendPositive ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs font-semibold font-mono ${trendPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trendPositive ? '+' : ''}{seg.trend}%
                      </span>
                    </div>
                  </div>
                </div>
                {/* Top channel */}
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-gray-500">
                      Top Channel: <span className="font-medium text-gray-700">{seg.topChannel}</span> ({seg.campaignCount} campaigns)
                    </span>
                  </div>
                </div>
                {/* Insight */}
                <div className="px-4 pb-3.5">
                  <p className="text-[10px] text-gray-400 leading-relaxed">{seg.insight}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>)}

      {/* ── Creative Tab ── */}
      {activeTab === 'creative' && (<>

      {/* Bubble Chart — Creative Performance Landscape */}
      <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900">Creative Performance Landscape</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Bubble size represents spend. Green = scale candidates, Red = pause candidates.
        </p>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              dataKey="ctr"
              name="CTR"
              unit="%"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              label={{ value: 'Click-Through Rate (%)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              type="number"
              dataKey="roas"
              name="ROAS"
              unit="x"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'ROAS', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
            />
            <ZAxis type="number" dataKey="spend" range={[200, 1200]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as CreativeBubble;
                return (
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs">
                    <div className="font-semibold text-gray-900 mb-1">{d.name}</div>
                    <div className="text-gray-500">CTR: {d.ctr}% · ROAS: {d.roas}x · Spend: ${(d.spend / 1000).toFixed(1)}k</div>
                  </div>
                );
              }}
            />
            <Scatter data={creativeBubbleData}>
              {creativeBubbleData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.category === 'scale' ? '#10b981' : '#ef4444'}
                  fillOpacity={0.6}
                  stroke={entry.category === 'scale' ? '#059669' : '#dc2626'}
                  strokeWidth={1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Scale These Winners + Pause or Refresh These */}
      <div className="grid grid-cols-2 gap-6">
        {/* Scale These Winners */}
        <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900">Scale These Winners</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Top 5 creatives by efficiency — increase spend to maximize returns</p>
          <div className="space-y-2.5">
            {scaleCreatives.map((c) => (
              <div key={c.rank} className="bg-white rounded-lg border border-gray-100 p-3.5 border-l-[3px] border-l-emerald-400">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white bg-emerald-500 w-5 h-5 rounded-full flex items-center justify-center">
                      {c.rank}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                      <div className="text-[10px] text-gray-400">{c.type}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    {c.roas.toFixed(1)}x
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <div className="text-[10px] text-gray-400">Spend</div>
                    <div className="text-xs font-semibold text-gray-800 font-mono">${(c.spend / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Conv.</div>
                    <div className="text-xs font-semibold text-gray-800 font-mono">{c.conversions}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Impr.</div>
                    <div className="text-xs font-semibold text-gray-800 font-mono">{c.impressions}</div>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 pt-2 border-t border-gray-50">
                  <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500">{c.recommendation}</span>
                    <span className="text-[10px] font-semibold text-emerald-600 ml-1">{c.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pause or Refresh These */}
        <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-base font-semibold text-gray-900">Pause or Refresh These</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Bottom 5 creatives — candidates for pausing, refreshing, or reallocation</p>
          <div className="space-y-2.5">
            {pauseCreatives.map((c) => (
              <div key={c.rank} className="bg-white rounded-lg border border-gray-100 p-3.5 border-l-[3px] border-l-red-400">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white bg-red-400 w-5 h-5 rounded-full flex items-center justify-center">
                      {c.rank}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                      <div className="text-[10px] text-gray-400">{c.type}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full">
                    {c.roas.toFixed(1)}x
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <div className="text-[10px] text-gray-400">Spend</div>
                    <div className="text-xs font-semibold text-gray-800 font-mono">${(c.spend / 1000).toFixed(1)}k</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Conv.</div>
                    <div className="text-xs font-semibold text-gray-800 font-mono">{c.conversions}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Impr.</div>
                    <div className="text-xs font-semibold text-gray-800 font-mono">{c.impressions}</div>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 pt-2 border-t border-gray-50">
                  <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500">{c.recommendation}</span>
                    <span className="text-[10px] font-semibold text-red-600 ml-1">{c.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </>)}

      </div>
      </div>

      {/* Right — sticky AI Recommendations sidebar */}
      <div className="w-[340px] shrink-0 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col overflow-hidden">
        <div className="shrink-0 px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">
              AI Optimization Opportunities
            </h2>
          </div>
          <p className="text-[11px] text-gray-400">
            {visibleOpportunities.length} actionable suggestions based on your data
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="space-y-3">
            {visibleOpportunities.length > 0 ? (
              visibleOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onApply={handleApply}
                  onDismiss={handleDismiss}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                <Check className="w-8 h-8 mb-2" />
                <span className="text-sm">All caught up!</span>
                <span className="text-xs text-gray-300 mt-1">No pending recommendations</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

