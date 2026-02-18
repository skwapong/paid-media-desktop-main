/**
 * Optimization Dashboard Page — In-flight campaign optimization view.
 * Renders the full OptimizationDashboard with hierarchical campaign tree,
 * AI insights, recommendations, and quick actions.
 */

import OptimizationDashboard from '../components/optimize/OptimizationDashboard';

export default function OptimizeDashboardPage() {
  return (
    <div className="h-full overflow-hidden bg-[#F7F8FB]">
      <OptimizationDashboard />
    </div>
  );
}
