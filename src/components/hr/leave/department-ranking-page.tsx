"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trophy, CalendarDays, Building2, Users, Scale } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DataTable } from "@/src/components/shared/data-table";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { cn } from "@/src/lib/utils";
import {
  departmentLeaveReport,
  type DepartmentLeaveRow,
  type DepartmentRankBy,
} from "@/src/lib/leave/department-ranking";
import { useLeaveData } from "./hooks";
import { LEAVE_TYPE_LABELS } from "./data";

const LEAVE_PAGE = "/time-payroll/leave";

/**
 * Department leave ranking — every department in order of approved leave
 * taken, with ties sharing a rank. `?year=` picks the year and `?by=` the
 * measure: total days, or days per employee (the fair comparison between a
 * 12-person team and a 2-person one). A row opens that department's approved
 * requests back on the Leave page.
 */
export function DepartmentLeaveRankingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data, loading } = useLeaveData();
  const { data: headcounts } = useLocaleSection((b) => {
    const m = new Map<string, number>();
    for (const e of b.employees) {
      if (e.status === "terminated") continue;
      m.set(e.departmentName, (m.get(e.departmentName) ?? 0) + 1);
    }
    return m;
  });

  const requests = useMemo(() => data?.requests ?? [], [data]);
  const thisYear = String(new Date().getFullYear());
  const years = useMemo(() => {
    const set = new Set([thisYear, ...requests.map((r) => r.startDate.slice(0, 4))]);
    return [...set].sort().reverse();
  }, [requests, thisYear]);
  const year = params.get("year") ?? thisYear;
  const rankBy: DepartmentRankBy = params.get("by") === "perEmployee" ? "perEmployee" : "days";

  const report = useMemo(
    () => departmentLeaveReport(requests, year, headcounts ?? new Map(), rankBy),
    [requests, year, headcounts, rankBy],
  );

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const maxValue = Math.max(
    1,
    ...report.rows.map((r) => (rankBy === "days" ? r.days : r.daysPerEmployee)),
  );

  const columns = useMemo<ColumnDef<DepartmentLeaveRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "Rank",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex min-w-8 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              row.original.rank === 1 && (rankBy === "days" ? row.original.days : row.original.daysPerEmployee) > 0
                ? "bg-amber-500/15 text-amber-600"
                : "bg-muted text-muted-foreground",
            )}
            title={row.original.tied ? "Tied with another department" : undefined}
          >
            {row.original.tied ? "=" : ""}
            {row.original.rank}
          </span>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.department}</span>,
      },
      {
        id: "bar",
        header: rankBy === "days" ? "Days approved" : "Days per employee",
        cell: ({ row }) => {
          const v = rankBy === "days" ? row.original.days : row.original.daysPerEmployee;
          // No current staff (everyone has left): a per-head rate is undefined,
          // not zero.
          const noHeadcount = rankBy === "perEmployee" && row.original.headcount === 0;
          return (
            <div className="flex min-w-48 items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-fuchsia-500"
                  style={{ width: `${(v / maxValue) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm font-semibold tabular-nums">
                {noHeadcount ? "—" : v}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: rankBy === "days" ? "daysPerEmployee" : "days",
        header: rankBy === "days" ? "Per employee" : "Total days",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {rankBy === "days"
              ? row.original.headcount
                ? row.original.daysPerEmployee
                : "—"
              : row.original.days}
          </span>
        ),
      },
      {
        accessorKey: "share",
        header: "Share",
        cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.share}%</span>,
      },
      {
        accessorKey: "requests",
        header: "Requests",
        cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.requests}</span>,
      },
      {
        id: "people",
        header: "People off",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums">
            {row.original.people}
            {row.original.headcount ? (
              <span className="text-muted-foreground"> of {row.original.headcount}</span>
            ) : (
              <span className="text-muted-foreground" title="Nobody currently employed in this department">
                {" "}· no current staff
              </span>
            )}
          </span>
        ),
      },
      {
        id: "types",
        header: "Mostly",
        cell: ({ row }) =>
          row.original.byType.length ? (
            <span className="text-xs text-muted-foreground">
              {row.original.byType
                .slice(0, 2)
                .map((t) => `${LEAVE_TYPE_LABELS[t.leaveType as keyof typeof LEAVE_TYPE_LABELS] ?? t.leaveType} ${t.days}d`)
                .join(" · ")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No leave</span>
          ),
      },
    ],
    [rankBy, maxValue],
  );

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const withLeave = report.rows.filter((r) => r.days > 0);
  const headcountTotal = report.rows.reduce((s, r) => s + r.headcount, 0);
  const leaders = report.leaders;

  const cards: HrStatCardItem[] = [
    {
      label: leaders.length > 1 ? "Most leave taken (tied)" : "Most leave taken",
      value: leaders.length === 0 ? "—" : leaders.length === 1 ? leaders[0] : `${leaders.length} departments`,
      sub: leaders.length > 1 ? `${leaders.join(", ")} · ${report.leaderDays} days each` : leaders.length ? `${report.leaderDays} days approved` : "No approved leave",
      icon: Trophy,
      tone: "amber",
    },
    {
      label: "Total days approved",
      value: report.totalDays,
      sub: `Approved leave starting in ${year}`,
      icon: CalendarDays,
      tone: "violet",
    },
    {
      label: "Departments with leave",
      value: `${withLeave.length} / ${report.rows.length}`,
      sub: "Took at least one day",
      icon: Building2,
      tone: "blue",
    },
    {
      label: "Average per employee",
      value: headcountTotal ? Math.round((report.totalDays / headcountTotal) * 10) / 10 : "—",
      sub: "Days across current headcount",
      icon: Users,
      tone: "emerald",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-7 gap-1 text-xs text-muted-foreground" asChild>
            <Link href={LEAVE_PAGE}>
              <ArrowLeft className="h-3.5 w-3.5" /> Leave Management
            </Link>
          </Button>
          <h1 className="text-4xl font-semibold">Leave by Department</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every department ranked by approved leave. Departments with equal totals share a rank.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            {(
              [
                ["days", "Total days"],
                ["perEmployee", "Per employee"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setParam("by", value)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  rankBy === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Select value={year} onValueChange={(v) => setParam("year", v)}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <HrStatCardsGrid stats={cards} columns={4} />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Scale className="h-3.5 w-3.5" />
        {rankBy === "days"
          ? "Ranked by total approved days. Switch to Per employee to compare departments of different sizes fairly."
          : "Ranked by approved days per current employee, so a small team isn't out-ranked by a large one on size alone."}
      </div>

      <DataTable
        exportTitle={`Leave by Department ${year}`}
        columns={columns}
        data={report.rows}
        getRowId={(r) => r.department}
        enablePagination={false}
        onRowClick={(r) =>
          router.push(`${LEAVE_PAGE}?department=${encodeURIComponent(r.department)}&year=${year}`)
        }
        emptyMessage="No departments to show."
      />
    </div>
  );
}
