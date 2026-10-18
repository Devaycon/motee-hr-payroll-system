/**
 * Branch performance management report — one model, three renderings: the
 * print-to-PDF page, the Excel workbook and the scheduled email body. Built
 * from the same engine the dashboard uses, so the numbers always agree.
 */

import * as XLSX from "xlsx";
import { format, parseISO } from "date-fns";
import { esc } from "@/src/lib/reports/export";
import {
  BAND_LABELS,
  FREQUENCY_LABELS,
  FREQUENCY_PERIOD,
  KPI_BY_ID,
  attentionItems,
  bandFor,
  buildRows,
  computeKpis,
  formatKpi,
  performanceScore,
  periodRange,
  trendBuckets,
  type AttentionItem,
  type BranchPerformanceRow,
  type KpiId,
  type KpiValues,
  type PerfInput,
  type PeriodPreset,
  type PeriodRange,
  type ReportFrequency,
} from "./performance";

export interface ReportOptions {
  companyName: string;
  /** Either a cadence (weekly/monthly/quarterly) or an explicit preset. */
  frequency?: ReportFrequency;
  period?: PeriodPreset;
  branchIds: string[];
  kpis: KpiId[];
  scoreKpis: KpiId[];
  targets: Record<KpiId, number>;
  rankBy?: KpiId | "score";
}

export interface ReportModel {
  title: string;
  companyName: string;
  range: PeriodRange;
  asOf: string;
  kpis: KpiId[];
  targets: Record<KpiId, number>;
  rows: BranchPerformanceRow[];
  company: KpiValues;
  companyScore: number | null;
  tasksCompleted: number;
  attention: AttentionItem[];
  /** Score per branch across the last six months, oldest first. */
  trends: Array<{ branch: string; points: Array<{ label: string; value: number | null }>; direction: "improving" | "declining" | "steady" }>;
}

export function buildReportModel(input: PerfInput, opts: ReportOptions): ReportModel {
  const preset = opts.period ?? FREQUENCY_PERIOD[opts.frequency ?? "monthly"];
  const range = periodRange(preset, input.asOf);
  const rows = buildRows(input, opts.branchIds, range, opts.scoreKpis, opts.rankBy ?? "score");
  const company = computeKpis(input, null, range, opts.branchIds);
  const ids = new Set(input.employees.filter((e) => e.branchId && opts.branchIds.includes(e.branchId)).map((e) => e.id));
  const tasksCompleted = input.tasks.filter(
    (t) => ids.has(t.assigneeId) && t.status === "done" && t.dueDate >= range.start && t.dueDate <= range.end,
  ).length;
  const buckets = trendBuckets(input.asOf, "month");
  const trends = rows.map((r) => {
    const points = buckets.map((b) => ({
      label: b.label,
      value: performanceScore(computeKpis(input, r.branch.id, b), opts.scoreKpis),
    }));
    const known = points.map((p) => p.value).filter((v): v is number => v != null);
    const diff = known.length >= 2 ? known[known.length - 1] - known[0] : 0;
    return {
      branch: r.branch.name,
      points,
      direction: (diff > 2 ? "improving" : diff < -2 ? "declining" : "steady") as "improving" | "declining" | "steady",
    };
  });
  const cadence = opts.frequency ? `${FREQUENCY_LABELS[opts.frequency]} ` : "";
  return {
    title: `${cadence}Branch Performance Report`,
    companyName: opts.companyName,
    range,
    asOf: input.asOf,
    kpis: opts.kpis,
    targets: opts.targets,
    rows,
    company,
    companyScore: performanceScore(company, opts.scoreKpis),
    tasksCompleted,
    attention: attentionItems(rows, opts.targets, opts.kpis),
    trends,
  };
}

function fmtDate(isoDate: string): string {
  return format(parseISO(isoDate), "d MMM yyyy");
}

// ── PDF (print window) ───────────────────────────────────────────────────────

export function reportHtml(m: ReportModel): string {
  const kpiHead = m.kpis.map((k) => `<th>${esc(KPI_BY_ID[k].label)}</th>`).join("");
  const rankRows = m.rows
    .map((r) => {
      const change =
        r.score != null && r.previousScore != null
          ? `${r.score - r.previousScore >= 0 ? "+" : ""}${(r.score - r.previousScore).toFixed(1)}`
          : "—";
      const band = bandFor(r.score);
      return `<tr><td>${r.rank}</td><td><b>${esc(r.branch.name)}</b><div class="muted">${esc(r.region)}</div></td>
        <td class="num"><b>${formatKpi("score", r.score)}</b></td><td class="num">${change}</td>
        <td>${band ? esc(BAND_LABELS[band]) : "—"}</td>
        ${m.kpis.map((k) => `<td class="num">${formatKpi(k, r.values[k])}</td>`).join("")}</tr>`;
    })
    .join("");
  const avgRow = `<tr class="avg"><td></td><td>Company average</td><td class="num">${formatKpi("score", m.companyScore)}</td><td></td><td></td>${m.kpis
    .map((k) => `<td class="num">${formatKpi(k, m.company[k])}</td>`)
    .join("")}</tr>
    <tr class="avg"><td></td><td>Organisational target</td><td></td><td></td><td></td>${m.kpis
      .map((k) => `<td class="num">${formatKpi(k, m.targets[k])}</td>`)
      .join("")}</tr>`;
  const attention = m.attention.length
    ? `<ul>${m.attention.map((a) => `<li class="${a.severity}">${esc(a.message)}</li>`).join("")}</ul>`
    : `<p class="muted">Every branch met its targets for the selected indicators.</p>`;
  const trendHead = m.trends[0]?.points.map((p) => `<th>${esc(p.label)}</th>`).join("") ?? "";
  const trendRows = m.trends
    .map(
      (t) =>
        `<tr><td>${esc(t.branch)}</td>${t.points.map((p) => `<td class="num">${formatKpi("score", p.value)}</td>`).join("")}<td>${t.direction}</td></tr>`,
    )
    .join("");
  const compliance = m.company.compliance;
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${esc(m.title)}</title>
<style>
*{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}
body{margin:32px auto;max-width:1000px;color:#0f172a;}
h1{font-size:24px;margin:0;} .sub{color:#475569;font-size:13px;margin:4px 0 16px;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
.stat{border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;}
.stat .l{font-size:11px;color:#64748b;} .stat .v{font-size:22px;font-weight:700;}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin:22px 0 8px;}
table{width:100%;border-collapse:collapse;font-size:11px;}
th{text-align:left;background:#f1f5f9;padding:6px;border-bottom:1px solid #cbd5e1;}
td{padding:6px;border-bottom:1px solid #e2e8f0;vertical-align:top;}
.num{text-align:right;font-variant-numeric:tabular-nums;} .muted{color:#64748b;font-size:10px;}
tr.avg td{background:#f8fafc;font-weight:600;}
li{font-size:12px;margin-bottom:4px;} li.high{color:#b91c1c;}
footer{margin-top:24px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;}
section,table{break-inside:avoid-page;} @page{margin:14mm;size:A4 landscape;}
</style></head><body>
<h1>${esc(m.title)}</h1>
<p class="sub">${esc(m.companyName)} · ${esc(m.range.label)} · ${m.rows.length} branch${m.rows.length === 1 ? "" : "es"}</p>
<div class="stats">
<div class="stat"><div class="l">Branches monitored</div><div class="v">${m.rows.length}</div></div>
<div class="stat"><div class="l">Overall score</div><div class="v">${formatKpi("score", m.companyScore)}</div></div>
<div class="stat"><div class="l">Overall compliance</div><div class="v">${formatKpi("compliance", compliance)}</div></div>
<div class="stat"><div class="l">Tasks completed / overdue</div><div class="v">${m.tasksCompleted} / ${m.company.overdueTasks ?? 0}</div></div>
</div>
<section><h2>Branch rankings</h2>
<table><thead><tr><th>#</th><th>Branch</th><th class="num">Score</th><th class="num">Change</th><th>Status</th>${kpiHead}</tr></thead>
<tbody>${rankRows}${avgRow}</tbody></table></section>
<section><h2>Management attention required</h2>${attention}</section>
<section><h2>Performance trends (score by month)</h2>
<table><thead><tr><th>Branch</th>${trendHead}<th>Direction</th></tr></thead><tbody>${trendRows}</tbody></table></section>
<footer>Calculated from Motee records as at ${fmtDate(m.asOf)}. Score = mean of the selected percentage indicators.
Change is against the previous period of the same length. Generated ${format(new Date(), "d MMM yyyy HH:mm")}.</footer>
<script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>
</body></html>`;
}

export function printReport(m: ReportModel): boolean {
  if (typeof window === "undefined") return false;
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) return false;
  w.document.write(reportHtml(m));
  w.document.close();
  return true;
}

// ── Excel ────────────────────────────────────────────────────────────────────

export function exportReportXlsx(m: ReportModel, fileName: string): void {
  const wb = XLSX.utils.book_new();
  const summary = [
    [m.title],
    [m.companyName],
    ["Period", m.range.label],
    ["As at", fmtDate(m.asOf)],
    [],
    ["Branches monitored", m.rows.length],
    ["Overall score (%)", m.companyScore ?? ""],
    ["Overall compliance (%)", m.company.compliance ?? ""],
    ["Tasks completed", m.tasksCompleted],
    ["Overdue tasks", m.company.overdueTasks ?? 0],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

  const head = ["Rank", "Branch", "Region", "Headcount", "Score (%)", "Previous score (%)", "Status", ...m.kpis.map((k) => KPI_BY_ID[k].label)];
  const body = m.rows.map((r) => {
    const band = bandFor(r.score);
    return [r.rank, r.branch.name, r.region, r.headcount, r.score ?? "", r.previousScore ?? "", band ? BAND_LABELS[band] : "", ...m.kpis.map((k) => r.values[k] ?? "")];
  });
  const avg = ["", "Company average", "", "", m.companyScore ?? "", "", "", ...m.kpis.map((k) => m.company[k] ?? "")];
  const tgt = ["", "Organisational target", "", "", "", "", "", ...m.kpis.map((k) => m.targets[k])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([head, ...body, avg, tgt]), "Rankings");

  const cmpHead = ["Indicator", ...m.rows.map((r) => r.branch.name), "Company average", "Target", "Source"];
  const cmp = m.kpis.map((k) => [KPI_BY_ID[k].label, ...m.rows.map((r) => r.values[k] ?? ""), m.company[k] ?? "", m.targets[k], KPI_BY_ID[k].source]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([cmpHead, ...cmp]), "Comparison");

  const trendHead = ["Branch", ...(m.trends[0]?.points.map((p) => p.label) ?? []), "Direction"];
  const trend = m.trends.map((t) => [t.branch, ...t.points.map((p) => p.value ?? ""), t.direction]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([trendHead, ...trend]), "Trends");

  const att = [["Branch", "Indicator", "Severity", "Detail"], ...m.attention.map((a) => [a.branchName, KPI_BY_ID[a.kpi].label, a.severity, a.message])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(att), "Attention");

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
