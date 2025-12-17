"use client";

import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Button } from "@calcom/ui";
import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../_trpc/trpc";

export default function WaitlistPage() {
  const { t } = useLocale();
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<number | null>(null);

  // Get user's teams and their event types
  const { data: teams } = trpc.viewer.teams.list.useQuery();
  const teamEventTypes =
    teams?.flatMap((team) => team.eventTypes?.map((et) => ({ ...et, teamName: team.name })) || []) || [];

  // Get waitlist for selected lesson
  const { data: waitlist, refetch } = trpc.viewer.swim.waitlist.getWaitlistForLesson.useQuery(
    { eventTypeId: selectedEventTypeId! },
    { enabled: !!selectedEventTypeId }
  );

  const promoteMutation = trpc.viewer.swim.waitlist.promoteFromWaitlist.useMutation({
    onSuccess: () => {
      showToast("Swimmer promoted successfully!", "success");
      refetch();
    },
    onError: (error) => {
      showToast(error.message || "Failed to promote swimmer", "error");
    },
  });

  const handlePromote = (enrollmentId: string) => {
    if (confirm("Promote this swimmer from waitlist to active enrollment?")) {
      promoteMutation.mutate({ enrollmentId });
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Waitlist Management</h1>

      {/* Lesson Selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium">Select Lesson</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={selectedEventTypeId || ""}
          onChange={(e) => setSelectedEventTypeId(Number(e.target.value) || null)}>
          <option value="">-- Select a lesson --</option>
          {teamEventTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.title} ({et.teamName})
            </option>
          ))}
        </select>
      </div>

      {/* Waitlist Table */}
      {selectedEventTypeId && (
        <div className="overflow-hidden rounded-lg border">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h2 className="font-semibold">
              Waitlist ({waitlist?.length || 0} {waitlist?.length === 1 ? "swimmer" : "swimmers"})
            </h2>
          </div>

          {!waitlist || waitlist.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No swimmers on waitlist for this lesson</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                      Swimmer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                      Parent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-600">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {waitlist.map((entry) => (
                    <tr key={entry.enrollmentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          #{entry.position}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{entry.swimmer.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.swimmer.age ? `${entry.swimmer.age} yrs` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{entry.parent.name || "—"}</div>
                        <div className="text-xs text-gray-500">{entry.parent.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.joinedAt ? new Date(entry.joinedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => handlePromote(entry.enrollmentId)}
                          loading={promoteMutation.isLoading}>
                          Promote
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-900">💡 Waitlist Tips</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Swimmers are promoted in order of their position (#1 first)</li>
          <li>• Promoting a swimmer automatically updates remaining positions</li>
          <li>• Parents will be notified when promoted (email notification)</li>
        </ul>
      </div>
    </main>
  );
}
