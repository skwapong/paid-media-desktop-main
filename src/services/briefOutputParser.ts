/**
 * Brief Output Parser — detects and parses `campaign-brief-json` code fences
 * from Claude's streamed response content.
 */

import type { BriefSections } from '../types/brief';

/**
 * Extract a structured BriefSections object from Claude's response content.
 * Looks for a ```campaign-brief-json code fence containing valid JSON.
 * Returns null if no match or invalid JSON.
 */
export function extractBriefFromContent(content: string): BriefSections | null {
  // Match ```campaign-brief-json ... ``` (with optional trailing whitespace)
  const match = content.match(
    /```campaign-brief-json\s*\n([\s\S]*?)\n\s*```/
  );
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);

    // Validate that all 5 required sections exist
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.overview ||
      !parsed.audience ||
      !parsed.experience ||
      !parsed.offer ||
      !parsed.measurement
    ) {
      return null;
    }

    // Validate overview section has required string fields
    const { overview, audience, experience, offer, measurement } = parsed;
    if (
      typeof overview.campaignName !== 'string' ||
      typeof overview.objective !== 'string' ||
      typeof audience.primaryAudience !== 'string' ||
      typeof experience.headline !== 'string' ||
      typeof offer.offerType !== 'string' ||
      typeof measurement.primaryKpi !== 'string'
    ) {
      return null;
    }

    return parsed as BriefSections;
  } catch {
    return null;
  }
}
