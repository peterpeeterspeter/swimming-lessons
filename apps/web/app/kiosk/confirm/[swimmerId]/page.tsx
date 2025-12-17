"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

import { trpc } from "../../../_trpc/trpc";

export default function KioskConfirmPage() {
  const router = useRouter();
  const params = useParams();
  const swimmerId = params.swimmerId as string;

  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Get swimmer details
  const { data: swimmers } = trpc.viewer.swim.kiosk.findSwimmer.useQuery(
    { query: swimmerId },
    { enabled: !!swimmerId }
  );

  const swimmer = swimmers?.[0];

  // Check-in mutation
  const checkInMutation = trpc.viewer.swim.kiosk.checkIn.useMutation({
    onSuccess: () => {
      setIsCheckedIn(true);
      // Auto-return to landing after 5 seconds
      setTimeout(() => {
        router.push("/kiosk");
      }, 5000);
    },
  });

  const handleCheckIn = (bookingId: number) => {
    setSelectedLessonId(bookingId);
    checkInMutation.mutate({
      swimmerId,
      bookingId,
    });
  };

  if (!swimmer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
        <div className="text-3xl text-white">Loading...</div>
      </main>
    );
  }

  if (isCheckedIn) {
    const lesson = swimmer.todayLessons.find((l) => l.bookingId === selectedLessonId);

    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-500 to-green-700 p-8">
        <div className="shadow-3xl max-w-3xl rounded-3xl bg-white p-16 text-center">
          {/* Success Animation */}
          <div className="mb-8 animate-bounce text-9xl">✅</div>

          <h1 className="mb-6 text-5xl font-bold text-gray-800">You're Checked In!</h1>

          <div className="mb-4 text-3xl text-gray-700">
            {swimmer.firstName} {swimmer.lastName}
          </div>

          {lesson && (
            <div className="mb-8 rounded-2xl bg-green-100 p-6">
              <div className="mb-2 text-2xl font-semibold text-green-900">{lesson.title}</div>
              <div className="text-xl text-green-700">
                {new Date(lesson.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}

          <p className="mb-8 text-2xl text-gray-600">Have a great lesson! 🏊‍♂️</p>

          <div className="text-lg text-gray-500">Returning to home screen in 5 seconds...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 p-8">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-4xl">
        <button
          onClick={() => router.push("/kiosk/search")}
          className="mb-6 text-2xl text-white hover:underline">
          ← Back
        </button>
        <h1 className="mb-4 text-5xl font-bold text-white">Select Your Lesson</h1>
      </div>

      {/* Swimmer Card */}
      <div className="mx-auto mb-8 max-w-4xl">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-200 text-4xl font-bold text-blue-700">
              {swimmer.photo ? (
                <img
                  src={swimmer.photo}
                  alt={swimmer.firstName}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                swimmer.firstName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-800">
                {swimmer.firstName} {swimmer.lastName}
              </h2>
              <p className="text-xl text-gray-600">Parent: {swimmer.parentName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Lessons */}
      <div className="mx-auto max-w-4xl space-y-4">
        {swimmer.todayLessons.map((lesson) => (
          <button
            key={lesson.bookingId}
            onClick={() => handleCheckIn(lesson.bookingId)}
            disabled={checkInMutation.isLoading}
            className="hover:shadow-3xl hover:scale-102 w-full rounded-2xl bg-white p-8 shadow-2xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="mb-2 text-3xl font-bold text-gray-800">{lesson.title}</h3>
                <p className="text-2xl text-gray-600">
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
              <div className="text-5xl">
                {checkInMutation.isLoading && selectedLessonId === lesson.bookingId ? "⏳" : "✅"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {swimmer.todayLessons.length === 0 && (
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-12 text-center shadow-2xl">
          <div className="mb-4 text-6xl">📅</div>
          <h2 className="mb-2 text-3xl font-bold text-gray-800">No Lessons Today</h2>
          <p className="text-xl text-gray-600">You don't have any lessons scheduled for today.</p>
        </div>
      )}
    </main>
  );
}
