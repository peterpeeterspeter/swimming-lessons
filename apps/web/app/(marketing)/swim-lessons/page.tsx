import Link from "next/link";
import prisma from "@calcom/prisma";

import { Reveal } from "../components-client";
import { SectionHeading, SectionLead } from "../components-server";
import { DirectorySearch } from "./DirectorySearch";

const SITE_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || "https://swim-lessons.vercel.app";

export const metadata = {
  title: "Find Swim Schools Near You — 1,000+ Schools Directory",
  description:
    "Browse 1,000+ swim schools across the US. Search by city or state, compare ratings, read about their programs, and send an inquiry or book a trial lesson.",
  alternates: { canonical: `${SITE_URL}/swim-lessons` },
  openGraph: {
    title: "Find Swim Schools Near You — 1,000+ Schools Directory",
    description:
      "Browse 1,000+ swim schools across the US. Search by city or state, compare ratings, read about their programs, and send an inquiry or book a trial lesson.",
    url: `${SITE_URL}/swim-lessons`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Swim Schools Near You — 1,000+ Schools Directory",
    description:
      "Browse 1,000+ swim schools across the US. Search by city or state, compare ratings, and send an inquiry.",
  },
};

const PER_PAGE = 24;

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const stateFilter = params.state?.trim() || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const where = {
    isPublished: true,
    ...(stateFilter && { state: { equals: stateFilter, mode: "insensitive" as const } }),
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { city: { contains: query, mode: "insensitive" as const } },
        { tagline: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };

  const [listings, total, states] = await Promise.all([
    prisma.directoryListing.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }, { name: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        city: true,
        state: true,
        coverPhotoUrl: true,
        levelsOffered: true,
        isFeatured: true,
        rating: true,
        reviewCount: true,
      },
    }),
    prisma.directoryListing.count({ where }),
    prisma.directoryListing.findMany({
      where: { isPublished: true, state: { not: null } },
      select: { state: true },
      distinct: ["state"],
      orderBy: { state: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const stateList = states.map((s) => s.state).filter(Boolean);

  return (
    <>
      {/* Header */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-32 sm:px-6 lg:pb-12 lg:pt-40">
          <Reveal>
            <SectionHeading>Find a swim school</SectionHeading>
            <SectionLead>
              Browse {total.toLocaleString()} swim schools across the US. Read about their programs,
              compare ratings, and send an inquiry.
            </SectionLead>
          </Reveal>
          {/* Search + filter */}
          <div className="mt-8">
            <DirectorySearch
              states={stateList}
              currentQuery={query}
              currentState={stateFilter}
            />
          </div>
        </div>
      </section>

      {/* Listings grid */}
      <section className="bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Showing {listings.length} of {total.toLocaleString()} schools
            {query && ` for "${query}"`}
            {stateFilter && ` in ${stateFilter}`}
          </p>
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                No swim schools found. Try a different search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing, i) => (
                <Reveal key={listing.id} delay={Math.min(i * 0.03, 0.3)}>
                  <Link
                    href={`/swim-lessons/${listing.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Cover image or gradient */}
                    <div className="relative h-40 overflow-hidden">
                      {listing.coverPhotoUrl ? (
                        <Image
                          src={listing.coverPhotoUrl}
                          alt={listing.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-700">
                          <span className="text-3xl font-semibold text-white/90">
                            {listing.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      {listing.isFeatured && (
                        <span className="absolute right-3 top-3 rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                          Featured
                        </span>
                      )}
                      {listing.rating && (
                        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {Number(listing.rating).toFixed(1)}
                          {listing.reviewCount && (
                            <span className="font-normal text-white/70">({listing.reviewCount})</span>
                          )}
                        </span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {listing.name}
                      </h3>
                      {listing.tagline && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                          {listing.tagline}
                        </p>
                      )}
                      {listing.city && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-slate-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M12 21s-7-6.5-7-12a7 7 0 1114 0c0 5.5-7 12-7 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          {listing.city}
                          {listing.state ? `, ${listing.state}` : ""}
                        </p>
                      )}
                      <div className="mt-auto pt-4">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 group-hover:gap-2 dark:text-cyan-400">
                          View school
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/swim-lessons?${new URLSearchParams({ ...(query && { q: query }), ...(stateFilter && { state: stateFilter }), page: String(page - 1) }).toString()}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/swim-lessons?${new URLSearchParams({ ...(query && { q: query }), ...(stateFilter && { state: stateFilter }), page: String(page + 1) }).toString()}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
