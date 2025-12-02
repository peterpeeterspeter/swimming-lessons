import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const managerRouter = router({
  todaySummary: authedProcedure
    .input(
      z
        .object({ start: z.string().datetime().optional(), end: z.string().datetime().optional() })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const start = input?.start ? new Date(input.start) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = input?.end ? new Date(input.end) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // All teams where user is ADMIN or OWNER
      const myTeams = await ctx.prisma.membership.findMany({
        where: { userId: ctx.user?.id, accepted: true, role: { in: ["ADMIN", "OWNER"] } },
        select: { teamId: true },
      });
      const teamIds = myTeams.map((m) => m.teamId);
      if (teamIds.length === 0) return [] as Array<{
        bookingId: number;
        title: string;
        startTime: Date;
        teamId: number;
        teamName: string;
        eventTypeId: number;
        totalEnrolled: number;
        markedPresent: number;
        markedCount: number;
      }>;

      const bookings = await ctx.prisma.booking.findMany({
        where: {
          startTime: { gte: start },
          endTime: { lte: end },
          eventType: { teamId: { in: teamIds } },
        },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          title: true,
          startTime: true,
          eventTypeId: true,
          eventType: { select: { title: true, teamId: true, team: { select: { id: true, name: true } } } },
        },
      });

      if (bookings.length === 0) return [];

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
        bookingId: b.id,
        title: b.title || b.eventType?.title || "Lesson",
        startTime: b.startTime,
        teamId: b.eventType?.teamId || 0,
        teamName: b.eventType?.team?.name || "",
        eventTypeId: b.eventTypeId!,
        totalEnrolled: enrolledMap.get(b.eventTypeId!) ?? 0,
        markedPresent: presentMap.get(b.id) ?? 0,
        markedCount: markedMap.get(b.id) ?? 0,
      }));
    }),
});

export default managerRouter;
