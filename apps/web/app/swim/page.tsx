"use client";

import Link from "next/link";
import { useEffect } from "react";

import { trpc } from "../_trpc/trpc";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

export default function SwimQuickLinksPage() {
  const { t } = useLocale();
  const me = trpc.viewer.me.get.useQuery();
  const swimmers = trpc.viewer.swim.swimmers.listMine.useQuery();
  const myTeams = trpc.viewer.teams.list.useQuery({ includeOrgs: false });

  useEffect(() => {
    if (me.error || swimmers.error || myTeams.error) {
      showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error");
    }
  }, [me.error, swimmers.error, myTeams.error, t]);

  const isTeamAdminOrOwner = me.data?.isTeamAdminOrOwner ?? false;
  const isTeamMember = (myTeams.data?.length ?? 0) > 0;
  const hasSwimmers = (swimmers.data?.length ?? 0) > 0;

  const isLoading = me.isLoading || swimmers.isLoading || myTeams.isLoading;

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">{t("swim.title", { defaultValue: "Swim" })}</h1>
      {isLoading && <div className="text-sm text-gray-500">{t("loading", { defaultValue: "Loading…" })}</div>}
      <ul className="space-y-2">
        {isTeamMember && (
          <li>
            <Link className="text-blue-600" href="/instructor">
              {t("swim.instructor", { defaultValue: "Instructor" })}
            </Link>
          </li>
        )}
        {isTeamAdminOrOwner && (
          <li>
            <Link className="text-blue-600" href="/manager">
              {t("swim.manager", { defaultValue: "Manager" })}
            </Link>
          </li>
        )}
        {
          // Always show Parent entry; the target page will handle empty state
        }
        <li>
          <Link className="text-blue-600" href="/parent">
            {t("swim.parent", { defaultValue: "Parent" })}
          </Link>
        </li>
      </ul>
    </main>
  );
}
