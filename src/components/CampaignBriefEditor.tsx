import { useState } from 'react';
import { useBriefStore } from '../stores/briefStore';
import { parseCampaignBrief } from '../services/briefParser';
import type { BriefSectionKey } from '../types/brief';
import ChipInput from './ChipInput';
import AutosaveIndicator from './AutosaveIndicator';

interface CampaignBriefEditorProps {
  onCreateCampaign: () => void;
}

const SECTION_CONFIG: Array<{
  key: BriefSectionKey;
  title: string;
  helper: string;
}> = [
  { key: 'overview', title: 'Campaign Overview', helper: 'High-level campaign details and timeline' },
  { key: 'audience', title: 'Target Audience', helper: 'Who you want to reach and how to segment them' },
  { key: 'experience', title: 'Creative & Experience', helper: 'Messaging, tone, and placement strategy' },
  { key: 'offer', title: 'Offer & Promotion', helper: 'Discount, promo code, and offer conditions' },
  { key: 'measurement', title: 'Measurement & KPIs', helper: 'How you will measure success' },
];

export default function CampaignBriefEditor({ onCreateCampaign }: CampaignBriefEditorProps) {
  const {
    activeBrief,
    isDirty,
    lastSavedAt,
    isGenerating,
    updateSection,
    toggleLock,
    renameBrief,
  } = useBriefStore();

  const [collapsedSections, setCollapsedSections] = useState<Set<BriefSectionKey>>(new Set());
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  if (!activeBrief) return null;

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">{activeBrief.name}</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-500 rounded-full">generating</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {SECTION_CONFIG.map(({ key, title }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm font-medium text-gray-900 mb-3">{title}</div>
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 animate-pulse">AI is generating your campaign brief...</p>
        </div>
      </div>
    );
  }

  const toggleCollapse = (key: BriefSectionKey) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleRegenerate = (sectionKey: BriefSectionKey) => {
    const parsed = parseCampaignBrief(activeBrief.sourceMessage, activeBrief);
    const newSection = parsed.sections[sectionKey];
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(newSection)) {
      if (k !== 'locked' && k !== 'userEditedFields' && k !== 'notes') {
        updates[k] = v;
      }
    }
    // Apply without fieldName so we don't mark as user-edited
    updateSection(sectionKey, updates);
  };

  const startNameEdit = () => {
    setNameValue(activeBrief.name);
    setEditingName(true);
  };

  const commitNameEdit = () => {
    setEditingName(false);
    if (nameValue.trim() && nameValue.trim() !== activeBrief.name) {
      renameBrief(activeBrief.id, nameValue.trim());
    }
  };

  const isUserEdited = (sectionKey: BriefSectionKey, field: string): boolean => {
    return activeBrief.sections[sectionKey].userEditedFields?.includes(field) ?? false;
  };

  const renderFieldLabel = (label: string, sectionKey: BriefSectionKey, field: string) => (
    <div className="flex items-center gap-1.5 mb-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {isUserEdited(sectionKey, field) ? (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="User edited" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-300" title="AI inferred" />
      )}
    </div>
  );

  const renderTextInput = (
    sectionKey: BriefSectionKey,
    field: string,
    label: string,
    value: string,
    placeholder?: string
  ) => (
    <div>
      {renderFieldLabel(label, sectionKey, field)}
      <input
        type="text"
        value={value}
        onChange={(e) => updateSection(sectionKey, { [field]: e.target.value }, field)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
      />
    </div>
  );

  const renderTextArea = (
    sectionKey: BriefSectionKey,
    field: string,
    label: string,
    value: string,
    rows?: number
  ) => (
    <div>
      {renderFieldLabel(label, sectionKey, field)}
      <textarea
        value={value}
        onChange={(e) => updateSection(sectionKey, { [field]: e.target.value }, field)}
        rows={rows ?? 2}
        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white resize-none"
      />
    </div>
  );

  const renderChipField = (
    sectionKey: BriefSectionKey,
    field: string,
    label: string,
    value: string[],
    placeholder?: string
  ) => (
    <div>
      {renderFieldLabel(label, sectionKey, field)}
      <ChipInput
        value={value}
        onChange={(vals) => updateSection(sectionKey, { [field]: vals }, field)}
        placeholder={placeholder}
      />
    </div>
  );

  const renderSectionContent = (sectionKey: BriefSectionKey) => {
    const s = activeBrief.sections;

    switch (sectionKey) {
      case 'overview':
        return (
          <div className="space-y-3">
            {renderTextInput('overview', 'campaignName', 'Campaign Name', s.overview.campaignName)}
            {renderTextArea('overview', 'objective', 'Objective', s.overview.objective)}
            {renderTextInput('overview', 'businessGoal', 'Business Goal', s.overview.businessGoal)}
            <div className="grid grid-cols-2 gap-3">
              {renderTextInput('overview', 'timelineStart', 'Start Date', s.overview.timelineStart, 'YYYY-MM-DD')}
              {renderTextInput('overview', 'timelineEnd', 'End Date', s.overview.timelineEnd, 'YYYY-MM-DD')}
            </div>
            {renderTextInput('overview', 'budget', 'Budget', s.overview.budget, 'e.g., $50,000')}
            {renderChipField('overview', 'channels', 'Channels', s.overview.channels, 'Add channel...')}
          </div>
        );

      case 'audience':
        return (
          <div className="space-y-3">
            {renderTextInput('audience', 'primaryAudience', 'Primary Audience', s.audience.primaryAudience)}
            {renderTextInput('audience', 'audienceSize', 'Audience Size', s.audience.audienceSize, 'e.g., 500K users')}
            {renderChipField('audience', 'inclusionCriteria', 'Inclusion Criteria', s.audience.inclusionCriteria, 'Add criteria...')}
            {renderChipField('audience', 'exclusionCriteria', 'Exclusion Criteria', s.audience.exclusionCriteria, 'Add criteria...')}
            {renderChipField('audience', 'segments', 'Segments', s.audience.segments, 'Add segment...')}
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-3">
            {renderTextInput('experience', 'headline', 'Headline', s.experience.headline)}
            {renderTextArea('experience', 'bodyMessage', 'Body Message', s.experience.bodyMessage, 3)}
            {renderTextInput('experience', 'ctaText', 'CTA Text', s.experience.ctaText)}
            {renderTextInput('experience', 'tone', 'Tone', s.experience.tone)}
            {renderChipField('experience', 'placements', 'Placements', s.experience.placements, 'Add placement...')}
          </div>
        );

      case 'offer':
        return (
          <div className="space-y-3">
            {renderTextInput('offer', 'offerType', 'Offer Type', s.offer.offerType)}
            {renderTextInput('offer', 'offerValue', 'Offer Value', s.offer.offerValue, 'e.g., 20% off')}
            {renderTextArea('offer', 'offerConditions', 'Conditions', s.offer.offerConditions)}
            {renderTextInput('offer', 'promoCode', 'Promo Code', s.offer.promoCode, 'e.g., SAVE20')}
            {renderTextInput('offer', 'expirationDate', 'Expiration Date', s.offer.expirationDate, 'YYYY-MM-DD')}
          </div>
        );

      case 'measurement':
        return (
          <div className="space-y-3">
            {renderTextInput('measurement', 'primaryKpi', 'Primary KPI', s.measurement.primaryKpi)}
            {renderChipField('measurement', 'secondaryKpis', 'Secondary KPIs', s.measurement.secondaryKpis, 'Add KPI...')}
            {renderChipField('measurement', 'secondaryMetrics', 'Secondary Metrics', s.measurement.secondaryMetrics, 'Add metric...')}
            {renderChipField('measurement', 'successCriteria', 'Success Criteria', s.measurement.successCriteria, 'Add criterion...')}
            {renderChipField('measurement', 'risks', 'Risks', s.measurement.risks, 'Add risk...')}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitNameEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') commitNameEdit(); if (e.key === 'Escape') setEditingName(false); }}
              className="text-sm font-semibold text-gray-900 border-b border-blue-400 outline-none bg-transparent"
            />
          ) : (
            <button
              onClick={startNameEdit}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate"
              title="Click to rename"
            >
              {activeBrief.name}
            </button>
          )}
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-500 rounded-full">
            {activeBrief.status}
          </span>
        </div>
        <AutosaveIndicator isDirty={isDirty} lastSavedAt={lastSavedAt} />
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {SECTION_CONFIG.map(({ key, title, helper }) => {
          const section = activeBrief.sections[key];
          const isCollapsed = collapsedSections.has(key);

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Section header */}
              <div className="flex items-center justify-between px-5 py-3">
                <button
                  onClick={() => toggleCollapse(key)}
                  className="flex items-center gap-2 text-left min-w-0"
                >
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{title}</div>
                    <div className="text-xs text-gray-400">{helper}</div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Lock toggle */}
                  <button
                    onClick={() => toggleLock(key)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                      section.locked
                        ? 'bg-amber-50 text-amber-600'
                        : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                    }`}
                    title={section.locked ? 'Unlock section' : 'Lock section'}
                  >
                    {section.locked ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>

                  {/* Regenerate */}
                  <button
                    onClick={() => handleRegenerate(key)}
                    disabled={section.locked}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Regenerate section"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Section body */}
              {!isCollapsed && (
                <div className="px-5 pb-4">
                  {section.locked && (
                    <div className="mb-3 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      This section is locked. AI regeneration is disabled.
                    </div>
                  )}
                  {section.notes && (
                    <div className="mb-3 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 italic">
                      {section.notes}
                    </div>
                  )}
                  {renderSectionContent(key)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
        <button
          onClick={onCreateCampaign}
          className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          Create Campaign
        </button>
      </div>
    </div>
  );
}
