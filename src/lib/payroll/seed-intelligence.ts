import type { LocaleBundle } from "@/src/lib/types/locale";
import { compareRuns, defaultPreviousRun, REASON_LABELS } from "./comparison";
import type { TenantPayrollData } from "./run-builder";
import type { VarianceInvestigation } from "./types";

/**
 * Demo data for Payroll Intelligence: one investigation already being worked,
 * on the latest regular run's largest new one-off payment, so the register,
 * the case page and the sign-off flow have something to show on first open.
 */
export function seedInvestigations(data: TenantPayrollData, bundle: LocaleBundle, today: Date): VarianceInvestigation[] {
  const regular = data.runs.filter((r) => r.type === "regular").sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month));
  const current = regular[0];
  const previous = current ? defaultPreviousRun(data.runs, current) : null;
  if (!current || !previous) return [];
  const cmp = compareRuns(current, previous, { people: new Map(bundle.employees.map((e) => [e.id, e])), elements: data.elements, structures: data.structures });
  const target = cmp.employees.find((e) => e.movements.some((m) => m.kind === "new_payment" && m.reason === "one_off")) ?? cmp.employees.find((e) => Math.abs(e.change) >= 1);
  if (!target) return [];
  const nameOf = (roleId: string) => {
    const id = bundle.roles.find((r) => r.id === roleId)?.linkedEmployeeId;
    const e = bundle.employees.find((x) => x.id === id);
    return e ? { id: e.id, name: e.fullName } : null;
  };
  const hr = nameOf("ROLE-HRADMIN") ?? { id: "", name: "HR Admin" };
  const fin = nameOf("ROLE-FIN") ?? hr;
  const owner = fin.id !== hr.id ? fin : hr;
  const day = (offset: number) => new Date(today.getTime() + offset * 86_400_000).toISOString();
  const reason = (Object.keys(target.reasons)[0] ?? "one_off") as keyof typeof REASON_LABELS;
  return [
    {
      id: "INV-DEMO-001",
      runId: current.id,
      previousRunId: previous.id,
      periodLabel: current.period.label,
      employeeId: target.employeeId,
      employeeName: target.name,
      reason,
      amount: target.change,
      title: `${target.name}: ${REASON_LABELS[reason]} — confirm before approval`,
      finding: target.explanation,
      status: "investigating",
      ownerId: owner.id,
      ownerName: owner.name,
      createdBy: hr.name,
      createdById: hr.id,
      createdAt: day(-2),
      dueDate: day(3).slice(0, 10),
      comments: [
        { id: "C-DEMO-1", at: day(-2), by: hr.name, text: "Please confirm the commission against the approved sales schedule before the run goes to approval." },
        { id: "C-DEMO-2", at: day(-1), by: owner.name, text: "Requested the Q4 commission schedule from Sales Operations." },
      ],
      documents: [],
      history: [
        { at: day(-2), actor: hr.name, action: `Opened and assigned to ${owner.name}`, note: target.explanation },
        { at: day(-1), actor: owner.name, action: "Moved to Under investigation" },
      ],
    },
  ];
}
