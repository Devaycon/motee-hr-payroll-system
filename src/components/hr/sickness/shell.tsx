"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { SICKNESS_BASE, useCanManageSickness } from "./hooks";

const TABS = [
  { href: SICKNESS_BASE, label: "Absence Records", exact: true },
  { href: `${SICKNESS_BASE}/bradford`, label: "Bradford Factor Dashboard" },
  { href: `${SICKNESS_BASE}/schemes`, label: "Sickness Schemes" },
  { href: `${SICKNESS_BASE}/return-to-work`, label: "Return-to-Work Reviews" },
  { href: `${SICKNESS_BASE}/alerts`, label: "Alerts & Reporting" },
  { href: `${SICKNESS_BASE}/approval-chain`, label: "Approval Chain" },
];

/** Header, privacy notice and the module's sub-navigation. */
export function SicknessShell({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const canManage = useCanManageSickness();
  const active = (t: (typeof TABS)[number]) =>
    t.exact ? pathname === t.href || pathname.startsWith(`${SICKNESS_BASE}/records`) : pathname.startsWith(t.href);

  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4 pt-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Sickness &amp; Absence</h1>
          <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">
            Report and approve sickness, track fit notes and return-to-work, apply your
            company sick pay schemes and monitor Bradford Factor scores — one end-to-end process.
          </p>
        </div>
        <div className="flex gap-2">
          {actions}
          {canManage && (
            <Button asChild className="gap-1.5">
              <Link href={`${SICKNESS_BASE}/report`}>
                <Plus className="h-4 w-4" /> Report Sickness
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-50 dark:bg-sky-950 px-3 py-2 text-xs text-sky-800 dark:text-sky-300">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <b>Sensitive health information.</b> Medical details and fit notes are visible only to
          authorised HR users, every view is recorded in the audit log, and records are anonymised
          after the retention period. Bradford scores prompt a human review — they never trigger
          disciplinary action automatically.
        </span>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              active(t)
                ? "border-[#FE8F44] font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
