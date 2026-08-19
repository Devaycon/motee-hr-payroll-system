/**
 * Cost centre master data (client feedback §7.3, §7.4).
 *
 * Finance allocates payroll, recruitment and training spend by these codes, so
 * they can't be free text on each workforce request — a typo there lands the
 * cost in the wrong place. They are maintained centrally and picked from a
 * dropdown.
 *
 * NOTE: `LocaleDepartment.costCenter` already carried a code per department in
 * the locale bundles but nothing read it. That value seeds this table, so the
 * two stay consistent rather than diverging.
 */

export type CostCentreStatus = "active" | "inactive";

export interface CostCentre {
  id: string;
  /** The code Finance actually books against, e.g. "HR001". */
  code: string;
  name: string;
  businessUnit: string;
  status: CostCentreStatus;
  /** Department this centre is the default for, when there is one. */
  departmentId?: string;
}

export const COST_CENTRE_STATUS_LABELS: Record<CostCentreStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const COST_CENTRE_STATUS_STYLES: Record<CostCentreStatus, string> = {
  active:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inactive: "border-border bg-muted text-muted-foreground",
};

/**
 * The mapping the client supplied in §7.3. Used when the locale bundle has no
 * cost-centre code for a department.
 */
export const DEFAULT_COST_CENTRES: CostCentre[] = [
  {
    id: "cc-hr001",
    code: "HR001",
    name: "Human Resources",
    businessUnit: "Corporate Services",
    status: "active",
  },
  {
    id: "cc-fin001",
    code: "FIN001",
    name: "Finance",
    businessUnit: "Corporate Services",
    status: "active",
  },
  {
    id: "cc-sal100",
    code: "SAL100",
    name: "Sales",
    businessUnit: "Commercial",
    status: "active",
  },
  {
    id: "cc-it200",
    code: "IT200",
    name: "IT",
    businessUnit: "Technology",
    status: "active",
  },
  {
    id: "cc-ops300",
    code: "OPS300",
    name: "Operations",
    businessUnit: "Logistics",
    status: "active",
  },
];

/** Only active centres can be selected on a new request. */
export function selectableCostCentres(centres: CostCentre[]): CostCentre[] {
  return centres.filter((c) => c.status === "active");
}

/** "HR001 — Human Resources", the form's display form. */
export function costCentreLabel(c: CostCentre): string {
  return `${c.code} — ${c.name}`;
}
