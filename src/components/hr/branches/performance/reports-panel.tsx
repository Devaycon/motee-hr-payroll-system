"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarClock,
  Eye,
  FileSpreadsheet,
  FileText,
  History,
  Pencil,
  Plus,
  Send,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
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
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import {
  FREQUENCY_LABELS,
  KPI_BY_ID,
  KPI_DEFS,
  formatKpi,
  type KpiId,
  type ReportFrequency,
} from "@/src/lib/branches/performance";
import {
  buildReportModel,
  exportReportXlsx,
  printReport,
  type ReportModel,
} from "@/src/lib/branches/performance-report";
import {
  deleteSchedule,
  recordDelivery,
  resetTargets,
  setScoreKpis,
  setTargets,
  toggleSchedule,
  upsertSchedule,
  type ReportFormat,
  type ReportSchedule,
  type Weekday,
} from "@/src/lib/stores/branch-performance-slice";
import { usePerformanceInput } from "./use-performance";
import { KPI_OPTIONS, MultiSelect } from "./shared";
import { EmailPreviewDialog } from "./email-preview";
import {
  WEEKDAY_LABELS,
  dueSchedules,
  previousRun,
  relativeNext,
  scheduleLabel,
} from "./schedule-utils";

/**
 * Exportable management reports: on-demand PDF/Excel (weekly, monthly,
 * quarterly), automated email schedules, organisational targets and a log of
 * what was sent.
 */
export function ReportsPanel() {
  const dispatch = useAppDispatch();
  const { input, loading, visibleBranchIds, settings } = usePerformanceInput();
  const company = useAppSelector((s) => s.locale.data?.tenant.name) ?? "Company";
  const canManage = useCan("organization.branches", "edit");

  const [frequency, setFrequency] = useState<ReportFrequency>("weekly");
  const [branchSel, setBranchSel] = useState<string[]>([]);
  const [kpis, setKpis] = useState<KpiId[]>(["taskCompletion", "compliance", "overdueTasks", "training", "issues"]);
  const [rankBy, setRankBy] = useState<KpiId | "score">("score");
  const [editing, setEditing] = useState<ReportSchedule | null>(null);
  const [preview, setPreview] = useState<ReportSchedule | null>(null);

  const branchOptions = useMemo(
    () =>
      (input?.branches ?? [])
        .filter((b) => visibleBranchIds.includes(b.id))
        .map((b) => ({ value: b.id, label: b.name })),
    [input, visibleBranchIds],
  );

  function modelFor(opts: { frequency: ReportFrequency; branchIds: string[]; kpis: KpiId[]; rankBy?: KpiId | "score" }): ReportModel | null {
    if (!input) return null;
    const ids = opts.branchIds.length ? opts.branchIds.filter((id) => visibleBranchIds.includes(id)) : visibleBranchIds;
    return buildReportModel(input, {
      companyName: company,
      frequency: opts.frequency,
      branchIds: ids,
      kpis: opts.kpis.length ? opts.kpis : KPI_DEFS.map((k) => k.id),
      scoreKpis: settings.scoreKpis,
      targets: settings.targets,
      rankBy: opts.rankBy,
    });
  }

  const previewModel = useMemo(
    () => (preview ? modelFor(preview) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preview, input, settings, visibleBranchIds],
  );

  // There's no mail server in this environment, so schedules run when HR
  // opens this tab: any run that fell due since the last send is generated
  // and logged as a scheduled delivery.
  useEffect(() => {
    if (!input) return;
    for (const s of dueSchedules(settings.schedules)) {
      const model = modelFor(s);
      if (!model) continue;
      dispatch(
        recordDelivery({
          id: `BPR-DLV-${s.id}-${previousRun(s).getTime()}`,
          scheduleId: s.id,
          scheduleName: s.name,
          sentAt: previousRun(s).toISOString(),
          recipients: s.recipients.map((r) => r.email),
          periodLabel: model.range.label,
          branchCount: model.rows.length,
          summary: `Score ${formatKpi("score", model.companyScore)} · ${model.attention.length} attention item${model.attention.length === 1 ? "" : "s"}`,
          trigger: "scheduled",
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, settings.schedules]);

  if (loading || !input) return <Skeleton className="h-96 w-full" />;

  function generate(kind: "pdf" | "excel") {
    const model = modelFor({ frequency, branchIds: branchSel, kpis, rankBy });
    if (!model) return;
    const name = `${frequency}-branch-performance-${input!.asOf}`;
    if (kind === "pdf") {
      if (!printReport(model)) toast.error("Allow pop-ups to download the PDF");
    } else {
      exportReportXlsx(model, name);
      toast.success("Excel report downloaded");
    }
  }

  function sendNow(s: ReportSchedule) {
    const model = modelFor(s);
    if (!model) return;
    if (s.recipients.length === 0) {
      toast.error("Add at least one recipient first");
      return;
    }
    dispatch(
      recordDelivery({
        id: `BPR-DLV-${Date.now()}`,
        scheduleId: s.id,
        scheduleName: s.name,
        sentAt: new Date().toISOString(),
        recipients: s.recipients.map((r) => r.email),
        periodLabel: model.range.label,
        branchCount: model.rows.length,
        summary: `Score ${formatKpi("score", model.companyScore)} · ${model.attention.length} attention item${model.attention.length === 1 ? "" : "s"}`,
        trigger: "manual",
      }),
    );
    toast.success(`Report sent to ${s.recipients.length} recipient${s.recipients.length === 1 ? "" : "s"}`, {
      description: "Demo environment: delivery is logged here; no email server is connected yet.",
    });
    setPreview(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* On-demand report */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Generate a management report</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Rankings, comparisons against the company average and targets, attention items and
          six-month trends for every branch you can access — no manual gathering from branches.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5 text-xs">
            {(Object.keys(FREQUENCY_LABELS) as ReportFrequency[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={
                  frequency === f
                    ? "rounded bg-primary px-3 py-1 font-medium text-primary-foreground"
                    : "rounded px-3 py-1 font-medium text-muted-foreground hover:text-foreground"
                }
              >
                {FREQUENCY_LABELS[f]}
              </button>
            ))}
          </div>
          <MultiSelect label="Branches" allLabel="All branches" options={branchOptions} value={branchSel} onChange={setBranchSel} />
          <MultiSelect label="Indicators" allLabel="All indicators" options={KPI_OPTIONS} value={kpis} onChange={(v) => setKpis(v as KpiId[])} min={1} />
          <Select value={rankBy} onValueChange={(v) => setRankBy(v as KpiId | "score")}>
            <SelectTrigger size="sm" className="h-8 w-[200px] text-xs">
              <span className="text-muted-foreground">Rank by:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score" className="text-xs">Overall score</SelectItem>
              {KPI_DEFS.map((k) => (
                <SelectItem key={k.id} value={k.id} className="text-xs">{k.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => generate("pdf")}>
              <FileText className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => generate("excel")}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Download Excel
            </Button>
          </div>
        </div>
      </section>

      {/* Schedules */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <CalendarClock className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Automated email reports</h3>
            <p className="text-xs text-muted-foreground">
              Motee generates and emails these on schedule — nobody has to log in and prepare them.
            </p>
          </div>
          {canManage && (
            <Button size="sm" className="ml-auto h-8 gap-1.5 text-xs" onClick={() => setEditing(newSchedule())}>
              <Plus className="h-3.5 w-3.5" /> New schedule
            </Button>
          )}
        </div>
        {settings.schedules.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No scheduled reports yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {settings.schedules.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Switch checked={s.active} disabled={!canManage} onCheckedChange={() => dispatch(toggleSchedule(s.id))} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {scheduleLabel(s)} · {s.recipients.map((r) => r.name).join(", ") || "No recipients"} ·{" "}
                    {s.branchIds.length ? `${s.branchIds.length} branches` : "All branches"} · {s.format.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.active ? `Next run ${relativeNext(s)}` : "Paused"}
                    {s.lastSentAt ? ` · Last sent ${format(new Date(s.lastSentAt), "d MMM yyyy, HH:mm")}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setPreview(s)}>
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => sendNow(s)}>
                    <Send className="h-3.5 w-3.5" /> Send now
                  </Button>
                  {canManage && (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          dispatch(deleteSchedule(s.id));
                          toast.success("Schedule deleted");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <TargetsCard canManage={canManage} />

        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Delivery log</h3>
          </div>
          {settings.deliveries.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No reports sent yet.</p>
          ) : (
            <div className="max-h-80 divide-y divide-border/60 overflow-y-auto">
              {settings.deliveries.map((d) => (
                <div key={d.id} className="px-4 py-2.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{d.scheduleName}</span>
                    <span className="text-muted-foreground">{format(new Date(d.sentAt), "d MMM yyyy, HH:mm")}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {d.recipients.join(", ")} · {d.branchCount} branches · {d.periodLabel}
                  </p>
                  <p className="text-muted-foreground">{d.summary} · {d.trigger === "manual" ? "Sent manually" : "Scheduled"}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ScheduleDialog schedule={editing} onClose={() => setEditing(null)} branchOptions={branchOptions} />
      <EmailPreviewDialog
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
        schedule={preview}
        model={previewModel}
        onSend={preview ? () => sendNow(preview) : undefined}
      />
    </div>
  );

  function newSchedule(): ReportSchedule {
    return {
      id: `BPR-SCH-${Date.now()}`,
      name: "Weekly Branch Performance Report",
      frequency: "weekly",
      weekday: "monday",
      time: "08:00",
      recipients: [],
      branchIds: [],
      kpis: ["taskCompletion", "compliance", "overdueTasks", "training", "issues"],
      format: "pdf",
      active: true,
      createdBy: "HR",
      createdAt: new Date().toISOString().slice(0, 10),
    };
  }
}

function TargetsCard({ canManage }: { canManage: boolean }) {
  const dispatch = useAppDispatch();
  const targets = useAppSelector((s) => s.branchPerformance.targets);
  const scoreKpis = useAppSelector((s) => s.branchPerformance.scoreKpis);
  const [draft, setDraft] = useState<Record<KpiId, number> | null>(null);
  const values = draft ?? targets;

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Target className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold">Organisational targets</h3>
          <p className="text-xs text-muted-foreground">Branches are measured against these. Ticked indicators make up the overall score.</p>
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {KPI_DEFS.map((k) => (
          <div key={k.id} className="flex items-center gap-3 px-4 py-2">
            <Checkbox
              checked={scoreKpis.includes(k.id)}
              disabled={!canManage || k.unit === "count"}
              title={k.unit === "count" ? "Counts can't be averaged into a percentage score" : "Include in overall score"}
              onCheckedChange={(c) =>
                dispatch(setScoreKpis(c ? [...scoreKpis, k.id] : scoreKpis.filter((x) => x !== k.id)))
              }
            />
            <span className="flex-1 text-xs">
              {k.label}
              <span className="ml-1 text-muted-foreground">({k.higherIsBetter ? "at least" : "at most"})</span>
            </span>
            <Input
              type="number"
              step={k.unit === "rating" ? 0.1 : 1}
              disabled={!canManage}
              value={values[k.id]}
              onChange={(e) => setDraft({ ...values, [k.id]: Number(e.target.value) })}
              className="h-7 w-20 text-right text-xs"
            />
            <span className="w-4 text-xs text-muted-foreground">{k.unit === "pct" ? "%" : ""}</span>
          </div>
        ))}
      </div>
      {canManage && (
        <div className="flex justify-end gap-2 border-t border-border px-4 py-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              dispatch(resetTargets());
              setDraft(null);
            }}
          >
            Reset to defaults
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!draft}
            onClick={() => {
              if (draft) dispatch(setTargets(draft));
              setDraft(null);
              toast.success("Targets saved");
            }}
          >
            Save targets
          </Button>
        </div>
      )}
    </section>
  );
}

function ScheduleDialog({
  schedule,
  onClose,
  branchOptions,
}: {
  schedule: ReportSchedule | null;
  onClose: () => void;
  branchOptions: { value: string; label: string }[];
}) {
  const dispatch = useAppDispatch();
  const { data: emails } = useUnscopedLocaleSection((b) =>
    Object.fromEntries(b.employees.map((e) => [e.id, { name: e.fullName, email: e.email }])),
  );
  const [form, setForm] = useState<ReportSchedule | null>(schedule);
  const [typed, setTyped] = useState("");
  const [prev, setPrev] = useState(schedule);
  if (prev !== schedule) {
    setPrev(schedule);
    setForm(schedule);
    setTyped("");
  }
  if (!form) return null;

  const set = <K extends keyof ReportSchedule>(k: K, v: ReportSchedule[K]) => setForm({ ...form, [k]: v });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typed.trim());

  function save() {
    if (!form) return;
    if (!form.name.trim() || form.recipients.length === 0) {
      toast.error("Give the schedule a name and at least one recipient");
      return;
    }
    dispatch(upsertSchedule(form));
    toast.success("Schedule saved");
    onClose();
  }

  return (
    <Dialog open={!!schedule} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Scheduled report</DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => set("frequency", v as ReportFrequency)}>
                <SelectTrigger size="sm" className="h-8 w-full text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQUENCY_LABELS) as ReportFrequency[]).map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">{FREQUENCY_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Day</Label>
              <Select value={form.weekday} disabled={form.frequency !== "weekly"} onValueChange={(v) => set("weekday", v as Weekday)}>
                <SelectTrigger size="sm" className="h-8 w-full text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(WEEKDAY_LABELS) as Weekday[]).map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{WEEKDAY_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">{scheduleLabel(form)}</p>

          <div className="space-y-1.5">
            <Label className="text-xs">Recipients</Label>
            <div className="flex flex-wrap gap-1.5">
              {form.recipients.map((r) => (
                <span key={r.email} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs">
                  {r.name}
                  <button type="button" onClick={() => set("recipients", form.recipients.filter((x) => x.email !== r.email))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <EmployeePicker
              placeholder="Add a senior manager…"
              excludeIds={form.recipients.map((r) => r.employeeId ?? "")}
              onChange={(p) => {
                if (!p || !emails) return;
                const e = emails[p.id];
                if (!e || form.recipients.some((r) => r.email === e.email)) return;
                set("recipients", [...form.recipients, { employeeId: p.id, name: e.name, email: e.email }]);
              }}
            />
            <div className="flex gap-2">
              <Input placeholder="or type an email address" value={typed} onChange={(e) => setTyped(e.target.value)} className="h-8 text-sm" />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={!emailOk}
                onClick={() => {
                  set("recipients", [...form.recipients, { name: typed.trim(), email: typed.trim() }]);
                  setTyped("");
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Branches</Label>
              <MultiSelect className="w-full" label="Branches" allLabel="All branches" options={branchOptions} value={form.branchIds} onChange={(v) => set("branchIds", v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Format</Label>
              <Select value={form.format} onValueChange={(v) => set("format", v as ReportFormat)}>
                <SelectTrigger size="sm" className="h-8 w-full text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf" className="text-xs">PDF attachment</SelectItem>
                  <SelectItem value="excel" className="text-xs">Excel attachment</SelectItem>
                  <SelectItem value="both" className="text-xs">PDF and Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Indicators included</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {KPI_DEFS.map((k) => (
                <label key={k.id} className="flex cursor-pointer items-center gap-2 text-xs">
                  <Checkbox
                    checked={form.kpis.includes(k.id)}
                    onCheckedChange={(c) => set("kpis", c ? [...form.kpis, k.id] : form.kpis.filter((x) => x !== k.id))}
                    className="h-3.5 w-3.5"
                  />
                  {KPI_BY_ID[k.id].label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 text-xs" onClick={save}>Save schedule</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
