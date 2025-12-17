"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../../../_trpc/trpc";

export default function InstructorSkillsPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = Number(params?.id ?? 0);

  const [selectedSwimmerId, setSelectedSwimmerId] = useState<string | null>(null);

  const utils = trpc.useContext();

  // Get booking details
  const { data: booking } = trpc.viewer.bookings.get.useQuery({ id: bookingId }, { enabled: bookingId > 0 });

  // Get skill tree for team
  const { data: skillTree } = trpc.viewer.swim.skills.getSkillTree.useQuery(
    { teamId: booking?.eventType?.teamId! },
    { enabled: !!booking?.eventType?.teamId }
  );

  // Get swimmers in this lesson
  const { data: attendance } = trpc.viewer.swim.attendance.list.useQuery({
    bookingId,
  });

  // Get progress for selected swimmer
  const { data: progressData } = trpc.viewer.swim.skills.getSwimmerProgress.useQuery(
    { swimmerId: selectedSwimmerId! },
    { enabled: !!selectedSwimmerId }
  );

  // Record achievement mutation
  const recordMutation = trpc.viewer.swim.skills.recordAchievement.useMutation({
    onSuccess: (data) => {
      showToast(
        data.levelComplete
          ? "Skill recorded! Level complete - certificate generated!"
          : "Skill recorded successfully",
        "success"
      );
      utils.viewer.swim.skills.getSwimmerProgress.invalidate();
    },
    onError: (error) => {
      showToast(error.message || "Failed to record skill", "error");
    },
  });

  const handleRecordSkill = (skillLevelId: string, skillName: string) => {
    if (!selectedSwimmerId) return;

    recordMutation.mutate({
      swimmerId: selectedSwimmerId,
      skillLevelId,
      skillName,
    });
  };

  const progress = progressData?.progress || [];

  const selectedSwimmer = attendance?.find((a) => a.swimmer.id === selectedSwimmerId)?.swimmer;

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Record Skills</h1>
        <button
          onClick={() => router.push(`/instructor/booking/${bookingId}`)}
          className="text-sm text-blue-600 hover:underline">
          ← Back to Attendance
        </button>
      </div>

      {/* Swimmer Selector */}
      <div className="mb-6 rounded-lg border bg-white p-4">
        <label className="mb-2 block text-sm font-medium">Select Swimmer</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={selectedSwimmerId || ""}
          onChange={(e) => setSelectedSwimmerId(e.target.value || null)}>
          <option value="">-- Select a swimmer --</option>
          {attendance?.map((record) => (
            <option key={record.swimmer.id} value={record.swimmer.id}>
              {record.swimmer.firstName} {record.swimmer.lastName}
            </option>
          ))}
        </select>
      </div>

      {selectedSwimmerId && selectedSwimmer && (
        <>
          {/* Swimmer Header */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedSwimmer.firstName} {selectedSwimmer.lastName}
                </h2>
                {selectedSwimmer.currentLevel && (
                  <div className="text-sm text-gray-600">Current Level: {selectedSwimmer.currentLevel}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Progress</div>
                <div className="text-2xl font-bold text-blue-700">
                  {progress.length > 0
                    ? Math.round(
                        progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>

          {/* Skill Levels */}
          <div className="space-y-4">
            {progress.map((levelProgress) => {
              const level = levelProgress.level;
              const skills = level.skills as string[];
              const achievedSkillNames = levelProgress.achievements.map((a: any) => a.skillName);

              return (
                <div
                  key={level.id}
                  className="rounded-lg border bg-white p-4"
                  style={level.color ? { borderLeftWidth: "4px", borderLeftColor: level.color } : {}}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{level.name}</h3>
                      {level.description && <p className="text-sm text-gray-600">{level.description}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{ color: level.color || "#3b82f6" }}>
                        {levelProgress.completionPercentage}%
                      </div>
                      {levelProgress.certificate && (
                        <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                          🎖️ Certified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {skills.map((skill) => {
                      const isAchieved = achievedSkillNames.includes(skill);

                      return (
                        <button
                          key={skill}
                          onClick={() => !isAchieved && handleRecordSkill(level.id, skill)}
                          disabled={isAchieved || recordMutation.isLoading}
                          className={`flex items-center gap-2 rounded border p-3 text-left transition-all ${
                            isAchieved
                              ? "cursor-default border-green-300 bg-green-50"
                              : "cursor-pointer border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50"
                          } ${recordMutation.isLoading ? "opacity-50" : ""}`}>
                          <span className="text-2xl">{isAchieved ? "✅" : "⭕"}</span>
                          <div className="flex-1">
                            <div
                              className={`text-sm ${
                                isAchieved ? "font-medium text-gray-600 line-through" : ""
                              }`}>
                              {skill}
                            </div>
                            {isAchieved && (
                              <div className="text-xs text-gray-500">
                                Achieved{" "}
                                {new Date(
                                  levelProgress.achievements.find((a: any) => a.skillName === skill)
                                    ?.achievedAt || ""
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {progress.length === 0 && (
              <div className="rounded-lg border bg-white p-12 text-center">
                <div className="mb-4 text-5xl">📚</div>
                <h3 className="mb-2 text-lg font-semibold">No Skill Levels Set Up</h3>
                <p className="text-gray-600">Your manager needs to create skill levels for this team.</p>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedSwimmerId && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <div className="mb-4 text-6xl">👆</div>
          <h3 className="mb-2 text-xl font-semibold">Select a Swimmer</h3>
          <p className="text-gray-600">Choose a swimmer above to record their skill achievements.</p>
        </div>
      )}
    </main>
  );
}
