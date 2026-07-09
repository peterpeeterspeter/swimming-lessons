import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import prisma from "@calcom/prisma";

import { LeadForm } from "../LeadForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await prisma.directoryListing.findUnique({
    where: { slug, isPublished: true },
    select: { name: true, tagline: true, city: true },
  });
  if (!listing) return { title: "Swim school not found" };
  return {
    title: `${listing.name} — Swim School${listing.city ? ` in ${listing.city}` : ""}`,
    description: listing.tagline || `Learn more about ${listing.name} and book a trial lesson.`,
  };
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const listing = await prisma.directoryListing.findUnique({
    where: { slug, isPublished: true },
  });

  if (!listing) notFound();

  // Find trial lesson event types for this team
  const trialEvents = await prisma.eventType.findMany({
    where: {
      teamId: listing.teamId,
      OR: [
        { slug: { contains: "trial", mode: "insensitive" } },
        { title: { contains: "trial", mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, slug: true, length: true },
    take: 3,
  });

  const team = await prisma.team.findUnique({
    where: { id: listing.teamId },
    select: { slug: true },
  });

  return (
    <>
      {/* Cover photo */}
      <div className="relative h-64 overflow-hidden sm:h-80">
        {listing.coverPhotoUrl ? (
          <Image
            src={listing.coverPhotoUrl}
            alt={listing.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-600 to-cyan-900">
            <span className="text-5xl font-semibold text-white/80">{listing.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title section overlapping cover */}
        <div className="-mt-16 relative z-10">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {listing.logoUrl ? (
                <Image
                  src={listing.logoUrl}
                  alt={listing.name}
                  width={56}
                  height={56}
                  className="rounded-xl"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-100 text-xl font-semibold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                  {listing.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {listing.name}
                </h1>
                {listing.tagline && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{listing.tagline}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {trialEvents.length > 0 && (
                <Link
                  href={`/${team?.slug || ""}`}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-cyan-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 active:scale-[0.98]"
                >
                  Book a trial lesson
                </Link>
              )}
              <a
                href="#inquire"
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-6 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 dark:border-slate-700 dark:text-slate-100"
              >
                Send inquiry
              </a>
            </div>
          </div>
        </div>

        {/* Main content: description + sidebar */}
        <div className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-3">
          {/* Left: description, levels, facilities */}
          <div className="lg:col-span-2">
            {listing.description && (
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">About</h2>
                <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Levels offered */}
            {listing.levelsOffered && Array.isArray(listing.levelsOffered) && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Levels offered</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(listing.levelsOffered as string[]).map((level) => (
                    <span
                      key={level}
                      className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-sm font-medium text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trial lessons */}
            {trialEvents.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Trial lessons</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Book a single trial lesson to see if this school is the right fit.
                </p>
                <div className="mt-4 space-y-3">
                  {trialEvents.map((evt) => (
                    <Link
                      key={evt.id}
                      href={`/${team?.slug || ""}/${evt.slug || ""}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{evt.title}</div>
                        <div className="text-sm text-slate-400">
                          {evt.length ? `${evt.length} min` : "Flexible length"}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                        Book now →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: contact info + lead form */}
          <div className="lg:col-span-1">
            {/* Contact info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Location</h3>
              {listing.address && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{listing.address}</p>
              )}
              {listing.city && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {listing.city}
                  {listing.state ? `, ${listing.state}` : ""}
                  {listing.postalCode ? ` ${listing.postalCode}` : ""}
                </p>
              )}
              {(listing.phone || listing.email || listing.website) && (
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  {listing.phone && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">📞 {listing.phone}</p>
                  )}
                  {listing.email && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">✉️ {listing.email}</p>
                  )}
                  {listing.website && (
                    <a
                      href={listing.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400"
                    >
                      Visit website →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Lead form */}
            <div id="inquire" className="mt-6 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Send an inquiry
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tell {listing.name} about your child and they will contact you.
              </p>
              <div className="mt-4">
                <LeadForm listingId={listing.id} schoolName={listing.name} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to directory */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/swim-lessons"
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to directory
          </Link>
        </div>
      </div>
    </>
  );
}
