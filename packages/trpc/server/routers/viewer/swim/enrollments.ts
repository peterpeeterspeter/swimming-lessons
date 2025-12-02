import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const createEnrollmentSchema = z.object({
  swimmerId: z.string().uuid(),
  eventTypeId: z.number().int(),
  status: z.enum(["ACTIVE", "WITHDRAWN", "COMPLETED", "WAITLISTED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  bookingId: z.number().int().optional(),
});

const updateEnrollmentSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["ACTIVE", "WITHDRAWN", "COMPLETED", "WAITLISTED"]).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  bookingId: z.number().int().optional().nullable(),
});

const enrollmentsRouter = router({
  listBySwimmer: authedProcedure.input(z.object({ swimmerId: z.string().uuid() })).query(async ({ ctx, input }) => {
    // Ensure caller is the parent of the swimmer
    const swimmer = await ctx.prisma.swimmer.findFirst({ where: { id: input.swimmerId, parentId: ctx.user?.id } });
    if (!swimmer) return [];
    return ctx.prisma.enrollment.findMany({ where: { swimmerId: input.swimmerId }, orderBy: { createdAt: "desc" } });
  }),

  listByEventType: authedProcedure.input(z.object({ eventTypeId: z.number().int() })).query(async ({ ctx, input }) => {
    // Allow members of the team owning the eventType
    const et = await ctx.prisma.eventType.findUnique({ where: { id: input.eventTypeId }, select: { teamId: true } });
    if (!et?.teamId) return [];
    const isMember = await ctx.prisma.membership.findFirst({ where: { teamId: et.teamId, userId: ctx.user?.id } });
    if (!isMember) return [];
    return ctx.prisma.enrollment.findMany({ where: { eventTypeId: input.eventTypeId }, orderBy: { createdAt: "desc" } });
  }),

  create: authedProcedure.input(createEnrollmentSchema).mutation(async ({ ctx, input }) => {
    // Only the parent of the swimmer can create enrollment
    const swimmer = await ctx.prisma.swimmer.findFirst({ where: { id: input.swimmerId, parentId: ctx.user?.id } });
    if (!swimmer) throw new Error("Unauthorized");

    const data: any = {
      swimmerId: input.swimmerId,
      eventTypeId: input.eventTypeId,
      status: input.status,
      bookingId: input.bookingId,
    };
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);

    return ctx.prisma.enrollment.create({ data });
  }),

  update: authedProcedure.input(updateEnrollmentSchema).mutation(async ({ ctx, input }) => {
    // Ensure enrollment belongs to a swimmer of the caller
    const enrollment = await ctx.prisma.enrollment.findFirst({
      where: { id: input.id, swimmer: { parentId: ctx.user?.id } },
      select: { id: true },
    });
    if (!enrollment) throw new Error("Not found");

    const { id, startDate, endDate, ...rest } = input;
    return ctx.prisma.enrollment.update({
      where: { id },
      data: {
        ...rest,
        startDate: startDate === undefined ? undefined : startDate ? new Date(startDate) : null,
        endDate: endDate === undefined ? undefined : endDate ? new Date(endDate) : null,
      },
    });
  }),

  delete: authedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    // Ensure enrollment belongs to a swimmer of the caller
    const enrollment = await ctx.prisma.enrollment.findFirst({
      where: { id: input.id, swimmer: { parentId: ctx.user?.id } },
      select: { id: true },
    });
    if (!enrollment) throw new Error("Not found");

    await ctx.prisma.enrollment.delete({ where: { id: input.id } });
    return { ok: true };
  }),
});

export default enrollmentsRouter;
