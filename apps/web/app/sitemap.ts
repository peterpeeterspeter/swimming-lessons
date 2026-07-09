import type { MetadataRoute } from "next";
import prisma from "@calcom/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || "https://swim-lessons.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/swim-lessons`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Dynamic school listing pages
  const listings = await prisma.directoryListing.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true, isFeatured: true },
  });

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${SITE_URL}/swim-lessons/${listing.slug}`,
    lastModified: listing.updatedAt,
    changeFrequency: listing.isFeatured ? "weekly" : "monthly",
    priority: listing.isFeatured ? 0.9 : 0.7,
  }));

  return [...staticPages, ...listingPages];
}
