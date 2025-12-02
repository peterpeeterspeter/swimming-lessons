"use client";

import Link from "next/link";
import { useMemo } from "react";

import { trpc } from "../_trpc/trpc";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { useEffect } from "react";
import { showToast } from "@calcom/ui/components/toast";

export default function ManagerTodaySummaryPage() {
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, []);

  const { data, isLoading, error } = trpc.viewer.swim.manager.todaySummary.useQuery({ start: todayStart, end: todayEnd });
  const items = data || [];

  useEffect(() => {
    if (error) showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error");
  }, [error]);

  const { t } = useLocale();

  // Calculate summary stats
  const totalLessons = items.length;
  const totalEnrolled = items.reduce((sum, l) => sum + (l.totalEnrolled || 0), 0);
  const totalMarked = items.reduce((sum, l) => sum + (l.markedCount || 0), 0);
  const totalPresent = items.reduce((sum, l) => sum + (l.markedPresent || 0), 0);
  const attendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;
  const completionRate = totalEnrolled > 0 ? Math.round((totalMarked / totalEnrolled) * 100) : 0;

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t("swim.managerDashboard", { defaultValue: "Manager Dashboard" })}</h1>
      {isLoading && <div className="text-sm text-gray-500">{t("loading", { defaultValue: "Loading…" })}</div>}
      
      {/* Summary Cards */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="border rounded p-3 bg-blue-50">
            <div className="text-2xl font-bold text-blue-700">{totalLessons}</div>
            <div className="text-xs text-gray-600">Today's Lessons</div>
          </div>
          <div className="border rounded p-3 bg-green-50">
            <div className="text-2xl font-bold text-green-700">{totalEnrolled}</div>
            <div className="text-xs text-gray-600">Total Enrolled</div>
          </div>
          <div className="border rounded p-3 bg-purple-50">
            <div className="text-2xl font-bold text-purple-700">{completionRate}%</div>
            <div className="text-xs text-gray-600">Marked</div>
          </div>
          <div className="border rounded p-3 bg-orange-50">
            <div className="text-2xl font-bold text-orange-700">{attendanceRate}%</div>
            <div className="text-xs text-gray-600">Attendance Rate</div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">{t("swim.todaysLessons", { defaultValue: "Today's Lessons" })}</h2>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.bookingId} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">{it.title}</div>
              <div className="text-xs text-gray-500">
                {new Date(it.startTime).toLocaleTimeString()} · {it.teamName}
              </div>
              <div className="text-xs text-gray-500">{it.markedPresent}/{it.totalEnrolled} present</div>
            </div>
            <Link href={`/instructor/booking/${it.bookingId}`} className="text-blue-600 text-sm">Open</Link>
          </li>
        ))}
        {items.length === 0 && !isLoading && (
          <li className="text-sm text-gray-500">No lessons today.</li>
        )}
      </ul>
    </main>
  );
}
