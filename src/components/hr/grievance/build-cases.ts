/**
 * Builds the unified ER case list from a locale bundle.
 *
 * Extracted out of `hooks.ts` so the §5.10 report definition can select the
 * same rows the Employee Relations page renders. Two separate mappings of the
 * same raw data would eventually disagree, and a report that disagrees with
 * the screen it reports on is worse than no report.
 *
 * Pure — no React, no store. Safe to call from a report `select`.
 */
import type {
  ERCase,
  CaseComplaintType,
  CaseStage,
  CasePriority,
  ConfidentialityLevel,
} from "@/src/lib/types/grievance";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { ER_CASES } from "@/src/data/grievance-demo";

interface RawGrievance {
  id?: string;
  caseId?: string;
  raisedBy?: string;
  employeeId?: string;
  category?: string;
  severity?: string;
  priority?: string;
  status?: string;
  description?: string;
  body?: string;
  assignedTo?: string;
  raisedAt?: string;
  incidentDate?: string;
  type?: string;
  confidentiality?: string;
}

function mapComplaintType(category?: string, type?: string): CaseComplaintType {
  switch (category) {
    case "harassment":
    case "discrimination":
    case "pay_dispute":
    case "working_conditions":
    case "misconduct":
    case "attendance":
    case "policy_violation":
      return category;
    case "unfair_treatment":
      return "grievance";
    case "poor_performance":
    case "insubordination":
      return "disciplinary";
    default:
      return type === "disciplinary" ? "disciplinary" : "grievance";
  }
}

function mapPriority(p?: string): CasePriority {
  if (p === "urgent" || p === "high" || p === "medium" || p === "low") return p;
  if (p === "critical") return "urgent";
  return "medium";
}

function mapStage(s?: string): CaseStage {
  switch (s) {
    case "raised":
    case "reported":
      return "raised";
    case "under_review":
    case "triage":
      return "triage";
    case "assigned":
      return "assigned";
    case "under_investigation":
    case "investigation":
    case "mediation":
      return "investigation";
    case "hearing_scheduled":
    case "hearing":
      return "hearing";
    case "outcome_issued":
    case "resolved":
      return "outcome_issued";
    case "appealed":
    case "appeal":
      return "appeal";
    case "closed":
      return "closed";
    default:
      return "raised";
  }
}

function mapConfidentiality(c?: string): ConfidentialityLevel {
  if (c === "confidential" || c === "highly_confidential" || c === "standard")
    return c;
  return "standard";
}

export function buildCases(bundle: LocaleBundle): ERCase[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const raw = (bundle.grievances ?? []) as RawGrievance[];

  if (raw.length === 0) {
    return ER_CASES;
  }

  return raw.map((g, i) => {
    const empId = g.raisedBy ?? g.employeeId;
    const emp = empId ? employeesById.get(empId) : null;
    const assignee = g.assignedTo ? employeesById.get(g.assignedTo) : null;
    const today = g.raisedAt ?? bundle.tenant.createdAt.slice(0, 10);
    return {
      id: g.id ?? g.caseId ?? `ERC-${i + 1}`,
      caseNumber: g.caseId ?? `ERC-${String(i + 1).padStart(3, "0")}`,
      complaintType: mapComplaintType(g.category, g.type),
      employeeName: emp?.fullName ?? "Anonymous",
      employeeInitials: emp?.initials ?? "A",
      employeeDept: emp?.departmentName ?? "—",
      dateRaised: today,
      incidentDate: g.incidentDate,
      description: g.description ?? g.body ?? "",
      stage: mapStage(g.status),
      priority: mapPriority(g.priority ?? g.severity),
      confidentialityLevel: mapConfidentiality(g.confidentiality),
      assignedTo: assignee?.fullName,
      assignedInitials: assignee?.initials,
      employeeId: empId,
      witnesses: [],
      evidence: [],
      hearingPanel: [],
      hasAppeal: false,
      notes: [],
      createdAt: today,
      updatedAt: today,
    };
  });
}
