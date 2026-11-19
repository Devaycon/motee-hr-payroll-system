# MOTEE Payroll Module (Nigeria): Specification v2

| | |
|---|---|
| **Status** | Built on `feat/temitope-demo-branch` (frontend + reference engine, mock data) and hardened after a full audit (§16). Backend to implement against §12. |
| **Replaces** | `MOTEE_Payroll_Module_Plan.md` (v1) |
| **Scope** | Nigeria. Two input pathways (auto-calculated, manually uploaded) feeding one approval pipeline and one payslip generator. UK is a later statutory module behind the same model. |
| **Owners** | Devaycon (product), backend developer (API + authoritative engine), frontend (screens in this repo) |

> ⚠️ **The figures in §3 come from industry reporting of the Nigeria Tax Act 2025, not the gazetted text.** Confirm them with a Nigerian tax adviser and against Nigeria Revenue Service (NRS) guidance before the first live payroll. They are stored as data (§4.4), so a correction is a configuration change, not a deployment.

---

## 1. What changed from v1, and why

v1's structure was right and is kept: a configurable Pay Element Master, two pathways meeting at one line-item shape, effective-dated statutory rates, runs that lock once finalized, and the AI features parked for later. What changed:

### 1.1 Statutory corrections

| v1 said | Correct position | Effect |
|---|---|---|
| Pension at 8% of **gross** in the worked example | 8% (employee) and at least 10% (employer) of **pensionable emoluments**: basic + housing + transport at minimum (Pension Reform Act 2014) | Pension was overstated for anyone with other allowances |
| NHF at 2.5% of **gross** | 2.5% of **basic salary** only, and only for eligible employees | NHF was overstated |
| NHIS/NHIA not mentioned | Health insurance under the NHIA Act 2022 is a deductible relief; it's a tenant setting because many companies use a private HMO instead | Added as an optional deduction |
| Reliefs: pension, NHF, rent | Also: NHIA contributions, voluntary pension, life assurance premiums, interest on a mortgage for an owner-occupied home | More reliefs on the employee tax profile |
| Annualisation was an "open question" | **Recommended: cumulative method** (§3.4). Annualised is available as a setting. | Bonus months are taxed fairly and the method self-corrects |
| "FIRS / Nigeria Revenue Service" | The NRS replaced FIRS. PAYE is still administered by the **State IRS of the employee's residence**. | Remittance routing per state |
| No compliance calendar | Remittance deadlines (§3.6) | Drives the Statutory Remittances tab |
| Group Life as a computed deduction | It's an employer **insurance policy** (cover of at least 3× annual emoluments), not a percentage taken from each payslip | Tracked as policy cover, not a payslip line |
| No rounding rule | Line items rounded half-up to the kobo. Net pay in words reads "… Naira, … Kobo Only". | Payslips reconcile exactly |
| All employment types on PAYE | Self-employed/freelance staff are paid with **withholding tax**, not PAYE or pension. Fixed-term "contract" employees stay on PAYE. | Rule per employment type (§4.5) |

### 1.2 The corrected worked example

Monthly pay of ₦300,000: basic ₦150,000, housing ₦75,000, transport ₦30,000, other allowances ₦45,000. Declared rent is ₦600,000 a year, with evidence verified.

```
Annual gross                               ₦3,600,000
– Pension 8% × (150k+75k+30k) × 12        ₦244,800
– NHF 2.5% × 150k × 12                      ₦45,000
– Rent relief 20% × ₦600,000 (cap ₦500k)   ₦120,000
= Chargeable income                       ₦3,190,200

First ₦800,000 @ 0%      ₦0
Next ₦2,200,000 @ 15%    ₦330,000
Next ₦190,200 @ 18%      ₦34,236
Annual PAYE              ₦364,236   → ₦30,353.00 a month

Monthly: gross ₦300,000 − PAYE ₦30,353 − pension ₦20,400 − NHF ₦3,750 = net ₦245,497
Employer: pension ₦25,500 · NSITF ₦3,000 · ITF ₦3,000
```

`src/lib/payroll/ng/engine.test.ts` reproduces this to the kobo. **The backend must pass the same golden tests** (§13).

### 1.3 Questions v1 left open that the codebase already answers

| v1 open decision | Answer |
|---|---|
| Who approves? | Roles `PAYROLL-ADMIN` and `FINANCE` already exist (`src/lib/permissions/seeds.ts`). Runs go through the existing approval engine as a new `payroll_run` chain: **Finance review → Executive authorises payment**. Whoever prepared the run can never approve it (§6.2). |
| Where does overtime come from? | Attendance already records overtime (`TimesheetDto.approvedOvertimeHours`). Payroll reads approved hours as `rate_x_units` inputs. |
| Should payroll own loan tracking? | No. The Employee Loans module exists, and its own code says "Payroll Phase 2" will post repayments. Payroll deducts each loan's due instalment and posts the repayment back when the run is finalized. |
| Mixed mode (some employees auto, some manual)? | **Built.** Each employee in a run can be switched between Auto and Manual (§5.3). |
| Bank disbursement? | V1 exports a NIBSS bulk-payment file. A direct bank API is a later phase. |

### 1.4 Additions v1 missed

- **Statutory schedules:** PAYE per State IRS, pension per PFA (with RSA PINs), NHF, plus a payroll register and a variance report.
- **Run types:** off-cycle runs (bonus, final settlement) and adjustment runs that correct a finalized period.
- **Calendar and pay day:** a payroll calendar with an input cut-off day, and a configurable pay day.
- **Other modules:** approved expense claims are paid through payroll as a non-taxable line, and lateness/absence deductions reuse the attendance deduction policy.
- **Data protection (NDPA 2023):** confidential pay data, masked bank accounts, role-scoped access, an audit trail on every change, and 6-year retention.
- **Payslip verification:** a public, login-free page backed by a SHA-256 fingerprint of the payslip's figures. HR can revoke a code.
- **"PayCheck Before Payday":** employees see a watermarked DRAFT preview of the run being prepared.

---

## 2. How the module fits together

```
 Salary structures ─┐                                 ┌─► Payslips (immutable, verifiable)
 Loans (instalments)┤                                 ├─► NIBSS bulk payment file
 Expenses (approved)┼─► AUTO ──┐                      ├─► PAYE / pension / NHF schedules
 Attendance (OT,    │          ├─► PayslipLine rows ─► Validate ─► Approve ─► Finalize ─► Paid
   unpaid days)     │          │   (one shape for     (exceptions)  (Finance →  (locked)
 Manual inputs ─────┘          │    both pathways)                  Executive)
 Uploaded spreadsheet ─► MANUAL┘
```

The statutory engine is a **country module** (`src/lib/payroll/ng/`). Everything else (data model, pipeline, payslip) has no country logic in it, so UK payroll can be added as a second module without touching it.

---

## 3. Nigerian statutory rules (rate set `NG-RS-2026-01`, from 1 Jan 2026)

### 3.1 PAYE bands (annual chargeable income)

| Band | Rate |
|---|---|
| First ₦800,000 | 0% |
| Next ₦2,200,000 | 15% |
| Next ₦9,000,000 | 18% |
| Next ₦13,000,000 | 21% |
| Next ₦25,000,000 | 23% |
| Above ₦50,000,000 | 25% |

The Consolidated Relief Allowance is **repealed**. No code may compute it.

### 3.2 Reliefs (deducted before the bands)

- Employee pension, including voluntary contributions
- NHF
- NHIA contributions
- Rent relief: 20% of annual rent, capped at ₦500,000. It applies only once HR marks the tenancy agreement or receipt as verified.
- Life assurance premiums
- Mortgage interest on an owner-occupied home

Compensation for loss of office (gratuity, redundancy, severance) is exempt up to ₦50,000,000.

### 3.3 Contributions

| Item | Rate | Base | Paid by |
|---|---|---|---|
| Pension | 8% | Basic + housing + transport | Employee |
| Pension | 10% minimum | Same | Employer |
| NHF | 2.5% | Basic | Employee (eligible staff) |
| NHIA | 5% / 10% (tenant setting) | Basic | Employee / employer |
| NSITF | 1% | Monthly payroll | Employer |
| ITF | 1% | Annual payroll (accrued monthly) | Employer, if 5+ staff or ₦50m+ turnover |
| Group Life | Cover ≥ 3× annual emoluments | — | Employer policy |
| Withholding tax | 5% (to confirm) | Gross | Self-employed/freelance only, instead of PAYE |

Earners at or below the national minimum wage (₦70,000 a month, held as a rate-set value) pay no PAYE.

### 3.4 Calculation method (recommendation: cumulative)

**Cumulative:** tax due on all chargeable pay to date, with the bands scaled to the **calendar month** (month ÷ 12), minus the PAYE already deducted this year.

- Steady pay gives exactly annual tax ÷ 12 (₦30,353 in the example).
- A bonus month is taxed at the employee's **marginal** rate. Annualising would multiply the bonus by 12 and tax it at a higher band. With a ₦1,000,000 bonus, cumulative takes ₦210,353 and annualised takes ₦218,328.50; both figures are covered by tests.
- **Off-cycle and adjustment runs never add a tax month.** A ₦500,000 bonus paid off-cycle in November is taxed at 18% (₦90,000) and December still taxes as month 12.
- **Mid-year joiners** end the year on their true annual liability: six months' pay taxed with the full year's bands by December.
- **Refunds:** when chargeable income to date falls (long unpaid leave, a late relief), the over-deduction comes back as a "PAYE refund" line. It's a setting (on by default).
- **Year to date is a sum**, never a chained snapshot: each final payslip stores its own period figures, and YTD adds them up, so the order runs are issued in can't corrupt it.
- **Annual reliefs** (rent, life assurance, mortgage interest) are given cumulatively: annual × month ÷ 12, less what's already been given. Off-cycle runs never double them, and a rent declaration verified late in the year catches up at once.

**Annualised** (this month × 12 through the bands, then ÷ 12) is available in Payroll Settings for regular runs, for tenants whose adviser prefers it. Off-cycle runs always use the cumulative calculation. **Decision required from Devaycon / the tax adviser** (§14).

New statutory rate sets start on **1 January** of a tax year, so a year is never taxed under two sets of bands.

### 3.5 Order of operations (the engine)

1. Pro-rate recurring pay for joiners and leavers. The default is calendar days; working days is a setting.
2. Add period inputs: overtime (hourly basic × multiplier × hours), bonuses, expenses, unpaid days, loan instalments.
3. Work out gross, then taxable gross. **Unpaid leave and lateness reduce earnings** (a negative earning line), so gross, NSITF, ITF and every schedule see the pay actually earned. Taxable gross leaves out non-taxable reimbursements and the loss-of-office exemption (used once per termination).
4. Work out the statutory bases: pensionable pay, the NHF base, the NHIA base.
5. Deduct the reliefs to get chargeable income, then calculate PAYE (§3.4). The minimum-wage exemption is tested on **full-month recurring pay**, so a late-month joiner on a high salary isn't wrongly exempted.
6. Apply the other deductions to get net pay.
7. Calculate employer costs (pension, NHIA, NSITF, ITF) separately. They are never deducted from net pay.

### 3.6 Remittance calendar

| Remittance | To | Due |
|---|---|---|
| Pension (employee + employer) | Each employee's PFA | Within 7 working days of paying salaries |
| Voluntary pension (AVC) | Each employee's PFA | With the mandatory pension, within 7 working days |
| PAYE | State IRS of the employee's residence | 10th of the following month |
| NHF | Federal Mortgage Bank of Nigeria | Within one month |
| NSITF | NSITF | Monthly |
| ITF | ITF | 1 April, for the previous year |
| Annual PAYE return (Form H1) | State IRS | 31 January |

"Working days" exclude weekends and federal public holidays (`src/lib/payroll/ng/calendar.ts`).

**Pay day.** Pay day is set in Payroll Settings (default 25th). If it falls on a weekend or public holiday, pay moves back to the **previous working day**. For example, Sunday 25 October 2026 becomes Friday 23 October, and Christmas Day 2026 becomes Thursday 24 December. The period keeps the scheduled day (`scheduledPayDate`) and the reason (`payDateNote`) so screens can say why the date moved. Months are paid and closed in order: a new regular run can't be created while an earlier month is still open. On the overview, "Next Pay Day" is the earliest open month.

---

## 4. Data model

The TypeScript source of truth is `src/lib/payroll/types.ts`. The backend should mirror these entities.

### 4.1 PayElement (Pay Element Master)
`code` (stable, never renamed) · `name` · `category` (earning | deduction | employer) · `group` · `calculationType` (fixed | percent_of_basic | percent_of_gross | rate_x_units | formula | manual) · `taxable` · `pensionable` · `recurring` · `proratable` · `statutory` · `active` · `multiplier?` (overtime) · `preTax?` · `custom?`

The seed has 120+ elements from the client's workbook, in 13 groups (`src/lib/payroll/elements-seed.ts`). Tenants switch whole groups on or off; the manufacturing group is off by default. Statutory elements are system-owned and can't be edited.

### 4.2 SalaryStructure (versioned)
`employeeId` · `effectiveFrom` · `effectiveTo` · `lines[{code, amount}]` (monthly) · `reason` · `approvedBy/At`.

A salary change is a **new version**: the previous one is closed the day before. History is never overwritten.

> **Backend gap:** the API's `EmployeeDto` has no salary field today. This entity is new.

### 4.3 EmployeeTaxProfile
`tin` · `stateOfResidence` · `pfaCode` · `pfaName` · `rsaPin` · `nhfNumber` · `nhfEligible` · `nhisEnrolled` · `annualRentDeclared` · `rentEvidence{fileName, uploadedAt}` · `rentEvidenceVerified` · `lifeAssurancePremiumAnnual` · `mortgageInterestAnnual` · `bankName` · `bankCode` (NIBSS) · `accountNumber` · `accountName` · `bvn`

> **Backend gaps:** today `IdentityDocumentsDto.pensionId` is a single field. Split it into PFA code, PFA name and RSA PIN. `BankDetailsDto` has a UK `sortCode` but no NIBSS bank code or BVN.

### 4.4 StatutoryRateSet (effective-dated data, never hardcoded)
`effectiveFrom` · `payeBands[{width, rate}]` · rent relief rate and cap · minimum wage · pension rates and base codes · NHF, NHIA, NSITF and ITF rates · Group Life multiple · loss-of-office threshold · WHT rate · `legalBasis`

The set is chosen by the **pay period's date**, never today's date, so re-running March uses March's rules.

### 4.5 PayrollSettings (per tenant)
- Calculation: tax method, proration basis, pay day, input cut-off day
- Toggles: NHIA, ITF applicability, loans via payroll, expenses via payroll
- Validation: variance threshold %, basic-salary sanity range
- Default salary split
- **Employment-type rules** (`ET-xx → {regime: paye|wht|exempt, pension, nhf}`)
- Payslip display options and insights
- Enabled element groups

### 4.6 PayrollRun
`type` (regular | off_cycle | adjustment) · `period{year, month, start, end, payDate}` · `status` (draft → in_review → approved → finalized → disbursed) · `employees[{employeeId, included, mode: auto|manual, manualLines?, manualStatutory?, computation, attendance}]` · `inputs[]` · `exceptions[]` · `totals` · `preparedBy` · `approvedBy` · `finalizedBy` · `parentRunId?` (adjustments)

### 4.7 PayslipLine (the normalisation point)
`code` · `name` · `category` · `group` · `amount` · `source` (auto | manual | attendance | loan | expense | adjustment) · `statutory` · `taxable` · `units?` · `rate?` · `note?` · `refId?`

The payslip generator renders these lines and nothing else. `source` is kept for audit only.

### 4.8 Payslip (immutable)
`reference` (PSL-YYYY-MM-NNNN) · `period` · `status` (draft | final) · company and employee **snapshots** (so a later address or grade change doesn't alter an issued payslip) · `computation` (lines, totals, tax breakdown, YTD) · `attendance` · `leave` · `insights[]` (generated once and stored) · `verification{code, hash, revoked}` · `approvedBy` · `generatedAt` · `display`

---

## 5. Input pathways

### 5.1 Auto
For each eligible employee, the engine reads:
- the salary structure in force at the period end
- period inputs gathered from the other modules:
  - **Loans:** each active loan's due instalment (amount ≤ outstanding), with the line reading "instalment 3 of 6 · ₦X left after"
  - **Expenses:** approved claims dated in the period, paid as a non-taxable reimbursement
  - **Attendance:** approved overtime hours and unpaid days
  - **Employee record:** recurring voluntary deductions (union dues, cooperative, pension AVC) and one-off payments or deductions in the period

  Records that duplicate statutory items, or that look implausible (a voluntary deduction above 10% of pay), are ignored.

### 5.2 Manual upload (`/time-payroll/payroll/[runId]/upload`)
1. **Templates:** a *wide* layout (one row per employee, a column per element code) or a *long* one (employee, element code, amount).
2. **Any spreadsheet:** CSV or XLSX, with **column mapping** (auto-guessed from headers and editable), so clients aren't forced onto MOTEE's template.
3. **Staging preview with per-row errors:**
   - unknown or departed employee
   - unknown element
   - non-numeric amount
   - element listed twice
   - duplicate employee rows
   - no earnings

   **Nothing is saved until confirmed.**
4. **Statutory option:** recalculate PAYE, pension and NHF from the uploaded pay (recommended), or take the uploaded statutory figures as given.
5. **Same checks:** uploaded employees go through the same validation as auto ones.

### 5.3 Mixed runs
Each employee in a draft run has an Auto/Manual selector. Switching to Manual copies their current earnings and deductions as editable lines.

---

## 6. Pipeline

`Draft → Awaiting approval → Approved → Finalized (locked, payslips issued) → Paid`

### 6.1 Validation (deterministic, `src/lib/payroll/validation.ts`)
**Errors** block submission until fixed, or until acknowledged with a written reason (kept on the run and shown to approvers):
- duplicate bank account across employees (bank code + number)
- invalid account number: NUBAN check digit (CBN algorithm) for 3-digit bank codes
- missing NIBSS bank code
- **bank details changed since the employee's last pay**: confirm with the employee before paying
- leaver in the run (someone who left *before* the period; a final pay inside the period is fine)
- negative or zero net pay
- missing bank account
- missing TIN when PAYE is deducted

**Warnings** are flagged for review only:
- missing TIN (no PAYE), pension deducted without an RSA PIN
- basic salary outside the configured range (regular runs)
- net pay variance above the threshold (regular-to-regular only)
- deductions over two-thirds of gross (Labour Act)
- manual figures with no PAYE line
- rent declared but evidence unverified
- a voluntary deduction on the employee record held back for review (over 10% of pay)

An acknowledgement is tied to the figure it was given for: if the amount changes, the exception has to be acknowledged again.

### 6.2 Approval and segregation of duties
- A `payroll_run` approval category is registered in the existing engine (`lib/types/approvals.ts`, `lib/approvals/config.ts`, `lib/permissions/approval-seeds.ts`).
  - Default chain: **Finance — "Review register, variances & exceptions"**, then **Executive — "Authorise payment release"**.
  - Reviewers sign.
  - The chain is editable in Submissions & Approvals like any other.
- **Segregation of duties is enforced in the approvals reducer**, not only in the UI: each request carries `excludedApproverIds` (the preparer and the submitter), and approve / reject / return actions from those people are ignored.
- Submit waits for the approval request to be created and stores its id on the run. A chain with no reviewers approves straight away; a missing chain is reported, never left half-submitted.
- The listener moves a run only for **its current request**, so an old rejected request can't move a resubmitted run. Re-raising withdraws any open request first. Payroll requests can't be resubmitted from the hub; they're re-raised from the run after recalculation.
- **Months close in order:** a run can't be submitted or finalized while an earlier month is still open.
- **Stale runs:** finalizing a run, or changing settings, a tax profile or a rate set, marks later unlocked runs as needing recalculation; runs in review or approved go back to draft and their approval is withdrawn.
- **Finalize is a separate, explicit action.** It never happens automatically.

### 6.3 Finalize
- Locks the run. The store refuses any later change to its figures. Bank and statutory IDs were frozen on the run at calculation (`RunEmployee.snapshot`), so the bank file pays what was approved.
- Issues the payslips, naming every approver in the chain, and **notifies each employee**.
- Posts each loan deduction as a repayment on the loan record, and marks expense claims paid through payroll as **reimbursed** in the Expenses module.
- Corrections afterwards go through an **Adjustment run** linked to the original and paid in the next open month.
- **Salary changes** go through the salary change approval chain; a back-dated change pays **arrears automatically** in the next draft run (once per change).

### 6.4 Pay
1. Download the NIBSS file from Exports.
2. Process it with the bank.
3. Mark the run as paid.

---

## 7. The payslip

Design for sign-off: `docs/design/payslip-mockup.html`.
App component: `src/components/shared/payslip/payslip-document.tsx`.

One A4 page that prints in greyscale-safe colours, in the tenant's brand colour, and stacks on a phone. Sections from top to bottom:

1. **Header:** legal name, address, RC number, company TIN; period, pay date, reference.
2. **Net pay first:** the figure, the amount in words, the masked account it was paid to, and a bar showing take-home / tax / pension / other as shares of gross.
3. **Employee:** ID, title, department, grade, employment type, date joined, length of service, TIN, RSA PIN, PFA, tax state.
4. **Attendance:** working days, days worked, paid and unpaid leave, overtime hours.
5. **Earnings and deductions side by side:**
   - Earnings grouped as in the Pay Element Master.
   - Deductions split into Statutory (PAYE, pension, voluntary pension, NHF) and Other.
   - Every statutory line shows its base ("8% of ₦255,000 pensionable pay").
   - Loan lines show the instalment number and the balance left.
6. **How your tax was calculated:** taxable pay to date → each relief to date → chargeable income to date → the bands scaled to the month → tax due to date − already paid = this month. It reconciles exactly, bonus months included. This is the section that cuts down "why is my tax this?" questions.
7. **Year to date:** gross, PAYE, net, pension (employee and employer), NHF.
8. **Paid by your employer** (tenant toggle): pension, NSITF, ITF, labelled as *not deducted from your pay*.
9. **Annual leave balance.**
10. **Your pay at a glance:** deterministic insights, generated once and stored. They cover the net-change explainer, the share of gross kept, tax-year progress, pension growth and (optionally) a leave reminder. Nothing predictive, no advice. Each one can be switched on or off per tenant.
11. **Footer:**
    - QR code and verification code
    - Approved by, generated time, the statutory basis and remitting state
    - "Private and confidential", "computer-generated, valid without a signature"
    - the content fingerprint
12. **DRAFT watermark** ("NOT A VALID PAYSLIP") on previews before Finalize, and no verification code on drafts.
13. **Also shown:** pay frequency and payment method in the net-pay line; Group Life cover (3× annual pay) under employer contributions.

### 7.1 Verification
- **Hash:** `hash = SHA-256(canonical JSON of {reference, tenant, employee, run, runType, period, [code, category, amount] lines, gross, deductions, net, YTD gross/PAYE/net, paid-to bank and masked account})`.
- **Code:** 12 unambiguous base-32 characters derived from the hash (`XXXX-XXXX-XXXX`).
- **Public page:** `/verify/payslip/[code]` needs no login. It shows only a shortened name, the period, net pay, the issuer and the reference.
  - It re-hashes the stored figures, so an altered record fails.
  - A revoked code reports the payslip as withdrawn.
  - **Backend:** rate-limit this endpoint and log lookups.

---

## 8. Screens (built, demo branch)

| Route | Who | What |
|---|---|---|
| `/time-payroll/payroll` | Payroll/HR admin, Finance, Executive, Auditor | KPIs, the run in progress with its pipeline, cost trend, runs table, statutory remittances, activity log, approval chain tab |
| `/time-payroll/payroll/[runId]` | Same | Run workspace with tabs for Employees (Auto/Manual, include toggle), Exceptions (acknowledge with reason), Variance, Inputs (add/remove), Summary. Actions: Recalculate, Upload, Submit, Finalize, Mark paid, Adjustment run, Exports, All payslips, Delete draft (all confirmed). Off-cycle runs add: Add employees (incl. recent leavers), Pay date, **Final settlement** (accrued leave, notice pay, gratuity, loan recovery). |
| `/time-payroll/payroll/[runId]/employees/[employeeId]` | Same | One employee in a draft run: structure, inputs, tax profile, live payslip preview |
| `/time-payroll/payroll/[runId]/upload` | Payroll admin | Manual upload (§5.2) |
| `/time-payroll/payroll/[runId]/breakdown?view=gross\|deductions\|net\|paye\|pension\|third-party` | Payroll staff | Drill-down behind the stat cards. **Net pay** shows each employee's name, ID, bank, account number, account name and net pay, grouped by bank. **Pension** shows PFA, RSA PIN, employee, employer and AVC. **Third-party** shows cooperative, union, loan and court-order deductions by payee. Search, group toggle and XLSX/CSV download are available |
| `/time-payroll/payroll/compare?current=&previous=` | Payroll staff, Finance | Month-on-month comparison: the totals and each earning element side by side with variance and %. A gross-pay **bridge** explains the movement by reason (joiners, leavers, salary changes, part months, overtime, unpaid leave, one-off payments, expenses), and a per-employee table shows the reason chips. Every naira of the change is assigned to exactly one reason. Downloadable |
| `/time-payroll/payroll/remittances/[YYYY-MM]/statement?item=&doc=statement\|receipt` | Payroll staff | Printable remittance **statement** (amount due, payee, due date, summary by payee, per-employee schedule) and, once the payment is recorded, the **remittance receipt** (reference, date, recorded by). Print / Save as PDF |
| `/time-payroll/payroll/settings` | Payroll/HR admin (edit), Auditor (read) | General, Pay Elements, Salary Structures (versioned), Tax & Statutory Profiles, Statutory Rates, Payslip options |
| `/organization/employees/[id]/payslips/[payslipId]` | Payroll staff, or the employee | Payslip page: Print / Save as PDF, copy verification link, revoke verification |
| `/employee/payslips` | Every employee | My Payslips: YTD strip, tax-year filter, list with month-on-month change, pre-payday draft preview |
| `/employee/payslips/[id]`, `/employee/payslips/preview/[runId]` | The employee | Own payslip / DRAFT preview (opt-in setting; regular runs once submitted) |
| `/time-payroll/payroll/[runId]/payslips` | Payroll staff | Every payslip in a run on one page; prints one per A4 page |
| `/employee/tax-certificate/[year]`, `/organization/employees/[id]/tax-certificate/[year]` | The employee, payroll staff | Annual PAYE certificate: month by month, reliefs, totals; printable |
| `/verify`, `/verify/payslip/[code]` | Public | Verification (§7.1) |

**Stat cards are clickable.** On the overview, the Gross pay, Deductions, Net pay and PAYE tiles open the matching breakdown, and Exceptions opens the run's Exceptions tab. In the run workspace, the Gross, Deductions, PAYE, Net and Pension cards open breakdowns, and Exceptions jumps to its tab. **HR dashboard → Payroll tab** (Nigeria tenants, payroll viewers only) shows the last paid month's gross, net, PAYE and employer cost against the month before, a 12-month cost trend, cost by department, the deduction mix, remittances due or overdue, and the month in progress.

The existing **Payslips** table on the employee profile is visually unchanged. For Nigerian tenants it now shows real payslips, and each row opens the payslip page. UK tenants see a "Nigeria first" notice on payroll screens.

---

## 9. Exports

Every schedule reads the bank and statutory IDs frozen on the run. Employer registrations (PenCom employer code, NSITF and ITF codes, debit account, State IRS payer IDs) are set in Payroll Settings.

- **Payroll register:** every employee with gross, taxable, PAYE, pension, NHF, other deductions, net and employer costs, with a totals row.
- **PAYE schedule:** grouped by State IRS with the employer's payer ID, month, TIN, reliefs, chargeable income, PAYE and YTD PAYE, and a **subtotal per state**.
- **Pension schedule (PenCom layout):** PFA and code, employer code, RSA PIN, surname / first name / other names, pensionable pay, employee, employer, voluntary and total. Missing RSA PINs are flagged, not dropped.
- **NHF schedule** and **NSITF schedule**, each with control totals.
- **NIBSS bulk payment file:** batch header (payer, debit account and bank code, value date), control count and total, detail rows, trailer. Only from a finalized run. Anyone left out (net ≤ 0, no account, no bank code) is listed when you download it.
- **Payroll journal by cost centre:** balanced debits (salaries, reimbursements, employer pension, NSITF, ITF) and credits (net pay, PAYE, pension, NHF, NSITF, ITF, loans, other deductions payable).
- **Form H1:** the annual PAYE return per employee, grouped by State IRS, from the year's final payslips.
- **Remittances tab:** every month with finalized pay, amounts summed across all its runs, due dates, overdue highlighting and **"Record payment"** (reference + date) for proof of remittance. Each line has **Download**: Statement (PDF), Schedule (XLSX) and Remittance receipt (after payment). Each month has **Download all**. Statements cover PAYE, pension, AVC, NHF, NSITF and ITF, and their totals match the tab.
- **Format:** XLSX (NIBSS as CSV, every field quoted so account numbers keep leading zeros). Every export is written to the activity log.

---

## 10. Permissions and data protection

| Module id | Roles (seed) |
|---|---|
| `time-payroll.payroll` | Super Admin, HR Admin, Payroll Admin, Finance, Executive, Auditor (view/export) |
| `time-payroll.payroll-settings` | Super Admin, HR Admin, Payroll Admin, Auditor (read) |

- **Line managers and read-only users get no payroll access.**
- **Payslips:** each one is visible only to its employee and to people with payroll access. The employee-profile Payslips tab shows a locked notice to anyone else, and no payroll data is loaded for them. The payslip page fails closed when no one is signed in.
- **Approvals:** payroll runs and salary changes in Submissions & Approvals are visible only to payroll staff, the submitter and the people on the chain, in the list and by direct link.
- **Storage (demo):** payroll is kept in the browser only, never sent to the shared unauthenticated runtime API, and BVNs are redacted before anything is stored. In production it lives behind the authenticated payroll API.
- **Masking:** bank accounts are masked on payslips (•••• 1234).
- **Audit:** every change (settings, structures, profiles, rate sets, runs, exports, verification revocations) goes to the payroll audit log.
- **Retention:** 6 years (tax records).
- **Emailed payslips (later):** send a link or a password-protected PDF, never the full figures in the email body.

---

## 11. Module integration points

| Module | Payroll reads | Payroll writes |
|---|---|---|
| Employees | Status, start/leave dates, employment type, grade, bank, identifiers | — |
| Employment Types | Pay frequency, payroll inclusion, statutory deductions | — |
| Loans | Active loans, schedule, outstanding balance | Repayment on finalize (`/loans/{id}/repayments`, method `payroll`) |
| Expenses | Approved, unpaid claims (any date up to the period end) | Marked **reimbursed** on finalize, with a history note naming the run |
| Attendance | Approved overtime, unpaid days, deduction policy | — |
| Leave | Balance for the payslip, unpaid leave | — |
| Approvals | — | `payroll_run` request (with `excludedApproverIds`); salary changes on the `promotion_request` chain; reads the outcomes |

---

## 12. REST contract for the backend

Base `/api/v1/payroll`. All money is a decimal string with 2 dp. All dates are ISO.

| Method & path | Purpose |
|---|---|
| `GET /elements` · `POST /elements` · `PATCH /elements/{code}` | Pay Element Master (statutory codes read-only) |
| `GET /settings` · `PATCH /settings` | Tenant payroll settings |
| `GET /rate-sets` · `POST /rate-sets` | Effective-dated statutory rate sets |
| `GET /employees/{id}/structures` · `POST /employees/{id}/structures` | Versioned salary structures (POST closes the current version) |
| `GET /employees/{id}/tax-profile` · `PATCH …` · `POST …/rent-evidence` | Tax and statutory profile, evidence upload |
| `GET /runs?year=` · `POST /runs {type, year, month, parentRunId?}` | List / create (creating gathers inputs and calculates) |
| `GET /runs/{id}` · `DELETE /runs/{id}` (draft only) | Run detail including employees, inputs, exceptions, totals |
| `POST /runs/{id}/recalculate` | Re-gather module inputs (manual inputs kept) and recalculate |
| `PATCH /runs/{id}/employees/{employeeId} {included?, mode?, manualLines?, manualStatutory?}` | Mixed mode and inclusion |
| `POST /runs/{id}/inputs` · `DELETE /runs/{id}/inputs/{inputId}` | One-period inputs |
| `POST /runs/{id}/uploads` (multipart) → staging result · `POST /runs/{id}/uploads/{stagingId}/commit {statutory}` | Manual upload with server-side staging |
| `POST /runs/{id}/exceptions/{exceptionId}/acknowledge {reason}` | Logged acknowledgement |
| `POST /runs/{id}/submit` | Creates the `payroll_run` approval instance; **422 if blocking errors remain** |
| `POST /runs/{id}/finalize` | **409 unless approved.** Locks the run, issues payslips, posts loan repayments, idempotent. |
| `POST /runs/{id}/disburse` | Mark paid |
| `POST /runs/{id}/employees` `{employeeIds}` · `PATCH /runs/{id} {payDate}` | Off-cycle: add people (incl. recent leavers), set pay date |
| `POST /employees/{id}/salary-changes` | Proposes a structure version; approved through the salary change chain; back pay computed server-side |
| `GET /remittances?year=` · `POST /remittances {month, item, reference, date}` | Remittance tracking |
| `GET /annual/{year}/form-h1` · `GET /employees/{id}/tax-certificate/{year}` | Annual return and employee certificate |
| `GET /runs/{id}/exports/{register\|paye\|pension\|nhf\|nsitf\|nibss\|journal}?format=xlsx\|csv` | Files (NIBSS only from a finalized run) |
| `GET /payslips?employeeId=&year=` · `GET /payslips/{id}` · `GET /payslips/{id}/pdf` | Payslips. `/me` variants for self-service. PDF rendered server-side. |
| `GET /runs/{id}/preview/{employeeId}` | Draft payslip preview (watermarked) |
| `POST /payslips/{id}/verification/revoke` · `…/restore` | Revocation |
| `GET /public/payslip-verification/{code}` (no auth, rate-limited) | `{status: genuine\|revoked\|not_found, name, period, net, issuer, reference}` |

Server rules:
- The approval engine must enforce segregation of duties (neither the preparer nor the submitter can decide on any step).
- Submit and finalize must refuse a run while an earlier month is open, and any run marked stale.
- Bank and statutory IDs are snapshotted on the run at calculation and frozen from approval.
- A finalized run is immutable at the database level.
- The engine is the backend's. The frontend engine is the **reference implementation** and the source of the golden tests.

---

## 13. Verification

**Automated tests:** `npx vitest run src/lib/payroll` runs 50 tests.

`engine.test.ts`: the worked example to the kobo; cumulative steady-pay and bonus cases; minimum-wage earner; rent relief cap and unverified evidence; top-band earner; joiner and leaver proration; loans after tax; unpaid leave reducing gross, tax, pension and NSITF; negative net pay; overtime; WHT for freelancers; manual "as uploaded" mode; amount in words; SHA-256 vectors. **Audit additions:** a same-month off-cycle bonus then December; issue order can't change YTD; an as-uploaded month then an auto month; joiner annual liability; PAYE refunds (and the setting); late rent verification catch-up; a late-month high earner not exempted; loss-of-office once; off-cycle overtime rate.

`run-builder.test.ts` (the full seeded Nigeria tenant): runs reconcile; YTD carries forward; loans deducted; hashes verify and tampering fails; recalculation idempotent. **Audit additions:** NUBAN check digits; no demo pay in real runs; unique payslip references; leaver final pay not flagged; bank-change detection; acknowledgements reset when figures change; back pay paid once; balanced journal; NIBSS control total; PAYE state subtotals; Form H1.

**End to end** (run in a browser on the demo branch):
1. Create the November run and calculate it.
2. HR Admin submits. HR Admin has no Approve button on their own run.
3. Finance approves and signs. Executive authorises and signs.
4. HR finalizes, which issues the payslips and posts the loan instalments.
5. The payslip prints on one A4 page.
6. Its QR code verifies on `/verify/payslip/[code]`.
7. "All payslips" shows every payslip in the run (18), one per printed page.

**Demo note:** this branch keeps approval requests in memory, so a full page reload drops pending requests. A run left awaiting approval shows **"Raise the approval again"**. With the live API this can't happen.

---

## 14. Decisions still needed from Devaycon

1. **Tax method.** Cumulative (recommended, default) or annualised. Confirm with a tax adviser.
2. **Default salary split** for employees migrated without a structure. The demo uses basic 50% / housing 25% / transport 10% / utility, meal and communication 5% each. Clients should confirm theirs, because the split drives pension and NHF.
3. **Employer contributions on the payslip.** Shown by default. Some clients prefer to hide them.
4. **NHIA vs private HMO.** Off by default.
5. **Approval chain.** Finance then Executive. Confirm, or name a dedicated payroll approver.
6. **WHT rate** for self-employed staff, and whether contractors are paid through payroll at all.
7. **Bank partner** for a future direct integration (V1 is the NIBSS file).

---

## 15. Later (parked, unchanged from v1)

Payroll Guardian (predictive risk), Statutory Remittance Tracker (proof of payment per remittance), Payroll Leakage Map, Payroll Investigator (AI Q&A), and the "Payroll Intelligence" bundle. All need several months of real, finalized payroll history first. UK payroll (PAYE codes, NI, auto-enrolment pension) is a second statutory module. The starter-tax logic in `lib/payroll/derive-starter-tax.ts` already exists for it.

---

## 15a. Voluntary pension contributions (AVC)

Set per employee in Settings → Tax & Statutory Profiles as a fixed ₦ amount a month or a % of pensionable pay, with an optional start and end date (`EmployeeTaxProfile.avc`).
- The engine adds the `VOL_PENSION` deduction on regular runs.
- It is relieved from PAYE.
- It is remitted to the PFA as its own line, alongside the mandatory 8%/10%.
- An AVC entered as a run input or upload replaces the profile amount for that month.
- An AVC on the HR record (a "Pension AVC" recurring deduction) is ignored once the payroll profile sets one, so it is never deducted twice.

---

## Sources

- Nigeria Tax Act 2025 (as summarised by PaySpace, *Nigeria Tax Reform 2026*, and BusinessDay, *Step-by-step calculation…*)
- Pension Reform Act 2014; National Housing Fund Act; National Health Insurance Authority Act 2022; Employee's Compensation Act 2010; Industrial Training Fund (Amendment) Act 2011; Nigeria Data Protection Act 2023
- Confirm all rates against Nigeria Revenue Service and State IRS guidance before go-live.

---

## 16. Audit and hardening (November 2026)

A full cross-check of the first build (two independent code reviews plus a browser run) found and fixed:

| Area | Problem | Fix |
|---|---|---|
| Tax engine | YTD came from whichever payslip was generated last; off-cycle and adjustment runs dropped the month's regular pay from YTD | YTD is the sum of each final payslip's own period figures |
| Tax engine | Every run counted as a tax month (an off-cycle run made December "month 13"); reliefs were repeated on off-cycle runs | Calendar-month band scaling; cumulative reliefs; off-cycle runs add no tax month |
| Tax engine | Manual "as uploaded" months added nothing to taxable income to date | Chargeable income derived from the uploaded figures; employer costs always computed |
| Tax engine | Minimum-wage exemption tested on prorated pay; no refunds; unpaid leave inflated gross | Full-month test; refunds (setting); unpaid leave is a negative earning |
| Data | Illustrative demo overtime/bonuses were added to runs people created | Demo pay only in seeded history |
| Data | Duplicate payslip references across runs in a month; run ids not tenant-scoped | Run sequence in references; tenant-prefixed ids |
| Data | Expenses read from the wrong source and never marked reimbursed | Read from the Expenses module; marked reimbursed on finalize |
| Data | Bank details read live — an edit after approval changed who got paid | Snapshot on the run; "bank changed since last pay" error |
| Workflow | Months could be finalized out of order; runs went stale silently | Months close in order; stale runs must be recalculated |
| Workflow | Approval request id not stored; old requests could move a resubmitted run; empty chains stuck runs | Real request id; current-request matching; immediate approval for empty chains |
| Workflow | Segregation of duties enforced only in the UI | Enforced in the approvals reducer (preparer and submitter) |
| Confidentiality | Line managers could see real pay on employee profiles; payroll sent over an unauthenticated API; payroll approvals visible to all | Ownership/permission gating; browser-only storage with BVN redacted; confidential approvals |
| UI | Stale closures lost edits; settings inputs didn't refresh; uploads failed silently | Actions read the latest state; controlled inputs; reported parse errors |
| Missing | Off-cycle usability, final settlement, salary-change approval, back pay, cut-off, bulk payslips, tax certificate, Form H1, journal, NSITF, remittance tracking, employee notifications | All built (see §6, §8, §9) |
