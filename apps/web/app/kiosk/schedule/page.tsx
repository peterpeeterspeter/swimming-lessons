"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { trpc } from "../../_trpc/trpc";

export default function KioskSchedulePage() {
  const router = useRouter();

  // Auto-refresh every 60 seconds
  const { data: lessons, refetch } = trpc.viewer.swim.kiosk.getTodayLessons.useQuery({});

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const now = new Date();

  // Group lessons by time status
  const upcomingLessons = lessons?.filter((l) => new Date(l.startTime) > now) || [];
  const currentLessons =
    lessons?.filter((l) => new Date(l.startTime) <= now && new Date(l.endTime) > now) || [];
  const completedLessons = lessons?.filter((l) => new Date(l.endTime) <= now) || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-5xl font-bold text-white">Today's Schedule</h1>
          <p className="text-2xl text-blue-100">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => router.push("/kiosk")}
          className="rounded-2xl bg-white px-8 py-4 text-2xl font-semibold text-blue-700 transition-colors hover:bg-blue-50">
          ← Back
        </button>
      </div>

      {/* Current Lessons (Highlighted) */}
      {currentLessons.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-3xl font-bold text-white">🏊 Happening Now</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {currentLessons.map((lesson) => (
              <div
                key={lesson.bookingId}
                className="animate-pulse rounded-2xl bg-gradient-to-r from-green-400 to-green-600 p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="mb-2 text-3xl font-bold text-white">{lesson.title}</h3>
                    <p className="text-xl text-green-100">
                      {new Date(lesson.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(lesson.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2">
                    <span className="text-2xl font-bold text-green-700">IN PROGRESS</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full bg-green-800 transition-all duration-500"
                      style={{
                        width: `${lesson.attendanceRate}%`,
                      }}
                    />
                  </div>
                  <span className="text-xl font-bold text-white">
                    {lesson.present}/{lesson.enrolled} ({lesson.attendanceRate}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Lessons */}
      {upcomingLessons.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-3xl font-bold text-white">⏰ Coming Up</h2>
          <div className="space-y-3">
            {upcomingLessons.map((lesson) => (
              <div
                key={lesson.bookingId}
                className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="min-w-[120px] text-center">
                    <div className="text-4xl font-bold text-blue-700">
                      {new Date(lesson.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.round((new Date(lesson.startTime).getTime() - now.getTime()) / 60000)} min
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-2xl font-bold text-gray-800">{lesson.title}</h3>
                    <p className="text-lg text-gray-600">
                      {new Date(lesson.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(lesson.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-800">
                    {lesson.present}/{lesson.enrolled}
                  </div>
                  <div className="text-sm text-gray-500">checked in</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Lessons */}
      {completedLessons.length > 0 && (
        <div className="opacity-75">
          <h2 className="mb-4 text-2xl font-bold text-white">✅ Completed</h2>
          <div className="space-y-2">
            {completedLessons.map((lesson) => (
              <div
                key={lesson.bookingId}
                className="flex items-center justify-between rounded-xl bg-white bg-opacity-60 p-4">
                <div className="flex items-center gap-4">
                  <div className="text-xl font-semibold text-gray-600">
                    {new Date(lesson.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700">{lesson.title}</h3>
                </div>
                <div className="text-lg text-gray-600">
                  {lesson.present}/{lesson.enrolled} attended
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Lessons */}
      {(!lessons || lessons.length === 0) && (
        <div className="rounded-3xl bg-white p-16 text-center shadow-2xl">
          <div className="mb-6 text-8xl">📅</div>
          <h2 className="mb-4 text-4xl font-bold text-gray-800">No Lessons Today</h2>
          <p className="text-2xl text-gray-600">Enjoy your day off!</p>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-4 right-4 rounded-lg bg-white bg-opacity-20 px-4 py-2 text-sm text-white">
        Auto-refreshes every 60 seconds
      </div>
    </main>
  );
}
