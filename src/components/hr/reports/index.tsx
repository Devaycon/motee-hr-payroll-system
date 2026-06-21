"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wand2 } from "lucide-react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ALL_REPORTS, REPORT_GROUPS } from "@/src/lib/reports/registry";
import { CustomReportModal } from "./components/custom-report-modal";

export function ReportsPage() {
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);
  const [customOpen, setCustomOpen] = useState(false);

  const visibleReports = useMemo(() => {
    const level = accessLevelId
      ? levels.find((l) => l.id === accessLevelId)
      : undefined;
    const canView = (mod: string) => {
      if (!accessLevelId || !level) return true;
      return !!level.permissions.find((p) => p.module === mod)?.access;
    };
    return ALL_REPORTS.filter((r) => canView(r.permission));
  }, [accessLevelId, levels]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 py-2">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">
            Reports &amp; Analytics
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pick a module to view its analytics dashboard and export the report.
          </p>
        </div>
        <Button className="mt-1 gap-1.5" onClick={() => setCustomOpen(true)}>
          <Wand2 className="h-4 w-4" />
          Build Custom Report
        </Button>
      </div>

      {REPORT_GROUPS.map((group) => {
        const reports = visibleReports.filter((r) => r.group === group);
        if (reports.length === 0) return null;
        return (
          <section key={group} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {reports.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((r) => {
                const Icon = r.icon;
                return (
                  <Link
                    key={r.id}
                    href={`/operations/reports/${r.id}`}
                    className="group focus-visible:outline-none"
                  >
                    <Card className="flex h-full flex-col gap-3 p-5 transition-all hover:border-primary/40 hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary/40">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-semibold text-foreground">
                          {r.label}
                        </h3>
                        {r.description && (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {r.description}
                          </p>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <CustomReportModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        allowedReportIds={visibleReports.map((r) => r.id)}
      />
    </div>
  );
}
