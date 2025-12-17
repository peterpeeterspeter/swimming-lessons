"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../_trpc/trpc";

export default function ParentSwimmersPage() {
  const { t } = useLocale();
  const { data, isLoading, error } = trpc.viewer.swim.swimmers.listMine.useQuery();
  const swimmers = data || [];

  useEffect(() => {
    if (error) showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error");
  }, [error, t]);

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("swim.mySwimmers", { defaultValue: "My Swimmers" })}</h1>
        <Link
          href="/parent/swimmer/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Add Swimmer
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Link
          href="/parent/absence"
          className="rounded border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
          📅 Report Absence
        </Link>
        <Link
          href="/parent/payment-method"
          className="rounded border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
          💳 Payment Methods
        </Link>
        <Link
          href="/parent/makeup"
          className="rounded border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
          🔄 Make-Up Lessons
        </Link>
        <Link
          href="/parent/progress"
          className="rounded border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
          📊 Skill Progress
        </Link>
      </div>

      {isLoading && <div className="text-sm text-gray-500">{t("loading", { defaultValue: "Loading…" })}</div>}
      <ul className="space-y-2">
        {swimmers.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <div className="text-sm font-medium">
                {s.firstName} {s.lastName}
              </div>
              {s.currentLevel && <div className="text-xs text-gray-500">Level: {s.currentLevel}</div>}
            </div>
            <Link className="text-sm text-blue-600" href={`/parent/swimmer/${s.id}`}>
              Open
            </Link>
          </li>
        ))}
        {swimmers.length === 0 && !isLoading && (
          <li className="text-sm text-gray-500">
            {t("swim.noSwimmersFound", { defaultValue: "No swimmers found." })}
          </li>
        )}
      </ul>
    </main>
  );
}
