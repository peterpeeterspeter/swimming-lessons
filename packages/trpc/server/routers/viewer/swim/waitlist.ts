import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const joinWaitlistSchema = z.object({
  swimmerId: z.string().uuid(),
  eventTypeId: z.number().int(),
});

const getWaitlistPositionSchema = z.object({
  enrollmentId: z.string().uuid(),
});

const promoteFromWaitlistSchema = z.object({
  enrollmentId: z.string().uuid(),
});

const waitlistRouter = router({
  /**
   * Join waitlist for a lesson
   */
  joinWaitlist: authedProcedure.input(joinWaitlistSchema).mutation(async ({ ctx, input }) => {
    // Verify swimmer belongs to user
    const swimmer = await ctx.prisma.swimmer.findFirst({
      where: { id: input.swimmerId, parentId: ctx.user?.id },
    });
    if (!swimmer) throw new Error("Unauthorized");

    // Check if already enrolled or waitlisted
    const existing = await ctx.prisma.enrollment.findUnique({
      where: { swimmerId_eventTypeId: { swimmerId: input.swimmerId, eventTypeId: input.eventTypeId } },
    });
    if (existing) throw new Error("Already enrolled or waitlisted");

    // Get current max position
    const maxPosition = await ctx.prisma.enrollment.findFirst({
      where: { eventTypeId: input.eventTypeId, status: "WAITLISTED" },
      orderBy: { waitlistPosition: "desc" },
      select: { waitlistPosition: true },
    });

    const nextPosition = (maxPosition?.waitlistPosition || 0) + 1;

    // Create waitlisted enrollment
    const enrollment = await ctx.prisma.enrollment.create({
      data: {
        swimmerId: input.swimmerId,
        eventTypeId: input.eventTypeId,
        status: "WAITLISTED",
        waitlistPosition: nextPosition,
        waitlistJoinedAt: new Date(),
      },
    });

    return {
      enrollmentId: enrollment.id,
      position: nextPosition,
      joinedAt: enrollment.waitlistJoinedAt,
    };
  }),

  /**
   * Get waitlist position for enrollment
   */
  getWaitlistPosition: authedProcedure.input(getWaitlistPositionSchema).query(async ({ ctx, input }) => {
    const enrollment = await ctx.prisma.enrollment.findFirst({
      where: {
        id: input.enrollmentId,
        swimmer: { parentId: ctx.user?.id },
        status: "WAITLISTED",
      },
    });

    if (!enrollment) return null;

    return {
      position: enrollment.waitlistPosition,
      joinedAt: enrollment.waitlistJoinedAt,
    };
  }),

  /**
   * Get waitlist for a lesson (Manager view)
   */
  getWaitlistForLesson: authedProcedure
    .input(z.object({ eventTypeId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      // Verify user is manager/instructor for this lesson's team
      const eventType = await ctx.prisma.eventType.findUnique({
        where: { id: input.eventTypeId },
        select: { teamId: true },
      });

      if (!eventType?.teamId) return [];

      const isMember = await ctx.prisma.membership.findFirst({
        where: { teamId: eventType.teamId, userId: ctx.user?.id, role: { in: ["ADMIN", "OWNER"] } },
      });

      if (!isMember) throw new Error("Unauthorized");

      const waitlist = await ctx.prisma.enrollment.findMany({
        where: { eventTypeId: input.eventTypeId, status: "WAITLISTED" },
        include: {
          swimmer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              birthDate: true,
              parent: { select: { email: true, name: true } },
            },
          },
        },
        orderBy: { waitlistPosition: "asc" },
      });

      return waitlist.map((e) => ({
        enrollmentId: e.id,
        position: e.waitlistPosition,
        joinedAt: e.waitlistJoinedAt,
        swimmer: {
          id: e.swimmer.id,
          name: `${e.swimmer.firstName} ${e.swimmer.lastName}`,
          age: e.swimmer.birthDate
            ? Math.floor((Date.now() - e.swimmer.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null,
        },
        parent: {
          email: e.swimmer.parent.email,
          name: e.swimmer.parent.name,
        },
      }));
    }),

  /**
   * Promote someone from waitlist to active (Manager action)
   */
  promoteFromWaitlist: authedProcedure.input(promoteFromWaitlistSchema).mutation(async ({ ctx, input }) => {
    const enrollment = await ctx.prisma.enrollment.findFirst({
      where: { id: input.enrollmentId, status: "WAITLISTED" },
      include: {
        eventType: true,
        swimmer: true,
      },
    });

    if (!enrollment) throw new Error("Enrollment not found");

    // Verify user is manager
    const isMember = await ctx.prisma.membership.findFirst({
      where: {
        teamId: enrollment.eventType.teamId || undefined,
        userId: ctx.user?.id,
        role: { in: ["ADMIN", "OWNER"] },
      },
    });

    if (!isMember) throw new Error("Unauthorized");

    // Update enrollment to active
    await ctx.prisma.enrollment.update({
      where: { id: input.enrollmentId },
      data: {
        status: "ACTIVE",
        waitlistPosition: null,
        startDate: new Date(),
      },
    });

    // Re-index remaining waitlist
    const remainingWaitlist = await ctx.prisma.enrollment.findMany({
      where: { eventTypeId: enrollment.eventTypeId, status: "WAITLISTED" },
      orderBy: { waitlistPosition: "asc" },
    });

    for (let i = 0; i < remainingWaitlist.length; i++) {
      await ctx.prisma.enrollment.update({
        where: { id: remainingWaitlist[i].id },
        data: { waitlistPosition: i + 1 },
      });
    }

    // TODO: Send email notification to parent

    return { success: true };
  }),

  /**
   * Leave waitlist (Parent action)
   */
  leaveWaitlist: authedProcedure
    .input(z.object({ enrollmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.enrollment.findFirst({
        where: {
          id: input.enrollmentId,
          swimmer: { parentId: ctx.user?.id },
          status: "WAITLISTED",
        },
        select: { id: true, eventTypeId: true },
      });

      if (!enrollment) throw new Error("Not found");

      // Delete enrollment
      await ctx.prisma.enrollment.delete({ where: { id: input.enrollmentId } });

      // Re-index remaining waitlist
      const remainingWaitlist = await ctx.prisma.enrollment.findMany({
        where: { eventTypeId: enrollment.eventTypeId, status: "WAITLISTED" },
        orderBy: { waitlistPosition: "asc" },
      });

      for (let i = 0; i < remainingWaitlist.length; i++) {
        await ctx.prisma.enrollment.update({
          where: { id: remainingWaitlist[i].id },
          data: { waitlistPosition: i + 1 },
        });
      }

      return { success: true };
    }),
});

export default waitlistRouter;
