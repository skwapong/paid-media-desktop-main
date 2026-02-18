import { useState, useEffect, useMemo } from 'react';
import { campaignConfigStorage } from '../services/campaignConfigStorage';
import type { WizardSegment } from '../types/campaignConfig';

interface SegmentWithCampaigns extends WizardSegment {
  campaignNames: string[];
}

export default function AudiencesPage() {
  const [allSegments, setAllSegments] = useState<SegmentWithCampaigns[]>([]);

  useEffect(() => {
    const configs = campaignConfigStorage.listConfigs();

    // Collect unique segments across all campaigns, tracking which campaigns use them
    const segmentMap = new Map<string, SegmentWithCampaigns>();

    for (const config of configs) {
      const campaignName = config.setup.name || 'Untitled Campaign';
      for (const seg of config.audiences.segments) {
        if (!seg.isSelected) continue;
        const existing = segmentMap.get(seg.id);
        if (existing) {
          if (!existing.campaignNames.includes(campaignName)) {
            existing.campaignNames.push(campaignName);
          }
        } else {
          segmentMap.set(seg.id, { ...seg, campaignNames: [campaignName] });
        }
      }
    }

    setAllSegments(Array.from(segmentMap.values()));
  }, []);

  // Group by source
  const tdxSegments = useMemo(() => allSegments.filter((s) => s.source === 'tdx'), [allSegments]);
  const briefSegments = useMemo(() => allSegments.filter((s) => s.source === 'brief'), [allSegments]);

  const formatCount = (count?: string) => {
    if (!count) return null;
    return count;
  };

  return (
    <div className="h-full p-4">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-full overflow-auto">
          {/* Header */}
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Audiences</h1>
              <p className="text-sm text-gray-500 mt-1">
                Segments used across your campaign configurations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {allSegments.length} segment{allSegments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {allSegments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No segments yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Segments will appear here once you configure audiences in your campaign drafts.
                  Start a campaign in Chat to define your target segments.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* TDX Segments */}
                {tdxSegments.length > 0 && (
                  <div>
                    <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-1">
                      TDX Segments ({tdxSegments.length})
                    </h2>
                    <div className="space-y-3">
                      {tdxSegments.map((segment) => (
                        <SegmentCard key={segment.id} segment={segment} formatCount={formatCount} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Brief-suggested Segments */}
                {briefSegments.length > 0 && (
                  <div>
                    <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-1">
                      Campaign-defined Segments ({briefSegments.length})
                    </h2>
                    <div className="space-y-3">
                      {briefSegments.map((segment) => (
                        <SegmentCard key={segment.id} segment={segment} formatCount={formatCount} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentCard({
  segment,
  formatCount,
}: {
  segment: SegmentWithCampaigns;
  formatCount: (count?: string) => string | null;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left side */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-medium text-gray-900">{segment.name}</h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                segment.source === 'tdx'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {segment.source === 'tdx' ? 'TDX' : 'New'}
            </span>
            {segment.isNew && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                Suggested
              </span>
            )}
          </div>

          {segment.description && (
            <p className="text-sm text-gray-500 mb-3">{segment.description}</p>
          )}

          {/* Rules */}
          {segment.rules && segment.rules.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {segment.rules.map((rule, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md"
                >
                  {rule.rule}: {rule.value}
                </span>
              ))}
            </div>
          )}

          {/* Used in campaigns */}
          <div className="flex flex-wrap gap-1.5">
            {segment.campaignNames.map((name) => (
              <span
                key={name}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Right side - count */}
        <div className="flex items-center gap-6 ml-6">
          {formatCount(segment.count) && (
            <div className="text-right">
              <p className="text-lg font-medium text-gray-900">{formatCount(segment.count)}</p>
              <p className="text-xs text-gray-500">users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
