"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../_trpc/trpc";

export default function ParentMakeupPage() {
  const router = useRouter();
  const [selectedSwimmerId, setSelectedSwimmerId] = useState<string | null>(null);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<number | null>(null);
  const [showSlots, setShowSlots] = useState(false);

  const utils = trpc.useContext();

  // Get user's swimmers
  const { data: swimmers } = trpc.viewer.swim.swimmers.list.useQuery({});

  // Get make-up credits for selected swimmer
  const { data: makeupCredits } = trpc.viewer.swim.makeup.getMakeupCredits.useQuery(
    { swimmerId: selectedSwimmerId! },
    { enabled: !!selectedSwimmerId }
  );

  // Get available slots
  const { data: availableSlots } = trpc.viewer.swim.makeup.getAvailableSlots.useQuery(
    { swimmerId: selectedSwimmerId!, eventTypeId: selectedEventTypeId! },
    { enabled: !!selectedSwimmerId && !!selectedEventTypeId && showSlots }
  );

  // Book make-up mutation
  const bookMakeupMutation = trpc.viewer.swim.makeup.bookMakeupLesson.useMutation({
    onSuccess: (data) => {
      showToast(
        `Make-up lesson booked for ${new Date(data.targetLesson.startTime).toLocaleDateString()}`,
        "success"
      );
      utils.viewer.swim.makeup.getMakeupCredits.invalidate();
      setShowSlots(false);
    },
    onError: (error) => {
      showToast(error.message || "Failed to book make-up lesson", "error");
    },
  });

  const handleBookMakeup = (makeupLessonId: string, targetBookingId: number) => {
    if (confirm("Book this make-up lesson?")) {
      bookMakeupMutation.mutate({ makeupLessonId, targetBookingId });
    }
  };

  const pendingCredits = makeupCredits?.filter((c) => c.status === "PENDING") || [];
  const scheduledCredits = makeupCredits?.filter((c) => c.status === "SCHEDULED") || [];
  const expiredCredits = makeupCredits?.filter((c) => c.status === "EXPIRED") || [];

  return (
    <main className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Make-Up Lessons</h1>
        <button onClick={() => router.push("/parent")} className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </button>
      </div>

      {/* Swimmer Selector */}
      <div className="mb-6 rounded-lg border bg-white p-6">
        <label className="mb-2 block text-sm font-medium">Select Swimmer</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={selectedSwimmerId || ""}
          onChange={(e) => {
            setSelectedSwimmerId(e.target.value || null);
            setShowSlots(false);
          }}>
          <option value="">-- Select a swimmer --</option>
          {swimmers?.map((swimmer) => (
            <option key={swimmer.id} value={swimmer.id}>
              {swimmer.firstName} {swimmer.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Make-up Credits Summary */}
      {selectedSwimmerId && makeupCredits && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="mb-1 text-sm font-medium text-yellow-700">Pending Credits</div>
            <div className="text-3xl font-bold text-yellow-900">{pendingCredits.length}</div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-1 text-sm font-medium text-green-700">Scheduled</div>
            <div className="text-3xl font-bold text-green-900">{scheduledCredits.length}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-1 text-sm font-medium text-gray-700">Expired</div>
            <div className="text-3xl font-bold text-gray-900">{expiredCredits.length}</div>
          </div>
        </div>
      )}

      {/* Pending Credits - Book Now */}
      {pendingCredits.length > 0 && (
        <div className="mb-6 rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">📅 Available Make-Up Credits</h2>
          <div className="space-y-3">
            {pendingCredits.map((credit) => (
              <div key={credit.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-medium">{credit.originalLesson.title}</div>
                    <div className="text-sm text-gray-600">
                      Missed on {new Date(credit.originalLesson.date).toLocaleDateString()}
                    </div>
                    {credit.reason && (
                      <div className="text-sm italic text-gray-500">Reason: {credit.reason}</div>
                    )}
                  </div>
                  {credit.expiresAt && (
                    <div className="text-right">
                      <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Expires {new Date(credit.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {!showSlots || selectedEventTypeId !== credit.originalLesson.title ? (
                  <button
                    onClick={() => {
                      setSelectedEventTypeId(credit.id as any); // TODO: Fix type
                      setShowSlots(true);
                    }}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                    Book Make-Up Lesson
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSlots(false)}
                    className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                    Cancel
                  </button>
                )}

                {/* Available Slots */}
                {showSlots && selectedEventTypeId === (credit.id as any) && availableSlots && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="mb-3 text-sm font-medium">Available Slots (Next 90 Days)</h3>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.bookingId}
                          onClick={() => handleBookMakeup(credit.id, slot.bookingId)}
                          disabled={bookMakeupMutation.isLoading}
                          className="w-full rounded border p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{slot.title}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(slot.startTime).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-2xl text-blue-600">→</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Credits */}
      {scheduledCredits.length > 0 && (
        <div className="mb-6 rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">✅ Scheduled Make-Ups</h2>
          <div className="space-y-3">
            {scheduledCredits.map((credit) => (
              <div key={credit.id} className="rounded-lg border bg-green-50 p-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">Original: {credit.originalLesson.title}</div>
                    <div className="text-sm text-gray-600">
                      Missed: {new Date(credit.originalLesson.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-700">Make-up: {credit.makeupLesson?.title}</div>
                    <div className="text-sm text-green-600">
                      {credit.makeupLesson && new Date(credit.makeupLesson.date).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Credits */}
      {selectedSwimmerId && makeupCredits && makeupCredits.length === 0 && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <div className="mb-4 text-6xl">🏊</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800">No Make-Up Credits</h2>
          <p className="text-gray-600">This swimmer doesn't have any make-up lesson credits at the moment.</p>
        </div>
      )}

      {/* No Swimmer Selected */}
      {!selectedSwimmerId && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <div className="mb-4 text-6xl">👆</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Select a Swimmer</h2>
          <p className="text-gray-600">Choose a swimmer above to view and book make-up lessons.</p>
        </div>
      )}
    </main>
  );
}
