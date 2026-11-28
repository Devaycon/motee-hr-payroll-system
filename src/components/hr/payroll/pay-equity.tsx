"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, FilePenLine, Lock, Pencil, Scale, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { PAYROLL_HREF, PAYROLL_MODULE, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { writeWorkbook } from "@/src/lib/payroll/exports";
import { DIMENSION_LABELS, FINDING_LABELS, buildEquityReport, compareBy, defaultBands, type Dimension, type EquityPerson, type Finding, type SalaryBand } from "@/src/lib/payroll/pay-equity";
import { useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { ChartCard, Figure, compactNaira } from "./components/charts";
import { NotSupported, fmtDate, money } from "./components/shared";
import { DetailModal, DownloadMenu, RowActions } from "./components/row-actions";

const SEVERITY: Record<Finding["severity"], string> = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  low: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300",
};
const DIMS: Dimension[] = ["department", "grade", "gender", "jobFamily", "service", "location", "band"];

/**
 * `/time-payroll/payroll/pay-equity` — Pay Equity & Salary Intelligence
 * (client feedback B9). Restricted: payroll editors only, because it shows
 * individual salaries alongside gender.
 */
export function PayEquityPage() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const me = useCurrentActor();
  const canSee = useCan(PAYROLL_MODULE, "edit");
  const canSettings = useCan(PAYROLL_SETTINGS_MODULE, "edit");
  const [dim, setDim] = useState<Dimension>("department");
  const [minLocal, setMinLocal] = useState<number | null>(null);
  const [editBands, setEditBands] = useState<SalaryBand[] | null>(null);
  const [explain, setExplain] = useState<Finding | null>(null);
  const [note, setNote] = useState("");
  const [person, setPerson] = useState<EquityPerson | null>(null);

  const run = useMemo(
    () => (data?.runs ?? []).filter((r) => r.type === "regular" && (r.status === "finalized" || r.status === "disbursed")).sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month))[0] ?? null,
    [data],
  );
  const minGroup = minLocal ?? data?.settings.payEquityMinGroup ?? 3;
  const report = useMemo(() => {
    if (!data || !bundle) return null;
    const branches = new Map(((bundle as unknown as { branches?: { id: string; name: string }[] }).branches ?? []).map((b) => [b.id, b.name]));
    return buildEquityReport({ run, people: new Map(bundle.employees.map((e) => [e.id, e])), structures: data.structures, bands: data.settings.salaryBands, explanations: data.equityExplanations, minGroup, branches });
  }, [data, bundle, run, minGroup]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !report) return <Skeleton className="h-[600px] w-full rounded-xl" />;
  if (!canSee) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <Lock className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Pay equity is restricted</p>
        <p className="max-w-md text-xs text-muted-foreground">It shows individual salaries alongside gender and service, so only payroll editors can open it.</p>
      </div>
    );
  }

  const provisional = !data.settings.salaryBands?.length;
  const bands = data.settings.salaryBands?.length ? data.settings.salaryBands : defaultBands(report.people);
  const groups = compareBy(report.people, dim, minGroup);
  const open = report.findings.filter((f) => !f.explained);
  const pendingExplanations = (data.equityExplanations ?? []).filter((x) => !x.approvedBy);
  const byId = new Map(report.people.map((p) => [p.employeeId, p]));

  const download = (f: "xlsx" | "csv" | "pdf") => {
    writeWorkbook(
      `pay-equity-${report.asOf.toLowerCase().replace(/\s+/g, "-")}`,
      [
        { name: "Summary", table: { headers: ["Measure", "Value"], data: [["As at", report.asOf], ["Employees", report.overall.count], ["Average annual pay", report.overall.average], ["Median annual pay", report.overall.median], ["Gender gap (median, unadjusted) %", report.genderGap.medianPct ?? "withheld"], ["Gender gap (mean, unadjusted) %", report.genderGap.meanPct ?? "withheld"], ["Within band %", report.bandCompliance.pct ?? "no bands"], ["Minimum group size", minGroup], ["Open findings", open.length]] } },
        ...DIMS.map((d) => ({ name: DIMENSION_LABELS[d], table: { headers: [DIMENSION_LABELS[d], "People", "Average", "Median", "Min", "Max", "Gender gap %"], data: compareBy(report.people, d, minGroup).map((g) => [g.group, g.count, g.average ?? "withheld", g.median ?? "withheld", g.min ?? "", g.max ?? "", g.genderGapPct ?? ""]) } })),
        { name: "Like for like", table: { headers: ["Grade", "Women", "Men", "Gap %"], data: report.likeForLike.map((l) => [l.grade, l.women, l.men, l.suppressed ? "withheld" : l.gapPct ?? ""]) } },
        { name: "Findings", table: { headers: ["Severity", "Type", "Finding", "Detail", "Annual cost to fix", "Explanation"], data: report.findings.map((x) => [x.severity, FINDING_LABELS[x.kind], x.title, x.detail, x.costToFix ?? "", x.explained ? `${x.explained.note} (approved by ${x.explained.approvedBy})` : ""]) } },
        { name: "Recommendations", table: { headers: ["Recommendation"], data: report.recommendations.map((r) => [r]) } },
      ],
      f,
      `Pay equity report — ${report.asOf}`,
    );
    actions.logExport("", `Pay equity management report — ${report.asOf} (${f.toUpperCase()})`);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`${PAYROLL_HREF}?tab=intelligence`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Payroll Intelligence</Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold"><Scale className="h-5 w-5 text-primary" /> Pay Equity &amp; Salary Intelligence</h1>
          <p className="text-xs text-muted-foreground">Annual fixed pay (salary structure × 12) as at {report.asOf}. Groups smaller than {minGroup} are withheld so no one can be identified and small samples don&apos;t mislead.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(minGroup)} onValueChange={(v) => { setMinLocal(Number(v)); if (canSettings) actions.updateSettings({ payEquityMinGroup: Number(v) }); }}>
            <SelectTrigger size="sm" className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{[2, 3, 5, 10].map((n) => <SelectItem key={n} value={String(n)} className="text-xs">Minimum group: {n} people</SelectItem>)}</SelectContent>
          </Select>
          <DownloadMenu label="Management report" onDownload={download} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6">
        <Figure label="Employees" value={String(report.overall.count)} sub={`${report.genderGap.women} women · ${report.genderGap.men} men`} />
        <Figure label="Median annual pay" value={compactNaira(report.overall.median)} sub={`Average ${compactNaira(report.overall.average)}`} />
        <Figure label="P90 ÷ P10" value={report.overall.p10 ? `${(report.overall.p90 / report.overall.p10).toFixed(1)}×` : "—"} sub="Spread top to bottom" />
        <Figure label="Gender pay gap" value={report.genderGap.medianPct === null ? "Withheld" : `${report.genderGap.medianPct}%`} sub={`Median, unadjusted · mean ${report.genderGap.meanPct ?? "—"}%`} tone={report.genderGap.medianPct !== null && Math.abs(report.genderGap.medianPct) >= 10 ? "warn" : undefined} />
        <Figure label="Within salary band" value={report.bandCompliance.pct === null ? "—" : `${report.bandCompliance.pct}%`} sub={`${report.bandCompliance.below} below · ${report.bandCompliance.above} above`} tone={report.bandCompliance.below ? "bad" : "good"} />
        <Figure label="Open findings" value={String(open.length)} sub={`${report.findings.length - open.length} explained & approved`} tone={open.some((f) => f.severity === "high") ? "bad" : open.length ? "warn" : "good"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChartCard title="Compare salaries" description="Average, median and range for each group. The gender gap column compares women's and men's medians inside each group, when both are large enough.">
          <div className="mb-3 flex flex-wrap gap-1">
            {DIMS.map((d) => (
              <button key={d} type="button" onClick={() => setDim(d)} className={cn("rounded-md border px-2 py-1 text-[11px]", dim === d ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50")}>{DIMENSION_LABELS[d]}</button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs tabular-nums">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">{DIMENSION_LABELS[dim]}</th>
                  <th className="px-3 py-1.5 text-right font-medium">People</th>
                  <th className="px-3 py-1.5 text-right font-medium">Average</th>
                  <th className="px-3 py-1.5 text-right font-medium">Median</th>
                  <th className="px-3 py-1.5 text-right font-medium">Range</th>
                  {dim !== "gender" && <th className="px-3 py-1.5 text-right font-medium">Gender gap</th>}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.group} className={cn("border-t", g.suppressed && "text-muted-foreground")}>
                    <td className="px-3 py-1.5">{g.group}</td>
                    <td className="px-3 py-1.5 text-right">{g.count}</td>
                    {g.suppressed ? (
                      <td colSpan={dim === "gender" ? 3 : 4} className="px-3 py-1.5 text-right italic">Fewer than {minGroup} people — withheld</td>
                    ) : (
                      <>
                        <td className="px-3 py-1.5 text-right">{compactNaira(g.average!)}</td>
                        <td className="px-3 py-1.5 text-right">{compactNaira(g.median!)}</td>
                        <td className="px-3 py-1.5 text-right">{compactNaira(g.min!)}–{compactNaira(g.max!)}</td>
                        {dim !== "gender" && <td className={cn("px-3 py-1.5 text-right", g.genderGapPct !== null && Math.abs(g.genderGapPct) >= 10 && "font-medium text-amber-700 dark:text-amber-400")}>{g.genderGapPct === null ? "—" : `${g.genderGapPct}%`}</td>}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Gender, like for like" description="Within the same grade, so different roles aren't compared. Positive = women's median is lower.">
          <table className="w-full text-xs tabular-nums">
            <thead className="text-muted-foreground"><tr><th className="py-1 text-left font-medium">Grade</th><th className="py-1 text-right font-medium">Women</th><th className="py-1 text-right font-medium">Men</th><th className="py-1 text-right font-medium">Gap</th></tr></thead>
            <tbody>
              {report.likeForLike.map((l) => (
                <tr key={l.grade} className="border-t">
                  <td className="py-1.5">{l.grade}</td>
                  <td className="py-1.5 text-right">{l.women}</td>
                  <td className="py-1.5 text-right">{l.men}</td>
                  <td className={cn("py-1.5 text-right", l.suppressed ? "italic text-muted-foreground" : l.gapPct !== null && Math.abs(l.gapPct) >= 5 && "font-medium text-amber-700 dark:text-amber-400")}>{l.suppressed ? "withheld" : `${l.gapPct}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-muted-foreground">A grade is only compared when it has at least {minGroup} women and {minGroup} men.</p>
        </ChartCard>
      </div>

      <ChartCard
        title="Salary bands & compliance"
        description={provisional ? "No approved bands yet — showing a provisional range of each grade's median ±20%. Approve real bands to make compliance meaningful." : "Approved annual pay range per grade."}
        right={canSettings && !editBands ? <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => setEditBands(bands.map((b) => ({ ...b })))}><Pencil className="h-3 w-3" /> {provisional ? "Approve bands" : "Edit bands"}</Button> : undefined}
      >
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs tabular-nums">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr><th className="px-3 py-1.5 text-left font-medium">Grade</th><th className="px-3 py-1.5 text-right font-medium">Minimum</th><th className="px-3 py-1.5 text-right font-medium">Midpoint</th><th className="px-3 py-1.5 text-right font-medium">Maximum</th><th className="px-3 py-1.5 text-right font-medium">Below</th><th className="px-3 py-1.5 text-right font-medium">Within</th><th className="px-3 py-1.5 text-right font-medium">Above</th></tr>
            </thead>
            <tbody>
              {(editBands ?? bands).map((b, i) => {
                const inG = report.people.filter((p) => p.grade === b.grade);
                return (
                  <tr key={b.grade} className="border-t">
                    <td className="px-3 py-1.5 font-medium">{b.grade}</td>
                    {editBands ? (
                      <>
                        <td className="px-3 py-1"><Input type="number" className="h-7 text-right text-xs" value={b.min} onChange={(e) => setEditBands(editBands.map((x, j) => (j === i ? { ...x, min: Number(e.target.value) } : x)))} /></td>
                        <td className="px-3 py-1.5 text-right text-muted-foreground">{compactNaira((b.min + b.max) / 2)}</td>
                        <td className="px-3 py-1"><Input type="number" className="h-7 text-right text-xs" value={b.max} onChange={(e) => setEditBands(editBands.map((x, j) => (j === i ? { ...x, max: Number(e.target.value) } : x)))} /></td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-1.5 text-right">{compactNaira(b.min)}</td>
                        <td className="px-3 py-1.5 text-right">{compactNaira((b.min + b.max) / 2)}</td>
                        <td className="px-3 py-1.5 text-right">{compactNaira(b.max)}</td>
                      </>
                    )}
                    <td className={cn("px-3 py-1.5 text-right", inG.some((p) => p.bandStatus === "below") && "font-medium text-rose-600")}>{inG.filter((p) => p.bandStatus === "below").length}</td>
                    <td className="px-3 py-1.5 text-right">{inG.filter((p) => p.bandStatus === "within").length}</td>
                    <td className="px-3 py-1.5 text-right">{inG.filter((p) => p.bandStatus === "above").length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {editBands && (
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditBands(null)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => {
                if (editBands.some((b) => !(b.min > 0) || b.max <= b.min)) return toast.error("Each band needs a minimum above zero and a maximum above the minimum.");
                actions.updateSettings({ salaryBands: editBands });
                setEditBands(null);
                toast.success("Salary bands saved", { description: "Logged in Settings → Change History." });
              }}
            >
              Save bands
            </Button>
          </div>
        )}
      </ChartCard>

      <ChartCard title="Disparity alerts" description="Raised automatically. A difference with a documented explanation approved by a second person is shown as explained, not as an alert.">
        <ul className="divide-y rounded-lg border">
          {report.findings.map((f) => (
            <li key={f.id} className={cn("flex items-start justify-between gap-3 px-3 py-2", f.explained && "opacity-70")}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                  <Badge variant="outline" className={cn("text-[9px] uppercase", SEVERITY[f.severity])}>{f.severity}</Badge>
                  <span className="text-[10px] text-muted-foreground">{FINDING_LABELS[f.kind]}</span>
                  {f.title}
                </p>
                <p className="text-[11px] text-muted-foreground">{f.detail}{f.costToFix ? ` Cost to fix: ${money(f.costToFix, 0)} a year.` : ""}</p>
                {f.explained && <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400"><ShieldCheck className="h-3 w-3" /> Explained: {f.explained.note} — approved by {f.explained.approvedBy}</p>}
              </div>
              <RowActions
                label={`${f.title} actions`}
                actions={[
                  ...f.employeeIds.slice(0, 4).map((id) => ({ label: `View ${byId.get(id)?.name ?? id}`, icon: Eye, onSelect: () => setPerson(byId.get(id) ?? null) })),
                  ...(f.explained ? [] : [{ label: "Document an explanation", icon: FilePenLine, onSelect: () => { setExplain(f); setNote(""); }, separated: true }]),
                  { label: "Employee profile", icon: UserRound, href: `/organization/employees/${f.employeeIds[0]}` },
                ]}
              />
            </li>
          ))}
          {!report.findings.length && <li className="px-3 py-6 text-center text-xs text-muted-foreground">No disparities at this threshold.</li>}
        </ul>
        {pendingExplanations.length > 0 && (
          <div className="mt-3 rounded-lg border p-3">
            <p className="text-xs font-semibold">Explanations awaiting approval</p>
            <ul className="mt-1 space-y-1.5 text-[11px]">
              {pendingExplanations.map((x) => (
                <li key={x.id} className="flex items-start justify-between gap-2">
                  <span><span className="font-medium">{byId.get(x.employeeId)?.name ?? x.employeeId}</span> · {FINDING_LABELS[x.kind]}: {x.note} <span className="text-muted-foreground">— {x.by}, {fmtDate(x.at)}</span></span>
                  <Button size="sm" variant="outline" className="h-6 shrink-0 gap-1 text-[10px]" disabled={x.by === me.name || x.byId === me.employeeId} title={x.by === me.name ? "A second person must approve it" : undefined} onClick={() => { const r = actions.approvePayExplanation(x.id); if (r.ok) toast.success("Explanation approved"); else toast.error(r.reason); }}><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </ChartCard>

      <ChartCard title="Recommendations for management" description="Built from the open findings above.">
        <ul className="list-disc space-y-1 pl-5 text-xs">{report.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
      </ChartCard>

      <Dialog open={!!explain} onOpenChange={(o) => !o && setExplain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document an explanation</DialogTitle>
            <DialogDescription>{explain?.title}. A second authorised person approves it before the alert is cleared; the explanation stays on record.</DialogDescription>
          </DialogHeader>
          <Textarea className="min-h-24 text-sm" placeholder="e.g. Market supplement approved by the CFO on 12 Mar 2026 for a scarce certification (ref HR-2026-044)." value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setExplain(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!explain) return;
                const r = actions.explainPayDifference(explain.employeeIds[0], explain.kind, note);
                if (!r.ok) return toast.error(r.reason);
                toast.success("Explanation recorded", { description: "It clears the alert once a second person approves it." });
                setExplain(null);
              }}
            >
              Submit for approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {person && (
        <DetailModal
          open
          onClose={() => setPerson(null)}
          title={person.name}
          description={`${person.employeeNumber} · ${person.jobTitle} · ${person.department} · ${person.location}`}
          facts={[
            { label: "Annual fixed pay", value: compactNaira(person.annual) },
            { label: "Grade / band", value: person.band ? `${person.grade} · ${compactNaira(person.band.min)}–${compactNaira(person.band.max)}` : person.grade },
            { label: "Compa-ratio", value: person.compaRatio === null ? "—" : person.compaRatio.toFixed(2), tone: person.bandStatus === "below" ? "bad" : person.bandStatus === "above" ? "warn" : "good" },
            { label: "Service", value: `${person.serviceYears.toFixed(1)} years` },
          ]}
          actions={<Button size="sm" variant="outline" asChild><Link href={`/organization/employees/${person.employeeId}`}>Employee profile</Link></Button>}
        >
          <p className="text-xs font-semibold">Salary history, promotions and approved adjustments</p>
          <table className="w-full text-xs tabular-nums">
            <thead className="text-muted-foreground"><tr><th className="py-1 text-left font-medium">Effective</th><th className="py-1 text-right font-medium">Annual</th><th className="py-1 text-left font-medium pl-3">Reason</th><th className="py-1 text-left font-medium">Approved by</th></tr></thead>
            <tbody>
              {person.history.map((h) => (
                <tr key={h.from} className="border-t">
                  <td className="py-1.5">{fmtDate(h.from)}</td>
                  <td className="py-1.5 text-right">{compactNaira(h.annual)}</td>
                  <td className="py-1.5 pl-3">{h.reason ?? "—"}</td>
                  <td className="py-1.5">{h.approvedBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DetailModal>
      )}
    </div>
  );
}
