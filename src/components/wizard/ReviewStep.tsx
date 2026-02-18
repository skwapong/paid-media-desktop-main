import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import WizardStepChat from './WizardStepChat';

export default function ReviewStep() {
  const config = useCampaignConfigStore((s) => s.config);
  const updateReview = useCampaignConfigStore((s) => s.updateReview);

  if (!config) return null;

  const { setup, audiences, content, review } = config;
  const selectedSegments = audiences.segments.filter((s) => s.isSelected);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Campaign Setup Summary */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Campaign Setup</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900 font-medium text-right max-w-[60%]">{setup.name || 'Untitled'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Objective</dt>
              <dd className="text-gray-900 text-right max-w-[60%] text-xs leading-relaxed">{setup.objective || 'Not set'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Business Goal</dt>
              <dd className="text-gray-900 font-medium">{setup.businessGoal || 'Not set'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Primary KPI</dt>
              <dd className="text-gray-900 font-medium">{setup.primaryKpi || 'Not set'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Duration</dt>
              <dd className="text-gray-900 font-medium">
                {setup.startDate && setup.endDate
                  ? `${setup.startDate} - ${setup.endDate}`
                  : 'Not set'}
              </dd>
            </div>
            {setup.budget && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Budget</dt>
                <dd className="text-gray-900 font-medium">{setup.budget}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Channels</dt>
              <dd className="flex flex-wrap gap-1 justify-end">
                {setup.channels.map((ch, i) => (
                  <span key={i} className="inline-flex px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded-full">
                    {ch}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </section>

        {/* Audiences Summary */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Audiences
            <span className="ml-2 text-sm font-normal text-gray-400">
              {selectedSegments.length} segment{selectedSegments.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <div className="space-y-2">
            {selectedSegments.map((seg) => (
              <div key={seg.id} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-gray-900">{seg.name}</span>
                {seg.count && <span className="text-xs text-gray-400">({seg.count})</span>}
                <span className={`inline-flex px-1.5 py-0.5 text-[10px] rounded ${
                  seg.source === 'tdx'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {seg.source === 'tdx' ? 'TDX' : 'New'}
                </span>
              </div>
            ))}
            {selectedSegments.length === 0 && (
              <p className="text-sm text-gray-400">No segments selected</p>
            )}
          </div>
        </section>

        {/* Content Summary */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Content</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Pages</dt>
              <dd className="text-gray-900 font-medium">{content.pages.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Spots</dt>
              <dd className="text-gray-900 font-medium">
                {content.pages.reduce((sum, p) => sum + p.spots.length, 0)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Segment Variants</dt>
              <dd className="text-gray-900 font-medium">
                {content.pages.reduce((sum, p) => sum + p.spots.reduce((s2, spot) => s2 + spot.variants.length, 0), 0)}
              </dd>
            </div>
          </dl>
          {content.pages.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {content.pages.map((page) => (
                <div key={page.pageId} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600 font-medium">{page.pageName}</span>
                  <span className="text-gray-400">
                    {page.spots.length} spot{page.spots.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {page.spots.map((spot) => (
                      <span key={spot.spotId} className="inline-flex px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                        {spot.spotName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Traffic Allocation */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Launch Settings</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Traffic Allocation: {review.trafficAllocation}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={review.trafficAllocation}
              onChange={(e) => updateReview({ trafficAllocation: parseInt(e.target.value) })}
              className="w-full accent-black"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={review.notes}
              onChange={(e) => updateReview({ notes: e.target.value })}
              rows={2}
              placeholder="Any launch notes or comments..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-300"
            />
          </div>
        </section>
      </div>

      {/* AI Chat */}
      <WizardStepChat step={4} />
    </div>
  );
}
