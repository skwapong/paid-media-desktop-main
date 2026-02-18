import { useCampaignConfigStore } from '../../stores/campaignConfigStore';
import WizardStepChat from './WizardStepChat';

export default function CampaignSetupStep() {
  const config = useCampaignConfigStore((s) => s.config);
  const updateSetup = useCampaignConfigStore((s) => s.updateSetup);

  if (!config) return null;

  const { setup } = config;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Campaign Name */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Campaign Name</label>
              <input
                type="text"
                value={setup.name}
                onChange={(e) => updateSetup({ name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Objective</label>
              <textarea
                value={setup.objective}
                onChange={(e) => updateSetup({ objective: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>
        </section>

        {/* Goal & KPI */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Goal & KPIs</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Business Goal</label>
              <input
                type="text"
                value={setup.businessGoal}
                onChange={(e) => updateSetup({ businessGoal: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Goal Type</label>
              <select
                value={setup.goalType}
                onChange={(e) => updateSetup({ goalType: e.target.value as typeof setup.goalType })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none cursor-pointer focus:outline-none focus:border-gray-300"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="conversion">Conversion</option>
                <option value="engagement">Engagement</option>
                <option value="retention">Retention</option>
                <option value="revenue">Revenue</option>
                <option value="awareness">Awareness</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Primary KPI</label>
              <input
                type="text"
                value={setup.primaryKpi}
                onChange={(e) => updateSetup({ primaryKpi: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Budget</label>
              <input
                type="text"
                value={setup.budget}
                onChange={(e) => updateSetup({ budget: e.target.value })}
                placeholder="e.g., $50,000"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>
          {/* Secondary KPIs */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Secondary KPIs</label>
            <div className="flex flex-wrap gap-2">
              {setup.secondaryKpis.map((kpi, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {kpi}
                  <button
                    onClick={() => {
                      const updated = setup.secondaryKpis.filter((_, i) => i !== idx);
                      updateSetup({ secondaryKpis: updated });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Dates & Channels */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Timeline & Channels</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={setup.startDate}
                onChange={(e) => updateSetup({ startDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={setup.endDate}
                onChange={(e) => updateSetup({ endDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Channels</label>
            <div className="flex flex-wrap gap-2">
              {setup.channels.map((ch, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {ch}
                  <button
                    onClick={() => {
                      const updated = setup.channels.filter((_, i) => i !== idx);
                      updateSetup({ channels: updated });
                    }}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* AI Chat */}
      <WizardStepChat step={1} />
    </div>
  );
}
