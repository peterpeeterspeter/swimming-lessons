"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useEffect, useState as useStateReact } from "react";

import { trpc } from "../_trpc/trpc";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

export default function InstructorBookingsPage() {
  const { t } = useLocale();

  // Rely on server-side day boundaries to avoid timezone skew
  const instructorList = trpc.viewer.swim.instructor.listBookings.useQuery();
  const managerSummary = trpc.viewer.swim.manager.todaySummary.useQuery();
  const anyBookings = trpc.viewer.swim.instructor.listAny.useQuery();
  const ensureDemoBooking = trpc.viewer.swim.instructor.ensureDemoBooking.useMutation({
    onError: () => showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error"),
    onSuccess: () => instructorList.refetch(),
  });

  useEffect(() => {
    if (instructorList.error || managerSummary.error || anyBookings.error) {
      showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error");
    }
  }, [instructorList.error, managerSummary.error, anyBookings.error, t]);

  const primary: any[] = (instructorList.data as any) || [];
  const fromSummary: any[] = ((managerSummary.data as any) || []).map((it: any) => ({
    id: it.bookingId,
    title: it.title,
    startTime: it.startTime,
    totalEnrolled: it.totalEnrolled,
    markedPresent: it.markedPresent,
    markedCount: it.markedCount,
  }));
  const fromAny: any[] = ((anyBookings.data as any) || []);
  const bookings: { id: number; title?: string; startTime: string; totalEnrolled?: number; markedPresent?: number; markedCount?: number }[] =
    primary.length > 0 ? primary : fromSummary.length > 0 ? fromSummary : fromAny;
  const isLoading = instructorList.isLoading && managerSummary.isLoading && anyBookings.isLoading;

  // In E2E/dev env, ensure a demo booking exists if none found
  useEffect(() => {
    const isE2E = (process.env.NEXT_PUBLIC_IS_E2E as string | undefined) === "1" || (process.env.NEXT_PUBLIC_IS_E2E as string | undefined) === "true";
    if (isE2E && !isLoading && bookings.length === 0 && ensureDemoBooking.status !== "pending") {
      ensureDemoBooking.mutate();
    }
  }, [isLoading, bookings.length, ensureDemoBooking]);

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t("swim.todaysLessons", { defaultValue: "Today's Lessons" })}</h1>
      {isLoading && <div className="text-sm text-gray-500">{t("loading")}</div>}
      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">{b.title || "Lesson"}</div>
              <div className="text-xs text-gray-500">{new Date(b.startTime).toLocaleTimeString()}</div>
              {(b.totalEnrolled !== undefined) && (
                <div className="text-xs text-gray-500">{b.markedPresent || 0}/{b.totalEnrolled} present</div>
              )}
            </div>
            <Link href={`/instructor/booking/${b.id}`} className="text-blue-600 text-sm">Open</Link>
          </li>
        ))}
        {bookings.length === 0 && (
          <li className="text-sm text-gray-500">{t("swim.noLessonsToday", { defaultValue: "No lessons today." })}</li>
        )}
      </ul>
    </main>
  );
}
