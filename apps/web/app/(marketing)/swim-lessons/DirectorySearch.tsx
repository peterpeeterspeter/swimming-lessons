"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

export function DirectorySearch({
  states,
  currentQuery,
  currentState,
}: {
  states: string[];
  currentQuery: string;
  currentState: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(currentQuery);

  const updateSearch = useCallback(
    (q: string, state: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (state) params.set("state", state);
      params.set("page", "1");
      router.push(`/swim-lessons?${params.toString()}`);
    },
    [router]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch(query, currentState);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by school name or city..."
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>
      <select
        value={currentState}
        onChange={(e) => updateSearch(query, e.target.value)}
        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
      >
        <option value="">All states</option>
        {states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-12 rounded-xl bg-cyan-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 active:scale-[0.98]"
      >
        Search
      </button>
    </form>
  );
}
