import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import type {
  ExpenseCategory,
  ExpenseClaim,
  ExpenseStatus,
} from "@/src/data/employee-expenses-demo";
import { formatExpenseReference } from "@/src/data/employee-expenses-demo";
import { inferStageIndexFromStatus } from "./stages";

/**
 * Claims belonging to *other* employees, so the HR review queue shows a real
 * spread of people, departments and chain positions. The seeded
 * `EMPLOYEE_EXPENSES` all belong to whoever is signed in, which demos the
 * employee portal fine but leaves HR looking at one person's list.
 *
 * Built from the active locale bundle rather than hardcoded, because the
 * approver chain resolves through `managerId` — an invented employee id has no
 * manager and would park every claim on an empty desk.
 */
interface ExtraSpec {
  title: string;
  category: ExpenseCategory;
  amount: number;
  merchant: string;
  status: ExpenseStatus;
  dayOffset: number;
  notes?: string;
}

const SPECS: ExtraSpec[] = [
  {
    title: "Quarterly client roadshow — flights",
    category: "travel",
    amount: 240000,
    merchant: "Ibom Air",
    status: "submitted",
    dayOffset: -3,
    notes: "Three-city roadshow ahead of the Q3 renewal cycle.",
  },
  {
    title: "Team offsite dinner (12 people)",
    category: "meals",
    amount: 168000,
    merchant: "Nok by Alara",
    status: "submitted",
    dayOffset: -5,
  },
  {
    title: "Conference pass — DevFest",
    category: "training",
    amount: 95000,
    merchant: "GDG Lagos",
    status: "approved",
    dayOffset: -9,
    notes: "Approved against this year's engineering L&D budget.",
  },
  {
    title: "Standing desk & monitor arm",
    category: "equipment",
    amount: 143500,
    merchant: "Ergonomics NG",
    status: "approved",
    dayOffset: -12,
  },
  {
    title: "Payroll software renewal",
    category: "software",
    amount: 310000,
    merchant: "Seamless HR",
    status: "reimbursed",
    dayOffset: -21,
  },
  {
    title: "Airport transfers — audit visit",
    category: "travel",
    amount: 28400,
    merchant: "Uber",
    status: "rejected",
    dayOffset: -16,
    notes: "Personal leg of the journey included on the same receipt.",
  },
];

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Picks employees other than the signed-in one, preferring varied departments. */
function pickOwners(
  bundle: LocaleBundle,
  excludeEmployeeId: string,
  count: number,
): LocaleEmployee[] {
  const eligible = bundle.employees.filter(
    (e) => e.id !== excludeEmployeeId && e.managerId,
  );
  const seenDepartments = new Set<string>();
  const spread: LocaleEmployee[] = [];
  for (const employee of eligible) {
    if (seenDepartments.has(employee.departmentId)) continue;
    seenDepartments.add(employee.departmentId);
    spread.push(employee);
    if (spread.length === count) return spread;
  }
  // Fewer departments than claims — top up with whoever is left.
  for (const employee of eligible) {
    if (spread.length === count) break;
    if (!spread.includes(employee)) spread.push(employee);
  }
  return spread;
}

export function buildExpenseExtras(
  bundle: LocaleBundle,
  ownerEmployeeId: string,
  stageCount: number,
): ExpenseClaim[] {
  const owners = pickOwners(bundle, ownerEmployeeId, SPECS.length);
  if (owners.length === 0) return [];

  return SPECS.map((spec, i) => {
    const owner = owners[i % owners.length];
    const dateSubmitted = isoOffset(spec.dayOffset);
    const year = dateSubmitted.slice(0, 4);
    return {
      // Stable ids, so re-attribution after a reload can't duplicate them.
      id: `exp-demo-${i + 1}`,
      reference: formatExpenseReference(year, 900 + i),
      title: spec.title,
      category: spec.category,
      amount: spec.amount,
      currency: bundle.tenant.currency,
      dateSubmitted,
      status: spec.status,
      merchant: spec.merchant,
      notes: spec.notes,
      employeeId: owner.id,
      employeeName: owner.fullName,
      employeeInitials: owner.initials,
      department: owner.departmentName,
      stageIndex: inferStageIndexFromStatus(spec.status, stageCount),
    } satisfies ExpenseClaim;
  });
}
