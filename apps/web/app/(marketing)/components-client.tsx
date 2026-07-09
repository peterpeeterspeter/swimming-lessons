"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
  type Variants,
} from "framer-motion";

import { Icon } from "@calcom/ui/components/icon";

/* ------------------------------------------------------------------ */
/*  Reveal — scroll-triggered fade/rise, RSC-safe client island         */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}

/* ------------------------------------------------------------------ */
/*  Site navigation                                                    */
/* ------------------------------------------------------------------ */
const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteNav() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8);
  });

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
          scrolled || open
            ? "border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2" aria-label="Lanebook home">
          <LogoMark className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Lanebook
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-full bg-cyan-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-500 active:scale-[0.98]"
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 md:hidden dark:text-slate-200"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Icon name={open ? "x" : "menu"} size={22} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-b border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="space-y-1 px-4 py-4 sm:px-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {l.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500"
              >
                Start free
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" fill="#0891b2" />
      {/* three lane lines + a swimmer dot */}
      <path d="M7 21h18" stroke="white" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 16.5h18" stroke="white" strokeOpacity="0.85" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 12h18" stroke="white" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="20.5" cy="11" r="2.4" fill="white" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero entrance animation                                            */
/* ------------------------------------------------------------------ */
const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export function HeroStagger({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={heroContainer}
      initial={reduce ? false : "hidden"}
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? undefined : heroItem} className={className}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Primary call to action with tactile feedback                       */
/* ------------------------------------------------------------------ */
export function CtaButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all active:scale-[0.98] sm:h-12 sm:text-base";
  const styles =
    variant === "primary"
      ? "bg-cyan-600 text-white shadow-sm hover:bg-cyan-500"
      : "border border-slate-300 text-slate-900 hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

/* A thin row of feature pills used under hero CTAs (client for hover) */
export function MiniCapRow({ items }: { items: { icon: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <Icon name={it.icon} size={16} className="text-cyan-600 dark:text-cyan-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}

export { Fragment };
