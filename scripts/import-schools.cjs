#!/usr/bin/env node
/**
 * Import swim schools from CSV into DirectoryListing table.
 * Usage: node scripts/import-schools.cjs
 */
const { readFileSync } = require("fs");
const { parse } = require("csv-parse/sync");
const { PrismaClient } = require("../packages/prisma/generated/prisma");

const CSV_PATH =
  process.argv[2] ||
  "/home/hermes/.hermes/cache/documents/doc_3d1183222d18_final_swim_schools_complete (2).csv";
const BATCH_SIZE = 50;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is required");
  process.exit(1);
}

function slugify(name, city) {
  const base = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const cityPart = (city || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return cityPart ? `${base}-${cityPart}` : base;
}

function cleanUrl(url) {
  if (!url) return null;
  const u = url.trim();
  if (!u || u === "null" || u === "None") return null;
  return u;
}

function cleanPhone(phone) {
  if (!phone) return null;
  const p = phone.trim();
  if (!p || p === "null" || p === "None") return null;
  return p;
}

function cleanEmail(email) {
  if (!email) return null;
  const e = email.trim();
  if (!e || e === "null" || e === "None" || !e.includes("@")) return null;
  return e;
}

async function main() {
  const csvContent = readFileSync(CSV_PATH, "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    quote: '"',
    escape: '"',
  });

  console.log(`Parsed ${records.length} records from CSV`);

  const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
  });

  // Delete old external listings (no teamId)
  const deleted = await prisma.directoryListing.deleteMany({
    where: { teamId: null },
  });
  console.log(`Deleted ${deleted.count} old external listings`);

  // Track slugs to handle duplicates
  const usedSlugs = new Set();
  let imported = 0;
  let skipped = 0;
  let batch = [];

  for (const row of records) {
    const name = (row.name || "").trim();
    if (!name) {
      skipped++;
      continue;
    }

    const city = (row.city || "").trim();
    const state = (row.state || "").trim();

    // Generate unique slug
    let slug = slugify(name, city);
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${slugify(name, city)}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    const rating = row.google_rating ? parseFloat(row.google_rating) : null;
    const reviewCount = row.google_reviews_count
      ? parseInt(row.google_reviews_count, 10)
      : null;
    const lat = row.latitude ? parseFloat(row.latitude) : null;
    const lng = row.longitude ? parseFloat(row.longitude) : null;
    const googlePlaceId = (row.google_place_id || "").trim() || null;

    const listing = {
      slug,
      name,
      tagline: null,
      description: (row.description || "").trim() || null,
      city: city || null,
      state: state || null,
      address: (row.address || "").trim() || null,
      postalCode: (row.zip || "").trim() || null,
      phone: cleanPhone(row.phone),
      email: cleanEmail(row.email),
      website: cleanUrl(row.website),
      rating: rating && !isNaN(rating) ? rating : null,
      reviewCount: reviewCount && !isNaN(reviewCount) ? reviewCount : null,
      latitude: lat && !isNaN(lat) ? lat : null,
      longitude: lng && !isNaN(lng) ? lng : null,
      googlePlaceId,
      isPublished: true,
      isFeatured: false,
    };

    batch.push(listing);

    if (batch.length >= BATCH_SIZE) {
      const result = await prisma.directoryListing.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += result.count;
      console.log(`Imported ${imported}/${records.length}...`);
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    const result = await prisma.directoryListing.createMany({
      data: batch,
      skipDuplicates: true,
    });
    imported += result.count;
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
