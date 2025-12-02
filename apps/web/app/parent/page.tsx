"use client";

import Link from "next/link";
import { useEffect } from "react";

import { trpc } from "../_trpc/trpc";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

export default function ParentSwimmersPage() {
  const { t } = useLocale();
  const { data, isLoading, error } = trpc.viewer.swim.swimmers.listMine.useQuery();
  const swimmers = data || [];

  useEffect(() => {
    if (error) showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error");
  }, [error, t]);

  return (
    <main className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{t("swim.mySwimmers", { defaultValue: "My Swimmers" })}</h1>
        <Link
          href="/parent/swimmer/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add Swimmer
        </Link>
      </div>
      {isLoading && <div className="text-sm text-gray-500">{t("loading", { defaultValue: "Loading…" })}</div>}
      <ul className="space-y-2">
        {swimmers.map((s) => (
          <li key={s.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">{s.firstName} {s.lastName}</div>
              {s.currentLevel && <div className="text-xs text-gray-500">Level: {s.currentLevel}</div>}
            </div>
            <Link className="text-blue-600 text-sm" href={`/parent/swimmer/${s.id}`}>Open</Link>
          </li>
        ))}
        {swimmers.length === 0 && !isLoading && (
          <li className="text-sm text-gray-500">{t("swim.noSwimmersFound", { defaultValue: "No swimmers found." })}</li>
        )}
      </ul>
    </main>
  );
}
