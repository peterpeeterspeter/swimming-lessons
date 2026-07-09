import Link from "next/link";

import { Icon } from "@calcom/ui/components/icon";

import { CtaButton, Reveal } from "../components-client";
import {
  PricingCard,
  SectionHeading,
  SectionLead,
} from "../components-server";

export const metadata = {
  title: "Pricing — Lanebook swim school software",
  description:
    "Simple, transparent pricing for swim schools. Start free, upgrade to School for billing and parent accounts, or talk to us about multiple locations.",
};

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-32 text-center sm:px-6 lg:pb-20 lg:pt-40">
          <Reveal>
            <SectionHeading align="center">Pricing that fits your school</SectionHeading>
            <SectionLead align="center">
              Begin free while you set up classes. Move to School when you are ready to
              bill families and run parent accounts.
            </SectionLead>
          </Reveal>
        </div>
      </section>

      {/* Plans */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Reveal className="h-full">
              <PricingCard
                name="Starter"
                price="$0"
                cadence="/mo"
                blurb="Get organized before you bill. For solo instructors and small programs."
                features={[
                  "Class scheduling & rosters",
                  "Attendance & kiosk check-in",
                  "Up to 50 swimmers",
                  "1 instructor",
                  "Email support",
                ]}
              />
            </Reveal>
            <Reveal delay={0.08} className="h-full">
              <PricingCard
                name="School"
                price="$79"
                cadence="/mo"
                blurb="The full platform for multi-instructor schools that bill families directly."
                featured
                features={[
                  "Everything in Starter",
                  "Unlimited swimmers & instructors",
                  "Stripe recurring billing & invoices",
                  "Parent accounts & two-way messaging",
                  "Skill tracking & certificates",
                  "Priority email support",
                ]}
              />
            </Reveal>
            <Reveal delay={0.16} className="h-full">
              <PricingCard
                name="Multi-site"
                price="Custom"
                blurb="For organizations running several pools or franchise locations."
                cta="Talk to us"
                ctaHref="mailto:hello@swimming-lessons.com"
                features={[
                  "Everything in School",
                  "Multiple locations & roles",
                  "Consolidated financials",
                  "Custom onboarding & data import",
                  "Dedicated support",
                ]}
              />
            </Reveal>
          </div>
          <Reveal>
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              All plans include attendance, makeups, waitlists, and progress notes. Annual
              billing available on request.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Compare plans — category-grouped matrix */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading align="center">Compare plans</SectionHeading>
          </Reveal>
          <div className="mt-10 space-y-10">
            {COMPARE_GROUPS.map((group) => (
              <Reveal key={group.category}>
                <CompareGroup group={group} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <Reveal>
            <SectionHeading>Frequently asked questions</SectionHeading>
          </Reveal>
          <div className="mt-8 divide-y divide-slate-200 dark:divide-slate-800">
            {FAQS.map((f) => (
              <Reveal as="div" key={f.q} className="py-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {f.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.a}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-200 px-6 py-14 text-center dark:border-slate-800">
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Try Lanebook free this term
              </h2>
              <p className="max-w-md text-slate-600 dark:text-slate-400">
                Set up your classes and check in swimmers in an afternoon. No credit card
                required to start.
              </p>
              <CtaButton href="/signup">
                Start free
                <Icon name="arrow-right" size={16} />
              </CtaButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison matrix data (grouped, sparse dividers)                  */
/* ------------------------------------------------------------------ */
type Cell = "yes" | "no" | string;

const PLAN_HEADERS = ["Starter", "School", "Multi-site"] as const;

const COMPARE_GROUPS: { category: string; rows: { label: string; cells: [Cell, Cell, Cell] }[] }[] = [
  {
    category: "Scheduling & attendance",
    rows: [
      { label: "Class scheduling & rosters", cells: ["yes", "yes", "yes"] },
      { label: "Kiosk self check-in", cells: ["yes", "yes", "yes"] },
      { label: "Makeup credits & waitlists", cells: ["yes", "yes", "yes"] },
      { label: "Swimmers included", cells: ["50", "Unlimited", "Unlimited"] },
    ],
  },
  {
    category: "Billing & parents",
    rows: [
      { label: "Stripe recurring billing", cells: ["no", "yes", "yes"] },
      { label: "Invoices & payment tracking", cells: ["no", "yes", "yes"] },
      { label: "Parent accounts", cells: ["no", "yes", "yes"] },
      { label: "Two-way parent messaging", cells: ["no", "yes", "yes"] },
    ],
  },
  {
    category: "Account & support",
    rows: [
      { label: "Skill tracking & certificates", cells: ["no", "yes", "yes"] },
      { label: "Multiple locations", cells: ["no", "no", "yes"] },
      { label: "Consolidated financials", cells: ["no", "no", "yes"] },
      { label: "Support", cells: ["Email", "Priority email", "Dedicated"] },
    ],
  },
];

function CompareGroup({
  group,
}: {
  group: { category: string; rows: { label: string; cells: [Cell, Cell, Cell] }[] };
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
        {group.category}
      </h3>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60">
              <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                <span className="sr-only">Feature</span>
              </th>
              {PLAN_HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {group.rows.map((row) => (
              <tr key={row.label} className="bg-white dark:bg-slate-950">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.label}</td>
                {row.cells.map((c, i) => (
                  <td key={i} className="px-4 py-3 text-center">
                    <CompareCell value={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareCell({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <span
        aria-label="Included"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
      >
        <Icon name="check" size={13} />
      </span>
    );
  }
  if (value === "no") {
    return <span className="text-slate-300 dark:text-slate-700" aria-label="Not included">&ndash;</span>;
  }
  return <span className="text-slate-700 dark:text-slate-300">{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */
const FAQS = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The Starter plan is free and lets you schedule classes and run attendance immediately. You only add billing details when you move to the School plan.",
  },
  {
    q: "How does billing work for families?",
    a: "School and Multi-site plans connect to Stripe. You set monthly or term fees per lesson type, and Lanebook charges families automatically and tracks payment status for each swimmer.",
  },
  {
    q: "Can parents check their kids in themselves?",
    a: "Yes. Kiosk mode runs on any tablet at the pool door. Parents search for their swimmer and confirm check-in, which syncs to the instructor roster instantly.",
  },
  {
    q: "What happens when a child misses a lesson?",
    a: "Absences are recorded automatically and a makeup credit is issued with an expiry date. When a spot opens, the next family on the waitlist is promoted automatically.",
  },
  {
    q: "Can I migrate from another system?",
    a: "Yes. For School plans we help import your swimmers, classes, and instructors. Multi-site plans include full assisted onboarding and data migration.",
  },
];
