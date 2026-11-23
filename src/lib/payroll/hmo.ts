import type { HmoEnrolment, HmoPlan, HmoSettings } from "./types";

/**
 * HMO (private health insurance) — premiums depend on the plan and the
 * employer's funding policy, not a fixed % of salary:
 *
 *   employer-funded  ₦120,000/yr → ₦10,000/month employer cost, nothing deducted
 *   shared 70 / 30   ₦120,000/yr → ₦7,000 employer, ₦3,000 deducted
 *   employee-funded  ₦120,000/yr → ₦10,000 deducted
 *
 * Pure, so the engine, the calculator and the remittance schedule agree.
 */

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface HmoSplit {
  plan: HmoPlan;
  providerName: string;
  /** Monthly premium for this employee (plan + dependants). */
  premium: number;
  employee: number;
  employer: number;
  note: string;
}

export const FUNDING_LABELS: Record<HmoPlan["funding"], string> = { employer: "Employer-funded", employee: "Employee-funded", shared: "Shared" };

/** Monthly premium and who pays it, for an enrolled employee in a period. */
export function hmoSplit(settings: HmoSettings | undefined, enrolment: HmoEnrolment | null | undefined, basicMonthly: number, periodEnd: string): HmoSplit | null {
  if (!settings || !enrolment) return null;
  if (enrolment.from && enrolment.from > periodEnd) return null;
  if (enrolment.to && enrolment.to < periodEnd.slice(0, 8) + "01") return null;
  const plan = settings.plans.find((p) => p.id === enrolment.planId && p.active !== false);
  if (!plan) return null;
  const perMonth = (v: number) => (plan.premiumPeriod === "annual" ? v / 12 : v);
  const cover = enrolment.coverage === "family" ? plan.familyPremium : plan.individualPremium;
  const base = plan.basis === "percent_of_basic" ? (basicMonthly * cover) / 100 : perMonth(cover);
  const dependants = Math.max(0, enrolment.dependants ?? 0) * perMonth(plan.dependantPremium ?? 0);
  const premium = r2(base + dependants);
  if (premium <= 0) return null;
  const employer = plan.funding === "employer" ? premium : plan.funding === "employee" ? 0 : r2((premium * Math.min(100, Math.max(0, plan.employerSharePct))) / 100);
  const employee = r2(premium - employer);
  const provider = settings.providers.find((p) => p.id === plan.providerId)?.name ?? "HMO";
  const cov = `${enrolment.coverage === "family" ? "family" : "individual"}${enrolment.dependants ? ` + ${enrolment.dependants} dependant${enrolment.dependants === 1 ? "" : "s"}` : ""}`;
  return {
    plan,
    providerName: provider,
    premium,
    employee,
    employer,
    note: `${provider} ${plan.name} (${cov}) · premium ${premium.toLocaleString("en-NG", { maximumFractionDigits: 2 })}/month · ${plan.funding === "shared" ? `employer ${plan.employerSharePct}% / employee ${100 - plan.employerSharePct}%` : FUNDING_LABELS[plan.funding]}`,
  };
}

// ── Demo data ───────────────────────────────────────────────────────────────

/** Two fictional providers and three plans — one per funding model. */
export const DEMO_HMO_SETTINGS: HmoSettings = {
  providers: [
    { id: "HMOP-LAGOON", name: "Lagoon Health HMO", bankName: "Zenith Bank", accountNumber: "1012345678" },
    { id: "HMOP-CREST", name: "Crestline Care HMO", bankName: "GTBank", accountNumber: "0123456789" },
  ],
  plans: [
    { id: "HMO-BRONZE", providerId: "HMOP-LAGOON", name: "Bronze", premiumPeriod: "annual", basis: "fixed", individualPremium: 120_000, familyPremium: 360_000, dependantPremium: 60_000, funding: "employer", employerSharePct: 100, employeeShareRelieved: true, employerShareTaxable: false, active: true },
    { id: "HMO-SILVER", providerId: "HMOP-LAGOON", name: "Silver", premiumPeriod: "annual", basis: "fixed", individualPremium: 180_000, familyPremium: 480_000, dependantPremium: 80_000, funding: "shared", employerSharePct: 70, employeeShareRelieved: true, employerShareTaxable: false, active: true },
    { id: "HMO-GOLD", providerId: "HMOP-CREST", name: "Gold top-up", premiumPeriod: "monthly", basis: "fixed", individualPremium: 25_000, familyPremium: 60_000, dependantPremium: 10_000, funding: "employee", employerSharePct: 0, employeeShareRelieved: true, employerShareTaxable: false, active: true },
  ],
};

/** A deterministic mix of enrolments for the demo (most staff covered, some family, a few not enrolled). */
export function demoHmoEnrolment(index: number, from: string): HmoEnrolment | null {
  if (index % 6 === 5) return null;
  const planId = ["HMO-BRONZE", "HMO-SILVER", "HMO-SILVER", "HMO-BRONZE", "HMO-GOLD"][index % 5];
  const family = index % 3 === 0;
  return { planId, coverage: family ? "family" : "individual", dependants: family && index % 4 === 0 ? 1 : 0, from };
}
