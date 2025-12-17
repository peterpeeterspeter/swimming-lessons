"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import { trpc } from "../../_trpc/trpc";

export default function KioskSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-return to landing page after 30 seconds of inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      const timer = setTimeout(() => {
        router.push("/kiosk");
      }, 30000); // 30 seconds
      setInactivityTimer(timer);
    };

    resetTimer();

    // Reset timer on any interaction
    const handleActivity = () => resetTimer();
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [inactivityTimer, router]);

  // Auto-focus search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search swimmers (debounced)
  const { data: swimmers, isLoading } = trpc.viewer.swim.kiosk.findSwimmer.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSwimmerSelect = (swimmerId: string) => {
    router.push(`/kiosk/confirm/${swimmerId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 p-8">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-4xl">
        <button onClick={() => router.push("/kiosk")} className="mb-6 text-2xl text-white hover:underline">
          ← Back
        </button>
        <h1 className="mb-4 text-5xl font-bold text-white">Find Your Name</h1>
        <p className="text-xl text-blue-100">Enter your phone number, email, or name</p>
      </div>

      {/* Search Input */}
      <div className="mx-auto mb-8 max-w-4xl">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by phone, email, or name..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-2xl border-4 border-blue-300 p-6 text-3xl shadow-2xl focus:border-white focus:outline-none"
          autoComplete="off"
        />
      </div>

      {/* Results */}
      <div className="mx-auto max-w-4xl">
        {isLoading && searchQuery.length >= 2 && (
          <div className="text-center text-2xl text-white">Searching...</div>
        )}

        {swimmers && swimmers.length === 0 && searchQuery.length >= 2 && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-2xl">
            <div className="mb-4 text-6xl">🤔</div>
            <h2 className="mb-2 text-3xl font-bold text-gray-800">No swimmers found</h2>
            <p className="text-xl text-gray-600">Try searching with a different phone number or name</p>
          </div>
        )}

        {swimmers && swimmers.length > 0 && (
          <div className="space-y-4">
            {swimmers.map((swimmer) => (
              <button
                key={swimmer.id}
                onClick={() => handleSwimmerSelect(swimmer.id)}
                className="hover:shadow-3xl hover:scale-102 w-full rounded-2xl bg-white p-8 text-left shadow-2xl transition-all duration-200">
                <div className="flex items-center gap-6">
                  {/* Swimmer Photo or Placeholder */}
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

                  {/* Swimmer Info */}
                  <div className="flex-1">
                    <h3 className="mb-2 text-3xl font-bold text-gray-800">
                      {swimmer.firstName} {swimmer.lastName}
                    </h3>
                    <p className="mb-3 text-lg text-gray-600">Parent: {swimmer.parentName}</p>

                    {/* Today's Lessons */}
                    <div className="space-y-2">
                      {swimmer.todayLessons.map((lesson) => (
                        <div
                          key={lesson.bookingId}
                          className="mr-2 inline-block rounded-lg bg-blue-100 px-4 py-2 text-lg font-medium text-blue-800">
                          {lesson.title} •{" "}
                          {new Date(lesson.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-4xl text-blue-600">→</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!searchQuery && (
          <div className="text-center text-2xl text-white opacity-75">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </main>
  );
}
