/**
 * Campaign Brief types — structured, editable brief documents
 * populated by AI from chat input and editable by the user.
 */

// ── Base section interface ──────────────────────────────────────────

export interface BriefSectionBase {
  locked?: boolean;
  userEditedFields?: string[];
  notes?: string;
}

// ── Section interfaces ──────────────────────────────────────────────

export interface BriefOverviewSection extends BriefSectionBase {
  campaignName: string;
  objective: string;
  businessGoal: string;
  timelineStart: string;
  timelineEnd: string;
  budget: string;
  channels: string[];
}

export interface BriefAudienceSection extends BriefSectionBase {
  primaryAudience: string;
  audienceSize: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  segments: string[];
}

export interface BriefExperienceSection extends BriefSectionBase {
  headline: string;
  bodyMessage: string;
  ctaText: string;
  tone: string;
  placements: string[];
}

export interface BriefOfferSection extends BriefSectionBase {
  offerType: string;
  offerValue: string;
  offerConditions: string;
  promoCode: string;
  expirationDate: string;
}

export interface BriefMeasurementSection extends BriefSectionBase {
  primaryKpi: string;
  secondaryKpis: string[];
  secondaryMetrics: string[];
  successCriteria: string[];
  risks: string[];
}

// ── Section key union ───────────────────────────────────────────────

export type BriefSectionKey =
  | 'overview'
  | 'audience'
  | 'experience'
  | 'offer'
  | 'measurement';

// ── Sections map ────────────────────────────────────────────────────

export interface BriefSections {
  overview: BriefOverviewSection;
  audience: BriefAudienceSection;
  experience: BriefExperienceSection;
  offer: BriefOfferSection;
  measurement: BriefMeasurementSection;
}

// ── Campaign Brief ──────────────────────────────────────────────────

export type BriefStatus = 'draft' | 'in_review' | 'approved' | 'active';

export interface CampaignBrief {
  id: string;
  name: string;
  status: BriefStatus;
  createdAt: string;
  updatedAt: string;
  sourceMessage: string;
  sections: BriefSections;
}
