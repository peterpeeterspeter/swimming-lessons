"use client";

import { useRouter, useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../../_trpc/trpc";

const statusOptions = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED", label: "Excused" },
  { value: "LATE", label: "Late" },
] as const;

type Status = (typeof statusOptions)[number]["value"];

export default function BookingAttendancePage() {
  const { t } = useLocale();
  const params = useParams<{ id?: string }>();
  const bookingId = Number(params?.id ?? 0);
  const router = useRouter();

  const { data: attendance, refetch } = trpc.viewer.swim.attendance.list.useQuery({
    bookingId: Number(bookingId),
  });

  // Get make-up lessons for this booking
  const { data: makeups } = trpc.viewer.swim.makeup.getMakeupsForLesson.useQuery({
    bookingId: Number(bookingId),
  });

  const markMutation = trpc.viewer.swim.attendance.mark.useMutation({
    onSuccess: () => {
      refetch();
      showToast("Attendance marked", "success");
    },
    onError: () => showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error"),
  });
  const upsertNote = trpc.viewer.swim.instructor.upsertNote.useMutation({
    onError: () => showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error"),
  });

  useEffect(() => {
    if (roster.error) showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error");
  }, [roster.error, t]);

  const [marks, setMarks] = useState<Record<string, { status: Status; notes?: string }>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const swimmers = roster.data?.swimmers ?? [];

  const submit = async () => {
    if (swimmers.length === 0) return;
    const payload = swimmers.map((s) => ({
      swimmerId: s.swimmer.id,
      status: (marks[s.swimmer.id]?.status || (s.attendance?.status as Status) || "PRESENT") as Status,
      notes: marks[s.swimmer.id]?.notes,
    }));
    await markMany.mutateAsync({ bookingId, marks: payload });
    setSaved("Attendance saved");
    setTimeout(() => setSaved(null), 1500);
  };

  const isSaving = markMany.status === "pending";

  return (
    <main className="mx-auto max-w-md space-y-3 p-3">
      <h1 className="text-lg font-semibold">{t("swim.attendance", { defaultValue: "Attendance" })}</h1>
      <div className="text-sm text-gray-600">Booking #{bookingId}</div>

      {/* The original code had `roster.isLoading`, assuming `attendance.isLoading` is the correct replacement */}
      {attendance?.isLoading && <div className="text-sm text-gray-500">{t("loading")}</div>}
      {saved && <div className="text-sm text-green-600">{saved}</div>}
      <div className="space-y-2">
        {attendance?.map((record) => {
          const makeup = makeups?.find((m) => m.swimmerId === record.swimmer.id);
          
          return (
            <div key={record.swimmer.id} className="flex items-center justify-between border rounded p-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {record.swimmer.firstName} {record.swimmer.lastName}
                    {makeup && (
                      <span
                        className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-normal"
                        title={`Make-up for ${new Date(makeup.originalLesson.date).toLocaleDateString()}`}>
                        🔄 Make-up
                      </span>
                    )}
                  </div>
                  {record.swimmer.currentLevel && (
                    <div className="text-sm text-gray-500">{record.swimmer.currentLevel}</div>
                  )}
                  {makeup && (
                    <div className="text-xs text-purple-600 italic">
                      Missed: {makeup.originalLesson.title} on{" "}
                      {new Date(makeup.originalLesson.date).toLocaleDateString()}
                      {makeup.reason && ` (${makeup.reason})`}
                    </div>
                  )}
                </div>
              </div>
              <select
                value={record.status}
                onChange={(e) =>
                  markMutation.mutate({
                    swimmerId: record.swimmer.id,
                    bookingId: Number(bookingId),
                    status: e.target.value as any,
                  })
                }
                className="border rounded px-2 py-1 text-sm">
                <option value="PRESENT">✅ Present</option>
                <option value="ABSENT">❌ Absent</option>
                <option value="EXCUSED">📋 Excused</option>
                <option value="LATE">⏰ Late</option>
              </select>
            </div>
            <textarea
              className="mt-2 w-full rounded border p-2 text-sm"
              placeholder="Notes (optional)"
              rows={2}
              defaultValue={marks[s.swimmer.id]?.notes}
              onChange={(e) =>
                setMarks((prev) => ({
                  ...prev,
                  [s.swimmer.id]: { ...(prev[s.swimmer.id] || { status: "PRESENT" }), notes: e.target.value },
                }))
              }
            />
          </li>
        ))}
        {swimmers.length === 0 && <li className="text-sm text-gray-500">No swimmers enrolled.</li>}
      </ul>

      <button
        onClick={submit}
        disabled={isSaving}
        className="w-full rounded bg-blue-600 py-2 text-sm text-white disabled:opacity-50">
        {isSaving ? "Saving..." : "Save Attendance"}
      </button>

      <button
        onClick={async () => {
          const entries = swimmers
            .map((s) => ({ swimmerId: s.swimmer.id, note: marks[s.swimmer.id]?.notes }))
            .filter((e) => !!e.note) as { swimmerId: string; note: string }[];
          if (entries.length === 0) return;
          await Promise.all(
            entries.map((e) =>
              upsertNote.mutateAsync({
                bookingId,
                swimmerId: e.swimmerId,
                note: e.note,
                visibleToParent: true,
              })
            )
          );
          setSaved("Notes saved");
          setTimeout(() => setSaved(null), 1500);
        }}
        className="w-full rounded border py-2 text-sm">
        Save Notes
      </button>

      <button onClick={() => router.back()} className="w-full rounded border py-2 text-sm">
        Back
      </button>
    </main>
  );
}
