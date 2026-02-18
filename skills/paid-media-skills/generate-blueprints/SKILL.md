---
name: generate-blueprints
description: >
  Creates three campaign blueprint variants (conservative, balanced, aggressive) from
  a completed campaign brief. Each blueprint includes channel mix, audience strategy,
  budget allocation, messaging, and predicted metrics.
---

# Generate Blueprints Skill

## When to Use

Activate this skill when the user has a completed campaign brief and wants to
generate executable blueprint options. Trigger phrases include but are not limited to:

- "Generate blueprints"
- "Create campaign plans from this brief"
- "Show me blueprint options"
- "Build media plans"
- "What are my campaign options?"
- "Generate three variants"
- Any request to move from brief to actionable campaign plans.

## Input Context

You will receive:
- The complete CampaignBriefData object
- Optional: user preferences for emphasis (e.g. "focus on video", "prioritize ROAS")
- Optional: historical campaign performance data

## Output Schema

Return an array of exactly 3 blueprint objects:

```jsonc
[
  {
    "id": "string — unique ID (e.g. bp-conservative-001)",
    "name": "string — descriptive blueprint name",
    "variant": "string — conservative | balanced | aggressive",
    "confidence": "number — 0-100 confidence score based on data availability",
    "summary": "string — 2-3 sentence strategy summary",
    "channels": [
      {
        "name": "string — channel name (e.g. Google Search, Meta Ads)",
        "budgetPercent": "number — percentage of total budget",
        "budgetAmount": "string — calculated dollar amount",
        "role": "string — Awareness | Consideration | Conversion | Retargeting",
        "formats": ["string — ad formats (e.g. Responsive Search, Video, Carousel)"],
        "expectedMetrics": {
          "impressions": "string — estimated impressions",
          "clicks": "string — estimated clicks",
          "ctr": "string — estimated CTR",
          "cpc": "string — estimated CPC",
          "conversions": "string — estimated conversions",
          "cpa": "string — estimated CPA",
          "roas": "string — estimated ROAS"
        }
      }
    ],
    "audiences": [
      {
        "name": "string — audience segment name",
        "type": "string — Prospecting | Retargeting | Lookalike | Custom",
        "priority": "string — Primary | Secondary",
        "channels": ["string — which channels target this audience"]
      }
    ],
    "budget": {
      "total": "string — total budget amount",
      "pacing": "string — Even | Front-loaded | Back-loaded",
      "phases": [
        {
          "name": "string — phase name",
          "percent": "number — budget percentage",
          "amount": "string — dollar amount",
          "duration": "string — e.g. Weeks 1-2"
        }
      ]
    },
    "metrics": {
      "estimatedReach": "string — total estimated reach",
      "estimatedImpressions": "string — total estimated impressions",
      "estimatedClicks": "string — total estimated clicks",
      "estimatedConversions": "string — total estimated conversions",
      "estimatedRoas": "string — overall estimated ROAS",
      "estimatedCpa": "string — overall estimated CPA"
    },
    "messaging": {
      "primaryMessage": "string — main campaign message",
      "supportingMessages": ["string — secondary messages by channel or phase"],
      "toneAndVoice": "string — creative direction"
    },
    "cta": "string — primary call-to-action"
  }
]
```

## Output Format

Wrap the JSON array in a `blueprints-json` code fence:

````
```blueprints-json
[
  { "id": "bp-conservative-001", "variant": "conservative", ... },
  { "id": "bp-balanced-001", "variant": "balanced", ... },
  { "id": "bp-aggressive-001", "variant": "aggressive", ... }
]
```
````

Before the code fence, provide a brief comparison of the three variants highlighting
key trade-offs (e.g. cost vs. reach, risk vs. reward).

## Quality Rules

1. **Always produce exactly 3 variants**: conservative, balanced, and aggressive.
   They must meaningfully differ in budget allocation, channel mix, and risk profile.
2. **Conservative** should prioritize proven channels, lower-risk formats, and
   predictable ROI. **Balanced** should be the recommended default. **Aggressive**
   should push into new channels, higher spend, and bolder creative.
3. **Budget allocations must sum to 100%** across channels within each blueprint.
4. **Metrics should be realistic.** Base estimates on industry benchmarks for the
   given channels and campaign type. Do not inflate projections.
5. **Channel recommendations must align with the brief.** Mandatory channels from
   the brief must appear in all three blueprints. Optional channels may vary.
6. **Each blueprint needs a distinct strategic narrative.** The summary should
   explain the "why" behind the approach, not just restate the numbers.
