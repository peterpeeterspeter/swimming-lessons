import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const createMakeupCreditSchema = z.object({
  swimmerId: z.string().uuid(),
  bookingId: z.number().int(),
  reason: z.string().optional(),
});

const bookMakeupLessonSchema = z.object({
  makeupLessonId: z.string().uuid(),
  targetBookingId: z.number().int(),
});

const getMakeupCreditsSchema = z.object({
  swimmerId: z.string().uuid(),
});

const getAvailableSlotsSchema = z.object({
  swimmerId: z.string().uuid(),
  eventTypeId: z.number().int(),
});

const getMakeupsForLessonSchema = z.object({
  bookingId: z.number().int(),
});

const makeupRouter = router({
  /**
   * Create make-up credit (parent reports absence, or instructor marks)
   */
  createMakeupCredit: authedProcedure.input(createMakeupCreditSchema).mutation(async ({ ctx, input }) => {
    // Verify swimmer belongs to user or user is instructor
    const swimmer = await ctx.prisma.swimmer.findUnique({
      where: { id: input.swimmerId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { eventType: true },
        },
      },
    });

    if (!swimmer) throw new Error("Swimmer not found");

    const isParent = swimmer.parentId === ctx.user?.id;

    // Get booking to verify access
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { eventType: { select: { teamId: true } } },
    });

    if (!booking) throw new Error("Lesson not found");

    const isMember = await ctx.prisma.membership.findFirst({
      where: {
        teamId: booking.eventType.teamId,
        userId: ctx.user?.id,
      },
    });

    if (!isParent && !isMember) {
      throw new Error("Unauthorized");
    }

    // Find enrollment for this event type
    const enrollment = swimmer.enrollments.find((e) => e.eventTypeId === booking.eventTypeId);

    if (!enrollment) {
      throw new Error("Swimmer not enrolled in this lesson");
    }

    // Mark original attendance as EXCUSED
    await ctx.prisma.attendanceRecord.upsert({
      where: {
        swimmerId_bookingId: {
          swimmerId: input.swimmerId,
          bookingId: input.bookingId,
        },
      },
      update: {
        status: "EXCUSED",
        notes: input.reason ? `Make-up credit issued: ${input.reason}` : "Make-up credit issued",
        markedById: ctx.user?.id,
        markedAt: new Date(),
      },
      create: {
        swimmerId: input.swimmerId,
        bookingId: input.bookingId,
        status: "EXCUSED",
        notes: input.reason ? `Make-up credit issued: ${input.reason}` : "Make-up credit issued",
        markedById: ctx.user?.id,
      },
    });

    // Create MakeupLesson record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now

    const makeupLesson = await ctx.prisma.makeupLesson.create({
      data: {
        swimmerId: input.swimmerId,
        originalBookingId: input.bookingId,
        status: "PENDING",
        reason: input.reason,
        expiresAt,
      },
    });

    // Increment enrollment makeup credits
    await ctx.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        makeupCredits: { increment: 1 },
      },
    });

    // TODO: Send email notification to parent

    return {
      success: true,
      makeupLessonId: makeupLesson.id,
      expiresAt: makeupLesson.expiresAt,
      creditsAvailable: enrollment.makeupCredits + 1,
    };
  }),

  /**
   * Get available slots for booking make-up
   */
  getAvailableSlots: authedProcedure.input(getAvailableSlotsSchema).query(async ({ ctx, input }) => {
    // Verify swimmer belongs to user
    const swimmer = await ctx.prisma.swimmer.findUnique({
      where: {
        id: input.swimmerId,
        parentId: ctx.user?.id,
      },
      include: {
        enrollments: {
          where: {
            eventTypeId: input.eventTypeId,
            status: "ACTIVE",
          },
        },
      },
    });

    if (!swimmer || swimmer.enrollments.length === 0) {
      throw new Error("Unauthorized or not enrolled");
    }

    // Get upcoming bookings for this event type (next 90 days)
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const upcomingBookings = await ctx.prisma.booking.findMany({
      where: {
        eventTypeId: input.eventTypeId,
        startTime: {
          gte: today,
          lte: ninetyDaysFromNow,
        },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: "asc" },
      take: 50, // Limit to 50 slots
    });

    return upcomingBookings.map((booking) => ({
      bookingId: booking.id,
      title: booking.title,
      startTime: booking.startTime,
      endTime: booking.endTime,
    }));
  }),

  /**
   * Book make-up lesson
   */
  bookMakeupLesson: authedProcedure.input(bookMakeupLessonSchema).mutation(async ({ ctx, input }) => {
    // Get make-up lesson record
    const makeupLesson = await ctx.prisma.makeupLesson.findUnique({
      where: { id: input.makeupLessonId },
      include: {
        swimmer: { select: { parentId: true } },
      },
    });

    if (!makeupLesson) throw new Error("Make-up lesson not found");
    if (makeupLesson.swimmer.parentId !== ctx.user?.id) {
      throw new Error("Unauthorized");
    }
    if (makeupLesson.status !== "PENDING") {
      throw new Error("This make-up credit has already been used or expired");
    }

    // Verify target booking exists and is in future
    const targetBooking = await ctx.prisma.booking.findUnique({
      where: { id: input.targetBookingId },
    });

    if (!targetBooking) throw new Error("Target lesson not found");
    if (targetBooking.startTime < new Date()) {
      throw new Error("Cannot book make-up for past lessons");
    }

    // Update MakeupLesson record
    await ctx.prisma.makeupLesson.update({
      where: { id: input.makeupLessonId },
      data: {
        makeupBookingId: input.targetBookingId,
        status: "SCHEDULED",
      },
    });

    // Create attendance record for make-up lesson
    await ctx.prisma.attendanceRecord.create({
      data: {
        swimmerId: makeupLesson.swimmerId,
        bookingId: input.targetBookingId,
        status: "PRESENT", // Pre-mark as present (will be confirmed by instructor)
        notes: `Make-up lesson for ${new Date(makeupLesson.createdAt).toLocaleDateString()}`,
      },
    });

    // Decrement enrollment makeup credits
    const enrollment = await ctx.prisma.enrollment.findFirst({
      where: {
        swimmerId: makeupLesson.swimmerId,
        eventTypeId: targetBooking.eventTypeId,
        status: "ACTIVE",
      },
    });

    if (enrollment) {
      await ctx.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          makeupCredits: { decrement: 1 },
        },
      });
    }

    // TODO: Send confirmation email

    return {
      success: true,
      targetLesson: {
        title: targetBooking.title,
        startTime: targetBooking.startTime,
      },
    };
  }),

  /**
   * Get swimmer's make-up credits
   */
  getMakeupCredits: authedProcedure.input(getMakeupCreditsSchema).query(async ({ ctx, input }) => {
    // Verify swimmer belongs to user
    const swimmer = await ctx.prisma.swimmer.findUnique({
      where: {
        id: input.swimmerId,
        parentId: ctx.user?.id,
      },
    });

    if (!swimmer) throw new Error("Unauthorized");

    // Get all make-up lessons for this swimmer
    const makeupLessons = await ctx.prisma.makeupLesson.findMany({
      where: { swimmerId: input.swimmerId },
      include: {
        originalBooking: {
          select: {
            title: true,
            startTime: true,
            eventType: { select: { title: true } },
          },
        },
        makeupBooking: {
          select: {
            title: true,
            startTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return makeupLessons.map((ml) => ({
      id: ml.id,
      status: ml.status,
      reason: ml.reason,
      originalLesson: {
        title: ml.originalBooking.eventType.title,
        date: ml.originalBooking.startTime,
      },
      makeupLesson: ml.makeupBooking
        ? {
            title: ml.makeupBooking.title,
            date: ml.makeupBooking.startTime,
          }
        : null,
      expiresAt: ml.expiresAt,
      createdAt: ml.createdAt,
    }));
  }),

  /**
   * Get make-ups for a specific lesson (instructor view)
   */
  getMakeupsForLesson: authedProcedure.input(getMakeupsForLessonSchema).query(async ({ ctx, input }) => {
    // Verify user is team member
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { eventType: { select: { teamId: true } } },
    });

    if (!booking) throw new Error("Lesson not found");

    const isMember = await ctx.prisma.membership.findFirst({
      where: {
        teamId: booking.eventType.teamId,
        userId: ctx.user?.id,
      },
    });

    if (!isMember) throw new Error("Unauthorized");

    // Get make-up lessons scheduled for this booking
    const makeupLessons = await ctx.prisma.makeupLesson.findMany({
      where: {
        makeupBookingId: input.bookingId,
        status: { in: ["SCHEDULED", "USED"] },
      },
      include: {
        swimmer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        originalBooking: {
          select: {
            startTime: true,
            eventType: { select: { title: true } },
          },
        },
      },
    });

    return makeupLessons.map((ml) => ({
      swimmerId: ml.swimmerId,
      swimmerName: `${ml.swimmer.firstName} ${ml.swimmer.lastName}`,
      originalLesson: {
        title: ml.originalBooking.eventType.title,
        date: ml.originalBooking.startTime,
      },
      reason: ml.reason,
      status: ml.status,
    }));
  }),

  /**
   * Mark make-up as used (instructor completes attendance)
   */
  markMakeupUsed: authedProcedure
    .input(z.object({ makeupLessonId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const makeupLesson = await ctx.prisma.makeupLesson.findUnique({
        where: { id: input.makeupLessonId },
      });

      if (!makeupLesson) throw new Error("Make-up lesson not found");

      await ctx.prisma.makeupLesson.update({
        where: { id: input.makeupLessonId },
        data: { status: "USED" },
      });

      return { success: true };
    }),

  /**
   * Get team make-up statistics (manager dashboard)
   */
  getTeamMakeupStats: authedProcedure
    .input(z.object({ teamId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      // Verify user is team admin/owner
      const membership = await ctx.prisma.membership.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.user?.id,
          role: { in: ["ADMIN", "OWNER"] },
        },
      });
      if (!membership) throw new Error("Unauthorized");

      // Get event types for this team
      const eventTypes = await ctx.prisma.eventType.findMany({
        where: { teamId: input.teamId },
        select: { id: true },
      });
      const eventTypeIds = eventTypes.map((et) => et.id);

      // Get all swimmers enrolled in team's event types
      const enrollments = await ctx.prisma.enrollment.findMany({
        where: {
          eventTypeId: { in: eventTypeIds },
        },
        select: { swimmerId: true },
      });
      const swimmerIds = enrollments.map((e) => e.swimmerId);

      // Get all make-up lessons for team's swimmers
      const allMakeups = await ctx.prisma.makeupLesson.findMany({
        where: {
          swimmerId: { in: swimmerIds },
        },
        include: {
          swimmer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          originalBooking: {
            select: {
              startTime: true,
              eventType: { select: { title: true } },
            },
          },
          makeupBooking: {
            select: {
              title: true,
              startTime: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Count by status
      const pending = allMakeups.filter((m) => m.status === "PENDING").length;
      const scheduled = allMakeups.filter((m) => m.status === "SCHEDULED").length;
      const used = allMakeups.filter((m) => m.status === "USED").length;
      const expired = allMakeups.filter((m) => m.status === "EXPIRED").length;

      // Find expiring soon (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringSoon = allMakeups
        .filter(
          (m) =>
            m.status === "PENDING" &&
            m.expiresAt &&
            m.expiresAt <= thirtyDaysFromNow &&
            m.expiresAt > new Date()
        )
        .map((m) => ({
          id: m.id,
          swimmer: m.swimmer,
          originalLesson: {
            title: m.originalBooking.eventType.title,
            date: m.originalBooking.startTime,
          },
          reason: m.reason,
          expiresAt: m.expiresAt,
        }));

      // Recent activity (last 20)
      const recentActivity = allMakeups.slice(0, 20).map((m) => ({
        id: m.id,
        swimmer: m.swimmer,
        status: m.status,
        originalLesson: {
          title: m.originalBooking.eventType.title,
          date: m.originalBooking.startTime,
        },
        makeupLesson: m.makeupBooking
          ? {
              title: m.makeupBooking.title,
              date: m.makeupBooking.startTime,
            }
          : null,
        updatedAt: m.updatedAt,
      }));

      return {
        pending,
        scheduled,
        used,
        expired,
        expiringSoon,
        recentActivity,
      };
    }),
});

export default makeupRouter;
