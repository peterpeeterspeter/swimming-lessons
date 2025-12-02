import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const statusEnum = z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]);

const upsertSchema = z.object({
  swimmerId: z.string().uuid(),
  bookingId: z.number().int(),
  status: statusEnum,
  notes: z.string().optional(),
  metadata: z.any().optional(),
});

const attendanceRouter = router({
  listByBooking: authedProcedure.input(z.object({ bookingId: z.number().int() })).query(async ({ ctx, input }) => {
    // Require membership on team that owns the booking's eventType
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { eventType: { select: { teamId: true } } },
    });
    const teamId = booking?.eventType?.teamId ?? null;
    if (!teamId) return [];
    const isMember = await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } });
    if (!isMember) return [];
    return ctx.prisma.attendanceRecord.findMany({ where: { bookingId: input.bookingId } });
  }),

  listBySwimmer: authedProcedure.input(z.object({ swimmerId: z.string().uuid() })).query(async ({ ctx, input }) => {
    // Parent can view their swimmer's attendance
    const swimmer = await ctx.prisma.swimmer.findFirst({ where: { id: input.swimmerId, parentId: ctx.user?.id } });
    if (!swimmer) return [];
    return ctx.prisma.attendanceRecord.findMany({ where: { swimmerId: input.swimmerId } });
  }),

  mark: authedProcedure.input(upsertSchema).mutation(async ({ ctx, input }) => {
    // Must be member of team owning the booking's event type
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
      update: {
        status: input.status,
        notes: input.notes,
        metadata: (input.metadata as any) ?? undefined,
        markedById: ctx.user?.id,
        markedAt: new Date(),
      },
      create: {
        swimmerId: input.swimmerId,
        bookingId: input.bookingId,
        status: input.status,
        notes: input.notes,
        metadata: (input.metadata as any) ?? undefined,
        markedById: ctx.user?.id,
      },
    });
  }),

  delete: authedProcedure.input(z.object({ swimmerId: z.string().uuid(), bookingId: z.number().int() })).mutation(async ({ ctx, input }) => {
    // Only team member can delete
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { eventType: { select: { teamId: true } } },
    });
    const teamId = booking?.eventType?.teamId ?? null;
    if (!teamId) throw new Error("Unauthorized");
    const isMember = await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } });
    if (!isMember) throw new Error("Unauthorized");

    await ctx.prisma.attendanceRecord.delete({ where: { swimmerId_bookingId: { swimmerId: input.swimmerId, bookingId: input.bookingId } } });
    return { ok: true };
  }),
});

export default attendanceRouter;
