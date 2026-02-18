/**
 * Reports Dashboard Page — Campaign performance reports and exports.
 * Placeholder that will be fully ported from paid-media-2026-v2.
 */

import { FileText, Download } from 'lucide-react';

export default function ReportsDashboardPage() {
  return (
    <div className="p-8 overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Generate campaign performance reports by selecting campaigns and a date range.
            Reports can be exported as PDF or PowerPoint.
          </p>
        </div>
      </div>
    </div>
  );
}
