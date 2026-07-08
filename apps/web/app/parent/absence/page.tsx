"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Button } from "@calcom/ui/components/button";
import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../_trpc/trpc";

export default function AbsenceReportPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [selectedSwimmerId, setSelectedSwimmerId] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [reason, setReason] = useState<"SICK" | "VACATION" | "OTHER">("SICK");
  const [notes, setNotes] = useState("");

  // Get user's swimmers
  const { data: swimmers } = trpc.viewer.swim.swimmers.list.useQuery();

  // Get upcoming lessons for selected swimmer
  const { data: enrollments } = trpc.viewer.swim.enrollments.listBySwimmer.useQuery(
    { swimmerId: selectedSwimmerId },
    { enabled: !!selectedSwimmerId }
  );

  // Get upcoming bookings for enrolled event types
  const eventTypeIds = enrollments?.map((e) => e.eventTypeId) || [];

  const reportAbsenceMutation = trpc.viewer.swim.attendance.reportAbsence.useMutation({
    onSuccess: () => {
      showToast("Absence reported successfully", "success");
      router.push("/parent");
    },
    onError: (error) => {
      showToast(error.message || "Failed to report absence", "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSwimmerId || !selectedBookingId) {
      showToast("Please select a swimmer and lesson", "error");
      return;
    }

    reportAbsenceMutation.mutate({
      swimmerId: selectedSwimmerId,
      bookingId: Number(selectedBookingId),
      reason,
      notes: notes || undefined,
    });
  };

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Report Absence</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Swimmer Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium">Swimmer</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={selectedSwimmerId}
            onChange={(e) => {
              setSelectedSwimmerId(e.target.value);
              setSelectedBookingId(""); // Reset lesson selection
            }}
            required>
            <option value="">-- Select a swimmer --</option>
            {swimmers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Lesson Selection */}
        {selectedSwimmerId && (
          <div>
            <label className="mb-2 block text-sm font-medium">Upcoming Lesson</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              required>
              <option value="">-- Select a lesson --</option>
              {/* TODO: Hook up to actual upcoming bookings */}
              <option value="1">Next Lesson - Today 4:00 PM</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Only showing upcoming lessons for this swimmer</p>
          </div>
        )}

        {/* Reason Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium">Reason</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="reason"
                value="SICK"
                checked={reason === "SICK"}
                onChange={(e) => setReason(e.target.value as typeof reason)}
                className="mr-2"
              />
              <span className="text-sm">Sick</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="reason"
                value="VACATION"
                checked={reason === "VACATION"}
                onChange={(e) => setReason(e.target.value as typeof reason)}
                className="mr-2"
              />
              <span className="text-sm">Vacation / Travel</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="reason"
                value="OTHER"
                checked={reason === "OTHER"}
                onChange={(e) => setReason(e.target.value as typeof reason)}
                className="mr-2"
              />
              <span className="text-sm">Other</span>
            </label>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="mb-2 block text-sm font-medium">Additional Notes (Optional)</label>
          <textarea
            className="w-full resize-none rounded border px-3 py-2"
            rows={3}
            placeholder="Any additional information..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            💡 Your instructor will be notified of this absence. The lesson will be marked as "Excused" in the
            attendance records.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" color="primary" className="flex-1" loading={reportAbsenceMutation.isLoading}>
            Report Absence
          </Button>
          <Button type="button" color="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
