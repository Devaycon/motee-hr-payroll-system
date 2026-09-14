/**
 * §5 — Risks & Issues.
 *
 * HRIS implementations touch employee data, payroll, access permissions and
 * documents, so a risk/issue register matters more here than on a generic
 * project — the client called this out as the single biggest missing
 * project-management feature.
 */
export type RiskType = "risk" | "issue";

export const RISK_TYPE_LABELS: Record<RiskType, string> = {
  risk: "Risk",
  issue: "Issue",
};

export type RiskImpact = "low" | "medium" | "high";

export const RISK_IMPACT_LABELS: Record<RiskImpact, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const RISK_IMPACT_STYLES: Record<RiskImpact, string> = {
  low: "border-border bg-muted text-muted-foreground",
  medium:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export type RiskStatus = "open" | "monitoring" | "closed";

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: "Open",
  monitoring: "Monitoring",
  closed: "Closed",
};

export const RISK_STATUS_STYLES: Record<RiskStatus, string> = {
  open: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  monitoring:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  closed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export interface ProjectRisk {
  id: string;
  projectId: string;
  type: RiskType;
  title: string;
  description?: string;
  ownerId?: string;
  ownerName?: string;
  impact: RiskImpact;
  status: RiskStatus;
  dueDate?: string;
  createdAt: string;
  /** Tasks or milestones this risk/issue is tied to, for a clickable trail. */
  relatedTaskIds?: string[];
  relatedMilestoneIds?: string[];
}

export type NewProjectRisk = Omit<ProjectRisk, "id" | "projectId" | "createdAt">;
