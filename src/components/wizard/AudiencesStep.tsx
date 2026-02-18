import { useState } from 'react';
import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import { useSettingsStore } from '../../stores/settingsStore';
import WizardStepChat from './WizardStepChat';

export default function AudiencesStep() {
  const config = useCampaignConfigStore((s) => s.config);
  const childSegments = useCampaignConfigStore((s) => s.childSegments);
  const isLoadingSegments = useCampaignConfigStore((s) => s.isLoadingSegments);
  const segmentError = useCampaignConfigStore((s) => s.segmentError);
  const toggleSegmentSelection = useCampaignConfigStore((s) => s.toggleSegmentSelection);
  const confirmNewSegment = useCampaignConfigStore((s) => s.confirmNewSegment);

  const parentSegments = useSettingsStore((s) => s.parentSegments);
  const selectedParentSegmentId = useSettingsStore((s) => s.selectedParentSegmentId);

  const [showAddPicker, setShowAddPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  if (!config) return null;

  const { audiences } = config;
  const selectedParent = parentSegments.find((ps) => ps.id === selectedParentSegmentId);

  // Selected existing segments (TDX segments that are selected/matched from brief)
  const selectedTdxSegments = audiences.segments.filter((s) => s.source === 'tdx' && s.isSelected);
  // Brief-suggested new segments (unmatched)
  const briefSegments = audiences.segments.filter((s) => s.source === 'brief' && s.isNew);
  const selectedCount = audiences.segments.filter((s) => s.isSelected).length;

  // Available segments to add (from childSegments, not yet selected)
  const selectedIds = new Set(selectedTdxSegments.map((s) => s.id));
  const availableToAdd = childSegments.filter((cs) => !selectedIds.has(cs.id));
  const filteredAvailable = pickerSearch.trim()
    ? availableToAdd.filter((s) => s.name.toLowerCase().includes(pickerSearch.toLowerCase()))
    : availableToAdd;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Parent Segment (read-only from global nav) */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Parent Segment</h2>
          {selectedParent ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{selectedParent.name}</span>
                {selectedParent.count && (
                  <span className="ml-2 text-xs text-gray-400">({selectedParent.count})</span>
                )}
              </div>
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">
                Selected
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
              No parent segment selected.
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Change the parent segment using the dropdown in the top-left navigation.
          </p>

          {isLoadingSegments && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading segments...
            </div>
          )}

          {segmentError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {segmentError}
            </div>
          )}
        </section>

        {/* Selected Existing Segments */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Selected Existing Segments
              <span className="ml-2 text-sm font-normal text-gray-400">
                {selectedCount} selected
              </span>
            </h2>
            {availableToAdd.length > 0 && (
              <button
                onClick={() => { setShowAddPicker(!showAddPicker); setPickerSearch(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add More
              </button>
            )}
          </div>

          {selectedTdxSegments.length > 0 ? (
            <div className="space-y-2">
              {selectedTdxSegments.map((seg) => (
                <label
                  key={seg.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-blue-300 bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={seg.isSelected}
                    onChange={() => toggleSegmentSelection(seg.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{seg.name}</span>
                      {seg.count && (
                        <span className="text-xs text-gray-400">({seg.count})</span>
                      )}
                      <span className="inline-flex px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 rounded">
                        TDX
                      </span>
                    </div>
                    {seg.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{seg.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No existing segments selected yet. Click "Add More" to browse available segments.
            </p>
          )}

          {/* Add More Picker */}
          {showAddPicker && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-2 border-b border-gray-100 bg-gray-50">
                <input
                  type="text"
                  placeholder="Search available segments..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredAvailable.length > 0 ? (
                  filteredAvailable.map((cs) => (
                    <button
                      key={cs.id}
                      onClick={() => toggleSegmentSelection(cs.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                    >
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900">{cs.name}</span>
                        {cs.count && (
                          <span className="ml-2 text-xs text-gray-400">({cs.count})</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    {pickerSearch ? 'No matching segments' : 'All segments have been added'}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Brief-Suggested Segments */}
        {briefSegments.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Suggested New Segments</h2>
            <p className="text-sm text-gray-500 mb-4">
              These segments from the brief didn't match any existing segments. Confirm to add them.
            </p>
            <div className="space-y-2">
              {briefSegments.map((seg) => (
                <div
                  key={seg.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-amber-200 text-amber-700 text-[10px] font-bold">
                      +
                    </span>
                    <span className="text-sm font-medium text-gray-900">{seg.name}</span>
                    <span className="inline-flex px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded">
                      From Brief
                    </span>
                  </div>
                  <button
                    onClick={() => confirmNewSegment(seg.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    Confirm & Create
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {audiences.segments.length === 0 && !isLoadingSegments && (
          <section className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-500">
              {selectedParent
                ? 'No segments found for this parent segment. Use the AI assistant below to suggest segments.'
                : 'Select a parent segment in the top-left navigation to load audience segments, or use the AI assistant below to suggest segments.'}
            </p>
          </section>
        )}
      </div>

      {/* AI Chat */}
      <WizardStepChat step={2} />
    </div>
  );
}
