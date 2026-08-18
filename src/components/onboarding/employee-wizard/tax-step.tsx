"use client";

import { useMemo } from "react";
import {
  Upload,
  Info,
  IdCard,
  Check,
  FileText,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  resolveStarterDeclaration,
  STARTER_DECLARATION_STATEMENTS,
  STUDENT_LOAN_PLAN_OPTIONS,
  STUDENT_LOAN_PLAN_GUIDANCE,
  TAX_BASIS_LABELS,
  type EmployeeStatementAnswers,
  type StarterTaxRecord,
  type StudentLoanPlan,
} from "@/src/lib/types/starter-tax";
import {
  computeRetainUntil,
  deriveStarterTaxCode,
} from "@/src/lib/payroll/derive-starter-tax";

/** Orange brand active state, matching the convention used across the app's tabs. */
const TAB_ACTIVE =
  "flex-1 text-sm gap-2 data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!";

type YesNo = "yes" | "no" | "";

/** Local, string-friendly form state for the tax step. */
export interface TaxFormState {
  /** Which path the joiner is providing: P45 vs Starter Checklist. */
  hasP45: YesNo;
  // P45 branch — official P45 (Continuous) boxes
  documentRef: string;
  payeOfficeNumber: string; // Box 1 left
  payeReferenceNumber: string; // Box 1 right
  niNumber: string; // Box 2
  leavingDate: string; // Box 4
  continueStudentLoan: boolean; // Box 5
  taxCodeAtLeaving: string; // Box 6
  week1Month1: boolean; // Box 6 'X'
  weekNumber: string; // Box 7
  monthNumber: string; // Box 7
  totalPayToDate: string; // Box 7
  totalTaxToDate: string; // Box 7
  // Starter Checklist — employee statement (guided)
  q8HasAnotherJob: YesNo;
  q9ReceivesPension: YesNo;
  q10RecentPayments: YesNo;
  // Starter Checklist — student loans
  q11HasLoan: YesNo;
  q12Exempt: YesNo;
  studentLoanPlan: StudentLoanPlan | "";
  postgraduateLoan: boolean;
}

export const EMPTY_TAX: TaxFormState = {
  // §2.18 — no default. The joiner answers "Do you have a P45?" first, and
  // that answer decides whether they upload or fill in the checklist.
  hasP45: "",
  documentRef: "",
  payeOfficeNumber: "",
  payeReferenceNumber: "",
  niNumber: "",
  leavingDate: "",
  continueStudentLoan: false,
  taxCodeAtLeaving: "",
  week1Month1: false,
  weekNumber: "",
  monthNumber: "",
  totalPayToDate: "",
  totalTaxToDate: "",
  q8HasAnotherJob: "",
  q9ReceivesPension: "",
  q10RecentPayments: "",
  q11HasLoan: "",
  q12Exempt: "",
  studentLoanPlan: "",
  postgraduateLoan: false,
};

/** True once the guided employee-statement flow has resolved to a declaration. */
export function isEmployeeStatementComplete(tax: TaxFormState): boolean {
  if (tax.q8HasAnotherJob === "") return false;
  if (tax.q8HasAnotherJob === "yes") return true; // → Statement C
  if (tax.q9ReceivesPension === "") return false;
  if (tax.q9ReceivesPension === "yes") return true; // → Statement C
  return tax.q10RecentPayments !== ""; // → Statement A or B
}

function toAnswers(tax: TaxFormState): EmployeeStatementAnswers {
  return {
    hasAnotherJob: tax.q8HasAnotherJob === "yes",
    receivesPension: tax.q9ReceivesPension === "yes",
    recentPaymentsSince6April: tax.q10RecentPayments === "yes",
  };
}

/**
 * Build a StarterTaxRecord from the form state, with `derived` and `retainUntil`
 * computed. Returns `null` until the joiner has entered enough to model.
 */
export function buildStarterTaxRecord(
  tax: TaxFormState,
  meta: { employeeId: string; tenantId: string; employmentStartDate: string },
): StarterTaxRecord | null {
  const base = {
    employeeId: meta.employeeId,
    tenantId: meta.tenantId,
    employmentStartDate: meta.employmentStartDate,
    retainUntil: computeRetainUntil(
      meta.employmentStartDate || new Date().toISOString().slice(0, 10),
    ),
  };

  if (tax.hasP45 === "yes") {
    // §2.18 — an uploaded P45 is enough on its own; the boxes are optional
    // extras for anyone who wants to key them, not a precondition.
    if (!tax.documentRef && (!tax.leavingDate || !tax.taxCodeAtLeaving)) {
      return null;
    }
    const payeRef = [tax.payeOfficeNumber, tax.payeReferenceNumber]
      .filter(Boolean)
      .join("/");
    const record: StarterTaxRecord = {
      ...base,
      source: "p45",
      p45: {
        documentRef: tax.documentRef || null,
        payeOfficeNumber: tax.payeOfficeNumber,
        payeReferenceNumber: tax.payeReferenceNumber,
        previousEmployerPayeRef: payeRef,
        niNumber: tax.niNumber,
        leavingDate: tax.leavingDate,
        continueStudentLoan: tax.continueStudentLoan,
        taxCodeAtLeaving: tax.taxCodeAtLeaving,
        week1Month1: tax.week1Month1,
        weekNumber: tax.week1Month1 ? "" : tax.weekNumber,
        monthNumber: tax.week1Month1 ? "" : tax.monthNumber,
        totalPayToDate: Number(tax.totalPayToDate) || 0,
        totalTaxToDate: Number(tax.totalTaxToDate) || 0,
      },
      starterChecklist: null,
      derived: { taxCode: "", basis: null, studentLoanDeduction: false, derivationSource: "" },
    };
    record.derived = deriveStarterTaxCode(record);
    return record;
  }

  if (tax.hasP45 === "no") {
    if (!isEmployeeStatementComplete(tax)) return null;
    const answers = toAnswers(tax);
    const hasPlan = tax.q11HasLoan === "yes" && tax.q12Exempt === "no";
    const record: StarterTaxRecord = {
      ...base,
      source: "starter_checklist",
      p45: null,
      starterChecklist: {
        employeeStatement: answers,
        starterDeclaration: resolveStarterDeclaration(answers),
        studentLoan: {
          hasPlan,
          plan: hasPlan ? (tax.studentLoanPlan || null) : null,
          postgraduateLoan: hasPlan ? tax.postgraduateLoan : false,
        },
      },
      derived: { taxCode: "", basis: null, studentLoanDeduction: false, derivationSource: "" },
    };
    record.derived = deriveStarterTaxCode(record);
    return record;
  }

  return null;
}

const DERIVATION_EXPLANATIONS: Record<string, string> = {
  starter_declaration_A: "Statement A — first job this tax year, standard cumulative code.",
  starter_declaration_B: "Statement B — only job now but had income since 6 April, taxed on a Week 1 / Month 1 basis.",
  starter_declaration_C: "Statement C — you have another job or a pension, taxed at the basic rate (BR).",
  p45_current_year: "Carried forward from your current-tax-year P45.",
  p45_stale_ignored: "Your P45 is from a previous tax year, so it can't be used — defaulted from your checklist.",
  no_form_default_0T: "No declaration yet — an emergency code applies until corrected.",
};

function fieldCls() {
  return "h-10 text-base";
}

/** A bigger, square check-style selector used for the Yes/No questions. */
function ChoiceBox({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-base transition-colors min-w-[120px]",
        selected
          ? "border-primary bg-primary/5 text-foreground"
          : "border-border text-muted-foreground hover:bg-accent/40",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors shrink-0",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40",
        )}
      >
        {selected && <Check className="w-4 h-4" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

/** A guided Yes/No question row built from square ChoiceBoxes. */
function YesNoRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Label className="text-base leading-relaxed">
        {label} <span className="text-destructive">*</span>
      </Label>
      {hint && <p className="text-sm text-muted-foreground -mt-1">{hint}</p>}
      <div className="flex gap-3">
        <ChoiceBox label="Yes" selected={value === "yes"} onClick={() => onChange("yes")} />
        <ChoiceBox label="No" selected={value === "no"} onClick={() => onChange("no")} />
      </div>
    </div>
  );
}

export function DerivedSummary({ record }: { record: StarterTaxRecord | null }) {
  if (!record) return null;
  const d = record.derived;
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">
          Your starting tax position
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tax code</p>
          <p className="text-lg font-semibold text-foreground">{d.taxCode}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Basis</p>
          <p className="text-base text-foreground">
            {d.basis ? TAX_BASIS_LABELS[d.basis] : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Student loan</p>
          <p className="text-base text-foreground">
            {d.studentLoanDeduction
              ? `Yes${d.studentLoanPlan ? ` · ${d.studentLoanPlan.replace("PLAN_", "Plan ")}` : ""}`
              : "No"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Postgraduate loan</p>
          <p className="text-base text-foreground">{d.postgraduateLoan ? "Yes" : "No"}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {DERIVATION_EXPLANATIONS[d.derivationSource] ?? d.derivationSource}
      </p>
    </div>
  );
}

export interface TaxRecap {
  fullName: string;
  dateOfBirth: string;
  niNumber: string;
  email: string;
  employmentStartDate: string;
}

function RecapItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-base text-foreground">{value || "—"}</span>
    </div>
  );
}

interface TaxStepProps {
  value: TaxFormState;
  onChange: (patch: Partial<TaxFormState>) => void;
  meta: { employeeId: string; tenantId: string; employmentStartDate: string };
  recap: TaxRecap;
}

export function TaxStep({ value: tax, onChange, meta, recap }: TaxStepProps) {
  const preview = useMemo(() => buildStarterTaxRecord(tax, meta), [tax, meta]);

  const resolved =
    tax.hasP45 === "no" && isEmployeeStatementComplete(tax)
      ? STARTER_DECLARATION_STATEMENTS[resolveStarterDeclaration(toAnswers(tax))]
      : null;

  // §2.18 — the joiner answers the P45 question first; until they do, neither
  // branch is shown, so nobody fills in a checklist they didn't need.
  const activeTab =
    tax.hasP45 === "no" ? "checklist" : tax.hasP45 === "yes" ? "p45" : "";

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          UK PAYE — Starter tax details
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          We use this to set your tax code on your first payslip.
        </p>
      </div>
      <Separator />

      {/* Read-only identity recap — broader, column-style list */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
          <IdCard className="h-4 w-4" /> Your details
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
          <RecapItem label="Full name" value={recap.fullName} />
          <RecapItem label="Date of birth" value={recap.dateOfBirth} />
          <RecapItem label="National Insurance" value={recap.niNumber} />
          <RecapItem label="Email" value={recap.email} />
          <RecapItem label="Employment start" value={recap.employmentStartDate} />
        </div>
      </div>

      <p className="text-sm font-medium text-foreground">
        Do you have a P45 from your previous employer?
      </p>

      {/* Tabbed P45 / Checklist selector, content in a wrapper card */}
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          onChange({ hasP45: v === "checklist" ? "no" : "yes" })
        }
        className="w-full"
      >
        <TabsList className="h-16 w-full">
          <TabsTrigger value="p45" className={TAB_ACTIVE}>
            <FileText className="h-4 w-4" /> I have a P45
          </TabsTrigger>
          <TabsTrigger value="checklist" className={TAB_ACTIVE}>
            <ClipboardList className="h-4 w-4" /> No P45 — Starter Checklist
          </TabsTrigger>
        </TabsList>

        <div className="rounded-xl border border-border bg-card p-5 mt-3">
          {/* P45 branch */}
          <TabsContent value="p45" className="mt-0 flex flex-col gap-4">
            {/* §2.18 — upload rather than re-key. Payroll can read the figures
                off the document, so asking the joiner to transcribe twelve
                boxes only adds transcription errors. */}
            <p className="text-sm text-muted-foreground">
              Upload your P45 and you&apos;re done — there&apos;s no need to
              copy the figures across.
            </p>
            <div
              className={cn(
                "rounded-lg border border-dashed p-4 flex items-center justify-between gap-3",
                tax.documentRef
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border",
              )}
            >
              <div className="flex items-center gap-2 text-sm">
                {tax.documentRef ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-foreground">{tax.documentRef}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Upload your P45 (PDF or photo)
                    </span>
                  </>
                )}
              </div>
              <label className="text-sm font-medium text-primary cursor-pointer">
                {tax.documentRef ? "Replace" : "Choose file"}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) =>
                    onChange({ documentRef: e.target.files?.[0]?.name ?? "" })
                  }
                />
              </label>
            </div>

            <details className="group rounded-lg border border-border">
              <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-foreground marker:hidden">
                <span className="flex items-center justify-between">
                  Enter the figures manually instead (optional)
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="border-t border-border p-4">
                <p className="mb-4 text-xs text-muted-foreground">
                  Copy these from Parts 2 and 3 of your P45. Only needed if you
                  can&apos;t upload the document.
                </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">
                  Employer PAYE reference{" "}
                  <span className="text-muted-foreground font-normal">(Box 1)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={tax.payeOfficeNumber}
                    onChange={(e) =>
                      onChange({ payeOfficeNumber: e.target.value.replace(/\D/g, "") })
                    }
                    className={cn(fieldCls(), "w-20")}
                    placeholder="120"
                    maxLength={3}
                    inputMode="numeric"
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    value={tax.payeReferenceNumber}
                    onChange={(e) =>
                      onChange({ payeReferenceNumber: e.target.value.toUpperCase() })
                    }
                    className={fieldCls()}
                    placeholder="AB456"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">
                  National Insurance number{" "}
                  <span className="text-muted-foreground font-normal">(Box 2)</span>
                </Label>
                <Input
                  value={tax.niNumber}
                  onChange={(e) => onChange({ niNumber: e.target.value.toUpperCase() })}
                  className={fieldCls()}
                  placeholder="e.g. QQ123456C"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">
                  Leaving date{" "}
                  <span className="text-muted-foreground font-normal">(Box 4)</span>
                </Label>
                <Input
                  type="date"
                  value={tax.leavingDate}
                  onChange={(e) => onChange({ leavingDate: e.target.value })}
                  className={fieldCls()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">
                  Tax code at leaving{" "}
                  <span className="text-muted-foreground font-normal">(Box 6)</span>
                </Label>
                <Input
                  value={tax.taxCodeAtLeaving}
                  onChange={(e) =>
                    onChange({ taxCodeAtLeaving: e.target.value.toUpperCase() })
                  }
                  className={fieldCls()}
                  placeholder="e.g. 1257L"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-base text-foreground">
                Week 1 / Month 1 basis?{" "}
                <span className="text-muted-foreground text-sm">(Box 6)</span>
              </span>
              <Switch
                checked={tax.week1Month1}
                onCheckedChange={(v) => onChange({ week1Month1: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-base text-foreground">
                Student Loan deductions to continue?{" "}
                <span className="text-muted-foreground text-sm">(Box 5)</span>
              </span>
              <Switch
                checked={tax.continueStudentLoan}
                onCheckedChange={(v) => onChange({ continueStudentLoan: v })}
              />
            </div>

            {/* Box 7 — only when cumulative (no entries if Week 1 / Month 1) */}
            {!tax.week1Month1 && (
              <div className="rounded-lg border border-border p-4 flex flex-col gap-4">
                <p className="text-sm font-semibold text-foreground">
                  Last entries on the Deductions Working Sheet{" "}
                  <span className="text-muted-foreground font-normal">
                    (Box 7 — cumulative only)
                  </span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Week number</Label>
                    <Input
                      inputMode="numeric"
                      value={tax.weekNumber}
                      onChange={(e) =>
                        onChange({ weekNumber: e.target.value.replace(/\D/g, "") })
                      }
                      className={fieldCls()}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Month number</Label>
                    <Input
                      inputMode="numeric"
                      value={tax.monthNumber}
                      onChange={(e) =>
                        onChange({ monthNumber: e.target.value.replace(/\D/g, "") })
                      }
                      className={fieldCls()}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Total pay to date (£)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={tax.totalPayToDate}
                      onChange={(e) => onChange({ totalPayToDate: e.target.value })}
                      className={fieldCls()}
                      placeholder="e.g. 8450.00"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Total tax to date (£)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={tax.totalTaxToDate}
                      onChange={(e) => onChange({ totalTaxToDate: e.target.value })}
                      className={fieldCls()}
                      placeholder="e.g. 690.00"
                    />
                  </div>
                </div>
              </div>
            )}
              </div>
            </details>
          </TabsContent>

          {/* Starter Checklist branch — guided flow */}
          <TabsContent value="checklist" className="mt-0 flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-foreground">
                Employee statement — answer these so we can apply the right tax code.
              </p>
              <YesNoRow
                label="Do you have another job?"
                value={tax.q8HasAnotherJob}
                onChange={(v) => onChange({ q8HasAnotherJob: v })}
              />
              {tax.q8HasAnotherJob === "no" && (
                <YesNoRow
                  label="Do you receive payments from a State, workplace or private pension?"
                  value={tax.q9ReceivesPension}
                  onChange={(v) => onChange({ q9ReceivesPension: v })}
                />
              )}
              {tax.q8HasAnotherJob === "no" && tax.q9ReceivesPension === "no" && (
                <YesNoRow
                  label="Since 6 April, have you received payments from another job that has ended, or from Jobseeker's Allowance, Employment and Support Allowance, or Incapacity Benefit?"
                  value={tax.q10RecentPayments}
                  onChange={(v) => onChange({ q10RecentPayments: v })}
                />
              )}
            </div>

            {/* Resolved statement read-back */}
            {resolved && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col gap-1.5">
                <p className="text-base font-semibold text-foreground">
                  {resolved.title} — {resolved.result}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {resolved.statement}
                </p>
              </div>
            )}

            <Separator />

            {/* Student loans */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-foreground">Student loans</p>
              <YesNoRow
                label="Do you have a student or postgraduate loan?"
                value={tax.q11HasLoan}
                onChange={(v) => onChange({ q11HasLoan: v })}
              />
              {tax.q11HasLoan === "yes" && (
                <YesNoRow
                  label="Do any of these apply: you're still studying, you left your course after 6 April this tax year, you've repaid your loan in full, or you're repaying it by Direct Debit to the Student Loans Company?"
                  value={tax.q12Exempt}
                  onChange={(v) => onChange({ q12Exempt: v })}
                />
              )}
              {tax.q11HasLoan === "yes" && tax.q12Exempt === "no" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Student loan plan type</Label>
                    <Select
                      value={tax.studentLoanPlan}
                      onValueChange={(v) =>
                        onChange({ studentLoanPlan: v as StudentLoanPlan })
                      }
                    >
                      <SelectTrigger className={fieldCls()}>
                        <SelectValue placeholder="Select your plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDENT_LOAN_PLAN_OPTIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-base text-foreground">Postgraduate loan?</span>
                    <Switch
                      checked={tax.postgraduateLoan}
                      onCheckedChange={(v) => onChange({ postgraduateLoan: v })}
                    />
                  </div>
                  <details className="sm:col-span-2 text-sm text-muted-foreground">
                    <summary className="cursor-pointer">Not sure which plan?</summary>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {STUDENT_LOAN_PLAN_GUIDANCE.map((g) => (
                        <li key={g}>{g}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Live derived summary */}
      <DerivedSummary record={preview} />
    </>
  );
}
