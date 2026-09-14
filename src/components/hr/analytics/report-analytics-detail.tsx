"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, FileQuestion } from "lucide-react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { getReport } from "@/src/lib/reports/registry";
import { ReportAnalyticsView } from "./components/report-analytics";
import { GenderSplitLayout } from "./components/gender-split-layout";

function BackLink() {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="-ml-2 h-8 w-fit gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Link href="/operations/analytics">
        <ArrowLeft className="h-4 w-4" />
        Analytics
      </Link>
    </Button>
  );
}

export function ReportAnalyticsDetailPage({ reportId }: { reportId: string }) {
  const { data: bundle, loading } = useLocaleSection<LocaleBundle>((b) => b);
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);

  const def = getReport(reportId);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const allRows = useMemo(
    () => (bundle && def ? def.select(bundle) : []),
    [bundle, def],
  );

  const filteredRows = useMemo(() => {
    if (!def) return [];
    let list = allRows;
    const q = search.trim().toLowerCase();
    if (q && def.searchText) {
      list = list.filter((r) => def.searchText!(r).toLowerCase().includes(q));
    }
    for (const f of def.filters ?? []) {
      const v = filters[f.key];
      if (v && v !== "all") list = list.filter((r) => f.match(r, v));
    }
    return list;
  }, [def, allRows, search, filters]);

  const analytics = useMemo(
    () => (def && bundle ? def.analytics(filteredRows, bundle) : null),
    [def, bundle, filteredRows],
  );

  const canView = (mod: string) => {
    if (!accessLevelId) return true;
    const level = levels.find((l) => l.id === accessLevelId);
    if (!level) return true;
    return !!level.permissions.find((p) => p.module === mod)?.access;
  };

  // Unknown report id, or the user lacks permission for it.
  if (!def || !canView(def.permission)) {
    return (
      <div className="flex flex-col gap-5">
        <BackLink />
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-base font-semibold text-foreground">
              Analytics not available
            </p>
            <p className="text-sm text-muted-foreground">
              {def
                ? "You don't have access to this report."
                : "This report doesn't exist."}
            </p>
          </div>
          <Button asChild size="sm" className="mt-1">
            <Link href="/operations/analytics">Back to all analytics</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !bundle) {
    return (
      <div className="flex flex-col gap-5">
        <BackLink />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const Icon = def.icon;

  return (
    <div className="flex flex-col gap-5">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {def.label}
            </h1>
            {def.description && (
              <p className="text-sm text-muted-foreground">{def.description}</p>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/operations/reports/${def.id}`}>View full report</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 pl-8"
          />
        </div>
        {(def.filters ?? []).map((f) => {
          const options = f.options(allRows);
          return (
            <Select
              key={f.key}
              value={filters[f.key] ?? "all"}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, [f.key]: v }))
              }
            >
              <SelectTrigger className="h-9 w-44 text-sm">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
                {options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
      </div>

      {analytics && def.id === "gender" ? (
        <GenderSplitLayout analytics={analytics} />
      ) : analytics ? (
        <ReportAnalyticsView
          analytics={analytics}
          reportId={def.id}
          group={def.group}
          breakdowns={def.breakdowns}
        />
      ) : null}
    </div>
  );
}
