"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "../../_trpc/trpc";

export default function ManagerMakeupDashboard() {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Get user's teams
  const { data: teams } = trpc.viewer.teams.list.useQuery();

  // Get all pending make-ups for team (we'll create this endpoint)
  const { data: pendingMakeups } = trpc.viewer.swim.makeup.getTeamMakeupStats.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );

  // Calculate stats
  const totalPending = pendingMakeups?.pending || 0;
  const totalScheduled = pendingMakeups?.scheduled || 0;
  const totalUsed = pendingMakeups?.used || 0;
  const totalExpired = pendingMakeups?.expired || 0;
  const utilizationRate =
    totalPending + totalScheduled + totalUsed > 0
      ? Math.round((totalUsed / (totalPending + totalScheduled + totalUsed + totalExpired)) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Make-Up Lesson Dashboard</h1>
        <button onClick={() => router.push("/manager")} className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </button>
      </div>

      {/* Team Selector */}
      <div className="mb-6 rounded-lg border bg-white p-6">
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

      {selectedTeamId && pendingMakeups && (
        <>
          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="mb-1 text-sm font-medium text-yellow-700">Pending</div>
              <div className="text-3xl font-bold text-yellow-900">{totalPending}</div>
              <div className="mt-1 text-xs text-yellow-600">Credits available</div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-1 text-sm font-medium text-blue-700">Scheduled</div>
              <div className="text-3xl font-bold text-blue-900">{totalScheduled}</div>
              <div className="mt-1 text-xs text-blue-600">Booked for future</div>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-1 text-sm font-medium text-green-700">Used</div>
              <div className="text-3xl font-bold text-green-900">{totalUsed}</div>
              <div className="mt-1 text-xs text-green-600">Completed</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-1 text-sm font-medium text-gray-700">Expired</div>
              <div className="text-3xl font-bold text-gray-900">{totalExpired}</div>
              <div className="mt-1 text-xs text-gray-600">Unused</div>
            </div>

            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="mb-1 text-sm font-medium text-purple-700">Utilization</div>
              <div className="text-3xl font-bold text-purple-900">{utilizationRate}%</div>
              <div className="mt-1 text-xs text-purple-600">Credits used</div>
            </div>
          </div>

          {/* Expiring Soon */}
          {pendingMakeups.expiringSoon && pendingMakeups.expiringSoon.length > 0 && (
            <div className="mb-6 rounded-lg border border-orange-300 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-orange-700">⚠️ Expiring Soon (Next 30 Days)</h2>
              <div className="space-y-3">
                {pendingMakeups.expiringSoon.map((makeup: any) => (
                  <div key={makeup.id} className="rounded border bg-orange-50 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {makeup.swimmer.firstName} {makeup.swimmer.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          Missed: {makeup.originalLesson.title} on{" "}
                          {new Date(makeup.originalLesson.date).toLocaleDateString()}
                        </div>
                        {makeup.reason && (
                          <div className="text-sm italic text-gray-500">Reason: {makeup.reason}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="rounded bg-orange-200 px-2 py-1 text-xs font-medium text-orange-900">
                          Expires: {new Date(makeup.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {pendingMakeups.recentActivity && pendingMakeups.recentActivity.length > 0 && (
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">📋 Recent Make-Up Activity</h2>
              <div className="space-y-2">
                {pendingMakeups.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="rounded border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {activity.swimmer.firstName} {activity.swimmer.lastName}
                        </span>
                        <span className="mx-2 text-gray-600">•</span>
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            activity.status === "USED"
                              ? "bg-green-100 text-green-700"
                              : activity.status === "SCHEDULED"
                              ? "bg-blue-100 text-blue-700"
                              : activity.status === "EXPIRED"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-1 text-gray-600">
                      {activity.originalLesson.title}
                      {activity.makeupLesson && <span> → {activity.makeupLesson.title}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalPending === 0 && totalScheduled === 0 && totalUsed === 0 && totalExpired === 0 && (
            <div className="rounded-lg border bg-white p-12 text-center">
              <div className="mb-4 text-6xl">🏊</div>
              <h2 className="mb-2 text-xl font-semibold text-gray-800">No Make-Up Lessons Yet</h2>
              <p className="text-gray-600">
                There are no make-up lesson credits for this team at the moment.
              </p>
            </div>
          )}
        </>
      )}

      {/* No Team Selected */}
      {!selectedTeamId && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <div className="mb-4 text-6xl">👆</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Select a Team</h2>
          <p className="text-gray-600">Choose a team above to view make-up lesson statistics.</p>
        </div>
      )}
    </main>
  );
}
