import Image from "next/image";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSession } from "@calcom/features/auth/lib/getServerSession";

import { Icon } from "@calcom/ui/components/icon";

import { buildLegacyRequest } from "@lib/buildLegacyCtx";

import {
  CtaButton,
  HeroItem,
  HeroStagger,
  MiniCapRow,
  Reveal,
} from "./components-client";
import {
  FeatureTile,
  PricingCard,
  SectionHeading,
  SectionLead,
  Stat,
} from "./components-server";

export const metadata = {
  title: "Lanebook — Swim school scheduling, attendance & billing software",
  description:
    "Lanebook runs the operations of your swim school: class scheduling, instructor check-in, attendance, parent messaging, and recurring billing in one place.",
};

export default async function LandingPage() {
  // Logged-in users skip the marketing page and land in the app.
  const session = await getServerSession({
    req: buildLegacyRequest(await headers(), await cookies()),
  });
  if (session?.user?.id) redirect("/swim");

  return (
    <>
      <Hero />
      <CapabilitiesStrip />
      <HowItWorks />
      <BentoFeatures />
      <AttendanceSpotlight />
      <Testimonial />
      <PricingTeaser />
      <FinalCta />
    </>
  );
}

/* ================================================================== */
/*  HERO — asymmetric split                                           */
/* ================================================================== */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* soft water-tone wash, top only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{
          background:
            "radial-gradient(120% 80% at 80% 0%, rgba(8,145,178,0.10), transparent 60%), radial-gradient(90% 70% at 0% 10%, rgba(14,165,233,0.07), transparent 55%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-28 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-28 lg:pt-32">
        <div className="lg:col-span-6">
          <HeroStagger>
            <HeroItem>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                Swim school operations, in one platform
              </span>
            </HeroItem>

            <HeroItem>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                Less admin. More pool time.
              </h1>
            </HeroItem>

            <HeroItem>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Lanebook handles class scheduling, instructor check-in, attendance,
                parent communication, and recurring billing so your team can focus on
                teaching kids to swim.
              </p>
            </HeroItem>

            <HeroItem>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaButton href="/signup">
                  Start free
                  <Icon name="arrow-right" size={16} />
                </CtaButton>
                <CtaButton href="/features" variant="ghost">
                  Explore features
                </CtaButton>
              </div>
            </HeroItem>

            <HeroItem>
              <div className="mt-8">
                <MiniCapRow
                  items={[
                    { icon: "calendar-check-2", label: "Class scheduling" },
                    { icon: "user-check", label: "Attendance" },
                    { icon: "credit-card", label: "Billing" },
                    { icon: "message-circle", label: "Parent comms" },
                  ]}
                />
              </div>
            </HeroItem>
          </HeroStagger>
        </div>

        {/* Hero image */}
        <div className="lg:col-span-6">
          <HeroItem className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 dark:border-slate-800">
              <Image
                src="/marketing/hero-pool.png"
                alt="A bright indoor swimming pool with calm turquoise water and empty lanes"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            {/* floating spec card */}
            <div className="absolute -bottom-5 -left-2 hidden rounded-xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur sm:block dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
                  <Icon name="check" size={16} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Tuesday 4:00 PM
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    6 of 6 checked in
                  </div>
                </div>
              </div>
            </div>
          </HeroItem>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  CAPABILITIES STRIP — honest platform facts, no fake customer count */
/* ================================================================== */
function CapabilitiesStrip() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <Stat value="3 roles" label="Manager, instructor, parent views" />
          <Stat value="1 check-in" label="Self-serve kiosk mode" />
          <Stat value="Auto" label="Recurring billing & invoices" />
          <Stat value="Anywhere" label="Mobile-first, works at poolside" />
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  HOW IT WORKS — horizontal stepper, not three equal cards           */
/* ================================================================== */
const STEPS = [
  {
    n: "01",
    title: "Set up your classes",
    body: "Define lesson types, levels, lanes, and instructors. Repeat weekly terms or one-off clinics in a few clicks.",
  },
  {
    n: "02",
    title: "Check swimmers in",
    body: "Instructors or a self-serve kiosk mark attendance poolside. Makeups, absences, and waitlists update automatically.",
  },
  {
    n: "03",
    title: "Bill and track progress",
    body: "Stripe handles monthly fees. Skill progress and certificates flow to each parent without extra paperwork.",
  },
] as const;

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <SectionHeading>How Lanebook works</SectionHeading>
          <SectionLead>
            Three steps take a swim school from spreadsheets to a single system that
            parents, instructors, and managers all trust.
          </SectionLead>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-y-12 md:grid-cols-3 md:gap-x-8">
          {/* connecting line on desktop */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent md:block dark:via-slate-800"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08} className="relative">
              <div className="flex items-center gap-4 md:block">
                <div className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-cyan-400">
                  {s.n}
                </div>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                {s.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {s.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  BENTO FEATURES — asymmetric, varied backgrounds                    */
/* ================================================================== */
function BentoFeatures() {
  return (
    <section className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <SectionHeading>Everything your swim school runs on</SectionHeading>
          <SectionLead>
            Replace the patchwork of calendars, spreadsheets, and payment apps with one
            connected platform.
          </SectionLead>
        </Reveal>

        {/* 
          Bento grid: 6 cells, asymmetric.
          col-span on lg: hero(6) + two stacked(6 split into rows) ...
          Layout families vary: image tile, gradient tile, text tiles.
        */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-6">
          {/* Large feature tile with image — spans 4 cols, 2 rows */}
          <Reveal className="md:col-span-4 md:row-span-2">
            <div className="group relative flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <Image
                src="/marketing/lesson-warm.png"
                alt="A swim instructor guiding children during a group lesson in a bright pool"
                fill
                sizes="(min-width: 768px) 66vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
              <div className="relative p-7">
                <h3 className="text-2xl font-semibold text-white">
                  Attendance and makeups, handled
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-200">
                  Track who showed up, credit makeups with expiry dates, and auto-promote
                  the next family off the waitlist when a spot opens.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="md:col-span-2">
            <FeatureTile icon="repeat" title="Recurring terms">
              Schedule seasonal terms, holiday intensives, and private lessons with
              capacity per lane and level.
            </FeatureTile>
          </Reveal>

          <Reveal delay={0.1} className="md:col-span-2">
            {/* gradient tile for background diversity */}
            <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-800 p-6 text-white">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Icon name="credit-card" size={20} />
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold">Billing on autopilot</h3>
                <p className="mt-2 text-sm leading-relaxed text-cyan-50">
                  Stripe subscriptions, invoices, and payment-status tracking without the
                  end-of-month spreadsheet panic.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="md:col-span-3">
            <FeatureTile icon="badge-check" title="Skill tracking & certificates">
              Record progress notes after each lesson and generate level certificates
              automatically when a swimmer meets the criteria.
            </FeatureTile>
          </Reveal>

          <Reveal delay={0.1} className="md:col-span-3">
            <FeatureTile icon="message-circle" title="Parent messaging">
              Two-way messages, absence notifications, and payment reminders reach parents
              by email without staff copying details between apps.
            </FeatureTile>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  ATTENDANCE SPOTLIGHT — single image/text split (no zigzag repeat)  */
/* ================================================================== */
function AttendanceSpotlight() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <Reveal>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-slate-800">
            <Image
              src="/marketing/instructor-tablet.png"
              alt="A swim instructor reviewing the class roster on a tablet at poolside"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <SectionHeading tone="muted">Built for the pool deck</SectionHeading>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Check in 30 kids in under a minute
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            A kiosk mode lets parents self-check-in at the door. Instructors see live
            rosters on any phone or tablet, mark attendance with one tap, and spend the
            first minute of class teaching instead of taking roll.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              "Self-serve parent kiosk with swimmer search",
              "Live roster synced to every instructor device",
              "Auto-deduct makeups and flag absences instantly",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                  <Icon name="check" size={13} />
                </span>
                <span className="text-base">{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <CtaButton href="/features" variant="ghost">
              See all features
              <Icon name="arrow-right" size={16} />
            </CtaButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  TESTIMONIAL — full-width quote                                     */
/* ================================================================== */
function Testimonial() {
  return (
    <section className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <span className="text-5xl leading-none text-cyan-500">&ldquo;</span>
          <blockquote className="mt-4 text-2xl font-medium leading-snug tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            We cut the time spent on scheduling and billing almost in half. Parents check
            in themselves, instructors see everything on their phones, and I finally have a
            single dashboard for the whole school.
          </blockquote>
          <div className="mt-7">
            <div className="text-base font-semibold text-slate-900 dark:text-white">
              Maria Delgado
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Aquatics Director, Cypress Aquatic Center
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  PRICING TEASER — two cards, link to /pricing                       */
/* ================================================================== */
function PricingTeaser() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <SectionHeading align="center">Simple pricing that scales with your school</SectionHeading>
          <SectionLead align="center">
            Start free. Upgrade when you are ready to run billing and parent accounts.
          </SectionLead>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          <Reveal className="h-full">
            <PricingCard
              name="Starter"
              price="$0"
              cadence="/mo"
              blurb="For a single instructor or small program getting organized."
              features={[
                "Class scheduling & rosters",
                "Attendance & kiosk check-in",
                "Up to 50 swimmers",
                "Email support",
              ]}
            />
          </Reveal>
          <Reveal delay={0.08} className="h-full">
            <PricingCard
              name="School"
              price="$79"
              cadence="/mo"
              blurb="For multi-instructor schools that bill families directly."
              featured
              features={[
                "Everything in Starter",
                "Unlimited swimmers & instructors",
                "Stripe recurring billing & invoices",
                "Parent accounts & messaging",
                "Skill tracking & certificates",
              ]}
            />
          </Reveal>
        </div>
        <Reveal>
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Running a larger organization or multiple locations?{" "}
            <Link
              href="mailto:hello@swimming-lessons.com"
              className="font-medium text-cyan-600 underline-offset-4 hover:underline dark:text-cyan-400"
            >
              Talk to us
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  FINAL CTA — teal band                                              */
/* ================================================================== */
function FinalCta() {
  return (
    <section className="bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 to-cyan-800 px-6 py-16 text-center sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 0%, rgba(255,255,255,0.25), transparent 70%)",
              }}
            />
            <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Get your swim school organized this term
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-cyan-50">
              Set up classes, check in swimmers, and start billing in an afternoon. No
              credit card to begin.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-base font-semibold text-cyan-700 shadow-sm transition-all hover:bg-cyan-50 active:scale-[0.98]"
              >
                Start free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
