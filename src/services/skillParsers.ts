/**
 * Skill Parsers — Generic code-fence parser factory for all 21 paid-media skills.
 *
 * Each skill emits JSON inside a named code fence (e.g. ```campaign-brief-json).
 * The parsers extract and validate the JSON from streamed content.
 */

import type { CampaignBriefData } from '../types/campaignBriefEditor';
import type { Blueprint } from '../../electron/utils/ipc-types';

// ============ Generic Parser Factory ============

/**
 * Create a parser that extracts JSON from a named code fence.
 * Returns null if no fence found or JSON is invalid.
 */
function createCodeFenceParser<T>(fenceName: string): (content: string) => T | null {
  return (content: string): T | null => {
    const pattern = new RegExp('```' + fenceName + '\\s*\\n([\\s\\S]*?)\\n\\s*```');
    const match = content.match(pattern);
    if (!match) return null;
    try {
      return JSON.parse(match[1]) as T;
    } catch {
      return null;
    }
  };
}

// ============ Category A: Campaign Planning ============

/** Skill 1: Extract structured brief from natural language */
export const parseCampaignBrief = createCodeFenceParser<CampaignBriefData>('campaign-brief-json');

/** Skill 2: Partial brief updates from user instruction */
export const parseBriefUpdate = createCodeFenceParser<Partial<CampaignBriefData>>('brief-update-json');

/** Skill 4: Generate 3 blueprint variants */
export interface BlueprintsOutput {
  blueprints: Array<{
    id: string;
    name: string;
    variant: 'conservative' | 'balanced' | 'aggressive';
    confidence: 'High' | 'Medium' | 'Low';
    channels: string[];
    audiences: string[];
    budget: { amount: string; pacing: string };
    metrics: { reach: string; ctr: string; roas: string; conversions: string };
    messaging: string;
    cta: string;
    creativeBrief?: {
      primaryAngle: string;
      confidence: string;
      supportingMessages: string[];
      recommendedFormats: string[];
      fatigueRisk: string[];
      refreshPlan: string[];
    };
  }>;
}
export const parseBlueprints = createCodeFenceParser<BlueprintsOutput>('blueprints-json');

/** Skill 5: Partial blueprint updates */
export const parseBlueprintUpdate = createCodeFenceParser<Partial<Blueprint>>('blueprint-update-json');

// ============ Category B: Audience & Targeting ============

/** Skill 7: Audience segment recommendations */
export interface AudienceRecommendationOutput {
  recommendations: Array<{
    segmentId: string;
    segmentName: string;
    reason: string;
    confidence: 'High' | 'Medium' | 'Low';
    suggestedRole: 'prospecting' | 'retargeting' | 'suppression';
  }>;
}
export const parseAudienceRecommendation = createCodeFenceParser<AudienceRecommendationOutput>('audience-recommendation-json');

/** Skill 8: Segment overlap analysis */
export interface SegmentOverlapOutput {
  overlaps: Array<{
    segmentA: string;
    segmentB: string;
    overlapPercentage: number;
    recommendation: string;
  }>;
  totalUniqueReach: number;
}
export const parseSegmentOverlap = createCodeFenceParser<SegmentOverlapOutput>('segment-overlap-json');

// ============ Category C: Performance Analysis ============

/** Skill 9: Campaign performance forecasting */
export interface ForecastOutput {
  predictions: Array<{
    date: string;
    predicted: number;
    lowerBound: number;
    upperBound: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  aiInsight: string;
}
export const parseForecast = createCodeFenceParser<ForecastOutput>('forecast-json');

/** Skill 10: Anomaly detection alerts */
export interface AnomaliesOutput {
  alerts: Array<{
    campaignId: string;
    severity: 'critical' | 'warning' | 'info';
    type: 'spike' | 'drop' | 'trend_change';
    metric: string;
    currentValue: number;
    expectedValue: number;
    deviation: number;
    aiRecommendation: string;
  }>;
}
export const parseAnomalies = createCodeFenceParser<AnomaliesOutput>('anomalies-json');

/** Skill 11: Creative fatigue detection */
export interface CreativeFatigueOutput {
  results: Array<{
    adId: string;
    fatigueScore: number;
    trend: 'worsening' | 'stable' | 'improving';
    suggestedAction: 'refresh' | 'pause' | 'monitor' | 'rotate';
    recommendation: string;
  }>;
}
export const parseCreativeFatigue = createCodeFenceParser<CreativeFatigueOutput>('creative-fatigue-json');

/** Skill 12: Attribution analysis */
export interface AttributionOutput {
  channels: Array<{
    channel: string;
    firstTouch: number;
    lastTouch: number;
    linear: number;
    timeDecay: number;
    positionBased: number;
    dataDriven: number;
    revenue: number;
  }>;
  insights: Array<{
    channel: string;
    insight: string;
    recommendation: string;
  }>;
}
export const parseAttribution = createCodeFenceParser<AttributionOutput>('attribution-json');

/** Skill 13: Performance benchmarking */
export interface BenchmarkOutput {
  benchmarks: Array<{
    metric: string;
    yourValue: number;
    p25: number;
    p50: number;
    p75: number;
    percentile: number;
    position: 'above' | 'at' | 'below';
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
export const parseBenchmark = createCodeFenceParser<BenchmarkOutput>('benchmark-json');

// ============ Category D: Optimization ============

/** Skill 14: Budget allocation recommendations */
export interface BudgetAllocationOutput {
  allocations: Array<{
    channel: string;
    currentBudget: number;
    recommendedBudget: number;
    change: number;
    reasoning: string;
  }>;
  expectedImpact: {
    projectedRoas: number;
    projectedConversions: number;
    projectedCpa: number;
  };
}
export const parseBudgetAllocation = createCodeFenceParser<BudgetAllocationOutput>('budget-allocation-json');

/** Skill: Media mix recommendations */
export interface MediaMixOutput {
  channels: Array<{
    name: string;
    role: string;
    percentage: number;
    rationale: string;
  }>;
  removedChannels?: Array<{ name: string; reason: string }>;
  addedChannels?: Array<{ name: string; reason: string }>;
  strategy?: string;
  expectedImpact?: {
    reach?: string;
    efficiency?: string;
    confidence?: string;
  };
}
export const parseMediaMix = createCodeFenceParser<MediaMixOutput>('media-mix-json');

/** Skill 15: A/B test recommendations */
export interface ABTestsOutput {
  recommendations: Array<{
    testType: string;
    hypothesis: string;
    variants: Array<{ name: string; description: string }>;
    estimatedSampleSize: number;
    expectedLift: { min: number; max: number };
    priority: 'high' | 'medium' | 'low';
  }>;
}
export const parseABTests = createCodeFenceParser<ABTestsOutput>('ab-tests-json');

/** Skill 16: Optimization actions */
export interface OptimizationActionsOutput {
  actions: Array<{
    type: 'pause_ad' | 'reallocate_budget' | 'adjust_bid';
    risk: 'low' | 'high';
    targetId: string;
    reason: string;
    impact: string;
    confidence: number;
  }>;
}
export const parseOptimizationActions = createCodeFenceParser<OptimizationActionsOutput>('optimization-actions-json');

/** Skill 17: Campaign cloning */
export interface CloneCampaignOutput {
  clonedCampaign: Record<string, unknown>;
  changes: Array<{ field: string; original: unknown; new: unknown }>;
  suggestions: string[];
}
export const parseCloneCampaign = createCodeFenceParser<CloneCampaignOutput>('clone-campaign-json');

// ============ Category E: Reporting ============

/** Skill 18: Report generation */
export interface ReportOutput {
  title: string;
  sections: Array<{
    type: string;
    title: string;
    content: string;
  }>;
  aiSummary: string;
}
export const parseReport = createCodeFenceParser<ReportOutput>('report-json');

// ============ Multi-Parser Dispatch ============

/**
 * All parsers with their fence names, for use in chatStore.finalizeStream().
 * Iterates through all parsers and returns the first match.
 */
export const SKILL_PARSERS = [
  { name: 'campaign-brief', parse: parseCampaignBrief },
  { name: 'brief-update', parse: parseBriefUpdate },
  { name: 'blueprints', parse: parseBlueprints },
  { name: 'blueprint-update', parse: parseBlueprintUpdate },
  { name: 'audience-recommendation', parse: parseAudienceRecommendation },
  { name: 'segment-overlap', parse: parseSegmentOverlap },
  { name: 'forecast', parse: parseForecast },
  { name: 'anomalies', parse: parseAnomalies },
  { name: 'creative-fatigue', parse: parseCreativeFatigue },
  { name: 'attribution', parse: parseAttribution },
  { name: 'benchmark', parse: parseBenchmark },
  { name: 'budget-allocation', parse: parseBudgetAllocation },
  { name: 'media-mix', parse: parseMediaMix },
  { name: 'ab-tests', parse: parseABTests },
  { name: 'optimization-actions', parse: parseOptimizationActions },
  { name: 'clone-campaign', parse: parseCloneCampaign },
  { name: 'report', parse: parseReport },
] as const;

/**
 * Try all skill parsers against content. Returns the first match with its skill name.
 */
export function detectSkillOutput(content: string): { skillName: string; data: unknown } | null {
  for (const { name, parse } of SKILL_PARSERS) {
    const result = parse(content);
    if (result) {
      return { skillName: name, data: result };
    }
  }
  return null;
}
