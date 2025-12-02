import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const noteSchema = z.object({
  swimmerId: z.string().uuid(),
  bookingId: z.number().int(),
  note: z.string().optional(),
  skills: z.any().optional(),
  visibleToParent: z.boolean().optional(),
});

const idSchema = z.object({ id: z.string().uuid() });

const progressNotesRouter = router({
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
    return ctx.prisma.progressNote.findMany({ where: { bookingId: input.bookingId } });
  }),

  listMineBySwimmer: authedProcedure.input(z.object({ swimmerId: z.string().uuid() })).query(async ({ ctx, input }) => {
    // Parent can view notes for their swimmer, filtered by visibility
    const swimmer = await ctx.prisma.swimmer.findFirst({ where: { id: input.swimmerId, parentId: ctx.user?.id } });
    if (!swimmer) return [];
    return ctx.prisma.progressNote.findMany({ where: { swimmerId: input.swimmerId, visibleToParent: true } });
  }),

  create: authedProcedure.input(noteSchema).mutation(async ({ ctx, input }) => {
    // Must be member of team owning the booking's event type
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: { eventType: { select: { teamId: true } } },
    });
    const teamId = booking?.eventType?.teamId ?? null;
    if (!teamId) throw new Error("Unauthorized");
    const isMember = await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } });
    if (!isMember) throw new Error("Unauthorized");

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

  update: authedProcedure
    .input(idSchema.merge(z.object({ note: z.string().optional(), skills: z.any().optional(), visibleToParent: z.boolean().optional() })))
    .mutation(async ({ ctx, input }) => {
      // Only the instructor who created or team member can update
      const pn = await ctx.prisma.progressNote.findUnique({ where: { id: input.id }, select: { instructorId: true, booking: { select: { eventType: { select: { teamId: true } } } } } });
      if (!pn) throw new Error("Not found");
      const teamId = pn.booking?.eventType?.teamId ?? null;
      const isMember = teamId ? await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } }) : null;
      if (pn.instructorId !== ctx.user?.id && !isMember) throw new Error("Unauthorized");

      return ctx.prisma.progressNote.update({ where: { id: input.id }, data: { note: input.note, skills: (input.skills as any) ?? undefined, visibleToParent: input.visibleToParent } });
    }),

  delete: authedProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const pn = await ctx.prisma.progressNote.findUnique({ where: { id: input.id }, select: { instructorId: true, booking: { select: { eventType: { select: { teamId: true } } } } } });
    if (!pn) throw new Error("Not found");
    const teamId = pn.booking?.eventType?.teamId ?? null;
    const isMember = teamId ? await ctx.prisma.membership.findFirst({ where: { teamId, userId: ctx.user?.id } }) : null;
    if (pn.instructorId !== ctx.user?.id && !isMember) throw new Error("Unauthorized");

    await ctx.prisma.progressNote.delete({ where: { id: input.id } });
    return { ok: true };
  }),
});

export default progressNotesRouter;
