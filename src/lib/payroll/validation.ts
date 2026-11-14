import type {
  EmployeeTaxProfile,
  PayComputation,
  PaymentSnapshot,
  PayrollException,
  PayrollRun,
  PayrollSettings,
} from "./types";
import { isValidNuban } from "./run-builder";

/**
 * Deterministic pre-approval checks, run identically on auto-calculated and
 * manually uploaded employees — a typed-in figure is not exempt from the
 * duplicate-account or negative-net checks.
 *
 * Errors block submission until fixed or acknowledged with a reason;
 * warnings are flagged for review. Every acknowledgement is kept on the run.
 *
 * An exception's id includes the figure it is about, so acknowledging
 * "net pay −₦5,000" does not silently cover "net pay −₦500,000" after a change.
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
  missing_bank_code: "Missing bank code",
  invalid_nuban: "Invalid account number (NUBAN)",
  bank_changed: "Bank details changed since last pay",
  missing_tin: "Missing TIN",
  missing_rsa: "Missing pension RSA PIN",
  basic_out_of_range: "Basic salary out of range",
  variance: "Month-on-month variance",
  deductions_over_limit: "Deductions over two-thirds of pay",
  manual_missing_paye: "Manual figures without PAYE",
  rent_evidence_unverified: "Rent relief evidence unverified",
  input_held: "Deduction held for review",
};

const k = (n: number) => Math.round(n);

export function validateRun(args: {
  run: PayrollRun;
  employees: Map<string, ValidationEmployee>;
  profiles: Map<string, EmployeeTaxProfile>;
  /** Each employee's previous REGULAR computation (variance). */
  previous: Map<string, PayComputation>;
  /** Each employee's payment details at their last finalized pay (bank-change check). */
  previousPayment?: Map<string, PaymentSnapshot>;
  settings: PayrollSettings;
}): PayrollException[] {
  const { run, employees, profiles, previous, settings } = args;
  const out: PayrollException[] = [];
  const keep = new Map(run.exceptions.map((e) => [e.id, e.acknowledged]));
  const push = (e: Omit<PayrollException, "acknowledged">) => out.push({ ...e, acknowledged: keep.get(e.id) });
  const regular = run.type === "regular";

  const included = run.employees.filter((e) => e.included);
  const accounts = new Map<string, string[]>();

  for (const re of included) {
    const emp = employees.get(re.employeeId);
    const name = emp?.fullName ?? re.employeeId;
    // Pay details as the run will pay them (frozen snapshot), else the live profile.
    const p = profiles.get(re.employeeId);
    const pay = re.snapshot ?? (p ? { bankName: p.bankName, bankCode: p.bankCode, accountNumber: p.accountNumber, tin: p.tin, rsaPin: p.rsaPin } : null);
    const c = re.computation;
    const id = re.employeeId;

    // A leaver is only an error when they left BEFORE this period (final pay inside it is legitimate).
    if (emp && ((emp.dateOfLeaving && emp.dateOfLeaving < run.period.start && regular) || (emp.status === "terminated" && !emp.dateOfLeaving))) {
      push({ id: `leaver:${id}`, rule: "leaver_in_run", severity: "error", employeeId: id, message: `${name} left${emp.dateOfLeaving ? ` on ${emp.dateOfLeaving}` : ""}, before this period, but is included.` });
    }

    if (!pay?.accountNumber || !pay.bankName) {
      push({ id: `bank:${id}`, rule: "missing_bank", severity: "error", employeeId: id, message: `${name} has no bank account on file — they cannot be paid.` });
    } else {
      if (!pay.bankCode)
        push({ id: `bankcode:${id}`, rule: "missing_bank_code", severity: "error", employeeId: id, message: `${name}'s bank (${pay.bankName}) has no NIBSS code — the bank file would be rejected.` });
      else if (!isValidNuban(pay.accountNumber, pay.bankCode))
        push({ id: `nuban:${id}:${pay.accountNumber}`, rule: "invalid_nuban", severity: "error", employeeId: id, message: `${name}'s account number ${pay.accountNumber} isn't a valid NUBAN for ${pay.bankName}. Check for a typo.` });
      const key = `${pay.bankCode || pay.bankName}|${pay.accountNumber}`;
      accounts.set(key, [...(accounts.get(key) ?? []), id]);
      const before = args.previousPayment?.get(id);
      if (before && before.accountNumber && (before.accountNumber !== pay.accountNumber || (before.bankCode || before.bankName) !== (pay.bankCode || pay.bankName))) {
        push({
          id: `bankchg:${id}:${pay.bankCode}${pay.accountNumber}`,
          rule: "bank_changed",
          severity: "error",
          employeeId: id,
          message: `${name}'s bank details changed since their last pay (${before.bankName} •••• ${before.accountNumber.slice(-4)} → ${pay.bankName} •••• ${pay.accountNumber.slice(-4)}). Confirm the change with the employee before paying.`,
        });
      }
    }

    const paye = c?.lines.filter((l) => l.code === "PAYE").reduce((s, l) => s + l.amount, 0) ?? 0;
    if (!pay?.tin)
      push({
        id: `tin:${id}`,
        rule: "missing_tin",
        severity: paye > 0 ? "error" : "warning",
        employeeId: id,
        message: paye > 0 ? `${name} has PAYE deducted but no TIN — the remittance can't be credited to them.` : `${name} has no Tax Identification Number on file.`,
      });
    if (c && c.lines.some((l) => l.code === "PENSION_EE") && !pay?.rsaPin)
      push({ id: `rsa:${id}`, rule: "missing_rsa", severity: "warning", employeeId: id, message: `${name} has pension deducted but no RSA PIN — the PFA remittance will bounce.` });
    if (p && p.annualRentDeclared > 0 && !p.rentEvidenceVerified)
      push({ id: `rent:${id}`, rule: "rent_evidence_unverified", severity: "warning", employeeId: id, message: `${name} declared rent but the evidence isn't verified, so Rent Relief was not applied.` });

    for (const [i, note] of (run.inputNotes ?? []).filter((n) => n.employeeId === id).entries())
      push({ id: `held:${id}:${i}`, rule: "input_held", severity: "warning", employeeId: id, message: note.message });

    if (!c) continue;
    if (c.net < 0)
      push({ id: `neg:${id}:${k(c.net)}`, rule: "negative_net", severity: "error", employeeId: id, message: `${name}'s deductions exceed their gross pay (net ₦${c.net.toLocaleString("en-NG")}).` });
    else if (c.net === 0)
      push({ id: `zero:${id}`, rule: "zero_net", severity: "error", employeeId: id, message: `${name} has zero net pay.` });

    // Labour Act: deductions shouldn't take more than a third of pay away from the employee.
    if (c.gross > 0 && c.totalDeductions > (c.gross * 2) / 3 && c.net >= 0)
      push({
        id: `limit:${id}:${k(c.totalDeductions)}`,
        rule: "deductions_over_limit",
        severity: "warning",
        employeeId: id,
        message: `${name}'s deductions are ${Math.round((c.totalDeductions / c.gross) * 100)}% of gross pay. The Labour Act limits deductions to two-thirds of wages.`,
      });

    if (regular && re.mode === "auto" && c.prorationFactor === 1) {
      const basic = c.lines.filter((l) => l.code === "BASIC" || l.code === "CONSOLIDATED").reduce((s, l) => s + l.amount, 0);
      if (basic < settings.basicMin || basic > settings.basicMax)
        push({
          id: `basic:${id}:${k(basic)}`,
          rule: "basic_out_of_range",
          severity: "warning",
          employeeId: id,
          message: `${name}'s basic salary (₦${basic.toLocaleString("en-NG")}) is outside the configured range of ₦${settings.basicMin.toLocaleString("en-NG")}–₦${settings.basicMax.toLocaleString("en-NG")}.`,
        });
    }

    if (re.mode === "manual" && re.manualStatutory === "as_uploaded" && !c.lines.some((l) => l.code === "PAYE") && c.tax.regime === "paye")
      push({ id: `mpaye:${id}`, rule: "manual_missing_paye", severity: "warning", employeeId: id, message: `${name}'s uploaded figures have no PAYE line.` });

    // Variance only makes sense regular-to-regular.
    const prev = regular ? previous.get(id) : undefined;
    if (prev && prev.net > 0) {
      const pct = ((c.net - prev.net) / prev.net) * 100;
      if (Math.abs(pct) > settings.varianceThresholdPct)
        push({
          id: `var:${id}:${Math.round(pct)}`,
          rule: "variance",
          severity: "warning",
          employeeId: id,
          message: `${name}'s net pay is ${pct > 0 ? "up" : "down"} ${Math.abs(pct).toFixed(1)}% on last month (₦${prev.net.toLocaleString("en-NG")} → ₦${c.net.toLocaleString("en-NG")}).`,
        });
    }
  }

  for (const [key, ids] of accounts) {
    if (ids.length < 2) continue;
    const names = ids.map((id) => employees.get(id)?.fullName ?? id).join(", ");
    for (const id of ids)
      push({ id: `dup:${id}:${key}`, rule: "duplicate_bank_account", severity: "error", employeeId: id, message: `The same bank account is used by ${names}.` });
  }

  return out;
}

export function blockingExceptions(run: Pick<PayrollRun, "exceptions">): PayrollException[] {
  return run.exceptions.filter((e) => e.severity === "error" && !e.acknowledged);
}
