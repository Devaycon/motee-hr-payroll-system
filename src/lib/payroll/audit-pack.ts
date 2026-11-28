import { round2 } from "./ng/engine";
import { writeWorkbook, type ExportFormat, type ExportTable } from "./exports";
import { REMITTANCE_ITEMS, remittanceStatement, type RemittanceCtx, type RemittanceStatement } from "./remittances";
import { REMITTANCE_STATUS_META, hasEvidence, type RemittanceRow } from "./remittance-centre";
import type { PayrollAuditEntry } from "./types";

/**
 * Statutory Remittance Audit Pack (client feedback B3, Nov 2026): one
 * download for a pay month that an auditor or regulator can follow end to
 * end — the summary, reconciliation of calculated vs paid, what is still
 * outstanding, every schedule with its employee breakdown (pension by PFA),
 * the payment evidence and the full activity history.
 */

export interface AuditPack {
  month: string;
  monthLabel: string;
  sheets: { name: string; table: ExportTable }[];
  totals: { liability: number; paid: number; outstanding: number; overdue: number; withoutEvidence: number };
}

const status = (r: RemittanceRow) => REMITTANCE_STATUS_META[r.status].label;

export function buildAuditPack(month: string, rows: RemittanceRow[], ctx: RemittanceCtx, audit: PayrollAuditEntry[], generatedBy: string, now = new Date()): AuditPack | null {
  const mine = rows.filter((r) => r.month === month && !r.projected);
  if (!mine.length) return null;
  const label = mine[0].monthLabel;
  const runs = mine[0].runs;
  const due = mine.filter((r) => r.liability > 0);
  const totals = {
    liability: round2(due.reduce((s, r) => s + r.liability, 0)),
    paid: round2(due.reduce((s, r) => s + r.paid, 0)),
    outstanding: round2(due.reduce((s, r) => s + r.outstanding, 0)),
    overdue: due.filter((r) => r.overdue).length,
    withoutEvidence: due.filter((r) => r.record && !hasEvidence(r.record)).length,
  };

  const head = (title: string): ExportTable["preamble"] => [[`Statutory Remittance Audit Pack — ${label}`], [title], [`Generated ${now.toLocaleString("en-GB")} by ${generatedBy}`], []];

  const summary: ExportTable = {
    preamble: head("1. Summary"),
    headers: ["Obligation", "Paid to", "Basis", "Due date", "Calculated liability", "Paid", "Outstanding", "Status", "Overdue"],
    data: due.map((r) => [r.title, r.to, r.basis, r.due, r.liability, r.paid, r.outstanding, status(r), r.overdue ? "Yes" : "No"]),
    trailer: [["Total", "", "", "", totals.liability, totals.paid, totals.outstanding, "", String(totals.overdue)]],
  };

  const reconciliation: ExportTable = {
    preamble: head("2. Reconciliation — calculated vs paid"),
    headers: ["Obligation", "Calculated", "Paid (evidenced)", "Difference", "Result", "Reconciled by", "Reconciled on"],
    data: due.map((r) => {
      const diff = round2(r.paid - r.liability);
      const result = r.record?.status === "reconciled" ? "Reconciled" : Math.abs(diff) < 0.5 && r.paid > 0 ? "Matched — awaiting reconciliation" : r.paid > r.liability + 0.5 ? "Overpaid" : r.paid > 0 ? "Underpaid" : r.record && !hasEvidence(r.record) ? "Payment recorded without evidence" : "Not paid";
      return [r.title, r.liability, r.paid, diff, result, r.record?.reconciledBy ?? "", r.record?.reconciledAt?.slice(0, 10) ?? ""];
    }),
  };

  const outstanding: ExportTable = {
    preamble: head("3. Outstanding liabilities"),
    headers: ["Obligation", "Paid to", "Due date", "Outstanding", "Days to due (negative = overdue)", "Status"],
    data: due.filter((r) => r.outstanding > 0).map((r) => [r.title, r.to, r.due, r.outstanding, r.daysToDue, status(r)]),
    trailer: [["Total outstanding", "", "", totals.outstanding, "", ""]],
  };

  const evidence: ExportTable = {
    preamble: head("4. Payment evidence"),
    headers: ["Obligation", "Payment reference", "Payment date", "Amount paid", "Receipt / acknowledgement", "Recorded by", "Recorded at", "Note"],
    data: due.map((r) => [r.title, r.record?.reference ?? "", r.record?.date ?? "", r.paid, r.record?.receipt?.fileName ?? (r.record ? "MISSING" : ""), r.record?.by ?? "", r.record?.at?.slice(0, 16).replace("T", " ") ?? "", r.record?.note ?? ""]),
  };

  const keys = new Set(mine.map((r) => r.key));
  const history: ExportTable = {
    preamble: head("5. Activity history"),
    headers: ["When", "Who", "What", "Item"],
    data: audit
      .filter((a) => (a.detail && keys.has(a.detail)) || (a.detail ?? "").includes(month) || runs.some((r) => r.id === a.runId))
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((a) => [a.at.slice(0, 16).replace("T", " "), a.actor, a.action, a.detail ?? a.runId ?? ""]),
  };

  const schedules: { name: string; table: ExportTable }[] = [];
  for (const item of REMITTANCE_ITEMS) {
    const st: RemittanceStatement | null = remittanceStatement(item, runs, ctx);
    if (!st || st.total <= 0) continue;
    schedules.push({
      name: `${st.title}`.slice(0, 28),
      table: {
        preamble: [...head(`Schedule — ${st.title} to ${st.to}, due ${st.due}`)!, ...(st.groups.length > 1 ? [["By payee"], ...st.groups.map((g) => [g.name, g.reference ?? "", `${g.count} employees`, g.amount]), []] : [])],
        headers: st.table.headers,
        data: st.table.data,
        trailer: st.table.trailer,
      },
    });
  }

  return {
    month,
    monthLabel: label,
    totals,
    sheets: [
      { name: "1 Summary", table: summary },
      { name: "2 Reconciliation", table: reconciliation },
      { name: "3 Outstanding", table: outstanding },
      { name: "4 Evidence", table: evidence },
      ...schedules,
      { name: "5 Activity history", table: history },
    ],
  };
}

export function downloadAuditPack(pack: AuditPack, format: ExportFormat) {
  writeWorkbook(`${pack.month}-statutory-remittance-audit-pack`, pack.sheets, format, `Statutory Remittance Audit Pack — ${pack.monthLabel}`);
}
