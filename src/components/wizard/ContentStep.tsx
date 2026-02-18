import { useState, useEffect } from 'react';
import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import { usePageStore } from '../../stores/pageStore';
import type { ContentPage, ContentSpot, VariantContent } from '../../types/campaignConfig';
import WizardStepChat from './WizardStepChat';

// ── Placeholder thumbnail component ─────────────────────────────────

function PlaceholderThumb({ label, sublabel, icon }: { label: string; sublabel?: string; icon: 'page' | 'spot' }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-2 text-center">
      {icon === 'page' ? (
        <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )}
      <span className="text-[10px] font-medium text-gray-500 leading-tight line-clamp-1">{label}</span>
      {sublabel && <span className="text-[9px] text-gray-400 leading-tight line-clamp-1">{sublabel}</span>}
    </div>
  );
}

// ── Variant content editor ──────────────────────────────────────────

function VariantEditor({
  content,
  onChange,
  label,
}: {
  content: VariantContent;
  onChange: (updates: Partial<VariantContent>) => void;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Headline</label>
        <input
          type="text"
          value={content.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
          placeholder="Enter headline..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Body</label>
        <textarea
          value={content.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Enter body copy..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-300"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">CTA Text</label>
          <input
            type="text"
            value={content.ctaText}
            onChange={(e) => onChange({ ctaText: e.target.value })}
            placeholder="Shop Now"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Image URL</label>
          <input
            type="text"
            value={content.imageUrl}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Deep Link</label>
          <input
            type="text"
            value={content.deepLinkUrl}
            onChange={(e) => onChange({ deepLinkUrl: e.target.value })}
            placeholder="/landing-page"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
          />
        </div>
      </div>
    </div>
  );
}

// ── Spot card component ─────────────────────────────────────────────

function SpotCard({ page, spot }: { page: ContentPage; spot: ContentSpot }) {
  const config = useCampaignConfigStore((s) => s.config);
  const updateSpotTargetingMode = useCampaignConfigStore((s) => s.updateSpotTargetingMode);
  const updateDefaultVariant = useCampaignConfigStore((s) => s.updateDefaultVariant);
  const addVariant = useCampaignConfigStore((s) => s.addVariant);
  const removeVariant = useCampaignConfigStore((s) => s.removeVariant);
  const updateVariantContent = useCampaignConfigStore((s) => s.updateVariantContent);
  const updateVariantPriority = useCampaignConfigStore((s) => s.updateVariantPriority);

  const [showAddSegment, setShowAddSegment] = useState(false);

  const selectedSegments = config?.audiences.segments.filter((s) => s.isSelected) || [];
  const usedSegmentIds = new Set(spot.variants.map((v) => v.audienceRefId));
  const availableSegments = selectedSegments.filter((s) => !usedSegmentIds.has(s.id));

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden min-w-0">
      {/* Spot header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 min-w-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
          {spot.thumbnail.type === 'screenshot' && spot.thumbnail.url ? (
            <img src={spot.thumbnail.url} alt={spot.thumbnail.alt} className="w-full h-full object-cover" />
          ) : (
            <PlaceholderThumb label={spot.spotName} icon="spot" />
          )}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{spot.spotName}</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded font-mono flex-shrink-0">
              {spot.spotType}
            </span>
          </div>
        </div>

        {/* Delete spot */}
        <button
          onClick={() => {
            const store = useCampaignConfigStore.getState();
            store.removeContentSpot(page.pageId, spot.spotId);
          }}
          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
          title="Remove spot"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* Targeting mode toggle */}
        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => updateSpotTargetingMode(page.pageId, spot.spotId, 'default_only')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              spot.targetingMode === 'default_only'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Default only
          </button>
          <button
            onClick={() => updateSpotTargetingMode(page.pageId, spot.spotId, 'segment_variants')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              spot.targetingMode === 'segment_variants'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By segment
          </button>
        </div>
      </div>

      {/* Default variant */}
      <div className="p-4">
        <VariantEditor
          content={spot.defaultVariant}
          onChange={(updates) => updateDefaultVariant(page.pageId, spot.spotId, updates)}
          label="Default Content (all visitors)"
        />
      </div>

      {/* Segment variants */}
      {spot.targetingMode === 'segment_variants' && (
        <div className="border-t border-gray-100">
          {spot.variants.map((variant) => (
            <div key={variant.variantId} className="p-4 border-b border-gray-50 last:border-b-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-md">
                    {variant.audienceName}
                  </span>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-gray-400">Priority:</label>
                    <input
                      type="number"
                      value={variant.priority}
                      onChange={(e) => updateVariantPriority(page.pageId, spot.spotId, variant.variantId, parseInt(e.target.value) || 1)}
                      min={1}
                      max={100}
                      className="w-12 px-1.5 py-0.5 border border-gray-200 rounded text-xs text-gray-700 focus:outline-none focus:border-gray-300"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeVariant(page.pageId, spot.spotId, variant.variantId)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                  title="Remove variant"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <VariantEditor
                content={variant.content}
                onChange={(updates) => updateVariantContent(page.pageId, spot.spotId, variant.variantId, updates)}
                label=""
              />
            </div>
          ))}

          {/* Add variant */}
          <div className="p-3 bg-gray-50/50">
            {showAddSegment ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Select a segment:</p>
                {availableSegments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {availableSegments.map((seg) => (
                      <button
                        key={seg.id}
                        onClick={() => {
                          addVariant(page.pageId, spot.spotId, seg.name, seg.id);
                          setShowAddSegment(false);
                        }}
                        className="px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        {seg.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">All segments are already assigned to this spot.</p>
                )}
                <button
                  onClick={() => setShowAddSegment(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSegment(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add segment variant
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ContentStep component ──────────────────────────────────────

export default function ContentStep() {
  const config = useCampaignConfigStore((s) => s.config);
  const setContentPages = useCampaignConfigStore((s) => s.setContentPages);
  const removeContentPage = useCampaignConfigStore((s) => s.removeContentPage);
  const removeContentSpot = useCampaignConfigStore((s) => s.removeContentSpot);
  const { pages: savedPages, loadPages } = usePageStore();
  const [activePageId, setActivePageId] = useState<string | null>(null);

  // Load pages from storage on mount and sync with content
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Sync pages from Pages step into content config when entering Step 3.
  // Only ADDS new pages/spots — never overwrites or removes existing content edits.
  useEffect(() => {
    if (!config) return;

    const existingPages = config.content.pages;
    const existingPageIds = new Set(existingPages.map((p) => p.pageId));

    let hasChanges = false;
    // Deep copy existing pages to avoid mutating the store
    let mergedPages = existingPages.map((p) => ({
      ...p,
      spots: [...p.spots],
    }));

    for (const savedPage of savedPages) {
      if (!existingPageIds.has(savedPage.id)) {
        hasChanges = true;
        mergedPages.push({
          pageId: savedPage.id,
          pageName: savedPage.pageName,
          pageUrlPattern: savedPage.websiteUrl,
          thumbnail: {
            type: savedPage.thumbnailDataUrl ? 'screenshot' as const : 'placeholder' as const,
            url: savedPage.thumbnailDataUrl || '',
            alt: savedPage.pageName,
          },
          spots: savedPage.spots.map((spot) => ({
            spotId: spot.id,
            spotName: spot.name,
            spotType: spot.type,
            selector: spot.selector,
            thumbnail: { type: 'placeholder' as const, url: '', alt: `${spot.name} on ${savedPage.pageName}` },
            targetingMode: 'default_only' as const,
            defaultVariant: { headline: '', body: '', ctaText: '', imageUrl: '', deepLinkUrl: '' },
            variants: [],
          })),
        });
      } else {
        // Add new spots from the saved page that aren't in content yet
        const existingPage = mergedPages.find((p) => p.pageId === savedPage.id);
        if (existingPage) {
          const existingSpotIds = new Set(existingPage.spots.map((s) => s.spotId));
          for (const spot of savedPage.spots) {
            if (!existingSpotIds.has(spot.id)) {
              hasChanges = true;
              existingPage.spots = [...existingPage.spots, {
                spotId: spot.id,
                spotName: spot.name,
                spotType: spot.type,
                selector: spot.selector,
                thumbnail: { type: 'placeholder' as const, url: '', alt: `${spot.name} on ${savedPage.pageName}` },
                targetingMode: 'default_only' as const,
                defaultVariant: { headline: '', body: '', ctaText: '', imageUrl: '', deepLinkUrl: '' },
                variants: [],
              }];
            }
          }
        }
      }
    }

    if (hasChanges) {
      setContentPages(mergedPages);
    }
  }, [savedPages]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!config) return null;

  const { content } = config;
  const pages = content.pages;

  // Default to first page
  const currentPageId = activePageId || pages[0]?.pageId || '';
  const currentPage = pages.find((p) => p.pageId === currentPageId);

  // Count stats
  const totalSpots = pages.reduce((sum, p) => sum + p.spots.length, 0);
  const totalVariants = pages.reduce(
    (sum, p) => sum + p.spots.reduce((s2, spot) => s2 + spot.variants.length, 0),
    0
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        {pages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-700 mb-1">No pages configured</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Go to the Pages section to add webpages and configure content spots first.
              Content configuration is driven by the pages and spots you define there.
            </p>
          </div>
        ) : (
          <div className="flex h-full min-w-0">
            {/* Left sidebar — page list */}
            <div className="w-52 flex-shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50/50">
              <div className="p-3">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">
                  Pages ({pages.length})
                </div>
                <div className="space-y-1">
                  {pages.map((page) => (
                    <div
                      key={page.pageId}
                      className={`group/page relative flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        currentPageId === page.pageId
                          ? 'bg-white shadow-sm border border-gray-200'
                          : 'hover:bg-white/60'
                      }`}
                      onClick={() => setActivePageId(page.pageId)}
                    >
                      <div className="w-10 h-8 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                        {page.thumbnail.type === 'screenshot' && page.thumbnail.url ? (
                          <img src={page.thumbnail.url} alt={page.thumbnail.alt} className="w-full h-full object-cover" />
                        ) : (
                          <PlaceholderThumb label={page.pageName} icon="page" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">{page.pageName}</div>
                        <div className="text-[10px] text-gray-400">
                          {page.spots.length} spot{page.spots.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeContentPage(page.pageId);
                          if (activePageId === page.pageId) setActivePageId(null);
                        }}
                        className="p-1 text-gray-300 hover:text-red-500 rounded opacity-0 group-hover/page:opacity-100 transition-opacity flex-shrink-0"
                        title="Remove page"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right content — spots for selected page */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {currentPage ? (
                <div className="p-4">
                  {/* Page header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      {currentPage.thumbnail.type === 'screenshot' && currentPage.thumbnail.url ? (
                        <img src={currentPage.thumbnail.url} alt={currentPage.thumbnail.alt} className="w-full h-full object-cover" />
                      ) : (
                        <PlaceholderThumb label={currentPage.pageName} icon="page" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{currentPage.pageName}</h3>
                      <p className="text-[11px] text-gray-400 font-mono">{currentPage.pageUrlPattern}</p>
                    </div>
                  </div>

                  {/* Spots */}
                  {currentPage.spots.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                      <p className="text-xs text-gray-400">
                        No spots configured for this page. Go to Pages to add content spots.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentPage.spots.map((spot) => (
                        <SpotCard key={spot.spotId} page={currentPage} spot={spot} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  Select a page to configure content
                </div>
              )}

              {/* Stats footer */}
              {totalSpots > 0 && (
                <div className="px-4 pb-3 text-[10px] text-gray-400 text-center">
                  {totalSpots} spot{totalSpots !== 1 ? 's' : ''} across {pages.length} page{pages.length !== 1 ? 's' : ''}
                  {' / '}
                  {totalVariants} segment variant{totalVariants !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Chat */}
      <WizardStepChat step={3} />
    </div>
  );
}
