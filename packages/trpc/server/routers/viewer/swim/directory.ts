import { z } from "zod";

import publicProcedure from "../../../procedures/publicProcedure";
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

/* ----------------------------------------------------------------- */
/*  PUBLIC directory router (no auth)                                 */
/* ----------------------------------------------------------------- */
const submitLeadSchema = z.object({
  listingId: z.string().uuid(),
  parentName: z.string().min(2, "Name is required"),
  parentEmail: z.string().email("Valid email required"),
  parentPhone: z.string().optional(),
  childName: z.string().optional(),
  childAge: z.number().int().min(0).max(18).optional(),
  childLevel: z.string().optional(),
  message: z.string().max(2000).optional(),
  preferredTimes: z.string().optional(),
  source: z.string().optional(),
});

const searchListingsSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  level: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(12),
  offset: z.number().int().min(0).default(0),
});

const getBySlugSchema = z.object({
  slug: z.string(),
});

export const directoryRouter = router({
  /* List published listings with optional search */
  list: publicProcedure.input(searchListingsSchema).query(async ({ ctx, input }) => {
    const where: Record<string, unknown> = { isPublished: true };

    if (input.city) {
      where.city = { contains: input.city, mode: "insensitive" };
    }

    if (input.query) {
      where.OR = [
        { name: { contains: input.query, mode: "insensitive" } },
        { tagline: { contains: input.query, mode: "insensitive" } },
        { city: { contains: input.query, mode: "insensitive" } },
        { description: { contains: input.query, mode: "insensitive" } },
      ];
    }

    const [listings, total] = await Promise.all([
      ctx.prisma.directoryListing.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        take: input.limit,
        skip: input.offset,
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
      }),
      ctx.prisma.directoryListing.count({ where }),
    ]);

    return { listings, total };
  }),

  /* Get a single listing by slug (for detail page) */
  getBySlug: publicProcedure.input(getBySlugSchema).query(async ({ ctx, input }) => {
    const listing = await ctx.prisma.directoryListing.findUnique({
      where: { slug: input.slug, isPublished: true },
    });
    if (!listing) return null;

    // Get team info for trial lesson booking
    const team = await ctx.prisma.team.findUnique({
      where: { id: listing.teamId },
      select: {
        id: true,
        slug: true,
        name: true,
        eventTypes: {
          where: { slug: { contains: "trial" } },
          select: { id: true, title: true, slug: true, length: true },
          take: 3,
        },
      },
    });

    return { ...listing, team };
  }),

  /* Get featured listings (for directory homepage) */
  featured: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.directoryListing.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { name: "asc" },
      take: 6,
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
      },
    });
  }),

  /* Submit a lead (public, no auth) */
  submitLead: publicProcedure.input(submitLeadSchema).mutation(async ({ ctx, input }) => {
    const listing = await ctx.prisma.directoryListing.findUnique({
      where: { id: input.listingId },
      select: { teamId: true },
    });
    if (!listing) throw new Error("Listing not found");

    const lead = await ctx.prisma.lead.create({
      data: {
        teamId: listing.teamId,
        listingId: input.listingId,
        parentName: input.parentName,
        parentEmail: input.parentEmail,
        parentPhone: input.parentPhone,
        childName: input.childName,
        childAge: input.childAge,
        childLevel: input.childLevel,
        message: input.message,
        preferredTimes: input.preferredTimes ? JSON.parse(input.preferredTimes) : undefined,
        source: input.source || "directory",
        status: "NEW",
      },
    });

    return { id: lead.id, success: true };
  }),
});

/* ----------------------------------------------------------------- */
/*  MANAGER leads router (auth required, team-scoped)                 */
/* ----------------------------------------------------------------- */
const updateLeadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["NEW", "CONTACTED", "TRIAL_BOOKED", "ENROLLED", "LOST"]),
});

const getLeadsSchema = z.object({
  teamId: z.number().int(),
  status: z.enum(["NEW", "CONTACTED", "TRIAL_BOOKED", "ENROLLED", "LOST"]).optional(),
});

const getListingForTeamSchema = z.object({
  teamId: z.number().int(),
});

const upsertListingSchema = z.object({
  teamId: z.number().int(),
  name: z.string().min(2),
  slug: z.string().min(2),
  tagline: z.string().optional(),
  description: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  trialLessonUrl: z.string().optional(),
  isPublished: z.boolean().default(false),
  levelsOffered: z.string().optional(),
});

export const leadsRouter = router({
  /* Get all leads for a team */
  list: authedProcedure.input(getLeadsSchema).query(async ({ ctx, input }) => {
    return ctx.prisma.lead.findMany({
      where: { teamId: input.teamId, ...(input.status ? { status: input.status } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }),

  /* Get lead counts by status (for pipeline summary) */
  counts: authedProcedure.input(z.object({ teamId: z.number().int() })).query(async ({ ctx, input }) => {
    const leads = await ctx.prisma.lead.groupBy({
      by: ["status"],
      where: { teamId: input.teamId },
      _count: true,
    });
    return leads;
  }),

  /* Update lead status */
  updateStatus: authedProcedure.input(updateLeadStatusSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.lead.update({
      where: { id: input.id },
      data: { status: input.status },
    });
  }),

  /* Get directory listing for this team */
  getListing: authedProcedure.input(getListingForTeamSchema).query(async ({ ctx, input }) => {
    return ctx.prisma.directoryListing.findUnique({
      where: { teamId: input.teamId },
    });
  }),

  /* Create or update the team's directory listing */
  upsertListing: authedProcedure.input(upsertListingSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.directoryListing.findUnique({
      where: { teamId: input.teamId },
    });

    const data = {
      name: input.name,
      slug: input.slug,
      tagline: input.tagline || null,
      description: input.description || null,
      city: input.city || null,
      state: input.state || null,
      address: input.address || null,
      postalCode: input.postalCode || null,
      phone: input.phone || null,
      email: input.email || null,
      website: input.website || null,
      trialLessonUrl: input.trialLessonUrl || null,
      isPublished: input.isPublished,
      levelsOffered: input.levelsOffered ? JSON.parse(input.levelsOffered) : undefined,
    };

    if (existing) {
      return ctx.prisma.directoryListing.update({ where: { id: existing.id }, data });
    }
    return ctx.prisma.directoryListing.create({ data: { teamId: input.teamId, ...data } });
  }),
});
