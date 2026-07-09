import Link from "next/link";
import prisma from "@calcom/prisma";

import { Reveal } from "../components-client";
import { SectionHeading, SectionLead } from "../components-server";

const SITE_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || "https://swim-lessons.vercel.app";

export const metadata = {
  title: "Find Swim Schools — Swimming-Lessons.com Directory",
  description:
    "Browse swim schools near you. Compare programs, read about their approach, and send an inquiry or book a trial lesson directly.",
  alternates: { canonical: `${SITE_URL}/swim-lessons` },
  openGraph: {
    title: "Find Swim Schools — Swimming-Lessons.com Directory",
    description:
      "Browse swim schools near you. Compare programs, read about their approach, and send an inquiry or book a trial lesson directly.",
    url: `${SITE_URL}/swim-lessons`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Swim Schools — Swimming-Lessons.com Directory",
    description:
      "Browse swim schools near you. Compare programs, read about their approach, and send an inquiry or book a trial lesson directly.",
  },
};

export default async function DirectoryPage() {
  const listings = await prisma.directoryListing.findMany({
    where: { isPublished: true },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      city: true,
      state: true,
      logoUrl: true,
      coverPhotoUrl: true,
      levelsOffered: true,
      isFeatured: true,
    },
  });

  // Build JSON-LD ItemList for SEO
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Swim Schools Directory",
    itemListElement: listings.map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: listing.name,
      url: `${SITE_URL}/swim-lessons/${listing.slug}`,
      ...(listing.city && { description: `${listing.tagline || listing.name}${listing.state ? `, ${listing.state}` : ""}` }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Header */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-32 sm:px-6 lg:pb-16 lg:pt-40">
          <Reveal>
            <SectionHeading>Find a swim school</SectionHeading>
            <SectionLead>
              Browse schools using Lanebook. Read about their programs, send an inquiry,
              or book a trial lesson on the spot.
            </SectionLead>
          </Reveal>
        </div>
      </section>

      {/* Listings grid */}
      <section className="bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                No swim schools have published their listings yet.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Are you a swim school?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  Get listed free
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing, i) => (
                <Reveal key={listing.id} delay={i * 0.05}>
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
                    </div>
                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {listing.name}
                      </h3>
                      {listing.tagline && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
        </div>
      </section>
    </>
  );
}
