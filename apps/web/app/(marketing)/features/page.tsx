import Image from "next/image";

import { Icon } from "@calcom/ui/components/icon";

import { CtaButton, Reveal } from "../components-client";
import {
  FeatureTile,
  SectionHeading,
  SectionLead,
} from "../components-server";

export const metadata = {
  title: "Features — Lanebook swim school software",
  description:
    "Explore Lanebook features for managers, instructors, and parents: scheduling, attendance, kiosk check-in, billing, skill tracking, and messaging.",
};

export default function FeaturesPage() {
  return (
    <>
      {/* Header */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-32 text-center sm:px-6 lg:pb-20 lg:pt-40">
          <Reveal>
            <SectionHeading align="center">One platform, three perspectives</SectionHeading>
            <SectionLead align="center">
              Managers run the business, instructors run the lessons, and parents stay in
              the loop. Each gets a focused view of the same shared data.
            </SectionLead>
          </Reveal>
        </div>
      </section>

      <ManagersSection />
      <InstructorsSection />
      <ParentsSection />
      <CapabilitiesOverview />
      <FinalCta />
    </>
  );
}

/* ================================================================== */
/*  MANAGERS — 2x2 feature grid                                        */
/* ================================================================== */
function ManagersSection() {
  return (
    <section id="managers" className="scroll-mt-20 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <SectionHeading>For managers</SectionHeading>
          <SectionLead>
            Run the whole school from one dashboard. See revenue, utilization, and
            outstanding balances without exporting a single spreadsheet.
          </SectionLead>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {MANAGER_FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <FeatureTile icon={f.icon} title={f.title}>
                {f.body}
              </FeatureTile>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const MANAGER_FEATURES = [
  {
    icon: "calendar-range",
    title: "Term & class scheduling",
    body: "Build seasonal terms, recurring weekly classes, and holiday intensives. Set capacity per lane and assign instructors with conflict detection.",
  },
  {
    icon: "chart-bar",
    title: "Financials dashboard",
    body: "Track monthly recurring revenue, outstanding balances, and per-instructor utilization. Export CSVs for accounting when you need to.",
  },
  {
    icon: "users",
    title: "Staff & roster management",
    body: "Invite instructors, assign roles, and let them see only their own classes. Cover shifts and reassign lessons without breaking the schedule.",
  },
  {
    icon: "repeat",
    title: "Makeups & waitlists",
    body: "Auto-issue makeup credits with expiry and auto-promote the next waitlisted family the moment a spot opens. No manual list juggling.",
  },
];

/* ================================================================== */
/*  INSTRUCTORS — image / text split (single, no zigzag repeat)        */
/* ================================================================== */
function InstructorsSection() {
  return (
    <section
      id="instructors"
      className="scroll-mt-20 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-slate-800">
            <Image
              src="/marketing/instructor-tablet.png"
              alt="A swim instructor reviewing the live class roster on a tablet at poolside"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <SectionHeading tone="muted">For instructors</SectionHeading>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Teach first, paperwork later
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Instructors open a clean mobile roster, mark attendance with one tap, and log
            progress notes after class. The admin disappears so the lesson does not.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              "Live roster on any phone or tablet, poolside",
              "One-tap attendance and absence logging",
              "Per-lesson skill and progress notes",
              "Automatic level certificates when criteria are met",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                  <Icon name="check" size={13} />
                </span>
                <span className="text-base">{t}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  PARENTS — feature checklist in two columns                         */
/* ================================================================== */
function ParentsSection() {
  return (
    <section id="parents" className="scroll-mt-20 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading tone="muted">For parents</SectionHeading>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Everything families need, nothing they do not
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Parents check in, track progress, and manage payments from one account. No
              phone calls, no paper forms, no lost certificates.
            </p>
            <div className="mt-8">
              <CtaButton href="/pricing" variant="ghost">
                See plans
                <Icon name="arrow-right" size={16} />
              </CtaButton>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <ul className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {PARENT_FEATURES.map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
                    <Icon name={f.icon} size={18} />
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{f.title}</div>
                    <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{f.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const PARENT_FEATURES = [
  { icon: "smartphone", title: "Self check-in", body: "Find a swimmer and confirm arrival at the door kiosk." },
  { icon: "credit-card", title: "Easy payments", body: "Monthly fees charged automatically, receipts in the inbox." },
  { icon: "badge-check", title: "Progress tracking", body: "See skill notes and earned certificates after each term." },
  { icon: "message-circle", title: "Direct messaging", body: "Message the school about absences or makeup scheduling." },
  { icon: "calendar-check-2", title: "Book makeups", body: "Claim open spots from the waitlist without calling in." },
  { icon: "bell", title: "Reminders", body: "Class times, payment due dates, and absence alerts by email." },
];

/* ================================================================== */
/*  CAPABILITIES OVERVIEW — full-width numbered capability list         */
/* ================================================================== */
function CapabilitiesOverview() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <SectionHeading align="center">The full toolkit</SectionHeading>
          <SectionLead align="center">
            Every capability below ships on the School plan and above.
          </SectionLead>
        </Reveal>
        <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800 dark:bg-slate-800">
          {CAPABILITIES.map((c) => (
            <li key={c} className="flex items-center gap-3 bg-white px-5 py-4 dark:bg-slate-950">
              <Icon name="check" size={18} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const CAPABILITIES = [
  "Class & term scheduling",
  "Lane capacity & conflict detection",
  "Self-serve check-in kiosk",
  "Live instructor rosters",
  "Attendance & absence tracking",
  "Makeup credits with expiry",
  "Automatic waitlist promotion",
  "Stripe recurring billing",
  "Invoices & payment status",
  "Parent accounts & messaging",
  "Skill & progress notes",
  "Automatic level certificates",
  "Financials & MRR dashboard",
  "CSV exports for accounting",
  "Role-based staff access",
  "Email notifications",
  "Mobile-first poolside UI",
  "Dark mode",
];

/* ================================================================== */
/*  FINAL CTA                                                          */
/* ================================================================== */
function FinalCta() {
  return (
    <section className="bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 to-cyan-800 px-6 py-16 text-center sm:px-16">
            <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to see it on your pool deck?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-cyan-50">
              Set up your school and check in your first class today.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-cyan-700 shadow-sm transition-all hover:bg-cyan-50 active:scale-[0.98]"
              >
                Start free
              </a>
              <a
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                View pricing
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
