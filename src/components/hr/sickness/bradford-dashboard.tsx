"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { ResponsiveBar } from "@nivo/bar";
import { Calculator, ClipboardCheck, Info, Plus, Settings2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Slider } from "@/src/components/ui/slider";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { NIVO_THEME } from "@/src/components/shared/charts";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { openReviewCase, sicknessId, updateReviewCase, updateSettings } from "@/src/lib/stores/sickness-slice";
import { bandFor } from "@/src/lib/sickness/bradford";
import { cn } from "@/src/lib/utils";
import {
  BRADFORD_ACTION_LABELS,
  REVIEW_OUTCOME_LABELS,
  REVIEW_TRIGGER_LABELS,
  type AbsenceReviewCase,
  type BradfordAction,
  type BradfordThreshold,
  type ReviewOutcome,
} from "@/src/lib/types/sickness";
import { SICKNESS_BASE, useCanManageSickness, useSickness, useSicknessActor } from "./hooks";
import { SicknessShell } from "./shell";
import { FilterSelect } from "./records-page";
import { BradfordBadge, ChartPanel, Pager, StatTile, fmtDate, usePaged } from "./ui";

export function BradfordDashboard() {
  const s = useSickness();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = params.get("employee");
  const caseParam = params.get("case");
  const canManage = useCanManageSickness();
  const [dept, setDept] = useState("all");
  const [branch, setBranch] = useState("all");
  const [band, setBand] = useState("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(caseParam);

  const scored = useMemo(() => {
    const ids = [...new Set(s.records.map((r) => r.employeeId))];
    return ids
      .map((id) => {
        const emp = s.byId.get(id);
        const result = s.bradfordFor(id);
        const history = s.snapshots.filter((x) => x.employeeId === id);
        return { id, emp, result, prev: history[1], openCase: s.reviewCases.find((c) => c.employeeId === id && c.status !== "closed") };
      })
      .filter((x) => x.emp)
      .sort((a, b) => b.result.score - a.result.score);
  }, [s]);

  const visible = scored
    .filter((x) => dept === "all" || x.emp!.departmentName === dept)
    .filter((x) => branch === "all" || x.emp!.branchId === branch)
    .filter((x) => band === "all" || x.result.action === band);
  const empPager = usePaged(visible, 12, `${dept}|${branch}|${band}`);
  const casePager = usePaged(s.reviewCases, 8, "cases");

  const monthly = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(parseISO(s.asOf), 11 - i)));
    return months.map((m) => {
      const key = format(m, "yyyy-MM");
      const n = visible.reduce((sum, x) => sum + x.result.episodes.filter((e) => e.start.startsWith(key)).length, 0);
      return { month: format(m, "MMM"), episodes: n };
    });
  }, [visible, s.asOf]);

  if (s.loading) {
    return <SicknessShell><Skeleton className="h-96 w-full" /></SicknessShell>;
  }

  const departments = [...new Set(scored.map((x) => x.emp!.departmentName))].sort();
  const openCases = s.reviewCases.filter((c) => c.status !== "closed");
  const focus = selected ? scored.find((x) => x.id === selected) : undefined;
  const reviewing = reviewId ? s.reviewCases.find((c) => c.id === reviewId) ?? null : null;

  return (
    <SicknessShell actions={canManage && <Button variant="outline" className="gap-1.5" onClick={() => setSettingsOpen(true)}><Settings2 className="h-4 w-4" /> Thresholds &amp; rules</Button>}>
      <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          The Bradford Factor (B = S² × D) highlights frequent short absences. It is a <b>management indicator, not a
          disciplinary decision</b>, and has nothing to do with pay. Before acting, HR must consider disability- or
          pregnancy-related absence, reasonable adjustments and other circumstances. A lower score doesn&apos;t mean less time lost.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect value={dept} onChange={setDept} options={[["all", "All departments"], ...departments.map((d) => [d, d] as [string, string])]} />
        <FilterSelect value={branch} onChange={setBranch} options={[["all", "All locations"], ...(s.bundle?.branches ?? []).map((b) => [b.id, b.name] as [string, string])]} />
        <FilterSelect value={band} onChange={setBand} options={[["all", "All bands"], ...(Object.keys(BRADFORD_ACTION_LABELS) as BradfordAction[]).map((a) => [a, BRADFORD_ACTION_LABELS[a]] as [string, string])]} />
        <span className="ml-auto text-xs text-muted-foreground">Last {s.settings.bradford.windowWeeks} weeks · rules v{s.settings.bradford.calcVersion}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Employees with absence" value={visible.filter((x) => x.result.S > 0).length} sub={`of ${s.employees.length} employees`} />
        <StatTile label="Absence episodes" value={visible.reduce((a, x) => a + x.result.S, 0)} />
        <StatTile label="Days lost" value={visible.reduce((a, x) => a + x.result.D, 0)} />
        <StatTile label="Reviews pending" value={openCases.length} tone={openCases.length ? "amber" : undefined} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <ChartPanel title="Absence episodes by month" description="Qualifying sickness episodes starting each month" minHeight={240}>
            <ResponsiveBar
              data={monthly}
              keys={["episodes"]}
              indexBy="month"
              margin={{ top: 10, right: 10, bottom: 28, left: 32 }}
              padding={0.3}
              colors={["#5192FA"]}
              borderRadius={4}
              axisLeft={{ tickSize: 0 }}
              axisBottom={{ tickSize: 0, tickPadding: 6 }}
              labelSkipHeight={12}
              theme={NIVO_THEME}
              animate={false}
            />
        </ChartPanel>
        <BradfordCalculator />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Employees by Bradford score</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  {["Employee", "Episodes (S)", "Days (D)", "Score", "Change", "Status", "Review"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empPager.slice.map((x) => (
                  <tr
                    key={x.id}
                    className={cn("cursor-pointer border-t border-border/60 hover:bg-muted", selected === x.id && "bg-[color-mix(in_oklab,var(--primary)_7%,var(--card))]")}
                    onClick={() => router.replace(`${pathname}?employee=${x.id}`, { scroll: false })}
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <PersonAvatar name={x.emp!.fullName} initials={x.emp!.initials} className="size-6" fallbackClassName="text-[9px]" />
                        <span>
                          <span className="block font-medium">{x.emp!.fullName}</span>
                          <span className="block text-[10px] text-muted-foreground">{x.emp!.departmentName}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{x.result.S}</td>
                    <td className="px-3 py-2 tabular-nums">{x.result.D}</td>
                    <td className="px-3 py-2 text-sm font-semibold tabular-nums">{x.result.score}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                      {x.prev ? `${x.result.score - x.prev.score >= 0 ? "+" : ""}${Math.round((x.result.score - x.prev.score) * 10) / 10}` : "—"}
                    </td>
                    <td className="px-3 py-2"><BradfordBadge action={x.result.action} /></td>
                    <td className="px-3 py-2">
                      {x.openCase ? (
                        <button type="button" className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); setReviewId(x.openCase!.id); }}>
                          Open case
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No sickness absence for these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager pager={empPager} noun="employees" />
        </div>

        <div className="flex flex-col gap-4">
          {focus ? <EmployeeBreakdown x={focus} onClose={() => router.replace(pathname, { scroll: false })} onReview={(id) => setReviewId(id)} /> : (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
              Select an employee to see exactly how their score was calculated.
            </div>
          )}
          {/* Takes the rest of the column so it ends level with the table. */}
          <div className="flex flex-1 flex-col rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Review cases</h3>
              <span className="ml-auto rounded-full bg-muted px-2 text-xs">{openCases.length} open</span>
            </div>
            <div className="flex-1">
              {s.reviewCases.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted-foreground">No review cases.</p>}
              {casePager.slice.map((c) => (
                <button key={c.id} type="button" onClick={() => setReviewId(c.id)} className="block w-full border-b border-border/60 px-4 py-2.5 text-left text-xs last:border-0 hover:bg-muted">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{c.employeeName}</span>
                    <span className={cn("capitalize", c.status === "closed" ? "text-muted-foreground" : "text-amber-600")}>{c.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {REVIEW_TRIGGER_LABELS[c.trigger]}{c.scoreAtOpen != null ? ` · score ${c.scoreAtOpen}` : ""} · {fmtDate(c.openedAt)}
                    {c.outcome ? ` · ${REVIEW_OUTCOME_LABELS[c.outcome]}` : ""}
                  </p>
                </button>
              ))}
            </div>
            <Pager pager={casePager} noun="cases" />
          </div>
        </div>
      </div>

      <ReviewCaseDialog reviewCase={reviewing} onClose={() => setReviewId(null)} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </SicknessShell>
  );
}

type Scored = {
  id: string;
  emp?: { fullName: string; departmentName: string };
  result: ReturnType<ReturnType<typeof useSickness>["bradfordFor"]>;
  openCase?: AbsenceReviewCase;
};

function EmployeeBreakdown({ x, onClose, onReview }: { x: Scored; onClose: () => void; onReview: (id: string) => void }) {
  const s = useSickness();
  const dispatch = useAppDispatch();
  const actor = useSicknessActor();
  const canManage = useCanManageSickness();
  const history = s.snapshots.filter((h) => h.employeeId === x.id).slice(0, 8);
  const r = x.result;
  const avgLen = r.S ? r.D / r.S : 0;

  function startReview() {
    const id = sicknessId("ARC");
    dispatch(
      openReviewCase({
        actor,
        case: {
          id,
          tenantId: s.tenantId,
          employeeId: x.id,
          employeeName: x.emp!.fullName,
          trigger: "policy_review",
          action: r.action,
          scoreAtOpen: r.score,
          status: "open",
          openedAt: new Date().toISOString(),
          owner: actor,
          recordIds: r.episodes.flatMap((e) => e.recordIds),
          considerations: { disability: false, pregnancy: false, adjustments: false, otherCircumstances: false },
        },
      }),
    );
    onReview(id);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-xs">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{x.emp!.fullName}</h3>
          <p className="text-muted-foreground">{fmtDate(r.windowStart)} – {fmtDate(r.windowEnd)}</p>
        </div>
        <button type="button" onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <p className="mb-2 rounded-md bg-muted px-3 py-2 text-sm">
        {r.S}² × {r.D} = <b>{r.score}</b> <span className="ml-1"><BradfordBadge action={r.action} /></span>
      </p>
      <p className="mb-3 text-muted-foreground">
        {r.S === 0
          ? "No qualifying sickness in the window."
          : avgLen <= 2.5
            ? `${r.S} separate absences averaging ${avgLen.toFixed(1)} days — frequent short-notice absence is what the score is designed to surface (cover, rescheduling, colleagues' workload).`
            : `${r.S} absence${r.S === 1 ? "" : "s"} averaging ${avgLen.toFixed(1)} days — fewer, longer spells. The score is lower, but working time lost may still be significant.`}
      </p>
      <p className="mb-1 font-medium">Episodes counted</p>
      <ul className="mb-3 space-y-1">
        {r.episodes.map((e, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span>{fmtDate(e.start)} – {fmtDate(e.end)}{e.clipped ? " (part outside window)" : ""}</span>
            <span className="tabular-nums">{e.days} day{e.days === 1 ? "" : "s"}</span>
          </li>
        ))}
      </ul>
      {r.excluded.length > 0 && (
        <>
          <p className="mb-1 font-medium">Not counted</p>
          <ul className="mb-3 space-y-1 text-muted-foreground">
            {r.excluded.map((e) => (
              <li key={e.recordId}>
                <Link href={`${SICKNESS_BASE}/records/${e.recordId}`} className="hover:underline">{e.reason}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mb-1 font-medium">Score history</p>
      <ul className="mb-3 space-y-1 text-muted-foreground">
        {history.length === 0 && <li>Not yet recorded.</li>}
        {history.map((h) => (
          <li key={h.id} className="flex justify-between gap-2">
            <span>{fmtDate(h.computedAt, "d MMM yyyy HH:mm")} · {h.trigger}</span>
            <span className="tabular-nums">{h.score} (v{h.calcVersion})</span>
          </li>
        ))}
      </ul>
      {canManage && !x.openCase && r.S > 0 && (
        <Button size="sm" variant="outline" onClick={startReview}>Start a review</Button>
      )}
    </div>
  );
}

function ReviewCaseDialog({ reviewCase, onClose }: { reviewCase: AbsenceReviewCase | null; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const actor = useSicknessActor();
  const canManage = useCanManageSickness();
  const [considerations, setConsiderations] = useState(reviewCase?.considerations);
  const [outcome, setOutcome] = useState<ReviewOutcome | "">(reviewCase?.outcome ?? "");
  const [notes, setNotes] = useState(reviewCase?.outcomeNotes ?? "");
  const [prev, setPrev] = useState(reviewCase);
  if (prev !== reviewCase) {
    setPrev(reviewCase);
    setConsiderations(reviewCase?.considerations);
    setOutcome(reviewCase?.outcome ?? "");
    setNotes(reviewCase?.outcomeNotes ?? "");
  }
  if (!reviewCase || !considerations) return null;
  const closed = reviewCase.status === "closed";
  const allConsidered = Object.values(considerations).every(Boolean);

  const items: Array<[keyof AbsenceReviewCase["considerations"], string]> = [
    ["disability", "Considered whether any absence is disability-related (Equality Act 2010)"],
    ["pregnancy", "Considered whether any absence is pregnancy-related — these must be excluded"],
    ["adjustments", "Considered whether reasonable adjustments are in place or needed"],
    ["otherCircumstances", "Considered other circumstances (bereavement, caring, injury at work…)"],
  ];

  function save(close: boolean) {
    dispatch(
      updateReviewCase({
        id: reviewCase!.id,
        actor,
        changes: {
          considerations: considerations!,
          outcome: outcome || undefined,
          outcomeNotes: notes.trim() || undefined,
          status: close ? "closed" : "in_review",
          ...(close ? { closedBy: actor, closedAt: new Date().toISOString() } : {}),
        },
      }),
    );
    toast.success(close ? "Review closed" : "Review saved");
    onClose();
  }

  return (
    <Dialog open={!!reviewCase} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Attendance review — {reviewCase.employeeName}</DialogTitle>
          <DialogDescription className="text-xs">
            {REVIEW_TRIGGER_LABELS[reviewCase.trigger]}
            {reviewCase.scoreAtOpen != null ? ` · Bradford score ${reviewCase.scoreAtOpen}` : ""}
            {reviewCase.action ? ` · ${BRADFORD_ACTION_LABELS[reviewCase.action]}` : ""} · owner {reviewCase.owner}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <p className="rounded-md bg-muted px-3 py-2">
            This review is a conversation, not a sanction. Complete every check below before recording an outcome.
          </p>
          {items.map(([k, label]) => (
            <label key={k} className="flex items-start gap-2">
              <Checkbox
                disabled={closed || !canManage}
                checked={considerations[k]}
                onCheckedChange={(c) => setConsiderations({ ...considerations, [k]: !!c })}
                className="mt-0.5"
              />
              {label}
            </label>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs">Outcome</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as ReviewOutcome)} disabled={closed || !canManage || !allConsidered}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder={allConsidered ? "Choose an outcome" : "Complete the checks first"} /></SelectTrigger>
              <SelectContent>
                {(Object.keys(REVIEW_OUTCOME_LABELS) as ReviewOutcome[]).map((o) => (
                  <SelectItem key={o} value={o}>{REVIEW_OUTCOME_LABELS[o]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <textarea disabled={closed || !canManage} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          {closed && <p className="text-muted-foreground">Closed by {reviewCase.closedBy} on {fmtDate(reviewCase.closedAt)}.</p>}
          {reviewCase.recordIds.length > 0 && (
            <p className="text-muted-foreground">
              Absences in scope:{" "}
              {reviewCase.recordIds.slice(0, 6).map((id, i) => (
                <Link key={id} href={`${SICKNESS_BASE}/records/${id}`} className="text-primary hover:underline">{i ? ", " : ""}#{i + 1}</Link>
              ))}
            </p>
          )}
        </div>
        {!closed && canManage && (
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => save(false)}>Save progress</Button>
            <Button size="sm" disabled={!allConsidered || !outcome || notes.trim().length < 5} onClick={() => save(true)}>Close review</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const dispatch = useAppDispatch();
  const s = useSickness();
  const actor = useSicknessActor();
  const [rows, setRows] = useState<BradfordThreshold[]>(s.settings.bradford.thresholds);
  const [form, setForm] = useState(s.settings);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setRows(s.settings.bradford.thresholds);
      setForm(s.settings);
    }
  }
  const sorted = [...rows].sort((a, b) => a.min - b.min);
  const valid = sorted.length > 0 && sorted[0].min === 0 && new Set(sorted.map((r) => r.min)).size === sorted.length;

  function save() {
    if (!valid) return;
    dispatch(updateSettings({ tenantId: s.tenantId, actor, settings: { ...form, bradford: { ...form.bradford, thresholds: sorted } } }));
    toast.success("Rules saved — every score has been recalculated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Review thresholds &amp; calculation rules</DialogTitle>
          <DialogDescription className="text-xs">Your organisation&apos;s own policy — Motee doesn&apos;t impose one. Changes recalculate every score and are versioned.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 text-xs">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Review thresholds</Label>
            {sorted.map((t, i) => {
              const next = sorted[i + 1];
              return (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="w-10 text-muted-foreground">From</span>
                  <Input type="number" min={0} value={t.min} disabled={i === 0} onChange={(e) => setRows(rows.map((r) => (r.id === t.id ? { ...r, min: Number(e.target.value) } : r)))} className="h-8 w-20" />
                  <span className="w-20 text-muted-foreground">{next ? `to ${next.min - 1}` : "and above"}</span>
                  <Select value={t.action} onValueChange={(v) => setRows(rows.map((r) => (r.id === t.id ? { ...r, action: v as BradfordAction } : r)))}>
                    <SelectTrigger size="sm" className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BRADFORD_ACTION_LABELS) as BradfordAction[]).map((a) => (
                        <SelectItem key={a} value={a} className="text-xs">{BRADFORD_ACTION_LABELS[a]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => setRows(rows.filter((r) => r.id !== t.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setRows([...rows, { id: `th-${Date.now()}`, min: (sorted[sorted.length - 1]?.min ?? 0) + 100, label: "", action: "manager_review" }])}>
              <Plus className="h-3.5 w-3.5" /> Add threshold
            </Button>
            {!valid && <p className="text-destructive">Thresholds must start at 0 and each start value must be different.</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Rolling period (weeks)</Label>
              <Input type="number" min={4} max={104} value={form.bradford.windowWeeks} onChange={(e) => setForm({ ...form, bradford: { ...form.bradford, windowWeeks: Number(e.target.value) || 52 } })} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Long-term absence after (calendar days)</Label>
              <Input type="number" min={7} value={form.longTermDays} onChange={(e) => setForm({ ...form, longTermDays: Number(e.target.value) || 28 })} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Suggest OH referral after (continuous days)</Label>
              <Input type="number" min={1} value={form.ohTriggerDays} onChange={(e) => setForm({ ...form, ohTriggerDays: Number(e.target.value) || 28 })} className="h-8" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Self-certification limit (days)</Label>
              <Input type="number" min={1} value={form.selfCertDays} onChange={(e) => setForm({ ...form, selfCertDays: Number(e.target.value) || 7 })} className="h-8" />
            </div>
          </div>
          {(
            [
              ["mergeAcrossNonWorkingDays", "Treat absences either side of non-working days as one episode"],
              ["halfDaysAsHalf", "Count half days as 0.5"],
              ["honourExclusions", "Leave out absences HR has excluded (disability, pregnancy…)"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-3">
              {label}
              <Switch checked={form.bradford[k]} onCheckedChange={(c) => setForm({ ...form, bradford: { ...form.bradford, [k]: c } })} />
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!valid} onClick={save}>Save rules</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The brief's interactive calculator, banded against this tenant's thresholds. */
function BradfordCalculator() {
  const s = useSickness();
  const [episodes, setEpisodes] = useState(4);
  const [days, setDays] = useState(10);
  const score = episodes * episodes * days;
  const t = bandFor(score, s.settings.bradford.thresholds);
  return (
    <div className="h-full rounded-xl border border-border bg-card p-4 text-xs">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Bradford Factor calculator</h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex justify-between"><span>Separate sickness episodes</span><b>{episodes}</b></div>
          <Slider min={1} max={12} step={1} value={[episodes]} onValueChange={(v) => setEpisodes(v[0])} />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between"><span>Total sickness days</span><b>{days}</b></div>
          <Slider min={1} max={60} step={1} value={[days]} onValueChange={(v) => setDays(v[0])} />
        </div>
        <div className="rounded-md bg-muted py-3 text-center">
          <p className="text-muted-foreground">Calculated Bradford score</p>
          <p className="text-3xl font-bold tabular-nums">{score}</p>
          <p className="text-muted-foreground">{episodes}² × {days} = {score}</p>
          <div className="mt-1"><BradfordBadge action={t.action} /></div>
        </div>
        <table className="w-full">
          <tbody>
            {[[1, 10], [2, 10], [5, 10]].map(([sx, dx]) => (
              <tr key={sx} className="border-t border-border/60">
                <td className="py-1">{sx === 1 ? "One absence of 10 days" : `${sx} absences of ${dx / sx} days`}</td>
                <td className="py-1 text-muted-foreground">{sx}² × {dx}</td>
                <td className="py-1 text-right font-medium tabular-nums">{sx * sx * dx}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-muted-foreground">Same 10 days off, very different scores — the factor weights frequency, not length.</p>
      </div>
    </div>
  );
}
