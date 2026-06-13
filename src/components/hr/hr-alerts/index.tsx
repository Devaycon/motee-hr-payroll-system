"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, ChevronRight, UserPlus } from "lucide-react";
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
  HR_ALERT_SEVERITY_LABELS,
  HR_ALERT_SEVERITY_STYLES,
  HR_ALERT_TOTAL,
  type HrAlert,
  type HrAlertCategory,
} from "@/src/data/hr-alerts-demo";

function AlertRow({ alert, Icon }: { alert: HrAlert; Icon: typeof BellRing }) {
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
        {alert.description && (
          <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
        )}
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

export function HrAlertsCard() {
  const [tab, setTab] = useState(HR_ALERT_CATEGORIES[0]?.key ?? "");
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
      label: "Self-Onboarding",
      icon: UserPlus,
      alerts,
    };
  }, [onboardingRecords]);

  const categories = useMemo(
    () => [...HR_ALERT_CATEGORIES, onboardingCategory],
    [onboardingCategory],
  );
  const openTotal = HR_ALERT_TOTAL + onboardingCategory.alerts.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-[#ff8b2d]" />
          <CardTitle className="text-base">Pending Approvals &amp; Alerts</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs border-rose-500/30 bg-rose-500/10 text-rose-600">
          {openTotal} open
        </Badge>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <OverflowTabsList
            value={tab}
            onValueChange={setTab}
            tabs={categories.map((c) => ({
              value: c.key,
              badgeCount: c.alerts.length,
              label: (
                <span className="flex items-center gap-1.5">
                  {c.label}
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                    {c.alerts.length}
                  </span>
                </span>
              ),
            }))}
          />

          {categories.map((c) => (
            <TabsContent key={c.key} value={c.key} className="mt-4">
              {c.alerts.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No alerts in this category.
                </div>
              ) : (
                <ScrollArea className="max-h-80 pr-2 *:data-radix-scroll-area-viewport:max-h-80">
                  <div className="flex flex-col gap-2">
                    {c.alerts.map((a) => (
                      <AlertRow key={a.id} alert={a} Icon={c.icon} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
