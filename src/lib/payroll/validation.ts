import type {
  EmployeeTaxProfile,
  PayComputation,
  PayrollException,
  PayrollRun,
  PayrollSettings,
} from "./types";

/**
 * Deterministic pre-approval checks, run identically on auto-calculated and
 * manually uploaded employees — a typed-in figure is not exempt from the
 * duplicate-account or negative-net checks.
 *
 * Errors block submission until acknowledged with a reason; warnings are
 * shown for review. Every acknowledgement is kept on the run (audit trail).
 */

export interface ValidationEmployee {
  id: string;
  fullName: string;
  status: string;
  dateOfLeaving?: string | null;
}

export const EXCEPTION_RULE_LABELS: Record<PayrollException["rule"], string> = {
  duplicate_bank_account: "Duplicate bank account",
  leaver_in_run: "Leaver in run",
  negative_net: "Negative net pay",
  zero_net: "Zero net pay",
  missing_bank: "Missing bank details",
  missing_tin: "Missing TIN",
  missing_rsa: "Missing pension RSA PIN",
  basic_out_of_range: "Basic salary out of range",
  variance: "Month-on-month variance",
  manual_missing_paye: "Manual figures without PAYE",
  rent_evidence_unverified: "Rent relief evidence unverified",
};

export function validateRun(args: {
  run: PayrollRun;
  employees: Map<string, ValidationEmployee>;
  profiles: Map<string, EmployeeTaxProfile>;
  previous: Map<string, PayComputation>;
  settings: PayrollSettings;
}): PayrollException[] {
  const { run, employees, profiles, previous, settings } = args;
  const out: PayrollException[] = [];
  const keep = new Map(run.exceptions.map((e) => [e.id, e.acknowledged]));
  const push = (e: Omit<PayrollException, "acknowledged">) =>
    out.push({ ...e, acknowledged: keep.get(e.id) });

  const included = run.employees.filter((e) => e.included);
  const accounts = new Map<string, string[]>();

  for (const re of included) {
    const emp = employees.get(re.employeeId);
    const name = emp?.fullName ?? re.employeeId;
    const p = profiles.get(re.employeeId);
    const c = re.computation;

    if (emp && (emp.status === "terminated" || (emp.dateOfLeaving && emp.dateOfLeaving < run.period.start))) {
      push({
        id: `leaver:${re.employeeId}`,
        rule: "leaver_in_run",
        severity: "error",
        employeeId: re.employeeId,
        message: `${name} has left the company${emp.dateOfLeaving ? ` (${emp.dateOfLeaving})` : ""} but is included in this run.`,
      });
    }
    if (!p?.accountNumber || !p.bankName) {
      push({ id: `bank:${re.employeeId}`, rule: "missing_bank", severity: "error", employeeId: re.employeeId, message: `${name} has no bank account on file — they cannot be paid.` });
    } else {
      const k = `${p.bankName}|${p.accountNumber}`;
      accounts.set(k, [...(accounts.get(k) ?? []), re.employeeId]);
    }
    if (!p?.tin) push({ id: `tin:${re.employeeId}`, rule: "missing_tin", severity: "warning", employeeId: re.employeeId, message: `${name} has no Tax Identification Number — PAYE can't be filed against them.` });
    if (c && c.lines.some((l) => l.code === "PENSION_EE") && !p?.rsaPin)
      push({ id: `rsa:${re.employeeId}`, rule: "missing_rsa", severity: "warning", employeeId: re.employeeId, message: `${name} has pension deducted but no RSA PIN — the PFA remittance will bounce.` });
    if (p && p.annualRentDeclared > 0 && !p.rentEvidenceVerified)
      push({ id: `rent:${re.employeeId}`, rule: "rent_evidence_unverified", severity: "warning", employeeId: re.employeeId, message: `${name} declared rent but the evidence isn't verified, so Rent Relief was not applied.` });

    if (!c) continue;
    if (c.net < 0)
      push({ id: `neg:${re.employeeId}`, rule: "negative_net", severity: "error", employeeId: re.employeeId, message: `${name}'s deductions exceed their gross pay (net ₦${c.net.toLocaleString("en-NG")}).` });
    else if (c.net === 0)
      push({ id: `zero:${re.employeeId}`, rule: "zero_net", severity: "error", employeeId: re.employeeId, message: `${name} has zero net pay.` });

    const basic = c.lines.filter((l) => l.code === "BASIC" || l.code === "CONSOLIDATED").reduce((s, l) => s + l.amount, 0);
    if (re.mode === "auto" && c.prorationFactor === 1 && (basic < settings.basicMin || basic > settings.basicMax))
      push({
        id: `basic:${re.employeeId}`,
        rule: "basic_out_of_range",
        severity: "warning",
        employeeId: re.employeeId,
        message: `${name}'s basic salary (₦${basic.toLocaleString("en-NG")}) is outside the configured range of ₦${settings.basicMin.toLocaleString("en-NG")}–₦${settings.basicMax.toLocaleString("en-NG")}.`,
      });

    if (re.mode === "manual" && re.manualStatutory === "as_uploaded" && !c.lines.some((l) => l.code === "PAYE"))
      push({ id: `mpaye:${re.employeeId}`, rule: "manual_missing_paye", severity: "warning", employeeId: re.employeeId, message: `${name}'s uploaded figures have no PAYE line.` });

    const prev = previous.get(re.employeeId);
    if (prev && prev.net > 0) {
      const pct = ((c.net - prev.net) / prev.net) * 100;
      if (Math.abs(pct) > settings.varianceThresholdPct)
        push({
          id: `var:${re.employeeId}`,
          rule: "variance",
          severity: "warning",
          employeeId: re.employeeId,
          message: `${name}'s net pay is ${pct > 0 ? "up" : "down"} ${Math.abs(pct).toFixed(1)}% on last month (₦${prev.net.toLocaleString("en-NG")} → ₦${c.net.toLocaleString("en-NG")}).`,
        });
    }
  }

  for (const [, ids] of accounts) {
    if (ids.length < 2) continue;
    const names = ids.map((id) => employees.get(id)?.fullName ?? id).join(", ");
    for (const id of ids)
      push({ id: `dup:${id}`, rule: "duplicate_bank_account", severity: "error", employeeId: id, message: `The same bank account is used by ${names}.` });
  }

  return out;
}

export function blockingExceptions(run: Pick<PayrollRun, "exceptions">): PayrollException[] {
  return run.exceptions.filter((e) => e.severity === "error" && !e.acknowledged);
}
