"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../../_trpc/trpc";

type Status = "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";

export default function BookingAttendancePage() {
  const { t } = useLocale();
  const params = useParams<{ id?: string }>();
  const bookingId = Number(params?.id ?? 0);
  const router = useRouter();
  const [saved, setSaved] = useState<string | null>(null);

  const { data: attendanceData, refetch } = trpc.viewer.swim.attendance.listByBooking.useQuery({
    bookingId: Number(bookingId),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attendance = attendanceData as any[];

  const markMutation = trpc.viewer.swim.attendance.mark.useMutation({
    onSuccess: () => {
      refetch();
      showToast("Attendance marked", "success");
      setSaved("Attendance updated");
      setTimeout(() => setSaved(null), 1500);
    },
    onError: () => showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error"),
  });

  const isLoading = !attendanceData;

  return (
    <main className="mx-auto max-w-md space-y-3 p-3">
      <h1 className="text-lg font-semibold">{t("swim.attendance", { defaultValue: "Attendance" })}</h1>
      <div className="text-sm text-gray-600">Booking #{bookingId}</div>

      {isLoading && <div className="text-sm text-gray-500">{t("loading")}</div>}
      {saved && <div className="text-sm text-green-600">{saved}</div>}
      
      <div className="space-y-2">
        {attendance?.map((record) => (
          <div key={record.swimmer.id} className="space-y-2 border rounded p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">
                    {record.swimmer.firstName} {record.swimmer.lastName}
                  </div>
                  {record.swimmer.currentLevel && (
                    <div className="text-sm text-gray-500">{record.swimmer.currentLevel}</div>
                  )}
                </div>
              </div>
              <select
                value={record.status}
                onChange={(e) =>
                  markMutation.mutate({
                    swimmerId: record.swimmer.id,
                    bookingId: Number(bookingId),
                    status: e.target.value as Status,
                  })
                }
                className="border rounded px-2 py-1 text-sm">
                <option value="PRESENT">✅ Present</option>
                <option value="ABSENT">❌ Absent</option>
                <option value="EXCUSED">📋 Excused</option>
                <option value="LATE">⏰ Late</option>
              </select>
            </div>
          </div>
        ))}
        {attendance?.length === 0 && <div className="text-sm text-gray-500">No swimmers enrolled.</div>}
      </div>

      <button onClick={() => router.back()} className="w-full rounded border py-2 text-sm">
        Back
      </button>
    </main>
  );
}
