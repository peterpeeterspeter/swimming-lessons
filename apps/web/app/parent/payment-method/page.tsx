"use client";

import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Button } from "@calcom/ui/components/button";
import { showToast } from "@calcom/ui/components/toast";

import { trpc } from "../../_trpc/trpc";

// Initialize Stripe (use your publishable key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function PaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        showToast(error.message || "Failed to update payment method", "error");
      } else {
        showToast("Payment method updated successfully!", "success");
        onSuccess();
      }
    } catch (err) {
      showToast("An unexpected error occurred", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" color="primary" className="w-full" loading={isProcessing}>
        Update Payment Method
      </Button>
    </form>
  );
}

export default function PaymentMethodPage() {
  const { t } = useLocale();
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  // Get user's swimmers with enrollments
  const { data: swimmers } = trpc.viewer.swim.swimmers.list.useQuery();

  // Get enrollments for all swimmers
  const allEnrollments =
    swimmers?.flatMap((swimmer) =>
      trpc.viewer.swim.enrollments.listBySwimmer.useQuery(
        { swimmerId: swimmer.id },
        {
          enabled: !!swimmer.id,
        }
      )
    ) || [];

  // Get active paid enrollments
  const paidEnrollments = allEnrollments
    .flatMap((query) => query.data || [])
    .filter((e) => e.stripeSubscriptionId);

  // Get payment history for selected enrollment
  const { data: paymentHistory } = trpc.viewer.swim.enrollmentPayments.getPaymentHistory.useQuery(
    { enrollmentId: selectedEnrollmentId },
    { enabled: !!selectedEnrollmentId }
  );

  const selectedEnrollment = paidEnrollments.find((e) => e.id === selectedEnrollmentId);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Payment Method Management</h1>

      {/* Enrollment Selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium">Select Enrollment</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={selectedEnrollmentId}
          onChange={(e) => {
            setSelectedEnrollmentId(e.target.value);
            setShowUpdateForm(false);
          }}>
          <option value="">-- Select an enrollment --</option>
          {paidEnrollments.map((enrollment) => (
            <option key={enrollment.id} value={enrollment.id}>
              {enrollment.swimmer?.firstName} {enrollment.swimmer?.lastName} - {enrollment.eventType?.title}
            </option>
          ))}
        </select>
      </div>

      {selectedEnrollment && (
        <>
          {/* Current Payment Info */}
          <div className="mb-6 rounded-lg border bg-gray-50 p-4">
            <h2 className="mb-3 font-semibold">Current Payment Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  ${Number(selectedEnrollment.amount).toFixed(2)}/
                  {selectedEnrollment.paymentFrequency?.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    selectedEnrollment.paymentStatus === "ACTIVE" ? "text-green-600" : "text-yellow-600"
                  }`}>
                  {selectedEnrollment.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Payment:</span>
                <span className="font-medium">
                  {selectedEnrollment.nextPaymentDate
                    ? new Date(selectedEnrollment.nextPaymentDate).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Update Payment Method Button */}
          {!showUpdateForm && (
            <Button color="primary" onClick={() => setShowUpdateForm(true)} className="mb-6">
              Update Payment Method
            </Button>
          )}

          {/* Payment Method Update Form */}
          {showUpdateForm && (
            <div className="mb-6 rounded-lg border p-6">
              <h2 className="mb-4 font-semibold">Update Payment Method</h2>
              <Elements stripe={stripePromise}>
                <PaymentMethodForm onSuccess={() => setShowUpdateForm(false)} />
              </Elements>
            </div>
          )}

          {/* Payment History */}
          <div className="overflow-hidden rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="font-semibold">Payment History</h2>
            </div>
            {!paymentHistory || paymentHistory.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No payment history yet</div>
            ) : (
              <div className="divide-y">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">${payment.amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.created).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                          payment.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {payment.status}
                      </div>
                      {payment.hostedInvoiceUrl && (
                        <a
                          href={payment.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-xs text-blue-600">
                          View Invoice
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {paidEnrollments.length === 0 && (
        <div className="rounded-lg border p-8 text-center text-gray-500">
          No active paid enrollments found
        </div>
      )}
    </main>
  );
}
