/**
 * Brief-to-Config Mapper — pure function that creates a CampaignConfig
 * from a CampaignBrief, optionally matching audience segments against
 * TDX child segments.
 *
 * Step 3 content is sourced from the Pages step (SavedPage/Spot).
 */

import type { CampaignBrief } from '../types/brief';
import type {
  CampaignConfig,
  CampaignSetupData,
  WizardSegment,
  ContentPage,
  ContentSpot,
  VariantContent,
} from '../types/campaignConfig';
import type { SavedPage } from '../types/page';
import { CURRENT_SCHEMA_VERSION } from './campaignConfigStorage';
import { localPageStorage } from './pageStorage';

// ── Goal type inference ─────────────────────────────────────────────

function inferGoalType(businessGoal: string): CampaignSetupData['goalType'] {
  const lower = businessGoal.toLowerCase();
  if (/engag/i.test(lower)) return 'engagement';
  if (/retain|retention|loyal|lifetime/i.test(lower)) return 'retention';
  if (/revenue|aov|order\s*value|maximize\s*revenue/i.test(lower)) return 'revenue';
  if (/awareness|brand/i.test(lower)) return 'awareness';
  return 'conversion';
}

// ── Fuzzy segment matching ──────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fuzzyMatch(briefSegment: string, tdxSegment: string): boolean {
  const a = normalize(briefSegment);
  const b = normalize(tdxSegment);
  return a === b || b.includes(a) || a.includes(b);
}

// ── ID generators ───────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Default variant content ─────────────────────────────────────────

function makeDefaultContent(brief: CampaignBrief): VariantContent {
  const { experience, offer } = brief.sections;
  return {
    headline: experience.headline || '',
    body: experience.bodyMessage || '',
    ctaText: experience.ctaText || '',
    imageUrl: '',
    deepLinkUrl: offer.offerValue ? '' : '',
  };
}

// ── Convert SavedPages to ContentPages ──────────────────────────────

function savedPagesToContentPages(
  savedPages: SavedPage[],
  defaultContent: VariantContent,
): ContentPage[] {
  return savedPages.map((page): ContentPage => ({
    pageId: page.id,
    pageName: page.pageName,
    pageUrlPattern: page.websiteUrl,
    thumbnail: {
      type: page.thumbnailDataUrl ? 'screenshot' : 'placeholder',
      url: page.thumbnailDataUrl || '',
      alt: page.pageName,
    },
    spots: page.spots.map((spot): ContentSpot => ({
      spotId: spot.id,
      spotName: spot.name,
      spotType: spot.type,
      selector: spot.selector,
      thumbnail: {
        type: 'placeholder',
        url: '',
        alt: `${spot.name} on ${page.pageName}`,
      },
      targetingMode: 'default_only',
      defaultVariant: { ...defaultContent },
      variants: [],
    })),
  }));
}

// ── Main mapper ─────────────────────────────────────────────────────

interface TdxChildSegment {
  id: string;
  name: string;
  count?: string;
  description?: string;
  rules?: Array<{ rule: string; value: string }>;
}

export function mapBriefToConfig(
  brief: CampaignBrief,
  parentSegmentId?: string,
  childSegments?: TdxChildSegment[]
): CampaignConfig {
  const { overview, audience, experience, offer, measurement } = brief.sections;

  // ── Step 1: Setup ───────────────────────────────────────────────
  const setup: CampaignSetupData = {
    name: overview.campaignName,
    objective: overview.objective,
    businessGoal: overview.businessGoal,
    goalType: inferGoalType(overview.businessGoal),
    startDate: overview.timelineStart,
    endDate: overview.timelineEnd,
    primaryKpi: measurement.primaryKpi,
    secondaryKpis: measurement.secondaryKpis,
    budget: overview.budget,
    channels: overview.channels,
  };

  // ── Step 2: Audiences ───────────────────────────────────────────
  const segments: WizardSegment[] = [];
  const resolvedParentId = parentSegmentId || '';

  if (childSegments && childSegments.length > 0) {
    const matchedBriefSegments = new Set<string>();

    for (const child of childSegments) {
      const matchedBrief = audience.segments.find((bs) => fuzzyMatch(bs, child.name));
      segments.push({
        id: child.id,
        name: child.name,
        parentSegmentId: resolvedParentId,
        count: child.count,
        description: child.description,
        rules: child.rules,
        isNew: false,
        isSelected: !!matchedBrief,
        source: 'tdx',
      });
      if (matchedBrief) matchedBriefSegments.add(matchedBrief);
    }

    for (const bs of audience.segments) {
      if (!matchedBriefSegments.has(bs)) {
        segments.push({
          id: makeId('seg'),
          name: bs,
          parentSegmentId: resolvedParentId,
          isNew: true,
          isSelected: false,
          source: 'brief',
        });
      }
    }
  } else {
    for (const bs of audience.segments) {
      segments.push({
        id: makeId('seg'),
        name: bs,
        parentSegmentId: resolvedParentId,
        isNew: true,
        isSelected: true,
        source: 'brief',
      });
    }
  }

  // ── Step 3: Content — sourced from Pages step ─────────────────
  const savedPages = localPageStorage.listPages();
  const defaultContent = makeDefaultContent(brief);
  const contentPages = savedPagesToContentPages(savedPages, defaultContent);

  // ── Step 4: Review ──────────────────────────────────────────────
  const now = new Date().toISOString();

  return {
    id: makeId('config'),
    briefId: brief.id,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    status: 'draft',
    currentStep: 1,
    createdAt: now,
    updatedAt: now,
    setup,
    audiences: {
      parentSegmentId: resolvedParentId,
      segments,
    },
    content: {
      pages: contentPages,
    },
    review: {
      trafficAllocation: 100,
      notes: '',
    },
  };
}
