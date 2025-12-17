import Stripe from "stripe";
import { z } from "zod";

import { PaymentStatus, PaymentFrequency } from "@calcom/prisma/enums";

import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";

// Initialize Stripe (ensure STRIPE_PRIVATE_KEY is in env)
const stripe = process.env.STRIPE_PRIVATE_KEY
  ? new Stripe(process.env.STRIPE_PRIVATE_KEY, { apiVersion: "2024-11-20.acacia" })
  : null;

const createEnrollmentWithPaymentSchema = z.object({
  swimmerId: z.string().uuid(),
  eventTypeId: z.number().int(),
  paymentFrequency: z.enum(["MONTHLY", "QUARTERLY", "SESSION", "ANNUAL"]),
  amount: z.number().positive(),
  stripePriceId: z.string().optional(), // Optional: use existing Stripe Price
});

const updatePaymentMethodSchema = z.object({
  enrollmentId: z.string().uuid(),
  paymentMethodId: z.string(), // Stripe payment method ID from frontend
});

const cancelEnrollmentPaymentSchema = z.object({
  enrollmentId: z.string().uuid(),
});

const retryFailedPaymentSchema = z.object({
  enrollmentId: z.string().uuid(),
});

const enrollmentPaymentsRouter = router({
  /**
   * Create enrollment with Stripe subscription
   */
  createEnrollmentWithPayment: authedProcedure
    .input(createEnrollmentWithPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new Error("Stripe not configured");

      // Verify swimmer belongs to user
      const swimmer = await ctx.prisma.swimmer.findFirst({
        where: { id: input.swimmerId, parentId: ctx.user?.id },
      });
      if (!swimmer) throw new Error("Unauthorized");

      // Get or create Stripe customer for user
      let stripeCustomerId = ctx.user?.metadata?.stripeCustomerId as string | undefined;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: ctx.user?.email || undefined,
          name: ctx.user?.name || undefined,
          metadata: { userId: ctx.user?.id.toString() || "" },
        });
        stripeCustomerId = customer.id;

        // Save customer ID to user metadata
        await ctx.prisma.user.update({
          where: { id: ctx.user?.id },
          data: {
            metadata: {
              ...(ctx.user?.metadata as object),
              stripeCustomerId,
            },
          },
        });
      }

      // Create or use Stripe Price
      let priceId = input.stripePriceId;
      if (!priceId) {
        const price = await stripe.prices.create({
          unit_amount: Math.round(input.amount * 100), // Convert to cents
          currency: "usd",
          recurring:
            input.paymentFrequency === "SESSION"
              ? undefined
              : {
                  interval: input.paymentFrequency === "MONTHLY" ? "month" : "month",
                  interval_count:
                    input.paymentFrequency === "QUARTERLY" ? 3 : input.paymentFrequency === "ANNUAL" ? 12 : 1,
                },
          product_data: {
            name: `Swim Lesson Enrollment`,
          },
        });
        priceId = price.id;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      // Create enrollment
      const enrollment = await ctx.prisma.enrollment.create({
        data: {
          swimmerId: input.swimmerId,
          eventTypeId: input.eventTypeId,
          status: "ACTIVE",
          paymentStatus: PaymentStatus.PENDING,
          paymentFrequency: input.paymentFrequency as PaymentFrequency,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          amount: input.amount,
          nextPaymentDate: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
        },
      });

      // Return client secret for frontend to complete payment
      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

      return {
        enrollment,
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
      };
    }),

  /**
   * Update payment method for enrollment
   */
  updatePaymentMethod: authedProcedure.input(updatePaymentMethodSchema).mutation(async ({ ctx, input }) => {
    if (!stripe) throw new Error("Stripe not configured");

    const enrollment = await ctx.prisma.enrollment.findFirst({
      where: { id: input.enrollmentId, swimmer: { parentId: ctx.user?.id } },
    });
    if (!enrollment || !enrollment.stripeSubscriptionId) throw new Error("Not found");

    // Attach payment method to customer
    const subscription = await stripe.subscriptions.retrieve(enrollment.stripeSubscriptionId);
    await stripe.paymentMethods.attach(input.paymentMethodId, {
      customer: subscription.customer as string,
    });

    // Update subscription default payment method
    await stripe.subscriptions.update(enrollment.stripeSubscriptionId, {
      default_payment_method: input.paymentMethodId,
    });

    return { success: true };
  }),

  /**
   * Cancel enrollment payment subscription
   */
  cancelEnrollmentPayment: authedProcedure
    .input(cancelEnrollmentPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new Error("Stripe not configured");

      const enrollment = await ctx.prisma.enrollment.findFirst({
        where: { id: input.enrollmentId, swimmer: { parentId: ctx.user?.id } },
      });
      if (!enrollment || !enrollment.stripeSubscriptionId) throw new Error("Not found");

      // Cancel Stripe subscription
      await stripe.subscriptions.cancel(enrollment.stripeSubscriptionId);

      // Update enrollment
      await ctx.prisma.enrollment.update({
        where: { id: input.enrollmentId },
        data: {
          paymentStatus: PaymentStatus.CANCELED,
          status: "WITHDRAWN",
        },
      });

      return { success: true };
    }),

  /**
   * Retry failed payment
   */
  retryFailedPayment: authedProcedure.input(retryFailedPaymentSchema).mutation(async ({ ctx, input }) => {
    if (!stripe) throw new Error("Stripe not configured");

    const enrollment = await ctx.prisma.enrollment.findFirst({
      where: { id: input.enrollmentId, swimmer: { parentId: ctx.user?.id } },
    });
    if (!enrollment || !enrollment.stripeSubscriptionId) throw new Error("Not found");

    // Get latest invoice and retry
    const subscription = await stripe.subscriptions.retrieve(enrollment.stripeSubscriptionId);
    const latestInvoiceId = subscription.latest_invoice as string;

    if (latestInvoiceId) {
      const invoice = await stripe.invoices.retrieve(latestInvoiceId);
      if (invoice.status === "open") {
        await stripe.invoices.pay(latestInvoiceId);
      }
    }

    // Update enrollment status
    await ctx.prisma.enrollment.update({
      where: { id: input.enrollmentId },
      data: { paymentStatus: PaymentStatus.ACTIVE },
    });

    return { success: true };
  }),

  /**
   * Get payment history for enrollment
   */
  getPaymentHistory: authedProcedure
    .input(z.object({ enrollmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!stripe) throw new Error("Stripe not configured");

      const enrollment = await ctx.prisma.enrollment.findFirst({
        where: { id: input.enrollmentId, swimmer: { parentId: ctx.user?.id } },
      });
      if (!enrollment || !enrollment.stripeSubscriptionId) return [];

      const invoices = await stripe.invoices.list({
        subscription: enrollment.stripeSubscriptionId,
        limit: 100,
      });

      return invoices.data.map((inv) => ({
        id: inv.id,
        amount: inv.total / 100,
        status: inv.status,
        created: new Date(inv.created * 1000),
        paidAt: inv.status_transitions.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : null,
        hostedInvoiceUrl: inv.hosted_invoice_url,
      }));
    }),
});

export default enrollmentPaymentsRouter;
