import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const markSchema = z.object({
  bookingId: z.number().int(),
  swimmerId: z.string().uuid(),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]),
  notes: z.string().optional(),
});

const markManySchema = z.object({
  bookingId: z.number().int(),
  marks: z
    .array(
      z.object({
        swimmerId: z.string().uuid(),
        status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]),
        notes: z.string().optional(),
      })
    )
    .min(1),
});

const noteSchema = z.object({
  bookingId: z.number().int(),
  swimmerId: z.string().uuid(),
  note: z.string().optional(),
  skills: z.any().optional(),
  visibleToParent: z.boolean().optional(),
});

const instructorRouter = router({
  listBookings: authedProcedure
    .input(
      z
        .object({ start: z.string().datetime().optional(), end: z.string().datetime().optional() })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const start = input?.start ? new Date(input.start) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = input?.end ? new Date(input.end) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const bookings = await ctx.prisma.booking.findMany({
        where: {
          startTime: { gte: start },
          endTime: { lte: end },
          OR: [
            // Team membership path
            {
              eventType: {
                team: {
                  members: { some: { userId: ctx.user?.id } },
                },
              },
            },
            // Fallback to own bookings
            { userId: ctx.user?.id },
          ],
        },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          eventTypeId: true,
          eventType: { select: { title: true } },
        },
      });

      if (bookings.length === 0) return [] as Array<{ id: number; startTime: Date; endTime: Date; title: string; totalEnrolled: number; markedPresent: number; markedCount: number }>;

      const eventTypeIds = Array.from(new Set(bookings.map((b) => b.eventTypeId!).filter(Boolean)));
      const bookingIds = bookings.map((b) => b.id);

      const [enrollmentAgg, attendanceAgg] = await Promise.all([
        ctx.prisma.enrollment.groupBy({
          by: ["eventTypeId"],
          _count: { eventTypeId: true },
          where: { eventTypeId: { in: eventTypeIds }, status: "ACTIVE" },
        }),
        ctx.prisma.attendanceRecord.groupBy({
          by: ["bookingId", "status"],
          _count: { bookingId: true },
          where: { bookingId: { in: bookingIds } },
        }),
      ]);

      const enrolledMap = new Map<number, number>();
      for (const row of enrollmentAgg) enrolledMap.set(row.eventTypeId, row._count.eventTypeId);

      const presentMap = new Map<number, number>();
      const markedMap = new Map<number, number>();
      for (const row of attendanceAgg) {
        const prevMarked = markedMap.get(row.bookingId) ?? 0;
        markedMap.set(row.bookingId, prevMarked + row._count.bookingId);
        if (row.status === "PRESENT") {
          const prev = presentMap.get(row.bookingId) ?? 0;
          presentMap.set(row.bookingId, prev + row._count.bookingId);
        }
      }

      return bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        title: b.title || b.eventType?.title || "Lesson",
        totalEnrolled: enrolledMap.get(b.eventTypeId!) ?? 0,
        markedPresent: presentMap.get(b.id) ?? 0,
        markedCount: markedMap.get(b.id) ?? 0,
      }));
    }),

  // Fallback: list any recent or upcoming bookings the user can access
  listAny: authedProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          startTime: { gte: from },
          endTime: { lte: to },
          OR: [
            { eventType: { team: { members: { some: { userId: ctx.user?.id } } } } },
            { userId: ctx.user?.id },
          ],
        },
        orderBy: { startTime: "asc" },
        select: { id: true, title: true, startTime: true, endTime: true, eventTypeId: true, eventType: { select: { title: true } } },
        take: 5,
      });

      const eventTypeIds = Array.from(new Set(bookings.map((b) => b.eventTypeId!).filter(Boolean)));
      const bookingIds = bookings.map((b) => b.id);

      const [enrollmentAgg, attendanceAgg] = await Promise.all([
        ctx.prisma.enrollment.groupBy({ by: ["eventTypeId"], _count: { eventTypeId: true }, where: { eventTypeId: { in: eventTypeIds }, status: "ACTIVE" } }),
        ctx.prisma.attendanceRecord.groupBy({ by: ["bookingId", "status"], _count: { bookingId: true }, where: { bookingId: { in: bookingIds } } }),
      ]);

      const enrolledMap = new Map<number, number>();
      for (const row of enrollmentAgg) enrolledMap.set(row.eventTypeId, row._count.eventTypeId);

      const presentMap = new Map<number, number>();
      const markedMap = new Map<number, number>();
      for (const row of attendanceAgg) {
        const prevMarked = markedMap.get(row.bookingId) ?? 0;
        markedMap.set(row.bookingId, prevMarked + row._count.bookingId);
        if (row.status === "PRESENT") {
          const prev = presentMap.get(row.bookingId) ?? 0;
          presentMap.set(row.bookingId, prev + row._count.bookingId);
        }
      }

      return bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        title: b.title || b.eventType?.title || "Lesson",
        eventTypeId: b.eventTypeId!,
        totalEnrolled: enrolledMap.get(b.eventTypeId!) ?? 0,
        markedPresent: presentMap.get(b.id) ?? 0,
        markedCount: markedMap.get(b.id) ?? 0,
      }));
    }),

  getRoster: authedProcedure.input(z.object({ bookingId: z.number().int() })).query(async ({ ctx, input }) => {
    // Verify membership on team owning the booking's event type
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { id: true, eventTypeId: true, eventType: { select: { teamId: true, title: true } }, startTime: true, endTime: true },
    });
    const teamId = booking?.eventType?.teamId ?? null;
    if (!teamId) return { booking: null, swimmers: [] };

    const isMember = await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } });
    if (!isMember) return { booking: null, swimmers: [] };

    const [enrollments, attendance] = await Promise.all([
      ctx.prisma.enrollment.findMany({
        where: { eventTypeId: booking!.eventTypeId!, status: "ACTIVE" },
        select: { id: true, swimmer: true, swimmerId: true },
        orderBy: { createdAt: "asc" },
      }),
      ctx.prisma.attendanceRecord.findMany({ where: { bookingId: input.bookingId } }),
    ]);

    const attendanceMap = new Map(attendance.map((a) => [`${a.swimmerId}`, a] as const));

    return {
      booking: {
        id: booking!.id,
        title: booking!.eventType?.title ?? "",
        startTime: booking!.startTime,
        endTime: booking!.endTime,
      },
      swimmers: enrollments.map((e) => ({
        swimmer: e.swimmer,
        enrollmentId: e.id,
        attendance: attendanceMap.get(e.swimmerId) ?? null,
      })),
    };
  }),

  quickMark: authedProcedure.input(markSchema).mutation(async ({ ctx, input }) => {
    // Team membership check
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { eventType: { select: { teamId: true } } },
    });
    const teamId = booking?.eventType?.teamId ?? null;
    if (!teamId) throw new Error("Unauthorized");
    const isMember = await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } });
    if (!isMember) throw new Error("Unauthorized");

    return ctx.prisma.attendanceRecord.upsert({
      where: { swimmerId_bookingId: { swimmerId: input.swimmerId, bookingId: input.bookingId } },
      update: { status: input.status, notes: input.notes, markedById: ctx.user?.id, markedAt: new Date() },
      create: { swimmerId: input.swimmerId, bookingId: input.bookingId, status: input.status, notes: input.notes, markedById: ctx.user?.id },
    });
  }),

  quickMarkMany: authedProcedure.input(markManySchema).mutation(async ({ ctx, input }) => {
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { eventType: { select: { teamId: true } } },
    });
    const teamId = booking?.eventType?.teamId ?? null;
    if (!teamId) throw new Error("Unauthorized");
    const isMember = await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } });
    if (!isMember) throw new Error("Unauthorized");

    const ops = input.marks.map((m) =>
      ctx.prisma.attendanceRecord.upsert({
        where: { swimmerId_bookingId: { swimmerId: m.swimmerId, bookingId: input.bookingId } },
        update: { status: m.status, notes: m.notes, markedById: ctx.user?.id, markedAt: new Date() },
        create: { swimmerId: m.swimmerId, bookingId: input.bookingId, status: m.status, notes: m.notes, markedById: ctx.user?.id },
      })
    );
    return ctx.prisma.$transaction(ops);
  }),

  upsertNote: authedProcedure.input(noteSchema).mutation(async ({ ctx, input }) => {
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { eventType: { select: { teamId: true } } },
    });
    const teamId = booking?.eventType?.teamId ?? null;
    if (!teamId) throw new Error("Unauthorized");
    const isMember = await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } });
    if (!isMember) throw new Error("Unauthorized");

    const existing = await ctx.prisma.progressNote.findFirst({
      where: { swimmerId: input.swimmerId, bookingId: input.bookingId, instructorId: ctx.user?.id ?? undefined },
    });
    if (existing) {
      return ctx.prisma.progressNote.update({
        where: { id: existing.id },
        data: { note: input.note, skills: (input.skills as any) ?? undefined, visibleToParent: input.visibleToParent ?? true },
      });
    }
    return ctx.prisma.progressNote.create({
      data: {
        swimmerId: input.swimmerId,
        bookingId: input.bookingId,
        instructorId: ctx.user?.id,
        note: input.note,
        skills: (input.skills as any) ?? undefined,
        visibleToParent: input.visibleToParent ?? true,
      },
    });
  }),

  // E2E/dev helper: ensure a demo booking exists today for the user's team
  ensureDemoBooking: authedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");

    // Prefer the seeded swim event type if present
    let eventType = await ctx.prisma.eventType.findFirst({
      where: { slug: "round-robin-seeded-team-event" },
      select: { id: true, title: true, teamId: true },
    });

    if (!eventType) {
      // Fallback: find any event type on a team the user is a member of
      eventType = await ctx.prisma.eventType.findFirst({
        where: { team: { members: { some: { userId, accepted: true } } } },
        orderBy: { id: "asc" },
        select: { id: true, title: true, teamId: true },
      });
    }

    if (!eventType) throw new Error("No accessible event type for user");

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const midday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

    let booking = await ctx.prisma.booking.findFirst({
      where: { userId, eventTypeId: eventType.id, startTime: { gte: dayStart, lte: dayEnd } },
      select: { id: true, title: true, startTime: true, endTime: true, eventTypeId: true },
    });

    if (!booking) {
      booking = await ctx.prisma.booking.create({
        data: {
          uid: Math.random().toString(36).slice(2),
          userId,
          eventTypeId: eventType.id,
          title: "Seeded Swim Lesson",
          startTime: midday,
          endTime: new Date(midday.getTime() + 30 * 60 * 1000),
          status: "ACCEPTED",
        },
        select: { id: true, title: true, startTime: true, endTime: true, eventTypeId: true },
      });
    }

    return booking;
  }),

  markAndNote: authedProcedure
    .input(markSchema.extend({ note: z.string().optional(), skills: z.any().optional(), visibleToParent: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: { eventType: { select: { teamId: true } } },
      });
      const teamId = booking?.eventType?.teamId ?? null;
      if (!teamId) throw new Error("Unauthorized");
      const isMember = await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } });
      if (!isMember) throw new Error("Unauthorized");

      return ctx.prisma.$transaction(async (tx) => {
        const attendance = await tx.attendanceRecord.upsert({
          where: { swimmerId_bookingId: { swimmerId: input.swimmerId, bookingId: input.bookingId } },
          update: { status: input.status, notes: input.notes, markedById: ctx.user?.id, markedAt: new Date() },
          create: { swimmerId: input.swimmerId, bookingId: input.bookingId, status: input.status, notes: input.notes, markedById: ctx.user?.id },
        });

        if (input.note || input.skills) {
          const existing = await tx.progressNote.findFirst({
            where: { swimmerId: input.swimmerId, bookingId: input.bookingId, instructorId: ctx.user?.id ?? undefined },
          });
          if (existing) {
            await tx.progressNote.update({
              where: { id: existing.id },
              data: { note: input.note, skills: (input.skills as any) ?? undefined, visibleToParent: input.visibleToParent ?? true },
            });
          } else {
            await tx.progressNote.create({
              data: {
                swimmerId: input.swimmerId,
                bookingId: input.bookingId,
                instructorId: ctx.user?.id,
                note: input.note,
                skills: (input.skills as any) ?? undefined,
                visibleToParent: input.visibleToParent ?? true,
              },
            });
          }
        }

        return { ok: true, attendance };
      });
    }),
});

export default instructorRouter;
