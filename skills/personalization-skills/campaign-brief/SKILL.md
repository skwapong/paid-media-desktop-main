---
name: campaign-brief
description: >
  Analyzes a user's campaign or personalization request and generates a structured
  campaign brief as JSON. The brief covers overview, audience, experience, offer,
  and measurement sections — ready for rendering in the CampaignBriefEditor.
---

# Campaign Brief Skill

## When to Use

Activate this skill whenever the user describes a campaign, promotion, sale,
personalization request, or marketing initiative. Trigger phrases include but
are not limited to:

- "Create a ... campaign"
- "Build a personalization for ..."
- "Launch a ... sale / promotion"
- "Set up a ... experience for ..."
- "I want to target ... with ..."
- Any message mentioning audiences, offers, discounts, A/B tests, or KPIs in a
  campaign context.

## Brief Schema

Generate a JSON object matching this schema exactly. Every field is required;
use an empty string `""` or empty array `[]` when no value can be inferred.

```jsonc
{
  "overview": {
    "campaignName": "string — descriptive campaign name",
    "objective": "string — 1-2 sentence campaign objective",
    "businessGoal": "string — primary business goal (e.g. Increase Conversion Rate)",
    "timelineStart": "string — ISO date YYYY-MM-DD",
    "timelineEnd": "string — ISO date YYYY-MM-DD",
    "budget": "string — budget amount or empty if unknown",
    "channels": ["string — e.g. Web, Email, SMS, Social Media, Push Notifications"]
  },
  "audience": {
    "primaryAudience": "string — main audience segment name",
    "audienceSize": "string — estimated reach or empty",
    "inclusionCriteria": ["string — who to include"],
    "exclusionCriteria": ["string — who to exclude"],
    "segments": ["string — segment names"]
  },
  "experience": {
    "headline": "string — primary headline for the campaign creative",
    "bodyMessage": "string — supporting body copy",
    "ctaText": "string — call-to-action button text",
    "tone": "string — voice/tone descriptor (e.g. Friendly and urgent)",
    "placements": ["string — where the content appears (e.g. Hero Banner, Product Recs)"]
  },
  "offer": {
    "offerType": "string — Percentage Discount | Fixed Discount | BOGO | Free Shipping | Gift with Purchase | Loyalty Points | None",
    "offerValue": "string — e.g. 20% off, $15 off, Buy One Get One",
    "offerConditions": "string — minimum spend, eligible categories, etc.",
    "promoCode": "string — promo/coupon code or empty",
    "expirationDate": "string — ISO date or empty"
  },
  "measurement": {
    "primaryKpi": "string — single most important KPI",
    "secondaryKpis": ["string — additional KPIs"],
    "secondaryMetrics": ["string — supporting metrics"],
    "successCriteria": ["string — measurable success thresholds"],
    "risks": ["string — potential risks or challenges"]
  }
}
```

## Extraction Guidelines

Follow these rules when populating the brief from the user's message:

### Overview
- **campaignName**: Derive from the campaign theme or seasonal event. Append
  "Web Personalization Campaign" (e.g. "Black Friday Web Personalization Campaign").
- **objective**: Write a concise 1-2 sentence objective that captures the campaign intent.
- **businessGoal**: Infer from context — engagement keywords map to
  "Boost Customer Engagement", retention/loyalty to "Improve Customer Retention",
  revenue/AOV to "Maximize Revenue", brand/awareness to "Increase Brand Awareness".
  Default: "Increase Conversion Rate".
- **timelineStart / timelineEnd**: Infer from seasonal keywords (Black Friday:
  Nov 25-30, Summer: Jun 1 - Aug 31, Holiday: Dec 1-31, etc.). If unspecified,
  use a reasonable 3-week window starting from the current date.
- **budget**: Extract if mentioned; otherwise leave empty.
- **channels**: Extract from mentions of email, SMS, social, push, display, web.
  Default: ["Web", "Email"].

### Audience
- **primaryAudience**: The first or most prominent audience mentioned.
- **segments**: Extract all audience segments mentioned (New Visitors, Returning
  Customers, VIP, Cart Abandoners, Loyal Members, etc.). If none mentioned,
  default to ["New Visitors", "Returning Customers", "Loyal Members"].
- **inclusionCriteria**: Same as segments unless more specific criteria given.
- **exclusionCriteria**: Extract if mentioned, otherwise empty array.
- **audienceSize**: Extract if mentioned, otherwise empty string.

### Experience
- **headline**: Generate a compelling, on-brand headline incorporating the campaign theme.
- **bodyMessage**: Write 1-2 sentences of supporting copy.
- **ctaText**: Choose an action-oriented CTA (Shop Now, Explore Deals, Get Started, etc.).
- **tone**: Infer from context or default to "Friendly and urgent".
- **placements**: Default to ["Hero Banner", "Product Recommendations", "Category Carousel"]
  unless the user specifies placements.

### Offer
- **offerType**: Detect from the message — percentages → "Percentage Discount",
  dollar amounts → "Fixed Discount", BOGO → "BOGO", free shipping → "Free Shipping".
  If no offer mentioned, use "None".
- **offerValue**: Extract the numeric value (e.g. "20% off", "$15 off").
- **offerConditions**: Extract minimum spend, category restrictions, etc.
- **promoCode**: Extract if mentioned, otherwise empty.
- **expirationDate**: Use campaign end date or extract if specified.

### Measurement
- **primaryKpi**: Align with businessGoal — conversion → "Conversion Rate (CR)",
  engagement → "Pages per Session", retention → "Customer Lifetime Value (CLV)",
  revenue → "Revenue per Visitor (RPV)", awareness → "New Visitor Return Rate".
- **secondaryKpis**: Include 2-3 relevant secondary KPIs (e.g. Average Order Value,
  Revenue per Visitor, Click-Through Rate).
- **secondaryMetrics**: Include supporting metrics (Bounce Rate, Time on Site,
  Pages per Session, Add-to-Cart Rate).
- **successCriteria**: Generate 2-3 measurable targets
  (e.g. "+15% conversion rate vs control", "+10% average order value").
- **risks**: Include 2-3 relevant risks (e.g. "Low traffic during campaign period",
  "Creative fatigue from repeated exposure", "Audience overlap between segments").

## Output Format

Wrap the JSON brief in a `campaign-brief-json` code fence. This MUST appear in
your response so the application can detect and parse it:

````
```campaign-brief-json
{
  "overview": { ... },
  "audience": { ... },
  "experience": { ... },
  "offer": { ... },
  "measurement": { ... }
}
```
````

You may include conversational text before or after the code fence — the
application will extract only the JSON block.

## Quality Rules

1. **Fill intelligent defaults** for every field. Never leave a field as `null`
   or `undefined`. Use empty string `""` or empty array `[]` only when truly
   no value applies.
2. **Add `notes`** to any section where you had to make significant assumptions.
   Do NOT include notes in the JSON — they are only for your conversational
   response text.
3. **Use industry best practices** for KPIs and success criteria. Tie them to
   the stated business goal.
4. **Be specific and actionable.** Avoid vague objectives like "improve things".
   Instead write "Increase homepage-to-PDP conversion rate by 15% for new visitors".
5. **Keep copy concise.** Headlines under 10 words, body messages under 30 words,
   CTAs under 4 words.

## Examples

### Example 1: Seasonal Sale

**User message:**
> Create a Black Friday campaign targeting new visitors and loyal members with 30% off sitewide

**Expected output:**

```campaign-brief-json
{
  "overview": {
    "campaignName": "Black Friday Web Personalization Campaign",
    "objective": "Deliver personalized Black Friday shopping experiences to maximize sitewide sales with a 30% discount offer.",
    "businessGoal": "Increase Conversion Rate",
    "timelineStart": "2026-11-25",
    "timelineEnd": "2026-11-30",
    "budget": "",
    "channels": ["Web", "Email"]
  },
  "audience": {
    "primaryAudience": "New Visitors",
    "audienceSize": "",
    "inclusionCriteria": ["New Visitors", "Loyal Members"],
    "exclusionCriteria": [],
    "segments": ["New Visitors", "Loyal Members"]
  },
  "experience": {
    "headline": "Black Friday: 30% Off Everything",
    "bodyMessage": "Unlock exclusive Black Friday savings across all categories, curated just for you.",
    "ctaText": "Shop Now",
    "tone": "Friendly and urgent",
    "placements": ["Hero Banner", "Product Recommendations", "Category Carousel"]
  },
  "offer": {
    "offerType": "Percentage Discount",
    "offerValue": "30% off",
    "offerConditions": "Sitewide, no minimum spend",
    "promoCode": "",
    "expirationDate": "2026-11-30"
  },
  "measurement": {
    "primaryKpi": "Conversion Rate (CR)",
    "secondaryKpis": ["Average Order Value", "Revenue per Visitor"],
    "secondaryMetrics": ["Bounce Rate", "Time on Site", "Add-to-Cart Rate"],
    "successCriteria": ["+15% conversion rate vs control", "+10% average order value", "+20% revenue per visitor"],
    "risks": ["High competition during Black Friday weekend", "Creative fatigue from repeated exposure", "Potential margin impact from deep discounting"]
  }
}
```

### Example 2: Retention Campaign

**User message:**
> I want to improve retention for lapsed customers with a free shipping offer via email and web

**Expected output:**

```campaign-brief-json
{
  "overview": {
    "campaignName": "Customer Winback Web Personalization Campaign",
    "objective": "Re-engage lapsed customers through personalized free shipping offers across email and web channels.",
    "businessGoal": "Improve Customer Retention",
    "timelineStart": "2026-03-01",
    "timelineEnd": "2026-03-21",
    "budget": "",
    "channels": ["Web", "Email"]
  },
  "audience": {
    "primaryAudience": "Lapsed Customers",
    "audienceSize": "",
    "inclusionCriteria": ["Lapsed Customers"],
    "exclusionCriteria": [],
    "segments": ["Lapsed Customers"]
  },
  "experience": {
    "headline": "We Miss You — Free Shipping Inside",
    "bodyMessage": "Come back and enjoy free shipping on your next order. Your favorites are waiting.",
    "ctaText": "Shop Now",
    "tone": "Warm and inviting",
    "placements": ["Hero Banner", "Product Recommendations", "Category Carousel"]
  },
  "offer": {
    "offerType": "Free Shipping",
    "offerValue": "Free Shipping",
    "offerConditions": "",
    "promoCode": "",
    "expirationDate": "2026-03-21"
  },
  "measurement": {
    "primaryKpi": "Customer Lifetime Value (CLV)",
    "secondaryKpis": ["Reactivation Rate", "Repeat Purchase Rate"],
    "secondaryMetrics": ["Email Open Rate", "Click-Through Rate", "Time on Site"],
    "successCriteria": ["+10% reactivation rate for lapsed segment", "+5% repeat purchase rate within 30 days"],
    "risks": ["Low email deliverability for dormant accounts", "Free shipping margin impact", "Audience too small for statistical significance"]
  }
}
```

### Example 3: Minimal Input

**User message:**
> Build a summer sale campaign

**Expected output:**

```campaign-brief-json
{
  "overview": {
    "campaignName": "Summer Sale Web Personalization Campaign",
    "objective": "Drive personalized summer shopping experiences to boost seasonal sales and engagement.",
    "businessGoal": "Increase Conversion Rate",
    "timelineStart": "2026-06-01",
    "timelineEnd": "2026-08-31",
    "budget": "",
    "channels": ["Web", "Email"]
  },
  "audience": {
    "primaryAudience": "New Visitors",
    "audienceSize": "",
    "inclusionCriteria": ["New Visitors", "Returning Customers", "Loyal Members"],
    "exclusionCriteria": [],
    "segments": ["New Visitors", "Returning Customers", "Loyal Members"]
  },
  "experience": {
    "headline": "Summer Deals Made for You",
    "bodyMessage": "Discover personalized offers and hand-picked recommendations for the season.",
    "ctaText": "Shop Now",
    "tone": "Friendly and urgent",
    "placements": ["Hero Banner", "Product Recommendations", "Category Carousel"]
  },
  "offer": {
    "offerType": "None",
    "offerValue": "",
    "offerConditions": "",
    "promoCode": "",
    "expirationDate": "",
    "notes": "No specific offer mentioned — consider adding a discount or free shipping incentive."
  },
  "measurement": {
    "primaryKpi": "Conversion Rate (CR)",
    "secondaryKpis": ["Average Order Value", "Revenue per Visitor"],
    "secondaryMetrics": ["Bounce Rate", "Time on Site", "Pages per Session"],
    "successCriteria": ["+15% conversion rate vs control", "+10% average order value"],
    "risks": ["Low traffic during early summer", "Creative fatigue from extended campaign duration", "Audience overlap between segments"]
  }
}
```
