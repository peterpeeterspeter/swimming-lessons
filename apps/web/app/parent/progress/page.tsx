"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "../../_trpc/trpc";

export default function ParentProgressPage() {
  const router = useRouter();
  const [selectedSwimmerId, setSelectedSwimmerId] = useState<string | null>(null);

  // Get user's swimmers
  const { data: swimmers } = trpc.viewer.swim.swimmers.listMine.useQuery();

  // Get progress for selected swimmer
  const { data: progressData } = trpc.viewer.swim.skills.getSwimmerProgress.useQuery(
    { swimmerId: selectedSwimmerId! },
    { enabled: !!selectedSwimmerId }
  );

  const progress = progressData?.progress || [];
  const certificates = progressData?.certificates || [];

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Skill Progress</h1>
        <button onClick={() => router.push("/parent")} className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </button>
      </div>

      {/* Swimmer Selector */}
      <div className="mb-6 rounded-lg border bg-white p-6">
        <label className="mb-2 block text-sm font-medium">Select Swimmer</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={selectedSwimmerId || ""}
          onChange={(e) => setSelectedSwimmerId(e.target.value || null)}>
          <option value="">-- Select a swimmer --</option>
          {swimmers?.map((swimmer) => (
            <option key={swimmer.id} value={swimmer.id}>
              {swimmer.firstName} {swimmer.lastName}
            </option>
          ))}
        </select>
      </div>

      {selectedSwimmerId && progressData && (
        <>
          {/* Certificates Section */}
          {certificates.length > 0 && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <span className="text-2xl">🏆</span>
                Certificates Earned
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {certificates.map((cert) => (
                  <div key={cert.id} className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold">{cert.skillLevel.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="text-3xl">🎖️</span>
                    </div>
                    <div className="mb-2 text-xs text-gray-500">Certificate #{cert.certificateNumber}</div>
                    {cert.pdfUrl ? (
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline">
                        📄 Download Certificate
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">Certificate pending generation</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Level Progress */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Skill Level Progress</h2>

            {progress.map((levelProgress) => {
              const level = levelProgress.level;
              const skills = level.skills as string[];
              const achievedSkillNames = levelProgress.achievements.map((a: any) => a.skillName);

              return (
                <div
                  key={level.id}
                  className="rounded-lg border bg-white p-6"
                  style={level.color ? { borderLeftWidth: "4px", borderLeftColor: level.color } : {}}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{level.name}</h3>
                      {level.description && <p className="mt-1 text-sm text-gray-600">{level.description}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: level.color || "#3b82f6" }}>
                        {levelProgress.completionPercentage}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {levelProgress.achievedSkills} / {levelProgress.totalSkills} skills
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${levelProgress.completionPercentage}%`,
                          backgroundColor: level.color || "#3b82f6",
                        }}
                      />
                    </div>
                  </div>

                  {/* Skills List */}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {skills.map((skill) => {
                      const isAchieved = achievedSkillNames.includes(skill);
                      const achievement = levelProgress.achievements.find((a: any) => a.skillName === skill);

                      return (
                        <div
                          key={skill}
                          className={`flex items-center gap-2 rounded p-2 ${
                            isAchieved ? "bg-green-50" : "bg-gray-50"
                          }`}>
                          <span className="text-xl">{isAchieved ? "✅" : "⭕"}</span>
                          <div className="flex-1">
                            <div className={`text-sm ${isAchieved ? "font-medium" : ""}`}>{skill}</div>
                            {achievement && (
                              <div className="text-xs text-gray-500">
                                {new Date(achievement.achievedAt).toLocaleDateString()}
                                {achievement.markedBy && ` • by ${achievement.markedBy.name}`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Certificate Badge */}
                  {levelProgress.certificate && (
                    <div className="mt-4 flex items-center gap-3 rounded border border-yellow-200 bg-yellow-50 p-3">
                      <span className="text-2xl">🎖️</span>
                      <div className="flex-1">
                        <div className="font-semibold">Level Complete!</div>
                        <div className="text-sm text-gray-600">
                          Certificate earned on{" "}
                          {new Date(levelProgress.certificate.issuedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {progress.length === 0 && (
              <div className="rounded-lg border bg-white p-12 text-center">
                <div className="mb-4 text-6xl">📚</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-800">No Skill Levels Yet</h3>
                <p className="text-gray-600">
                  Your instructor will set up skill levels for tracking progress.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* No Swimmer Selected */}
      {!selectedSwimmerId && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <div className="mb-4 text-6xl">👆</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Select a Swimmer</h2>
          <p className="text-gray-600">Choose a swimmer above to view their skill progress.</p>
        </div>
      )}
    </main>
  );
}
