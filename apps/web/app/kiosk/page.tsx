"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function KioskLandingPage() {
  const router = useRouter();

  // Auto-refresh page every 5 minutes to keep session fresh
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 p-8">
      {/* Welcome Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-6xl font-bold text-white">🏊 Welcome to Swim School</h1>
        <p className="text-2xl text-blue-100">Self Check-In Kiosk</p>
      </div>

      {/* Action Buttons */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        {/* Check In Button */}
        <button
          onClick={() => router.push("/kiosk/search")}
          className="hover:shadow-3xl group relative overflow-hidden rounded-3xl bg-white p-12 shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <div className="mb-6 text-8xl">✅</div>
            <h2 className="mb-2 text-4xl font-bold text-gray-800">Check In</h2>
            <p className="text-xl text-gray-600">I'm here for my lesson today</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
        </button>

        {/* View Schedule Button */}
        <button
          onClick={() => router.push("/kiosk/schedule")}
          className="hover:shadow-3xl group relative overflow-hidden rounded-3xl bg-white p-12 shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <div className="mb-6 text-8xl">📅</div>
            <h2 className="mb-2 text-4xl font-bold text-gray-800">View Schedule</h2>
            <p className="text-xl text-gray-600">See today's lessons</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
        </button>
      </div>

      {/* Footer Instructions */}
      <div className="mt-16 text-center text-xl text-white opacity-75">
        <p>Tap a button above to get started</p>
      </div>

      {/* Admin Link (small, corner) */}
      <a
        href="/manager"
        className="fixed bottom-4 right-4 text-sm text-white opacity-30 transition-opacity hover:opacity-100">
        Staff Login →
      </a>
    </main>
  );
}
