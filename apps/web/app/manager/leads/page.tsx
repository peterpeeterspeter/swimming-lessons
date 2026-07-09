"use client";

import { useState } from "react";
import Link from "next/link";

import { trpc } from "../../_trpc/trpc";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";

type LeadStatus = "NEW" | "CONTACTED" | "TRIAL_BOOKED" | "ENROLLED" | "LOST";

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: "NEW", label: "New", color: "bg-cyan-500" },
  { status: "CONTACTED", label: "Contacted", color: "bg-blue-500" },
  { status: "TRIAL_BOOKED", label: "Trial booked", color: "bg-amber-500" },
  { status: "ENROLLED", label: "Enrolled", color: "bg-emerald-500" },
  { status: "LOST", label: "Lost", color: "bg-slate-400" },
];

export default function ManagerLeadsPage() {
  const { t } = useLocale();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Get user's teams
  const teams = trpc.viewer.teams.list.useQuery({ includeOrgs: false });
  const me = trpc.viewer.me.get.useQuery();

  // Auto-select first team
  if (teams.data && teams.data.length > 0 && !selectedTeamId) {
    setSelectedTeamId(teams.data[0].id);
  }

  const leads = trpc.viewer.swim.leads.list.useQuery(
    { teamId: selectedTeamId || 0 },
    { enabled: !!selectedTeamId }
  );

  const counts = trpc.viewer.swim.leads.counts.useQuery(
    { teamId: selectedTeamId || 0 },
    { enabled: !!selectedTeamId }
  );

  const updateStatus = trpc.viewer.swim.leads.updateStatus.useMutation({
    onSuccess: () => {
      leads.refetch();
      counts.refetch();
      showToast("Lead updated", "success");
    },
    onError: () => showToast("Failed to update lead", "error"),
  });

  if (me.isLoading || teams.isLoading) {
    return (
      <main className="mx-auto max-w-7xl p-4">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  if (!me.data) {
    return (
      <main className="mx-auto max-w-7xl p-4">
        <p>Please sign in to view leads.</p>
      </main>
    );
  }

  if (!teams.data || teams.data.length === 0) {
    return (
      <main className="mx-auto max-w-7xl p-4">
        <p>You need to be part of a team to view leads.</p>
      </main>
    );
  }

  const allLeads = leads.data || [];
  const countMap = new Map<LeadStatus, number>(
    (counts.data || []).map((c) => [c.status as LeadStatus, c._count])
  );

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Leads
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inquiries from your Swimming-Lessons.com directory listing.
          </p>
        </div>
        {/* Team selector */}
        {teams.data.length > 1 && (
          <select
            value={selectedTeamId || ""}
            onChange={(e) => setSelectedTeamId(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {teams.data.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${col.color}`} />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {col.label}
              </span>
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {countMap.get(col.status) || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Kanban pipeline */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const colLeads = allLeads.filter((l) => l.status === col.status);
          return (
            <div
              key={col.status}
              className="flex flex-col rounded-xl bg-slate-50 dark:bg-slate-900/50"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {col.label}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{colLeads.length}</span>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {colLeads.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-slate-400">No leads</p>
                ) : (
                  colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onStatusChange={(status) =>
                        updateStatus.mutate({ id: lead.id, status })
                      }
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Directory listing link */}
      <div className="mt-8 rounded-xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-900 dark:bg-cyan-950/30">
        <h3 className="text-sm font-semibold text-cyan-900 dark:text-cyan-300">
          Want more leads?
        </h3>
        <p className="mt-1 text-sm text-cyan-700 dark:text-cyan-400">
          Your directory listing on Swimming-Lessons.com is how parents find you.
          Make sure it's published and up to date.
        </p>
        <Link
          href="/manager/directory"
          className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          Manage listing
        </Link>
      </div>
    </main>
  );
}

function LeadCard({
  lead,
  onStatusChange,
}: {
  lead: {
    id: string;
    parentName: string;
    parentEmail: string;
    parentPhone: string | null;
    childName: string | null;
    childAge: number | null;
    childLevel: string | null;
    message: string | null;
    createdAt: Date;
  };
  onStatusChange: (status: LeadStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(d).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "just now";
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  };

  return (
    <div
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="font-medium text-slate-900 dark:text-white">{lead.parentName}</div>
      <div className="text-xs text-slate-400">{formatDate(lead.createdAt)}</div>
      {lead.childName && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Child: {lead.childName}
          {lead.childAge ? ` (${lead.childAge}y)` : ""}
        </div>
      )}
      {expanded && (
        <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ✉️ {lead.parentEmail}
          </div>
          {lead.parentPhone && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              📞 {lead.parentPhone}
            </div>
          )}
          {lead.childLevel && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Level: {lead.childLevel}
            </div>
          )}
          {lead.message && (
            <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
              "{lead.message}"
            </p>
          )}
          {/* Quick status actions */}
          <div className="mt-2 flex flex-wrap gap-1">
            {(["NEW", "CONTACTED", "TRIAL_BOOKED", "ENROLLED", "LOST"] as LeadStatus[]).map((s) => (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(s);
                }}
                className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {s === "TRIAL_BOOKED" ? "Trial" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
