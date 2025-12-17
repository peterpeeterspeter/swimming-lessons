"use client";

import { useState, useMemo } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../_trpc/trpc";

export default function FinancialDashboardPage() {
  const { t } = useLocale();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "1y" | "all">("90d");

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(start.getFullYear() - 1);
        break;
      case "all":
        start = new Date(0);
        break;
    }

    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [dateRange]);

  // Get user's teams
  const { data: teams } = trpc.viewer.teams.list.useQuery();

  // Get financial data
  const { data: revenueData, isLoading: loadingRevenue } =
    trpc.viewer.swim.financial.getRevenueOverview.useQuery(
      { teamId: selectedTeamId!, startDate, endDate },
      { enabled: !!selectedTeamId }
    );

  const { data: paymentBreakdown } = trpc.viewer.swim.financial.getPaymentStatusBreakdown.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );

  const { data: outstandingPayments } = trpc.viewer.swim.financial.getOutstandingPayments.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );

  const exportMutation = trpc.viewer.swim.financial.exportFinancialData.useQuery(
    { teamId: selectedTeamId!, startDate, endDate, format: "csv" },
    { enabled: false }
  );

  const handleExport = async () => {
    if (!selectedTeamId) return;

    try {
      const result = await exportMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        showToast("Financial data exported successfully", "success");
      }
    } catch (error) {
      showToast("Failed to export data", "error");
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Financial Dashboard</h1>

      {/* Team & Date Range Selectors */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Select Team</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={selectedTeamId || ""}
            onChange={(e) => setSelectedTeamId(Number(e.target.value) || null)}>
            <option value="">-- Select a team --</option>
            {teams?.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Date Range</label>
          <div className="flex gap-2">
            {(["30d", "90d", "1y", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`rounded px-3 py-2 text-sm font-medium ${
                  dateRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {range === "30d"
                  ? "30 Days"
                  : range === "90d"
                  ? "90 Days"
                  : range === "1y"
                  ? "1 Year"
                  : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedTeamId && (
        <>
          {/* Summary Cards */}
          {loadingRevenue ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-green-50 p-4">
                  <div className="mb-1 text-sm text-gray-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-700">
                    ${revenueData?.totalRevenue.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="rounded-lg border bg-blue-50 p-4">
                  <div className="mb-1 text-sm text-gray-600">Monthly Recurring</div>
                  <div className="text-2xl font-bold text-blue-700">
                    ${revenueData?.monthlyRecurringRevenue.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="rounded-lg border bg-purple-50 p-4">
                  <div className="mb-1 text-sm text-gray-600">Active Enrollments</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {revenueData?.activeEnrollments || 0}
                  </div>
                </div>
                <div className="rounded-lg border bg-orange-50 p-4">
                  <div className="mb-1 text-sm text-gray-600">Total Enrollments</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {revenueData?.totalEnrollments || 0}
                  </div>
                </div>
              </div>

              {/* Revenue Chart (Simple Bar Chart) */}
              <div className="mb-6 rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Revenue by Month</h2>
                  <button
                    onClick={handleExport}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                    📥 Export CSV
                  </button>
                </div>
                {revenueData && revenueData.revenueByMonth.length > 0 ? (
                  <div className="space-y-3">
                    {revenueData.revenueByMonth.map((item) => {
                      const maxRevenue = Math.max(...revenueData.revenueByMonth.map((i) => i.revenue));
                      const percentage = (item.revenue / maxRevenue) * 100;

                      return (
                        <div key={item.month}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-medium">{item.month}</span>
                            <span className="text-gray-600">${item.revenue.toFixed(2)}</span>
                          </div>
                          <div className="h-6 w-full rounded-full bg-gray-200">
                            <div
                              className="flex h-6 items-center justify-end rounded-full bg-blue-600 pr-2"
                              style={{ width: `${percentage}%` }}>
                              {percentage > 15 && (
                                <span className="text-xs font-medium text-white">
                                  ${item.revenue.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">No revenue data for this period</div>
                )}
              </div>

              {/* Payment Status Breakdown */}
              <div className="mb-6 rounded-lg border p-6">
                <h2 className="mb-4 text-lg font-semibold">Payment Status</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  {paymentBreakdown &&
                    Object.entries(paymentBreakdown).map(([status, data]) => (
                      <div key={status} className="text-center">
                        <div className="text-2xl font-bold">{data.count}</div>
                        <div className="text-xs uppercase text-gray-600">{status.replace("_", " ")}</div>
                        <div className="text-sm text-gray-500">${data.amount.toFixed(2)}</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Outstanding Payments */}
              <div className="overflow-hidden rounded-lg border">
                <div className="border-b bg-red-50 px-4 py-3">
                  <h2 className="font-semibold text-red-900">
                    Outstanding Payments ({outstandingPayments?.length || 0})
                  </h2>
                </div>
                {outstandingPayments && outstandingPayments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                            Swimmer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                            Parent
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                            Lesson
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                            Due Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {outstandingPayments.map((payment) => (
                          <tr key={payment.enrollmentId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{payment.swimmer.name}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm">{payment.swimmer.parentName || "—"}</div>
                              <div className="text-xs text-gray-500">{payment.swimmer.parentEmail}</div>
                            </td>
                            <td className="px-4 py-3 text-sm">{payment.lesson}</td>
                            <td className="px-4 py-3 text-sm font-medium">${payment.amount.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                                  payment.status === "PAST_DUE"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                {payment.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">No outstanding payments</div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!selectedTeamId && (
        <div className="rounded-lg border p-12 text-center text-gray-500">
          Select a team to view financial dashboard
        </div>
      )}
    </main>
  );
}
