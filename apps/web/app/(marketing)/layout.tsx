import type { ReactNode } from "react";

import { SiteNav } from "./components-client";
import { SiteFooter } from "./components-server";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* SiteNav is a client component (scroll + mobile menu) */}
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
