"use client";

import { useMemo, useEffect } from "react";
import { useParams } from "next/navigation";

import { trpc } from "../../../_trpc/trpc";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { showToast } from "@calcom/ui/components/toast";
import Link from "next/link";

export default function ParentSwimmerDetailsPage() {
  const params = useParams<{ id?: string }>();
  const swimmerId = params?.id as string | undefined;

  const swimmers = trpc.viewer.swim.swimmers.listMine.useQuery();
  const swimmer = useMemo(() => {
    return swimmers.data?.find(s => s.id === swimmerId);
  }, [swimmers.data, swimmerId]);

  const attendance = trpc.viewer.swim.attendance.listBySwimmer.useQuery(
    { swimmerId: swimmerId as string },
    { enabled: !!swimmerId }
  );
  const notes = trpc.viewer.swim.progressNotes.listMineBySwimmer.useQuery(
    { swimmerId: swimmerId as string },
    { enabled: !!swimmerId }
  );

  const sortedAttendance = useMemo(() => {
    return (attendance.data || []).slice().sort((a, b) => new Date(b.markedAt || b.createdAt).getTime() - new Date(a.markedAt || a.createdAt).getTime());
  }, [attendance.data]);

  const sortedNotes = useMemo(() => {
    return (notes.data || []).slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes.data]);

  const { t } = useLocale();

  useEffect(() => {
    if (attendance.error || notes.error) {
      showToast(`${t("something_went_wrong")} ${t("please_try_again")}`, "error");
    }
  }, [attendance.error, notes.error, t]);

  const isLoading = attendance.isLoading || notes.isLoading || swimmers.isLoading;

  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("swim.swimmer", { defaultValue: "Swimmer" })}</h1>
        {swimmer && (
          <Link
            href={`/parent/swimmer/${swimmerId}/edit`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="text-sm text-gray-500">{t("loading", { defaultValue: "Loading…" })}</div>
      )}

      {swimmer && (
        <section className="border rounded p-4 space-y-2 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold">{swimmer.firstName} {swimmer.lastName}</h2>
            {swimmer.currentLevel && (
              <p className="text-sm text-gray-600">Level: {swimmer.currentLevel}</p>
            )}
          </div>
          {swimmer.birthDate && (
            <p className="text-sm text-gray-600">
              Born: {new Date(swimmer.birthDate).toLocaleDateString()}
            </p>
          )}
          {swimmer.medicalNotes && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-gray-700">Medical Notes:</p>
              <p className="text-sm text-gray-600">{swimmer.medicalNotes}</p>
            </div>
          )}
          {swimmer.emergencyContacts && Array.isArray(swimmer.emergencyContacts) && (swimmer.emergencyContacts as any[]).length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-gray-700">Emergency Contacts:</p>
              {((swimmer.emergencyContacts as any[]) || []).map((contact: any, i: number) => (
                <div key={i} className="text-sm text-gray-600 mt-1">
                  {contact.name} ({contact.relationship}) - {contact.phone}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium mb-2">{t("swim.attendance", { defaultValue: "Attendance" })}</h2>
        <ul className="space-y-2">
          {sortedAttendance.map((r) => (
            <li key={r.id} className="border rounded p-2 text-sm">
              <div className="flex justify-between">
                <span>Status: {r.status}</span>
                <span>{new Date(r.markedAt || r.createdAt).toLocaleString()}</span>
              </div>
              {r.notes && <div className="text-gray-600 mt-1">{r.notes}</div>}
            </li>
          ))}
          {sortedAttendance.length === 0 && !isLoading && (
            <li className="text-sm text-gray-500">{t("swim.noAttendanceYet", { defaultValue: "No attendance yet." })}</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">{t("swim.progressNotes", { defaultValue: "Progress Notes" })}</h2>
        <ul className="space-y-2">
          {sortedNotes.map((n) => (
            <li key={n.id} className="border rounded p-2 text-sm">
              <div className="flex justify-between">
                <span>{n.note || "(no note)"}</span>
                <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
          {sortedNotes.length === 0 && !isLoading && (
            <li className="text-sm text-gray-500">{t("swim.noProgressNotesYet", { defaultValue: "No progress notes yet." })}</li>
          )}
        </ul>
      </section>
    </main>
  );
}
