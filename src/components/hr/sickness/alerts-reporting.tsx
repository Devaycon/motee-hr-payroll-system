"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { addDays, endOfMonth, format, parseISO, startOfMonth, subMonths } from "date-fns";
import { ResponsiveBar } from "@nivo/bar";
import {
  AlertTriangle,
  BellRing,
  FileSpreadsheet,
  FileText,
  History,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { NIVO_THEME } from "@/src/components/shared/charts";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { purgeExpired, updateSettings } from "@/src/lib/stores/sickness-slice";
import { printPdf } from "@/src/lib/reports/export";
import { spellLength } from "@/src/lib/sickness/bradford";
import { counts, sicknessStats, workingDaysBetween } from "@/src/lib/sickness/stats";
import { calculateSickPay } from "@/src/lib/sickness/sick-pay";
import { cn } from "@/src/lib/utils";
import {
  BRADFORD_ACTION_LABELS,
  REVIEW_TRIGGER_LABELS,
  type BradfordAction,
  type SicknessRecord,
} from "@/src/lib/types/sickness";
import {
  SICKNESS_BASE,
  dailyCost,
  payEmployee,
  useCanManageSickness,
  useCanViewMedical,
  useSickness,
  useSicknessActor,
} from "./hooks";
import { SicknessShell } from "./shell";
import { FilterSelect } from "./records-page";
import { useFormatMoney } from "./money";
import { ChartPanel, Pager, StatTile, fmtDate, usePaged } from "./ui";

type Severity = "high" | "medium" | "info";
interface Alert {
  id: string;
  severity: Severity;
  kind: string;
  title: string;
  detail: string;
  href: string;
}

export function AlertsReportingPage() {
  const s = useSickness();
  const money = useFormatMoney();
  const canViewMedical = useCanViewMedical();
  const [dept, setDept] = useState("all");
  const [branch, setBranch] = useState("all");
  const [months, setMonths] = useState("12");

  const inScope = (r: SicknessRecord) =>
    (dept === "all" || r.department === dept) && (branch === "all" || r.branchId === branch);

  const alerts = useMemo<Alert[]>(() => {
    const out: Alert[] = [];
    for (const c of s.reviewCases.filter((c) => c.status !== "closed")) {
      out.push({
        id: c.id,
        severity: c.action === "senior_hr_review" || c.action === "formal_review" ? "high" : "medium",
        kind: "Review threshold",
        title: `${c.employeeName} — ${REVIEW_TRIGGER_LABELS[c.trigger]}`,
        detail: c.action ? `${BRADFORD_ACTION_LABELS[c.action]}${c.scoreAtOpen != null ? ` (score ${c.scoreAtOpen})` : ""} · human review required` : "Human review required",
        href: `${SICKNESS_BASE}/bradford?case=${c.id}`,
      });
    }
    for (const r of s.records.filter(inScope)) {
      if (r.approvalStatus === "rejected" || r.approvalStatus === "cancelled") continue;
      const len = spellLength(r, s.asOf);
      if (r.rtw.status === "pending") {
        out.push({ id: `rtw-${r.id}`, severity: "medium", kind: "Return to work", title: `${r.employeeName} needs a return-to-work interview`, detail: `Back since ${fmtDate(r.rtw.returnDate)}`, href: `${SICKNESS_BASE}/return-to-work/${r.id}` });
      }
      if (r.fitNoteStatus === "awaiting" || r.fitNoteStatus === "expired") {
        out.push({ id: `fit-${r.id}`, severity: r.absenceState === "ongoing" ? "high" : "medium", kind: "Fit note", title: `${r.employeeName} — fit note ${r.fitNoteStatus === "expired" ? "expired" : "outstanding"}`, detail: `Absence from ${fmtDate(r.startDate)} (${len} days)`, href: `${SICKNESS_BASE}/records/${r.id}` });
      }
      if (r.absenceState === "ongoing" && len >= s.settings.ohTriggerDays && !r.ohReferralId) {
        out.push({ id: `oh-${r.id}`, severity: "high", kind: "Occupational Health", title: `${r.employeeName} — ${len} days continuous absence`, detail: `Consider an Occupational Health referral (trigger ${s.settings.ohTriggerDays} days)`, href: `${SICKNESS_BASE}/records/${r.id}` });
      } else if (r.absenceState === "ongoing" && len >= s.settings.longTermDays) {
        out.push({ id: `lt-${r.id}`, severity: "medium", kind: "Long-term", title: `${r.employeeName} — long-term absence`, detail: `${len} days so far`, href: `${SICKNESS_BASE}/records/${r.id}` });
      }
      if (r.approvalStatus === "awaiting_approval") {
        out.push({ id: `ap-${r.id}`, severity: "info", kind: "Approval", title: `${r.employeeName} — absence awaiting confirmation`, detail: `Reported ${fmtDate(r.reportedAt)}`, href: `${SICKNESS_BASE}/records/${r.id}` });
      }
    }
    const unenrolled = s.employees.filter((e) => e.status !== "terminated" && !s.schemeFor(e.id).scheme);
    if (unenrolled.length) {
      out.push({ id: "enrol", severity: "info", kind: "Sickness policy", title: `${unenrolled.length} employee${unenrolled.length === 1 ? "" : "s"} not on a sickness scheme`, detail: unenrolled.slice(0, 4).map((e) => e.fullName).join(", "), href: `${SICKNESS_BASE}/schemes` });
    }
    const rank: Record<Severity, number> = { high: 0, medium: 1, info: 2 };
    return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, dept, branch]);

  const report = useMemo(() => {
    const from = format(subMonths(parseISO(s.asOf), Number(months)), "yyyy-MM-dd");
    // Same engine as Absence Records and the dashboard: working days clipped
    // to the period, cost = days × daily pay, rate over working days.
    const people = new Map(s.employees.map((e) => [e.id, { schedule: e.workPattern?.schedule, dailyCost: dailyCost(e) }]));
    const holidaySet = new Set(s.holidays);
    const scopeRecords = s.records.filter(inScope);
    const inScopeEmp = (e: (typeof s.employees)[number]) =>
      e.status !== "terminated" && (dept === "all" || e.departmentName === dept) && (branch === "all" || e.branchId === branch);
    const stats = sicknessStats({
      records: scopeRecords,
      people,
      headcount: s.employees.filter(inScopeEmp).length,
      holidays: s.holidays,
      asOf: s.asOf,
      from,
      longTermDays: s.settings.longTermDays,
    });
    const enriched = stats.rows.map((x) => ({ ...x, emp: s.byId.get(x.r.employeeId), len: x.span }));
    const live = scopeRecords.filter(counts);
    const monthsList = Array.from({ length: Number(months) }, (_, i) => startOfMonth(subMonths(parseISO(s.asOf), Number(months) - 1 - i)));
    const trend = monthsList.map((m) => {
      const mStart = format(m, "yyyy-MM-dd");
      const mEnd = format(endOfMonth(m), "yyyy-MM-dd");
      const to = mEnd < s.asOf ? mEnd : s.asOf;
      return {
        month: format(m, "MMM yy"),
        "Days lost": live.reduce((a, r) => a + workingDaysBetween(r, s.asOf, mStart, to, people.get(r.employeeId)?.schedule, holidaySet), 0),
        Episodes: live.filter((r) => r.startDate >= mStart && r.startDate <= mEnd).length,
      };
    });
    const byDept = [...new Set(enriched.map((x) => x.r.department))].map((d) => {
      const deptStats = sicknessStats({
        records: scopeRecords.filter((r) => r.department === d),
        people,
        headcount: s.employees.filter((e) => inScopeEmp(e) && e.departmentName === d).length,
        holidays: s.holidays,
        asOf: s.asOf,
        from,
        longTermDays: s.settings.longTermDays,
      });
      const ids = [...new Set(deptStats.rows.map((x) => x.r.employeeId))];
      return {
        department: d,
        episodes: deptStats.episodes,
        days: deptStats.daysLost,
        rate: deptStats.absenceRate,
        cost: deptStats.cost,
        avgBradford: Math.round(ids.reduce((a, id) => a + s.bradfordFor(id).score, 0) / Math.max(1, ids.length)),
      };
    }).sort((a, b) => b.rate - a.rate);
    const longTerm = enriched.filter((x) => x.longTerm);
    const shortTerm = enriched.filter((x) => !x.longTerm);
    // Recurring patterns — short absences that extend a weekend or a public holiday.
    const holidays = new Set(s.holidays);
    const short = shortTerm.filter((x) => x.len <= 3);
    const mon = short.filter((x) => parseISO(x.r.startDate).getDay() === 1).length;
    const fri = short.filter((x) => parseISO(x.r.endDate ?? x.r.startDate).getDay() === 5).length;
    const nearHoliday = short.filter((x) => holidays.has(format(addDays(parseISO(x.r.startDate), -1), "yyyy-MM-dd")) || holidays.has(format(addDays(parseISO(x.r.endDate ?? x.r.startDate), 1), "yyyy-MM-dd"))).length;
    const perEmp = new Map<string, { name: string; mf: number; total: number }>();
    for (const x of short) {
      const e = perEmp.get(x.r.employeeId) ?? { name: x.r.employeeName, mf: 0, total: 0 };
      e.total += 1;
      const d1 = parseISO(x.r.startDate).getDay();
      const d2 = parseISO(x.r.endDate ?? x.r.startDate).getDay();
      if (d1 === 1 || d2 === 5) e.mf += 1;
      perEmp.set(x.r.employeeId, e);
    }
    const patternFlags = [...perEmp.values()].filter((e) => e.total >= 3 && e.mf / e.total >= 0.6);
    const bands = new Map<BradfordAction, number>();
    for (const id of new Set(enriched.map((x) => x.r.employeeId))) {
      const a = s.bradfordFor(id).action;
      bands.set(a, (bands.get(a) ?? 0) + 1);
    }
    const reasons = new Map<string, number>();
    for (const x of enriched) reasons.set(x.r.reasonCategory, (reasons.get(x.r.reasonCategory) ?? 0) + x.days);
    return {
      from,
      enriched,
      trend,
      byDept,
      longTerm,
      shortTerm,
      mon,
      fri,
      nearHoliday,
      shortCount: short.length,
      patternFlags,
      bands,
      reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]),
      totalDays: stats.daysLost,
      totalCost: stats.cost,
      frequency: stats.frequency,
      absenceRate: stats.absenceRate,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, dept, branch, months]);

  const alertPager = usePaged(alerts, 10, `${dept}|${branch}`);
  const deptPager = usePaged(report.byDept, 8, `${dept}|${branch}|${months}`);
  if (s.loading) return <SicknessShell><Skeleton className="h-96 w-full" /></SicknessShell>;
  const departments = [...new Set(s.records.map((r) => r.department))].sort();

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Month", "Episodes", "Days lost"], ...report.trend.map((t) => [t.month, t.Episodes, t["Days lost"]])]), "Trend");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Department", "Episodes", "Days lost", "Absence rate %", "Cost", "Avg Bradford"], ...report.byDept.map((d) => [d.department, d.episodes, d.days, d.rate, Math.round(d.cost), d.avgBradford])]), "Departments");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Employee", "Department", "First day", "Last day", "Calendar days", "Working days lost", "Term", "Reason", "Cost"],
        ...report.enriched.map((x) => [x.r.employeeName, x.r.department, x.r.startDate, x.r.endDate ?? "Ongoing", x.len, x.days, x.len >= s.settings.longTermDays ? "Long-term" : "Short-term", canViewMedical ? x.r.reasonCategory : "Medical absence", Math.round(x.cost)]),
      ]),
      "Absences",
    );
    const ids = [...new Set(report.enriched.map((x) => x.r.employeeId))];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Employee", "Episodes (S)", "Days (D)", "Bradford score", "Suggested response"], ...ids.map((id) => {
        const b = s.bradfordFor(id);
        return [s.byId.get(id)?.fullName ?? id, b.S, b.D, b.score, BRADFORD_ACTION_LABELS[b.action]];
      }).sort((a, b) => Number(b[3]) - Number(a[3]))]),
      "Bradford",
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Severity", "Type", "Alert", "Detail"], ...alerts.map((a) => [a.severity, a.kind, a.title, a.detail])]), "Alerts");
    XLSX.writeFile(wb, `sickness-report-${s.asOf}.xlsx`);
    toast.success("Sickness report downloaded");
  }

  function exportPdf() {
    printPdf(
      `Sickness & Absence report — last ${months} months`,
      [
        { key: "department", header: "Department", value: (d: (typeof report.byDept)[number]) => d.department },
        { key: "episodes", header: "Episodes", value: (d) => d.episodes },
        { key: "days", header: "Days lost", value: (d) => d.days },
        { key: "rate", header: "Absence rate %", value: (d) => d.rate },
        { key: "cost", header: "Cost", value: (d) => money(d.cost) },
        { key: "avg", header: "Avg Bradford", value: (d) => d.avgBradford },
      ],
      report.byDept,
      [
        { label: "Days lost", value: report.totalDays },
        { label: "Absence cost", value: money(report.totalCost) },
        { label: "Long-term absences", value: report.longTerm.length },
        { label: "Open alerts", value: alerts.length },
      ],
    );
  }

  return (
    <SicknessShell>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect value={dept} onChange={setDept} options={[["all", "All departments"], ...departments.map((d) => [d, d] as [string, string])]} />
        <FilterSelect value={branch} onChange={setBranch} options={[["all", "All locations"], ...(s.bundle?.branches ?? []).map((b) => [b.id, b.name] as [string, string])]} />
        <FilterSelect value={months} onChange={setMonths} options={[["3", "Last 3 months"], ["6", "Last 6 months"], ["12", "Last 12 months"], ["24", "Last 24 months"]]} />
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={exportPdf}><FileText className="h-3.5 w-3.5" /> PDF</Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={exportExcel}><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="flex flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <BellRing className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">HR alerts</h3>
            <span className="ml-auto rounded-full bg-muted px-2 text-xs">{alerts.length}</span>
          </div>
          <div className="flex-1">
            {alerts.length === 0 && <p className="px-4 py-8 text-center text-xs text-muted-foreground">Nothing needs attention.</p>}
            {alertPager.slice.map((a) => (
              <Link key={a.id} href={a.href} className="flex gap-2 border-b border-border/60 px-4 py-2.5 text-xs last:border-0 hover:bg-muted">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", a.severity === "high" ? "bg-rose-500" : a.severity === "medium" ? "bg-amber-500" : "bg-sky-500")} />
                <span>
                  <span className="block font-medium">{a.title}</span>
                  <span className="block text-muted-foreground">{a.kind} · {a.detail}</span>
                </span>
              </Link>
            ))}
          </div>
          <Pager pager={alertPager} noun="alerts" />
        </section>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Working days lost" value={report.totalDays} sub={`${report.enriched.length} episodes`} />
            <StatTile label="Estimated absence cost" value={money(report.totalCost)} sub="days lost × daily pay" />
            <StatTile label="Long-term vs short-term" value={`${report.longTerm.length} / ${report.shortTerm.length}`} sub={`${report.longTerm.reduce((a, x) => a + x.days, 0)} vs ${report.shortTerm.reduce((a, x) => a + x.days, 0)} days`} />
            <StatTile label="Absence frequency" value={report.frequency.toFixed(2)} sub={`episodes per employee · ${report.absenceRate}% absence rate`} />
          </div>
          {/* Grows to the height of the alerts list beside it. */}
          <ChartPanel title="Attendance trend" description="Sickness days lost and episodes by month" minHeight={256} className="h-auto flex-1">
              <ResponsiveBar
                data={report.trend}
                keys={["Days lost", "Episodes"]}
                indexBy="month"
                groupMode="grouped"
                margin={{ top: 24, right: 10, bottom: 28, left: 34 }}
                padding={0.25}
                colors={["#5192FA", "#FE8F44"]}
                borderRadius={3}
                axisLeft={{ tickSize: 0 }}
                axisBottom={{ tickSize: 0, tickPadding: 6 }}
                enableLabel={false}
                theme={NIVO_THEME}
                animate={false}
                legends={[{ dataFrom: "keys", anchor: "top-left", direction: "row", translateY: -22, itemWidth: 90, itemHeight: 12, symbolSize: 8 }]}
              />
          </ChartPanel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3"><h3 className="text-sm font-semibold">Departmental comparison</h3></div>
          <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground">
              <tr>{["Department", "Episodes", "Days lost", "Absence rate", "Cost", "Avg Bradford"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {deptPager.slice.map((d) => (
                <tr key={d.department} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium">{d.department}</td>
                  <td className="px-3 py-2 tabular-nums">{d.episodes}</td>
                  <td className="px-3 py-2 tabular-nums">{d.days}</td>
                  <td className="px-3 py-2 tabular-nums">{d.rate}%</td>
                  <td className="px-3 py-2 tabular-nums">{money(d.cost)}</td>
                  <td className="px-3 py-2 tabular-nums">{d.avgBradford}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pager pager={deptPager} noun="departments" />
        </section>

        <section className="rounded-xl border border-border bg-card p-4 text-xs">
          <h3 className="mb-3 text-sm font-semibold">Recurring absence patterns</h3>
          <p className="mb-3 text-muted-foreground">Of {report.shortCount} short absences (3 days or fewer):</p>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <StatTile label="Start on a Monday" value={report.mon} />
            <StatTile label="End on a Friday" value={report.fri} />
            <StatTile label="Next to a public holiday" value={report.nearHoliday} />
          </div>
          {report.patternFlags.length > 0 ? (
            <>
              <p className="mb-1 font-medium">Worth a conversation</p>
              <ul className="space-y-1">
                {report.patternFlags.map((p) => (
                  <li key={p.name} className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-amber-500" /> {p.name}: {p.mf} of {p.total} short absences extend a weekend</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">Patterns are prompts for a supportive conversation — there are often legitimate reasons.</p>
            </>
          ) : (
            <p className="text-muted-foreground">No recurring patterns stand out.</p>
          )}
          <h3 className="mb-2 mt-4 text-sm font-semibold">Bradford score distribution</h3>
          <div className="space-y-1.5">
            {(Object.keys(BRADFORD_ACTION_LABELS) as BradfordAction[]).map((a) => {
              const n = report.bands.get(a) ?? 0;
              const total = [...report.bands.values()].reduce((x, y) => x + y, 0) || 1;
              return (
                <div key={a} className="flex items-center gap-2">
                  <span className="w-52 shrink-0">{BRADFORD_ACTION_LABELS[a]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${(n / total) * 100}%` }} /></div>
                  <span className="w-6 text-right tabular-nums">{n}</span>
                </div>
              );
            })}
          </div>
          {canViewMedical && report.reasons.length > 0 && (
            <>
              <h3 className="mb-2 mt-4 text-sm font-semibold">Days lost by reason</h3>
              <div className="flex flex-wrap gap-1.5">
                {report.reasons.map(([k, v]) => <span key={k} className="rounded-full border border-border px-2 py-0.5">{k}: {v}</span>)}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PayrollExport />
        <PrivacyPanel />
      </div>
    </SicknessShell>
  );
}

/** Sick pay for a pay month, per employee per day — the payroll hand-off. */
function PayrollExport() {
  const s = useSickness();
  const money = useFormatMoney();
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), "yyyy-MM"));
  const rows = useMemo(() => {
    const start = format(startOfMonth(parseISO(`${month}-01`)), "yyyy-MM-dd");
    const end = format(endOfMonth(parseISO(`${month}-01`)), "yyyy-MM-dd");
    return [...new Set(s.records.map((r) => r.employeeId))].flatMap((id) => {
      const emp = s.byId.get(id);
      if (!emp) return [];
      const { scheme } = s.schemeFor(id, start);
      if (scheme && !scheme.advanced.exportToPayroll) return [];
      return calculateSickPay({ employee: payEmployee(emp), scheme, records: s.records, asOf: s.asOf, holidays: s.holidays })
        .filter((d) => d.date >= start && d.date <= end)
        .map((d) => ({ emp, scheme, d }));
    });
  }, [s, month]);
  const osp = rows.reduce((a, x) => a + x.d.ospAmount, 0);
  const ssp = rows.reduce((a, x) => a + x.d.sspAmount, 0);

  function download() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Employee number", "Employee", "Date", "Day portion", "Scheme", "Payroll code", "Step", "% of pay", "Company sick pay", "Statutory sick pay", "Basis"],
      ...rows.map(({ emp, scheme, d }) => [emp.employeeNumber, emp.fullName, d.date, d.portion, scheme?.name ?? "Statutory only", scheme?.advanced.payrollCode ?? "", d.stepLabel, d.payPercent, d.ospAmount, d.sspAmount, d.basis]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sick pay");
    XLSX.writeFile(wb, `sick-pay-${month}.xlsx`);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 text-xs">
      <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Wallet className="h-4 w-4 text-primary" /> Payroll — sick pay export</h3>
      <p className="mb-3 text-muted-foreground">Day-by-day company and statutory sick pay from each employee&apos;s scheme, ready for payroll.</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1"><Label className="text-xs">Pay month</Label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-8 w-40" /></div>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" disabled={rows.length === 0} onClick={download}><FileSpreadsheet className="h-3.5 w-3.5" /> Download</Button>
      </div>
      <p className="mt-3">
        {rows.length} sick day{rows.length === 1 ? "" : "s"} · company sick pay <b>{money(osp)}</b> · statutory sick pay <b>{money(ssp)}</b>
      </p>
    </section>
  );
}

function PrivacyPanel() {
  const s = useSickness();
  const dispatch = useAppDispatch();
  const actor = useSicknessActor();
  const canManage = useCanManageSickness();
  const [retention, setRetention] = useState(s.settings.retentionMonths);
  const [filter, setFilter] = useState("all");
  const before = format(subMonths(new Date(), s.settings.retentionMonths), "yyyy-MM-dd");
  const due = s.records.filter((r) => r.absenceState === "returned" && (r.endDate ?? "") < before && (r.reasonDetail || r.documents.length)).length;
  const audit = s.audit.filter((a) => filter === "all" || (filter === "medical" ? a.action === "medical_viewed" : a.action !== "medical_viewed"));
  const auditPager = usePaged(audit, 10, filter);

  return (
    <section className="rounded-xl border border-border bg-card p-4 text-xs">
      <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Privacy, retention &amp; audit</h3>
      <p className="mb-3 text-muted-foreground">
        Medical details are special-category data (UK GDPR Art. 9). They are shown only to authorised HR, each view is logged,
        and closed records are anonymised after the retention period.
      </p>
      {canManage && (
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Keep medical detail for (months)</Label>
            <Input type="number" min={12} value={retention} onChange={(e) => setRetention(Number(e.target.value))} className="h-8 w-28" />
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { dispatch(updateSettings({ tenantId: s.tenantId, actor, settings: { ...s.settings, retentionMonths: retention } })); toast.success("Retention period saved"); }}>Save</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" disabled={due === 0} onClick={() => { dispatch(purgeExpired({ tenantId: s.tenantId, before, actor })); toast.success(`${due} record${due === 1 ? "" : "s"} anonymised`); }}>
            Anonymise {due} expired record{due === 1 ? "" : "s"}
          </Button>
        </div>
      )}
      <div className="mb-2 flex items-center gap-2">
        <History className="h-3.5 w-3.5" />
        <span className="font-medium">Audit log</span>
        <FilterSelect value={filter} onChange={setFilter} options={[["all", "All activity"], ["medical", "Medical detail views"], ["changes", "Changes"]]} />
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        {audit.length === 0 && <p className="px-3 py-3 text-muted-foreground">No activity recorded yet.</p>}
        {auditPager.slice.map((a) => (
          <div key={a.id} className="flex gap-2 border-b border-border/60 px-3 py-1.5">
            <span className="w-32 shrink-0 tabular-nums text-muted-foreground">{fmtDate(a.at, "d MMM yy HH:mm")}</span>
            <span><b>{a.actor}</b> {a.action.replace(/_/g, " ")}{a.note ? ` — ${a.note}` : ""}</span>
          </div>
        ))}
        <Pager pager={auditPager} noun="entries" />
      </div>
    </section>
  );
}
