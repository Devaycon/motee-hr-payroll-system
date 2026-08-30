"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  ChevronRight,
  UserPlus,
  type LucideIcon,
  ShieldCheck,
  Plane,
  FileText,
  Banknote,
  ClipboardList,
  FileX,
  Briefcase,
  GraduationCap,
  Laptop,
  UserCog,
  Scale,
} from "lucide-react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { OverflowTabsList } from "@/src/components/shared/overflow-tabs";
import { cn } from "@/src/lib/utils";
import {
  HR_ALERT_CATEGORIES,
  HR_ALERT_SEVERITIES,
  HR_ALERT_SEVERITY_DOTS,
  HR_ALERT_SEVERITY_LABELS,
  HR_ALERT_SEVERITY_STYLES,
  HR_ALERT_DEFAULT_DUE_DAYS,
  countBySeverity,
  type HrAlert,
  type HrAlertCategory,
  type HrAlertSeverity,
} from "@/src/data/hr-alerts-demo";

/** Pick a distinct icon per issue type so categories read faster at a glance. */
function iconForAlert(alert: HrAlert, fallback: LucideIcon): LucideIcon {
  if (alert.icon) return alert.icon;
  const t = alert.title.toLowerCase();
  if (/visa/.test(t)) return Plane;
  if (/p45|p60|hmrc|tax|starter checklist|contract/.test(t)) return FileText;
  if (/right to work|share code|dbs|verification|compliance/.test(t)) return ShieldCheck;
  if (/bank|payroll|salary|pension|payment|invoice|finance/.test(t)) return Banknote;
  if (/checklist|probation|review|onboarding|calibration|goal/.test(t)) return ClipboardList;
  if (/missing|document|scan|id card|evidence/.test(t)) return FileX;
  if (/interview|candidate|offer|requisition|recruit/.test(t)) return Briefcase;
  if (/training|course|learning|certification/.test(t)) return GraduationCap;
  if (/asset|laptop|device|equipment/.test(t)) return Laptop;
  if (/grievance|case|hearing|disciplinary|appeal|investigation/.test(t)) return Scale;
  if (/emergency contact|data|profile|record/.test(t)) return UserCog;
  return fallback;
}

/** Actual due date + human countdown for an action row (§6.3, §6.6). */
function alertDue(alert: HrAlert): {
  dateLabel: string;
  countdown: string;
  tone: string;
} {
  const days = alert.dueInDays ?? HR_ALERT_DEFAULT_DUE_DAYS[alert.severity];
  const date = new Date();
  date.setDate(date.getDate() + days);
  const dateLabel = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const countdown =
    days < 0
      ? `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} overdue`
      : days === 0
        ? "Due today"
        : `Due in ${days} ${days === 1 ? "day" : "days"}`;
  const tone =
    days <= 0 ? "text-rose-600" : days <= 3 ? "text-amber-600" : "text-muted-foreground";
  return { dateLabel, countdown, tone };
}

function AlertRow({ alert, Icon }: { alert: HrAlert; Icon: LucideIcon }) {
  const due = alertDue(alert);
  const meta = alert.employeeId
    ? `${alert.description ?? ""} • Employee ID: ${alert.employeeId}`
    : alert.description;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
      <div className="flex items-center justify-center size-8 shrink-0 rounded-md bg-muted">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
          <Badge
            variant="outline"
            className={cn("text-[10px] shrink-0", HR_ALERT_SEVERITY_STYLES[alert.severity])}
          >
            {HR_ALERT_SEVERITY_LABELS[alert.severity]}
          </Badge>
        </div>
        {meta && (
          <p className="text-xs text-muted-foreground truncate">{meta}</p>
        )}
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className={cn("text-[11px] font-semibold whitespace-nowrap", due.tone)}>
          {due.countdown}
        </span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {due.dateLabel}
        </span>
      </div>
      {alert.href && (
        <Link
          href={alert.href}
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline shrink-0"
        >
          View
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/**
 * The severity breakdown the client asked for in place of a bare open-items
 * count, doubling as a filter so "12 Critical" is a way in, not just a number.
 */
function SeverityChips({
  counts,
  total,
  active,
  onSelect,
}: {
  counts: Record<HrAlertSeverity, number>;
  total: number;
  active: HrAlertSeverity | "all";
  onSelect: (severity: HrAlertSeverity | "all") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onSelect("all")}
        aria-pressed={active === "all"}
        className={cn(
          "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
          active === "all"
            ? "border-foreground/20 bg-foreground/10 text-foreground"
            : "border-border text-muted-foreground hover:bg-accent",
        )}
      >
        {total} open
      </button>
      {HR_ALERT_SEVERITIES.map((severity) => (
        <button
          key={severity}
          type="button"
          onClick={() => onSelect(severity)}
          aria-pressed={active === severity}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
            HR_ALERT_SEVERITY_STYLES[severity],
            active === severity
              ? "ring-2 ring-offset-1 ring-current"
              : "opacity-90 hover:opacity-100",
          )}
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              HR_ALERT_SEVERITY_DOTS[severity],
            )}
          />
          {HR_ALERT_SEVERITY_LABELS[severity]} ({counts[severity]})
        </button>
      ))}
    </div>
  );
}

/**
 * Every open action category: the static demo set plus the live self-onboarding
 * one derived from Redux. Shared by this card and the dashboard's Priorities
 * summary tiles so the headline count can never disagree with the list beneath
 * it.
 */
export function useHrAlertCategories(): HrAlertCategory[] {
  const onboardingRecords = useAppSelector((s) => s.onboardingRecords.records);

  // Surface self-onboarding invites that the new hire hasn't started or finished.
  const onboardingCategory = useMemo<HrAlertCategory>(() => {
    const alerts: HrAlert[] = onboardingRecords
      .filter(
        (r) =>
          r.mode === "invited" &&
          (r.status === "not_started" || r.status === "in_progress"),
      )
      .map((r) => ({
        id: `onb-${r.id}`,
        title: r.employeeName,
        description:
          r.status === "not_started"
            ? `Self-onboarding not started · ${r.jobTitle} · ${r.department}`
            : `Self-onboarding incomplete (${r.completedTasks}/${r.totalTasks}) · ${r.jobTitle} · ${r.department}`,
        severity: r.status === "not_started" ? "warning" : "info",
        href: `/talent/onboarding/${r.id}`,
      }));
    return {
      key: "self_onboarding",
      label: "Onboarding",
      icon: UserPlus,
      alerts,
    };
  }, [onboardingRecords]);

  return useMemo(
    () => [...HR_ALERT_CATEGORIES, onboardingCategory],
    [onboardingCategory],
  );
}

/**
 * Open items, counted rather than asserted. This was a hardcoded `54`, which
 * agreed with neither the severity chips beside it nor the live onboarding
 * rows folded into the categories.
 */
export function useHrAlertTotals() {
  const categories = useHrAlertCategories();
  return useMemo(() => {
    const counts = countBySeverity(categories);
    const total = HR_ALERT_SEVERITIES.reduce((sum, s) => sum + counts[s], 0);
    return { categories, counts, total };
  }, [categories]);
}

export function HrAlertsCard() {
  const [tab, setTab] = useState(HR_ALERT_CATEGORIES[0]?.key ?? "");
  const [severity, setSeverity] = useState<HrAlertSeverity | "all">("all");
  const {
    categories,
    counts: severityCounts,
    total: openTotal,
  } = useHrAlertTotals();

  /** The severity filter applies within whichever category tab is open. */
  const visibleAlerts = (category: HrAlertCategory) =>
    severity === "all"
      ? category.alerts
      : category.alerts.filter((a) => a.severity === severity);

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-[#ff8b2d]" />
          <CardTitle className="text-base">Your HR priorities today</CardTitle>
        </div>
        <SeverityChips
          counts={severityCounts}
          total={openTotal}
          active={severity}
          onSelect={setSeverity}
        />
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <OverflowTabsList
            value={tab}
            onValueChange={setTab}
            // Counts follow the severity filter, so a tab never promises rows
            // the filtered list won't show.
            tabs={categories.map((c) => {
              const count = visibleAlerts(c).length;
              return {
                value: c.key,
                badgeCount: count,
                label: (
                  <span className="flex items-center gap-1.5">
                    {c.label}
                    <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                      {count}
                    </span>
                  </span>
                ),
              };
            })}
          />

          {categories.map((c) => {
            const rows = visibleAlerts(c);
            return (
            <TabsContent key={c.key} value={c.key} className="mt-4">
              {rows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {c.alerts.length === 0
                    ? "No alerts in this category."
                    : `No ${HR_ALERT_SEVERITY_LABELS[
                        severity as HrAlertSeverity
                      ].toLowerCase()} alerts in this category.`}
                </div>
              ) : (
                <ScrollArea className="max-h-80 pr-2 *:data-radix-scroll-area-viewport:max-h-80">
                  <div className="flex flex-col gap-2">
                    {rows.map((a) => (
                      <AlertRow key={a.id} alert={a} Icon={iconForAlert(a, c.icon)} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
