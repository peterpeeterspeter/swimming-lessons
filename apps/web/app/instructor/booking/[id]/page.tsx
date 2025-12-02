"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { trpc } from "../../../_trpc/trpc";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

const statusOptions = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED", label: "Excused" },
  { value: "LATE", label: "Late" },
] as const;

type Status = typeof statusOptions[number]["value"];

export default function BookingAttendancePage() {
  const { t } = useLocale();
  const params = useParams<{ id?: string }>();
  const bookingId = Number(params?.id ?? 0);
  const router = useRouter();

  const roster = trpc.viewer.swim.instructor.getRoster.useQuery({ bookingId }, { enabled: bookingId > 0 });
  const markMany = trpc.viewer.swim.instructor.quickMarkMany.useMutation({
    onSuccess: () => roster.refetch(),
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
    <main className="p-3 max-w-md mx-auto space-y-3">
      <h1 className="text-lg font-semibold">{t("swim.attendance", { defaultValue: "Attendance" })}</h1>
      <div className="text-sm text-gray-600">Booking #{bookingId}</div>

      {roster.isLoading && <div className="text-sm text-gray-500">{t("loading")}</div>}
      {saved && <div className="text-green-600 text-sm">{saved}</div>}
      <ul className="space-y-2">
        {swimmers.map((s) => (
          <li key={s.swimmer.id} className="border rounded p-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{s.swimmer.firstName} {s.swimmer.lastName}</div>
                <div className="text-xs text-gray-500">{s.attendance?.status ?? "-"}</div>
              </div>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={marks[s.swimmer.id]?.status || s.attendance?.status || "PRESENT"}
                onChange={(e) =>
                  setMarks((prev) => ({ ...prev, [s.swimmer.id]: { ...(prev[s.swimmer.id] || { status: "PRESENT" }), status: e.target.value as Status } }))
                }
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <textarea
              className="mt-2 w-full border rounded p-2 text-sm"
              placeholder="Notes (optional)"
              rows={2}
              defaultValue={marks[s.swimmer.id]?.notes}
              onChange={(e) => setMarks((prev) => ({ ...prev, [s.swimmer.id]: { ...(prev[s.swimmer.id] || { status: "PRESENT" }), notes: e.target.value } }))}
            />
          </li>
        ))}
        {swimmers.length === 0 && <li className="text-sm text-gray-500">No swimmers enrolled.</li>}
      </ul>

      <button
        onClick={submit}
        disabled={isSaving}
        className="w-full bg-blue-600 text-white rounded py-2 text-sm disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Attendance"}
      </button>

      <button
        onClick={async () => {
          const entries = swimmers
            .map((s) => ({ swimmerId: s.swimmer.id, note: marks[s.swimmer.id]?.notes }))
            .filter((e) => !!e.note) as { swimmerId: string; note: string }[];
          if (entries.length === 0) return;
          await Promise.all(
            entries.map((e) => upsertNote.mutateAsync({ bookingId, swimmerId: e.swimmerId, note: e.note, visibleToParent: true }))
          );
          setSaved("Notes saved");
          setTimeout(() => setSaved(null), 1500);
        }}
        className="w-full border rounded py-2 text-sm"
      >
        Save Notes
      </button>

      <button onClick={() => router.back()} className="w-full border rounded py-2 text-sm">Back</button>
    </main>
  );
}
