/**
 * Brief Parser — demo-mode AI parsing of user messages into structured brief sections.
 * Reuses keyword-matching patterns from generateCampaignDraft() in chatStore.ts.
 */

import type {
  BriefSections,
  BriefSectionBase,
  BriefOverviewSection,
  BriefAudienceSection,
  BriefExperienceSection,
  BriefOfferSection,
  BriefMeasurementSection,
} from '../types/brief';

export interface ParsedBrief {
  sections: BriefSections;
  name: string;
  thinkingSteps: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Returns false if the section is locked or the field was user-edited,
 * meaning AI should NOT overwrite this field.
 */
function shouldFillField(
  existingSection: BriefSectionBase | undefined,
  fieldName: string
): boolean {
  if (!existingSection) return true;
  if (existingSection.locked) return false;
  if (existingSection.userEditedFields?.includes(fieldName)) return false;
  return true;
}

function keepOrFill<T>(
  existingSection: BriefSectionBase | undefined,
  fieldName: string,
  existingValue: T | undefined,
  newValue: T
): T {
  if (!shouldFillField(existingSection, fieldName)) return existingValue as T;
  return newValue;
}

// ── Campaign name extraction ────────────────────────────────────────

const campaignKeywords = [
  'black friday', 'cyber monday', 'summer sale', 'winter sale', 'spring sale',
  'back to school', 'holiday', 'flash sale', 'clearance', 'labor day',
  'memorial day', 'new year', 'valentine', 'easter', 'halloween',
  'prime day', 'boxing day',
];

function extractCampaignTheme(message: string): string {
  const lower = message.toLowerCase();
  for (const kw of campaignKeywords) {
    if (lower.includes(kw)) {
      return kw.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return message
    .replace(/^(build|create|make|set up|launch|design|prepare)\s+(a|an|the|my)?\s*/i, '')
    .split(/\s+/)
    .slice(0, 4)
    .join(' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Audience extraction ─────────────────────────────────────────────

const audiencePatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /new\s*visitor/i, label: 'New Visitors' },
  { pattern: /first[- ]?time/i, label: 'First-Time Visitors' },
  { pattern: /returning\s*(visitor|customer|shopper)?/i, label: 'Returning Customers' },
  { pattern: /loyal\s*(customer|member|shopper)?/i, label: 'Loyal Members' },
  { pattern: /lapsed\s*(customer|buyer|shopper)?/i, label: 'Lapsed Customers' },
  { pattern: /vip/i, label: 'VIP Customers' },
  { pattern: /high[- ]?value/i, label: 'High-Value Customers' },
  { pattern: /cart\s*abandon/i, label: 'Cart Abandoners' },
  { pattern: /bargain|deal[- ]?seek/i, label: 'Bargain Seekers' },
  { pattern: /browse|window\s*shop/i, label: 'Browsers' },
];

function extractAudiences(message: string): string[] {
  const matched: string[] = [];
  for (const { pattern, label } of audiencePatterns) {
    if (pattern.test(message)) matched.push(label);
  }
  return matched.length > 0
    ? matched
    : ['New Visitors', 'Returning Customers', 'Loyal Members'];
}

// ── Duration extraction ─────────────────────────────────────────────

const durationMap: Array<{ pattern: RegExp; start: string; end: string }> = [
  { pattern: /black\s*friday/i, start: '2026-11-25', end: '2026-11-30' },
  { pattern: /cyber\s*monday/i, start: '2026-11-28', end: '2026-12-02' },
  { pattern: /summer/i, start: '2026-06-01', end: '2026-08-31' },
  { pattern: /spring/i, start: '2026-03-10', end: '2026-03-31' },
  { pattern: /winter/i, start: '2026-12-01', end: '2027-02-28' },
  { pattern: /holiday/i, start: '2026-12-01', end: '2026-12-31' },
  { pattern: /back\s*to\s*school/i, start: '2026-08-01', end: '2026-09-15' },
  { pattern: /valentine/i, start: '2026-02-01', end: '2026-02-14' },
  { pattern: /easter/i, start: '2026-03-15', end: '2026-04-05' },
  { pattern: /halloween/i, start: '2026-10-15', end: '2026-10-31' },
  { pattern: /new\s*year/i, start: '2026-12-26', end: '2027-01-05' },
  { pattern: /flash\s*sale/i, start: '2026-03-10', end: '2026-03-12' },
];

function extractTimeline(message: string): { start: string; end: string } {
  for (const { pattern, start, end } of durationMap) {
    if (pattern.test(message)) return { start, end };
  }
  return { start: '2026-03-10', end: '2026-03-31' };
}

// ── Goal / KPI extraction ───────────────────────────────────────────

function extractGoalAndKpi(message: string): { goal: string; kpi: string } {
  const lower = message.toLowerCase();
  if (/engag/i.test(lower)) return { goal: 'Boost Customer Engagement', kpi: 'Pages per Session' };
  if (/retain|retention|loyal/i.test(lower)) return { goal: 'Improve Customer Retention', kpi: 'Customer Lifetime Value (CLV)' };
  if (/revenue|aov|order\s*value/i.test(lower)) return { goal: 'Maximize Revenue', kpi: 'Revenue per Visitor (RPV)' };
  if (/awareness|brand/i.test(lower)) return { goal: 'Increase Brand Awareness', kpi: 'New Visitor Return Rate' };
  return { goal: 'Increase Conversion Rate', kpi: 'Conversion Rate (CR)' };
}

// ── Channel extraction ──────────────────────────────────────────────

function extractChannels(message: string): string[] {
  const channels: string[] = [];
  const lower = message.toLowerCase();
  if (/email/i.test(lower)) channels.push('Email');
  if (/sms|text/i.test(lower)) channels.push('SMS');
  if (/social|facebook|instagram|tiktok/i.test(lower)) channels.push('Social Media');
  if (/push\s*notif/i.test(lower)) channels.push('Push Notifications');
  if (/display|banner/i.test(lower)) channels.push('Display Ads');
  return channels.length > 0 ? channels : ['Web', 'Email'];
}

// ── Section builders ────────────────────────────────────────────────

function buildOverviewSection(
  message: string,
  theme: string,
  existing?: BriefOverviewSection
): BriefOverviewSection {
  const timeline = extractTimeline(message);
  const { goal } = extractGoalAndKpi(message);
  const channels = extractChannels(message);

  return {
    campaignName: keepOrFill(existing, 'campaignName', existing?.campaignName, `${theme} Web Personalization Campaign`),
    objective: keepOrFill(existing, 'objective', existing?.objective, `Drive personalized experiences for the ${theme || 'upcoming'} campaign period.`),
    businessGoal: keepOrFill(existing, 'businessGoal', existing?.businessGoal, goal),
    timelineStart: keepOrFill(existing, 'timelineStart', existing?.timelineStart, timeline.start),
    timelineEnd: keepOrFill(existing, 'timelineEnd', existing?.timelineEnd, timeline.end),
    budget: keepOrFill(existing, 'budget', existing?.budget, ''),
    channels: keepOrFill(existing, 'channels', existing?.channels, channels),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes ?? (!message.match(/budget/i) ? 'Budget not specified' : undefined),
  };
}

function buildAudienceSection(
  message: string,
  existing?: BriefAudienceSection
): BriefAudienceSection {
  const audiences = extractAudiences(message);
  return {
    primaryAudience: keepOrFill(existing, 'primaryAudience', existing?.primaryAudience, audiences[0] || 'New Visitors'),
    audienceSize: keepOrFill(existing, 'audienceSize', existing?.audienceSize, ''),
    inclusionCriteria: keepOrFill(existing, 'inclusionCriteria', existing?.inclusionCriteria, audiences),
    exclusionCriteria: keepOrFill(existing, 'exclusionCriteria', existing?.exclusionCriteria, []),
    segments: keepOrFill(existing, 'segments', existing?.segments, audiences),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes ?? (!message.match(/audience size|reach/i) ? 'Audience size not specified' : undefined),
  };
}

function buildExperienceSection(
  message: string,
  theme: string,
  existing?: BriefExperienceSection
): BriefExperienceSection {
  return {
    headline: keepOrFill(existing, 'headline', existing?.headline, `Discover ${theme || 'Exclusive'} Deals Made for You`),
    bodyMessage: keepOrFill(existing, 'bodyMessage', existing?.bodyMessage, `Personalized offers and recommendations tailored to your shopping preferences.`),
    ctaText: keepOrFill(existing, 'ctaText', existing?.ctaText, 'Shop Now'),
    tone: keepOrFill(existing, 'tone', existing?.tone, 'Friendly and urgent'),
    placements: keepOrFill(existing, 'placements', existing?.placements, ['Hero Banner', 'Product Recommendations', 'Category Carousel']),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes,
  };
}

function buildOfferSection(
  message: string,
  existing?: BriefOfferSection
): BriefOfferSection {
  const lower = message.toLowerCase();
  let offerType = 'Percentage Discount';
  let offerValue = '';

  const percentMatch = message.match(/(\d+)\s*%\s*(off|discount)?/i);
  const dollarMatch = message.match(/\$(\d+)\s*(off|discount)?/i);
  if (percentMatch) {
    offerValue = `${percentMatch[1]}% off`;
  } else if (dollarMatch) {
    offerType = 'Fixed Discount';
    offerValue = `$${dollarMatch[1]} off`;
  } else if (/bogo|buy\s*one\s*get/i.test(lower)) {
    offerType = 'BOGO';
    offerValue = 'Buy One Get One';
  } else if (/free\s*shipping/i.test(lower)) {
    offerType = 'Free Shipping';
    offerValue = 'Free Shipping';
  }

  return {
    offerType: keepOrFill(existing, 'offerType', existing?.offerType, offerType),
    offerValue: keepOrFill(existing, 'offerValue', existing?.offerValue, offerValue),
    offerConditions: keepOrFill(existing, 'offerConditions', existing?.offerConditions, ''),
    promoCode: keepOrFill(existing, 'promoCode', existing?.promoCode, ''),
    expirationDate: keepOrFill(existing, 'expirationDate', existing?.expirationDate, ''),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes ?? (!offerValue ? 'Offer details not specified' : undefined),
  };
}

function buildMeasurementSection(
  message: string,
  existing?: BriefMeasurementSection
): BriefMeasurementSection {
  const { kpi } = extractGoalAndKpi(message);

  return {
    primaryKpi: keepOrFill(existing, 'primaryKpi', existing?.primaryKpi, kpi),
    secondaryKpis: keepOrFill(existing, 'secondaryKpis', existing?.secondaryKpis, ['Average Order Value', 'Revenue per Visitor']),
    secondaryMetrics: keepOrFill(existing, 'secondaryMetrics', existing?.secondaryMetrics, ['Bounce Rate', 'Time on Site', 'Pages per Session']),
    successCriteria: keepOrFill(existing, 'successCriteria', existing?.successCriteria, ['+15% conversion rate vs control', '+10% average order value']),
    risks: keepOrFill(existing, 'risks', existing?.risks, ['Low traffic during campaign period', 'Creative fatigue from repeated exposure']),
    locked: existing?.locked,
    userEditedFields: existing?.userEditedFields,
    notes: existing?.notes,
  };
}

// ── Main parser ─────────────────────────────────────────────────────

export function parseCampaignBrief(
  userMessage: string,
  existingBrief?: { sections: BriefSections }
): ParsedBrief {
  const theme = extractCampaignTheme(userMessage);
  const existing = existingBrief?.sections;

  const sections: BriefSections = {
    overview: buildOverviewSection(userMessage, theme, existing?.overview),
    audience: buildAudienceSection(userMessage, existing?.audience),
    experience: buildExperienceSection(userMessage, theme, existing?.experience),
    offer: buildOfferSection(userMessage, existing?.offer),
    measurement: buildMeasurementSection(userMessage, existing?.measurement),
  };

  const name = sections.overview.campaignName;
  const audiences = sections.audience.segments.join(', ');

  const thinkingSteps = [
    `Analyzing brief... identifying key themes: ${theme || 'general promotion'}`,
    `Identifying target audiences: ${audiences}`,
    `Determining campaign timeline: ${sections.overview.timelineStart} to ${sections.overview.timelineEnd}`,
    `Setting campaign goal and KPI: ${sections.overview.businessGoal} / ${sections.measurement.primaryKpi}`,
    `Building experience and offer sections`,
    `Defining measurement framework`,
    `Brief complete — review and edit as needed`,
  ];

  return { sections, name, thinkingSteps };
}
