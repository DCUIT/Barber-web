/**
 * RevenueChart
 *
 * Recharts is currently disabled because it throws runtime error:
 * “Invalid hook call” (React 19 incompatibility / bundling mismatch).
 */
export default function RevenueChart() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
        <i className="fas fa-chart-line text-green-500"></i>
        Thống Kê Doanh Thu & Lịch Hẹn
      </h3>
      <div className="text-sm text-gray-500">
        Chart is disabled for now (recharts runtime error).
      </div>
    </div>
  );
}

