/**
 * Certification renewal status — one rule shared by the Certification
 * Register, the employee profile and the dashboard, so a certificate can never
 * read "Active" in one place and "Expiring" in another.
 */

export type CertStatus =
  | "active"
  | "expiring_60"
  | "expiring_30"
  | "expired"
  | "no_expiry";

export const CERT_STATUS_LABELS: Record<CertStatus, string> = {
  active: "Active",
  expiring_60: "Expires in 60 days",
  expiring_30: "Expires in 30 days",
  expired: "Expired",
  no_expiry: "No expiry",
};

/** Traffic-light badge classes: green → amber → orange → red. */
export const CERT_STATUS_STYLES: Record<CertStatus, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  expiring_60: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  expiring_30: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  expired: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  no_expiry: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export const CERT_STATUS_DOT: Record<CertStatus, string> = {
  active: "bg-emerald-500",
  expiring_60: "bg-amber-400",
  expiring_30: "bg-orange-500",
  expired: "bg-red-500",
  no_expiry: "bg-slate-400",
};

const DAY_MS = 86_400_000;

/** Whole days from `today` to `iso` (negative once past). Null when there's no date. */
export function daysToExpiry(
  iso: string | null | undefined,
  today: Date = new Date(),
): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((t - start) / DAY_MS);
}

export function certStatus(
  expiresAt: string | null | undefined,
  today: Date = new Date(),
): CertStatus {
  const d = daysToExpiry(expiresAt, today);
  if (d == null) return "no_expiry";
  if (d < 0) return "expired";
  if (d <= 30) return "expiring_30";
  if (d <= 60) return "expiring_60";
  return "active";
}

/** A certification is compliant while it's valid — expired ones are the only failures. */
export function isCompliant(status: CertStatus): boolean {
  return status !== "expired";
}

export interface CertificationRecord {
  id: string;
  employeeId: string;
  courseId?: string | null;
  /** "professional" = external credential (PMP, ACCA…); "course" = L&D completion certificate. */
  kind?: "professional" | "course";
  title: string;
  issuingBody?: string;
  category?: string;
  credentialId?: string;
  issuedAt: string;
  expiresAt?: string | null;
  certificateUrl?: string;
}

export const CERT_CATEGORY_LABELS: Record<string, string> = {
  hr: "HR",
  finance: "Finance",
  it: "IT",
  health_safety: "Health & Safety",
  project_management: "Project Management",
  compliance: "Compliance",
  training: "Training",
};

export interface CertComplianceSummary {
  total: number;
  /** Not yet expired — includes those expiring soon, and those with no expiry. */
  active: number;
  expiringIn30: number;
  expiringIn90: number;
  expired: number;
  /** Share of certifications that haven't expired, 0–100. */
  complianceRate: number;
}

export function summariseCertifications(
  certs: Pick<CertificationRecord, "expiresAt">[],
  today: Date = new Date(),
): CertComplianceSummary {
  let active = 0;
  let expiringIn30 = 0;
  let expiringIn90 = 0;
  let expired = 0;
  for (const c of certs) {
    const d = daysToExpiry(c.expiresAt, today);
    if (d != null && d < 0) {
      expired += 1;
      continue;
    }
    active += 1;
    if (d != null && d <= 30) expiringIn30 += 1;
    if (d != null && d <= 90) expiringIn90 += 1;
  }
  const total = certs.length;
  return {
    total,
    active,
    expiringIn30,
    expiringIn90,
    expired,
    complianceRate: total ? Math.round(((total - expired) / total) * 100) : 100,
  };
}
