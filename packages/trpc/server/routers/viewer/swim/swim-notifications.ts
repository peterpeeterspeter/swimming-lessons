import { z } from "zod";

import SwimEnrollmentConfirmationEmail from "@calcom/emails/templates/swim-enrollment-confirmation-email";
import SwimLessonCancelledEmail from "@calcom/emails/templates/swim-lesson-cancelled-email";
import SwimPaymentFailedEmail from "@calcom/emails/templates/swim-payment-failed-email";
import SwimPaymentReminderEmail from "@calcom/emails/templates/swim-payment-reminder-email";
import SwimProgressWeeklyEmail from "@calcom/emails/templates/swim-progress-weekly-email";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const sendEnrollmentConfirmationSchema = z.object({
  enrollmentId: z.string().uuid(),
});

const sendPaymentReminderSchema = z.object({
  enrollmentId: z.string().uuid(),
});

const sendLessonCancellationSchema = z.object({
  bookingId: z.number().int(),
  reason: z.string().optional(),
  cancelledBy: z.string(),
});

const sendProgressDigestSchema = z.object({
  swimmerId: z.string().uuid(),
  weekStart: z.string().datetime(),
  weekEnd: z.string().datetime(),
});

const swimNotificationsRouter = router({
  /**
   * Send enrollment confirmation email
   */
  sendEnrollmentConfirmation: authedProcedure
    .input(sendEnrollmentConfirmationSchema)
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.prisma.enrollment.findFirst({
        where: { id: input.enrollmentId },
        include: {
          swimmer: { include: { parent: true } },
          eventType: true,
        },
      });

      if (!enrollment) throw new Error("Enrollment not found");

      const email = new SwimEnrollmentConfirmationEmail({
        swimmerName: `${enrollment.swimmer.firstName} ${enrollment.swimmer.lastName}`,
        lessonName: enrollment.eventType.title,
        parentEmail: enrollment.swimmer.parent.email,
        parentName: enrollment.swimmer.parent.name || "Parent",
        startDate: enrollment.startDate || new Date(),
        paymentAmount: enrollment.amount ? Number(enrollment.amount) : undefined,
        paymentFrequency: enrollment.paymentFrequency || undefined,
        nextPaymentDate: enrollment.nextPaymentDate || undefined,
        t: (key: string, vars?: any) => key, // TODO: Use proper translation
      });

      await email.sendEmail();

      return { success: true };
    }),

  /**
   * Send payment reminder email
   */
  sendPaymentReminder: authedProcedure.input(sendPaymentReminderSchema).mutation(async ({ ctx, input }) => {
    const enrollment = await ctx.prisma.enrollment.findFirst({
      where: { id: input.enrollmentId },
      include: {
        swimmer: { include: { parent: true } },
        eventType: true,
      },
    });

    if (!enrollment || !enrollment.amount || !enrollment.nextPaymentDate) {
      throw new Error("Enrollment or payment info not found");
    }

    const email = new SwimPaymentReminderEmail({
      swimmerName: `${enrollment.swimmer.firstName} ${enrollment.swimmer.lastName}`,
      lessonName: enrollment.eventType.title,
      parentEmail: enrollment.swimmer.parent.email,
      parentName: enrollment.swimmer.parent.name || "Parent",
      amount: Number(enrollment.amount),
      dueDate: enrollment.nextPaymentDate,
      t: (key: string, vars?: any) => key,
    });

    await email.sendEmail();

    return { success: true };
  }),

  /**
   * Send lesson cancellation email
   */
  sendLessonCancellation: authedProcedure
    .input(sendLessonCancellationSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findUnique({
        where: { id: input.bookingId },
        include: {
          eventType: true,
          user: true,
        },
      });

      if (!booking) throw new Error("Booking not found");

      // Get all enrolled swimmers for this lesson's event type
      const enrollments = await ctx.prisma.enrollment.findMany({
        where: { eventTypeId: booking.eventTypeId || undefined },
        include: {
          swimmer: { include: { parent: true } },
        },
      });

      // Send email to each enrolled parent
      const emailPromises = enrollments.map((enrollment) => {
        const email = new SwimLessonCancelledEmail({
          swimmerName: `${enrollment.swimmer.firstName} ${enrollment.swimmer.lastName}`,
          lessonName: booking.title,
          parentEmail: enrollment.swimmer.parent.email,
          parentName: enrollment.swimmer.parent.name || "Parent",
          originalDate: booking.startTime,
          cancelledBy: input.cancelledBy,
          reason: input.reason,
          makeupOffered: false, // TODO: Make this configurable
          t: (key: string, vars?: any) => key,
        });

        return email.sendEmail();
      });

      await Promise.all(emailPromises);

      return { success: true, emailsSent: enrollments.length };
    }),

  /**
   * Send weekly progress digest
   */
  sendProgressDigest: authedProcedure.input(sendProgressDigestSchema).mutation(async ({ ctx, input }) => {
    const swimmer = await ctx.prisma.swimmer.findFirst({
      where: { id: input.swimmerId },
      include: { parent: true },
    });

    if (!swimmer) throw new Error("Swimmer not found");

    const weekStart = new Date(input.weekStart);
    const weekEnd = new Date(input.weekEnd);

    // Get attendance for the week
    const attendance = await ctx.prisma.attendanceRecord.findMany({
      where: {
        swimmerId: input.swimmerId,
        booking: {
          startTime: { gte: weekStart, lte: weekEnd },
        },
      },
      include: { booking: true },
    });

    // Get progress notes for the week
    const progressNotes = await ctx.prisma.progressNote.findMany({
      where: {
        swimmerId: input.swimmerId,
        booking: {
          startTime: { gte: weekStart, lte: weekEnd },
        },
      },
      include: {
        instructor: true,
        booking: true,
      },
    });

    const attendanceCount = attendance.filter((a) => a.status === "PRESENT").length;

    const email = new SwimProgressWeeklyEmail({
      swimmerName: `${swimmer.firstName} ${swimmer.lastName}`,
      parentEmail: swimmer.parent.email,
      parentName: swimmer.parent.name || "Parent",
      weekStart,
      weekEnd,
      attendanceCount,
      totalLessons: attendance.length,
      progressNotes: progressNotes.map((note) => ({
        date: note.booking.startTime,
        instructor: note.instructor?.name || "Instructor",
        note: note.note || "",
        skills: (note.skills as string[]) || [],
      })),
      t: (key: string, vars?: any) => key,
    });

    await email.sendEmail();

    return { success: true };
  }),

  /**
   * Get enrollments with upcoming payments (for cron job)
   */
  getEnrollmentsDueReminders: authedProcedure.query(async ({ ctx }) => {
    // Get enrollments with payment due in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const enrollments = await ctx.prisma.enrollment.findMany({
      where: {
        paymentStatus: "ACTIVE",
        nextPaymentDate: {
          gte: threeDaysFromNow,
          lte: threeDaysEnd,
        },
      },
      include: {
        swimmer: { include: { parent: true } },
        eventType: true,
      },
    });

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      swimmerName: `${e.swimmer.firstName} ${e.swimmer.lastName}`,
      parentEmail: e.swimmer.parent.email,
      amount: e.amount,
      dueDate: e.nextPaymentDate,
    }));
  }),
});

export default swimNotificationsRouter;
