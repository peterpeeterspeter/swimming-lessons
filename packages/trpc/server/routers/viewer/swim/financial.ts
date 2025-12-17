import { z } from "zod";

import { Prisma } from "@calcom/prisma/client";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

const getRevenueOverviewSchema = z.object({
  teamId: z.number().int(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const getPaymentStatusBreakdownSchema = z.object({
  teamId: z.number().int(),
});

const getOutstandingPaymentsSchema = z.object({
  teamId: z.number().int(),
});

const exportFinancialDataSchema = z.object({
  teamId: z.number().int(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(["csv", "json"]),
});

const financialRouter = router({
  /**
   * Get revenue overview
   */
  getRevenueOverview: authedProcedure.input(getRevenueOverviewSchema).query(async ({ ctx, input }) => {
    // Verify user is team admin/owner
    const membership = await ctx.prisma.membership.findFirst({
      where: {
        teamId: input.teamId,
        userId: ctx.user?.id,
        role: { in: ["ADMIN", "OWNER"] },
      },
    });
    if (!membership) throw new Error("Unauthorized");

    const startDate = input.startDate ? new Date(input.startDate) : new Date(0);
    const endDate = input.endDate ? new Date(input.endDate) : new Date();

    // Get event types for this team
    const eventTypes = await ctx.prisma.eventType.findMany({
      where: { teamId: input.teamId },
      select: { id: true },
    });
    const eventTypeIds = eventTypes.map((et) => et.id);

    // Get all enrollments with payments
    const enrollments = await ctx.prisma.enrollment.findMany({
      where: {
        eventTypeId: { in: eventTypeIds },
        createdAt: { gte: startDate, lte: endDate },
        amount: { not: null },
      },
      select: {
        id: true,
        amount: true,
        paymentStatus: true,
        paymentFrequency: true,
        createdAt: true,
        eventType: { select: { title: true } },
      },
    });

    // Calculate total revenue (only from ACTIVE enrollments)
    const totalRevenue = enrollments
      .filter((e) => e.paymentStatus === "ACTIVE")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Calculate expected monthly recurring revenue
    const monthlyRevenue = enrollments
      .filter((e) => e.paymentStatus === "ACTIVE")
      .reduce((sum, e) => {
        const amount = Number(e.amount || 0);
        switch (e.paymentFrequency) {
          case "MONTHLY":
            return sum + amount;
          case "QUARTERLY":
            return sum + amount / 3;
          case "ANNUAL":
            return sum + amount / 12;
          default:
            return sum;
        }
      }, 0);

    // Group by month for chart data
    const revenueByMonth: Record<string, number> = {};
    enrollments.forEach((e) => {
      const monthKey = e.createdAt.toISOString().slice(0, 7); // YYYY-MM
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(e.amount || 0);
    });

    return {
      totalRevenue,
      monthlyRecurringRevenue: monthlyRevenue,
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((e) => e.paymentStatus === "ACTIVE").length,
      revenueByMonth: Object.entries(revenueByMonth)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }),

  /**
   * Get payment status breakdown
   */
  getPaymentStatusBreakdown: authedProcedure
    .input(getPaymentStatusBreakdownSchema)
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

      // Get enrollments grouped by payment status
      const enrollments = await ctx.prisma.enrollment.findMany({
        where: {
          eventTypeId: { in: eventTypeIds },
          paymentStatus: { not: null },
        },
        select: {
          paymentStatus: true,
          amount: true,
        },
      });

      const breakdown = {
        PENDING: { count: 0, amount: 0 },
        ACTIVE: { count: 0, amount: 0 },
        PAST_DUE: { count: 0, amount: 0 },
        CANCELED: { count: 0, amount: 0 },
        FAILED: { count: 0, amount: 0 },
      };

      enrollments.forEach((e) => {
        if (e.paymentStatus && breakdown[e.paymentStatus as keyof typeof breakdown]) {
          breakdown[e.paymentStatus as keyof typeof breakdown].count++;
          breakdown[e.paymentStatus as keyof typeof breakdown].amount += Number(e.amount || 0);
        }
      });

      return breakdown;
    }),

  /**
   * Get outstanding payments (past due or failed)
   */
  getOutstandingPayments: authedProcedure
    .input(getOutstandingPaymentsSchema)
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

      // Get past due or failed enrollments
      const outstanding = await ctx.prisma.enrollment.findMany({
        where: {
          eventTypeId: { in: eventTypeIds },
          paymentStatus: { in: ["PAST_DUE", "FAILED"] },
        },
        include: {
          swimmer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              parent: { select: { email: true, name: true } },
            },
          },
          eventType: {
            select: { title: true },
          },
        },
        orderBy: { nextPaymentDate: "asc" },
      });

      return outstanding.map((e) => ({
        enrollmentId: e.id,
        swimmer: {
          name: `${e.swimmer.firstName} ${e.swimmer.lastName}`,
          parentEmail: e.swimmer.parent.email,
          parentName: e.swimmer.parent.name,
        },
        lesson: e.eventType.title,
        amount: Number(e.amount || 0),
        status: e.paymentStatus,
        dueDate: e.nextPaymentDate,
      }));
    }),

  /**
   * Export financial data
   */
  exportFinancialData: authedProcedure.input(exportFinancialDataSchema).query(async ({ ctx, input }) => {
    // Verify user is team admin/owner
    const membership = await ctx.prisma.membership.findFirst({
      where: {
        teamId: input.teamId,
        userId: ctx.user?.id,
        role: { in: ["ADMIN", "OWNER"] },
      },
    });
    if (!membership) throw new Error("Unauthorized");

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    // Get event types for this team
    const eventTypes = await ctx.prisma.eventType.findMany({
      where: { teamId: input.teamId },
      select: { id: true },
    });
    const eventTypeIds = eventTypes.map((et) => et.id);

    // Get enrollments with payment info
    const enrollments = await ctx.prisma.enrollment.findMany({
      where: {
        eventTypeId: { in: eventTypeIds },
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        swimmer: {
          select: {
            firstName: true,
            lastName: true,
            parent: { select: { email: true, name: true } },
          },
        },
        eventType: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const exportData = enrollments.map((e) => ({
      enrollmentId: e.id,
      swimmerName: `${e.swimmer.firstName} ${e.swimmer.lastName}`,
      parentName: e.swimmer.parent.name || "",
      parentEmail: e.swimmer.parent.email,
      lesson: e.eventType.title,
      status: e.status,
      paymentStatus: e.paymentStatus || "N/A",
      amount: Number(e.amount || 0),
      frequency: e.paymentFrequency || "N/A",
      enrolledDate: e.createdAt.toISOString(),
      nextPaymentDate: e.nextPaymentDate?.toISOString() || "N/A",
    }));

    if (input.format === "csv") {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [headers.join(",")];
      exportData.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header as keyof typeof row];
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(","));
      });
      return { data: csvRows.join("\n"), format: "csv" };
    }

    return { data: JSON.stringify(exportData, null, 2), format: "json" };
  }),
});

export default financialRouter;
