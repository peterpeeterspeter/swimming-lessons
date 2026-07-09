import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@calcom/ui/components/icon";
import { LogoMark } from "./components-client";

/* ------------------------------------------------------------------ */
/*  Section heading (eyebrow optional — used sparingly across site)    */
/* ------------------------------------------------------------------ */
export function SectionHeading({
  children,
  align = "left",
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "center";
  tone?: "default" | "muted";
  className?: string;
}) {
  return (
    <h2
      className={`max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.75rem] md:leading-[1.1] dark:text-white ${
        align === "center" ? "mx-auto text-center" : ""
      } ${tone === "muted" ? "text-slate-500 dark:text-slate-400" : ""} ${className}`}
    >
      {children}
    </h2>
  );
}

export function SectionLead({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <p
      className={`mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 ${
        align === "center" ? "mx-auto text-center" : ""
      } ${className}`}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat                                                               */
/* ------------------------------------------------------------------ */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature tile (for bento / grids)                                   */
/* ------------------------------------------------------------------ */
export function FeatureTile({
  icon,
  title,
  children,
  className = "",
}: {
  icon: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
        <Icon name={icon} size={20} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing card                                                       */
/* ------------------------------------------------------------------ */
export function PricingCard({
  name,
  price,
  cadence,
  blurb,
  features,
  cta = "Start free",
  ctaHref = "/signup",
  featured = false,
}: {
  name: string;
  price: string;
  cadence?: string;
  blurb: string;
  features: string[];
  cta?: string;
  ctaHref?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl p-7 ${
        featured
          ? "border-2 border-cyan-600 bg-white shadow-xl shadow-cyan-600/10 dark:bg-slate-900"
          : "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-7 inline-flex items-center rounded-full bg-cyan-600 px-3 py-1 text-xs font-semibold text-white">
          Most popular
        </span>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{name}</h3>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{blurb}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {price}
        </span>
        {cadence && <span className="text-sm text-slate-500 dark:text-slate-400">{cadence}</span>}
      </div>
      <Link
        href={ctaHref}
        className={`mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition-all active:scale-[0.98] ${
          featured
            ? "bg-cyan-600 text-white hover:bg-cyan-500"
            : "border border-slate-300 text-slate-900 hover:border-slate-400 dark:border-slate-700 dark:text-slate-100"
        }`}
      >
        {cta}
      </Link>
      <ul className="mt-auto space-y-3 pt-7">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            <Icon
              name="circle-check"
              size={18}
              className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400"
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Site footer                                                        */
/* ------------------------------------------------------------------ */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark className="h-7 w-7" />
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Lanebook
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Scheduling, attendance, billing, and parent communication for modern swim schools.
            </p>
          </div>

          <FooterCol
            title="Product"
            links={[
              { label: "Find a school", href: "/swim-lessons" },
              { label: "Features", href: "/features" },
              { label: "Pricing", href: "/pricing" },
              { label: "Start free", href: "/signup" },
              { label: "Sign in", href: "/auth/login" },
            ]}
          />
          <FooterCol
            title="Roles"
            links={[
              { label: "For managers", href: "/features#managers" },
              { label: "For instructors", href: "/features#instructors" },
              { label: "For parents", href: "/features#parents" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "How it works", href: "/#how-it-works" },
              { label: "Contact", href: "mailto:hello@swimming-lessons.com" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {year} Lanebook. Built for swim schools.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Swimming-Lessons.com
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
      <ul className="mt-3 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-slate-500 transition-colors hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
