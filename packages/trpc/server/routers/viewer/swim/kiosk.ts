import { z } from "zod";

import authedProcedure from "../../../procedures/authedProcedure";
import publicProcedure from "../../../procedures/publicProcedure";
import { router } from "../../../trpc";

const findSwimmerSchema = z.object({
  query: z.string().min(2), // Phone, email, or name search
  teamId: z.number().int().optional(), // Optional team filter for multi-location
});

const checkInSchema = z.object({
  swimmerId: z.string().uuid(),
  bookingId: z.number().int(),
});

const getTodayLessonsSchema = z.object({
  teamId: z.number().int().optional(),
});

const kioskRouter = router({
  /**
   * Search for swimmers with lessons today
   * Public endpoint for kiosk usage
   */
  findSwimmer: publicProcedure.input(findSwimmerSchema).query(async ({ ctx, input }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Search swimmers by phone, email, or name
    const swimmers = await ctx.prisma.swimmer.findMany({
      where: {
        OR: [
          { parent: { phone: { contains: input.query } } },
          { parent: { email: { contains: input.query, mode: "insensitive" } } },
          { firstName: { contains: input.query, mode: "insensitive" } },
          { lastName: { contains: input.query, mode: "insensitive" } },
        ],
      },
      include: {
        parent: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            eventType: {
              include: {
                bookings: {
                  where: {
                    startTime: {
                      gte: today,
                      lt: tomorrow,
                    },
                  },
                  select: {
                    id: true,
                    title: true,
                    startTime: true,
                    endTime: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 10, // Limit results for kiosk display
    });

    // Flatten to swimmers with today's lessons
    const swimmersWithLessonsToday = swimmers
      .map((swimmer) => {
        const todayLessons = swimmer.enrollments
          .flatMap((e) => e.eventType.bookings)
          .filter((b) => b !== null);

        if (todayLessons.length === 0) return null;

        return {
          id: swimmer.id,
          firstName: swimmer.firstName,
          lastName: swimmer.lastName,
          dateOfBirth: swimmer.dateOfBirth,
          photo: swimmer.photo,
          parentName: swimmer.parent.name,
          todayLessons: todayLessons.map((lesson) => ({
            bookingId: lesson.id,
            title: lesson.title,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
          })),
        };
      })
      .filter((s) => s !== null);

    return swimmersWithLessonsToday;
  }),

  /**
   * Check in swimmer for a lesson (kiosk self check-in)
   */
  checkIn: publicProcedure.input(checkInSchema).mutation(async ({ ctx, input }) => {
    // Verify booking exists and is today
    const booking = await ctx.prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        eventType: { select: { title: true } },
      },
    });

    if (!booking) {
      throw new Error("Lesson not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (booking.startTime < today || booking.startTime >= tomorrow) {
      throw new Error("Can only check in for today's lessons");
    }

    // Verify swimmer is enrolled
    const swimmer = await ctx.prisma.swimmer.findUnique({
      where: { id: input.swimmerId },
      include: {
        enrollments: {
          where: {
            eventTypeId: booking.eventTypeId,
            status: "ACTIVE",
          },
        },
      },
    });

    if (!swimmer || swimmer.enrollments.length === 0) {
      throw new Error("Swimmer not enrolled in this lesson");
    }

    // Create or update attendance record
    const attendance = await ctx.prisma.attendanceRecord.upsert({
      where: {
        swimmerId_bookingId: {
          swimmerId: input.swimmerId,
          bookingId: input.bookingId,
        },
      },
      update: {
        status: "PRESENT",
        markedAt: new Date(),
        notes: "Self check-in via kiosk",
      },
      create: {
        swimmerId: input.swimmerId,
        bookingId: input.bookingId,
        status: "PRESENT",
        notes: "Self check-in via kiosk",
      },
    });

    return {
      success: true,
      swimmer: {
        firstName: swimmer.firstName,
        lastName: swimmer.lastName,
      },
      lesson: {
        title: booking.eventType.title,
        startTime: booking.startTime,
      },
      checkedInAt: attendance.markedAt,
    };
  }),

  /**
   * Get all lessons happening today (for display board)
   */
  getTodayLessons: publicProcedure.input(getTodayLessonsSchema).query(async ({ ctx, input }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await ctx.prisma.booking.findMany({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        ...(input.teamId ? { eventType: { teamId: input.teamId } } : {}),
      },
      include: {
        eventType: {
          select: {
            title: true,
            teamId: true,
          },
        },
        attendanceRecords: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Get enrollment count for each lesson
    const lessonsWithStats = await Promise.all(
      bookings.map(async (booking) => {
        const enrollmentCount = await ctx.prisma.enrollment.count({
          where: {
            eventTypeId: booking.eventTypeId,
            status: "ACTIVE",
          },
        });

        const presentCount = booking.attendanceRecords.filter((r) => r.status === "PRESENT").length;

        return {
          bookingId: booking.id,
          title: booking.eventType.title,
          startTime: booking.startTime,
          endTime: booking.endTime,
          enrolled: enrollmentCount,
          present: presentCount,
          attendanceRate: enrollmentCount > 0 ? Math.round((presentCount / enrollmentCount) * 100) : 0,
        };
      })
    );

    return lessonsWithStats;
  }),

  /**
   * Get kiosk stats for management
   */
  getKioskStats: authedProcedure
    .input(z.object({ teamId: z.number().int(), days: z.number().int().default(30) }))
    .query(async ({ ctx, input }) => {
      // Verify user is team member
      const membership = await ctx.prisma.membership.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.user?.id,
        },
      });
      if (!membership) throw new Error("Unauthorized");

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Count kiosk check-ins (identified by notes)
      const kioskCheckIns = await ctx.prisma.attendanceRecord.count({
        where: {
          notes: { contains: "kiosk" },
          createdAt: { gte: startDate },
          booking: {
            eventType: { teamId: input.teamId },
          },
        },
      });

      const totalCheckIns = await ctx.prisma.attendanceRecord.count({
        where: {
          createdAt: { gte: startDate },
          booking: {
            eventType: { teamId: input.teamId },
          },
        },
      });

      return {
        kioskCheckIns,
        totalCheckIns,
        kioskAdoptionRate: totalCheckIns > 0 ? Math.round((kioskCheckIns / totalCheckIns) * 100) : 0,
        period: `Last ${input.days} days`,
      };
    }),
});

export default kioskRouter;
