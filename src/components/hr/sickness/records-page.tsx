"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO, subMonths } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ExportMenu } from "@/src/components/shared/export-menu";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { cn } from "@/src/lib/utils";
import { spellLength } from "@/src/lib/sickness/bradford";
import { counts, sicknessStats, workingDaysBetween } from "@/src/lib/sickness/stats";
import { SICKNESS_SOURCE_LABELS, type SicknessRecord } from "@/src/lib/types/sickness";
import type { ReportColumn } from "@/src/lib/reports/types";
import { SICKNESS_BASE, dailyCost, useCanViewMedical, useSickness } from "./hooks";
import { SicknessShell } from "./shell";
import {
  AbsenceStateBadge,
  ApprovalBadge,
  FitNoteBadge,
  RtwBadge,
  Pager,
  StatTile,
  fmtDate,
  reasonFor,
  usePaged,
} from "./ui";

type Card = "all" | "ongoing" | "awaiting" | "fit_note" | "rtw" | "long_term";

/** Absence Records — every sickness episode, filterable and exportable. */
export function SicknessRecordsPage() {
  const s = useSickness();
  const canViewMedical = useCanViewMedical();
  const [card, setCard] = useState<Card>("all");
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [branch, setBranch] = useState("all");
  const [period, setPeriod] = useState("12");
  const [duration, setDuration] = useState("all");

  const branches = useMemo(() => s.bundle?.branches ?? [], [s.bundle]);
  const departments = useMemo(() => [...new Set(s.records.map((r) => r.department))].sort(), [s.records]);

  const from = period === "all" ? undefined : format(subMonths(parseISO(s.asOf), Number(period)), "yyyy-MM-dd");

  // Department / location / search / duration narrow everything; the period
  // only narrows period figures (days lost, rate) and the default list.
  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return s.records
      .filter((r) => dept === "all" || r.department === dept)
      .filter((r) => branch === "all" || r.branchId === branch)
      .filter((r) => {
        if (duration === "all") return true;
        const long = spellLength(r, s.asOf) >= s.settings.longTermDays;
        return duration === "long" ? long : !long;
      })
      .filter((r) => !q || `${r.employeeName} ${r.department}`.toLowerCase().includes(q));
  }, [s.records, s.asOf, s.settings.longTermDays, dept, branch, duration, search]);

  const stats = useMemo(() => {
    const people = new Map(s.employees.map((e) => [e.id, { schedule: e.workPattern?.schedule, dailyCost: dailyCost(e) }]));
    const headcount = s.employees.filter(
      (e) => e.status !== "terminated" && (dept === "all" || e.departmentName === dept) && (branch === "all" || e.branchId === branch),
    ).length;
    return sicknessStats({ records: scoped, people, headcount, holidays: s.holidays, asOf: s.asOf, from, longTermDays: s.settings.longTermDays });
  }, [scoped, s.employees, s.holidays, s.asOf, s.settings.longTermDays, from, dept, branch]);

  const rows = useMemo(() => {
    const holidays = new Set(s.holidays);
    // A status card lists every matching record, whatever the period, so the
    // count on the card and the rows in the table always agree.
    const base = card === "all" ? scoped.filter((r) => !from || (r.endDate ?? s.asOf) >= from) : scoped;
    return base
      .map((r) => ({
        r,
        days: counts(r) ? workingDaysBetween(r, s.asOf, card === "all" ? from : undefined, s.asOf, s.byId.get(r.employeeId)?.workPattern?.schedule, holidays) : 0,
        span: spellLength(r, s.asOf),
      }))
      .filter((x) => matchesCard(card, x, s.settings.longTermDays))
      .sort((a, b) => b.r.startDate.localeCompare(a.r.startDate));
  }, [scoped, card, from, s.asOf, s.byId, s.holidays, s.settings.longTermDays]);
  const visible = rows;
  const pager = usePaged(rows, 15, `${card}|${period}|${dept}|${branch}|${duration}|${search}`);
  const longTermCount = scoped.filter((r) => counts(r) && spellLength(r, s.asOf) >= s.settings.longTermDays).length;

  if (s.loading) {
    return (
      <SicknessShell>
        <Skeleton className="h-96 w-full" />
      </SicknessShell>
    );
  }

  const columns: ReportColumn<(typeof visible)[number]>[] = [
    { key: "employee", header: "Employee", value: (x) => x.r.employeeName },
    { key: "department", header: "Department", value: (x) => x.r.department },
    { key: "start", header: "First day", value: (x) => x.r.startDate },
    { key: "end", header: "Last day", value: (x) => x.r.endDate ?? "Ongoing" },
    { key: "days", header: "Working days lost", value: (x) => x.days },
    { key: "reason", header: "Reason", value: (x) => reasonFor(x.r, canViewMedical) },
    { key: "approval", header: "Approval", value: (x) => x.r.approvalStatus },
    { key: "fitNote", header: "Fit note", value: (x) => x.r.fitNoteStatus },
    { key: "rtw", header: "Return to work", value: (x) => x.r.rtw.status },
    { key: "source", header: "Source", value: (x) => SICKNESS_SOURCE_LABELS[x.r.source] },
  ];

  return (
    <SicknessShell>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Currently off sick" value={stats.ongoing} sub="right now" tone="rose" onClick={() => setCard(card === "ongoing" ? "all" : "ongoing")} active={card === "ongoing"} />
        <StatTile label="Awaiting approval" value={stats.awaitingApproval} sub="absence confirmations" tone="amber" onClick={() => setCard(card === "awaiting" ? "all" : "awaiting")} active={card === "awaiting"} />
        <StatTile label="Fit notes outstanding" value={stats.fitNotesOutstanding} sub="awaited or expired" tone="amber" onClick={() => setCard(card === "fit_note" ? "all" : "fit_note")} active={card === "fit_note"} />
        <StatTile label="RTW interviews due" value={stats.rtwDue} sub="back at work, not yet held" onClick={() => setCard(card === "rtw" ? "all" : "rtw")} active={card === "rtw"} />
        <StatTile label="Long-term absences" value={longTermCount} sub={`${s.settings.longTermDays}+ calendar days, all time`} onClick={() => setCard(card === "long_term" ? "all" : "long_term")} active={card === "long_term"} />
        <StatTile label="Working days lost" value={stats.daysLost} sub={`${stats.episodes} episodes · ${stats.absenceRate}% absence rate`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee or department…" className="h-8 pl-8 text-xs" />
        </div>
        <FilterSelect value={period} onChange={setPeriod} options={[["3", "Last 3 months"], ["6", "Last 6 months"], ["12", "Last 12 months"], ["24", "Last 24 months"], ["all", "All time"]]} />
        <FilterSelect value={dept} onChange={setDept} options={[["all", "All departments"], ...departments.map((d) => [d, d] as [string, string])]} />
        <FilterSelect value={branch} onChange={setBranch} options={[["all", "All locations"], ...branches.map((b) => [b.id, b.name] as [string, string])]} />
        <FilterSelect value={duration} onChange={setDuration} options={[["all", "Short & long term"], ["short", "Short-term"], ["long", "Long-term"]]} />
        <ExportMenu name="sickness-absence-records" title="Sickness absence records" columns={columns} rows={visible} variant="outline" buttonClassName="h-8 text-xs" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                {["Employee", "Dates", "Days lost", "Reason", "Status", "Fit note", "Return to work", "Reported"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground">No sickness records match these filters.</td>
                </tr>
              )}
              {pager.slice.map(({ r, days, span }) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted">
                  <td className="px-3 py-2">
                    <Link href={`${SICKNESS_BASE}/records/${r.id}`} className="flex items-center gap-2 hover:underline">
                      <PersonAvatar name={r.employeeName} initials={r.employeeInitials} className="size-7" fallbackClassName="text-[10px]" />
                      <span>
                        <span className="block font-medium">{r.employeeName}</span>
                        <span className="block text-[10px] text-muted-foreground">{r.department}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {fmtDate(r.startDate)} – {r.endDate ? fmtDate(r.endDate) : <span className="font-medium text-rose-600">ongoing</span>}
                    <div className={cn("text-[10px] text-muted-foreground", span >= s.settings.longTermDays && "font-medium text-amber-600")}>
                      {span} calendar day{span === 1 ? "" : "s"}{span >= s.settings.longTermDays ? " · long-term" : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{counts(r) ? days : "—"}</td>
                  <td className="px-3 py-2">
                    {reasonFor(r, canViewMedical)}
                    {r.kind === "medical_procedure" && <div className="text-[10px] text-muted-foreground">Planned procedure</div>}
                    {r.exclusion && <div className="text-[10px] text-violet-600">Excluded from Bradford</div>}
                  </td>
                  <td className="space-y-1 px-3 py-2">
                    <ApprovalBadge status={r.approvalStatus} />
                    <div><AbsenceStateBadge record={r} /></div>
                  </td>
                  <td className="px-3 py-2"><FitNoteBadge status={r.fitNoteStatus} /></td>
                  <td className="px-3 py-2"><RtwBadge status={r.rtw.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground">{SICKNESS_SOURCE_LABELS[r.source]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager pager={pager} noun="records" />
      </div>
    </SicknessShell>
  );
}

function matchesCard(card: Card, x: { r: SicknessRecord; span: number }, longTermDays: number): boolean {
  // Card counts leave out rejected/cancelled records, so their lists do too.
  if (card !== "all" && !counts(x.r)) return false;
  switch (card) {
    case "ongoing":
      return x.r.absenceState === "ongoing";
    case "awaiting":
      return x.r.approvalStatus === "awaiting_approval";
    case "fit_note":
      return x.r.fitNoteStatus === "awaiting" || x.r.fitNoteStatus === "expired";
    case "rtw":
      return x.r.rtw.status === "pending";
    case "long_term":
      return x.span >= longTermDays;
    default:
      return true;
  }
}

export function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="h-8 w-auto min-w-36 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
