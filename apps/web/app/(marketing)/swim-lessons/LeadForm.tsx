"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { trpc } from "../../_trpc/trpc";
import { showToast } from "@calcom/ui/components/toast";
import { Button } from "@calcom/ui/components/button";
import { EmailField, TextField, TextAreaField } from "@calcom/ui/components/form";

const leadSchema = z.object({
  parentName: z.string().min(2, "Your name is required"),
  parentEmail: z.string().email("Valid email required"),
  parentPhone: z.string().optional(),
  childName: z.string().optional(),
  childAge: z.string().optional(),
  childLevel: z.string().optional(),
  message: z.string().max(2000).optional(),
});

type LeadValues = z.infer<typeof leadSchema>;

const LEVELS = [
  "Beginner (not water-safe)",
  "Water-safe / can float",
  "Learning strokes",
  "Freestyle + backstroke",
  "Advanced / pre-team",
];

export function LeadForm({ listingId, schoolName }: { listingId: string; schoolName: string }) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const mutate = trpc.viewer.swim.directory.submitLead.useMutation();

  const methods = useForm<LeadValues>({
    resolver: zodResolver(leadSchema),
  });

  const onSubmit = async (values: LeadValues) => {
    try {
      await mutate.mutateAsync({
        listingId,
        parentName: values.parentName,
        parentEmail: values.parentEmail,
        parentPhone: values.parentPhone || undefined,
        childName: values.childName || undefined,
        childAge: values.childAge ? parseInt(values.childAge, 10) : undefined,
        childLevel: values.childLevel || undefined,
        message: values.message || undefined,
        source: "directory",
      });
      setSubmitted(true);
      showToast("Your inquiry has been sent to " + schoolName, "success");
    } catch (e) {
      showToast("Something went wrong. Please try again.", "error");
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-950">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 6 9 17l-5-5" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Inquiry sent</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {schoolName} will contact you within 1-2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Your name"
          placeholder="Jane Smith"
          required
          {...methods.register("parentName")}
        />
        <EmailField
          label="Email"
          placeholder="jane@example.com"
          required
          {...methods.register("parentEmail")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Phone (optional)"
          placeholder="+1 555 000 0000"
          {...methods.register("parentPhone")}
        />
        <TextField
          label="Child's name (optional)"
          placeholder="Alex"
          {...methods.register("childName")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Child's age (optional)"
          placeholder="6"
          type="number"
          {...methods.register("childAge")}
        />
        <div>
          <label className="text-default mb-1 block text-sm font-medium">
            Swimming level (optional)
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            {...methods.register("childLevel")}
          >
            <option value="">Select level...</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-default mb-1 block text-sm font-medium">
          Message (optional)
        </label>
        <textarea
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          rows={3}
          placeholder="Tell us what you're looking for..."
          {...methods.register("message")}
        />
      </div>
      {methods.formState.errors.parentName && (
        <p className="text-sm text-red-600">{methods.formState.errors.parentName.message}</p>
      )}
      {methods.formState.errors.parentEmail && (
        <p className="text-sm text-red-600">{methods.formState.errors.parentEmail.message}</p>
      )}
      <Button
        type="submit"
        color="primary"
        className="w-full justify-center"
        loading={methods.formState.isSubmitting}
      >
        Send inquiry
      </Button>
      <p className="text-center text-xs text-slate-400">
        Your details are sent directly to {schoolName}. We never share your information.
      </p>
    </form>
  );
}
