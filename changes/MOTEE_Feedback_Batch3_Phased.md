# MOTEE / MSL — Batch 3 Feedback, Grouped Into Phases

Source: `MOTEE_Client_Feedback_Batch3.txt` (10 documents, 12 module sections).
Item numbers below (e.g. §2.4, §6.13) map directly to that file — open it
side-by-side for full detail. This groups the SAME items by build phase
instead of by module.

Round 1 and Round 2 feedback already have their own phase tables from
earlier — this covers Batch 3 only.

---

## P0 — Decisions Needed Before Scoping

Not build work. Answer these first; they change how much of the phases
below actually gets built.

- **Kebab-menu reconciliation** (§3, §13) — your earlier dictated dropdown
  spec and this batch's screenshot are the same menu at different points
  in time. Confirm §3.1's order is the target before anyone builds it.
- **Dashboard IA restructure** (§4) — this touches nearly every nav item
  in the system. Needs explicit sign-off as a whole before any individual
  rename inside it is actioned, since moving one item implies moving
  others.
- **Project Module** (§10) — confirm whether this is a real net-new
  module or already planned elsewhere. No screenshot evidence it exists;
  everything else in this batch does.
- **Company logo on exports** (§12.1) — client raised this as a question,
  not a firm request. Confirm intent.
- **Cost Centre data model** (§7.3–7.4) — decide the master-data shape
  before building anything in Workforce Requests that references it;
  several P3 items below depend on it.
- **Diversity & Inclusion fields** (§6.23) — ethnicity/disability/veteran
  status need a compliance/jurisdiction decision before schema work
  starts, not after.

---

## P1 — Copy, Labels & Renames

Zero schema risk, no logic change. Fastest wins.

**Access Levels & Permissions**
- §1.14 Add suggested roles as simple config rows (no logic yet)

**Onboarding**
- §2.21 Tagline copy change

**Employee Kebab Menu**
- §3.1 Rename "Send Login Credentials" → "Send/Resend Login Credentials"
- §3.2 Rename "Exit Employee" → "Start Offboarding"

**Headcount Planning**
- §6.2 "Total Headcount" card copy/format clarification
- §6.5 Rename "Departments On Target" → "Departments at Target"

**Recruitment**
- Rename "Filter Constraints" → "Applicant Filters" (§7.13, naming part only)

**Expenses**
- §8.1 Currency formatting (decimals / compact form)
- §9.2 Title field placeholder examples
- §9.5 Date format fix (05/08/2026 → 05 Aug 2026)
- §9.8 Notes field placeholder copy

**Nav**
- Rename "Asset Tracking" → "Asset Management" (§4.10)
- Rename "Access Levels" → "Roles & Permissions" (§4.13, §13)

---

## P2 — UI Enhancements to Existing Screens

No schema changes — component work, formatting, and reusable patterns
on screens that already exist.

**Cross-cutting pattern (build once, reuse everywhere):**
- Clickable KPI cards → drill-down: Onboarding (§2.20), Headcount
  Planning all sub-tabs (§6.1, §6.17, §6.25), Workforce Requests (§7.1)

**Access Levels & Permissions**
- §1.2 Group permission matrix by module
- §1.12 Matrix search

**Onboarding**
- §2.4 Progress indicator with step names
- §2.5 Inline pre-submission validation
- §2.7 Digital declaration checkbox
- §2.11 Accessibility pass

**Employee Kebab Menu**
- §3.2 Visually distinguish Deactivate vs. Start Offboarding (icons/copy)

**Headcount Planning**
- §6.7 Colour-coded status badges
- §6.14, §6.34 Filters (Attrition Risk, Gap Report)
- §6.16 Clickable employee names
- §6.26 Demographics layout reorg into 4 sections

**Expenses (list view)**
- §8.3 Category icons
- §8.4 Approval progress tracker (visual)
- §8.7 "Needs Your Action" card

**Expenses (claim form)**
- §9.1 Required-field markers
- §9.3 Amount field (currency inside field, thousands separator)
- §9.6 Searchable category dropdown + icons
- §9.9 Receipt upload UI (thumbnails, drag-drop, paste, progress)
- §9.11 Inline validation messages
- §9.12 Submit button disabled/loading states
- §9.13 Accessibility pass
- §9.14 Mobile layout
- §9.16 Field reordering
- §9.17 Submission notification redesign

---

## P3 — Data Model & Field Additions

Schema work. Do this before the P4/P6 items that depend on these fields.

**Access Levels & Permissions**
- §1.3 Permission levels (View/Create/Edit/Approve/Delete/Export/Administer)
- §1.4 Data access restrictions by org hierarchy
- §1.6 Role assignment audit trail
- §1.7 Role status (Active/Inactive/Draft)
- §1.8 Role usage tracking (Last Used/Modified/Created By)

**Onboarding**
- §2.1 Invitation status tracking
- §2.6 Document upload fields (Passport, Driving Licence, RTW, Visa, Proof of Address)
- §2.16 Bank Details field separation (Account Holder / Sort Code / Account Number)
- §2.17 Identity Documents field separation
- §2.19 Onboarding Method field (Self/Manual/Bulk) — cross-ref §13, already logged once

**Employee Relations Cases**
- §5.1 Expand case type enum
- §5.3 Due dates/SLA fields
- §5.6 Standard outcomes enum
- §5.8 Confidentiality levels

**Headcount Planning**
- §6.3 Cost metric fields (Budget, Payroll Cost, Variance, Recruitment Budget)
- §6.6 Expand department table columns
- §6.11 Risk factor breakdown fields
- §6.12 Risk Score field
- §6.15 Trend fields (last promotion/review/rating/engagement)
- §6.23 Demographic fields (age, gender, job grade, employment status, FTE, location) — pending P0 D&I decision
- §6.29–6.31 Gap Report pipeline/vacancy-status/cost fields

**Workforce Requests**
- §7.2 Position/Grade/Employment Type fields
- §7.3–7.4 Cost Centre master data table (blocks other Workforce Request work — see P0)
- §7.5 Vacancy Type field
- §7.9 Hiring Team fields (Hiring Manager, Recruiter, HRBP, Panel)
- §7.10 Salary Band/Range field

**Workflow Engine**
- §11.9 Due date/SLA/priority fields per task
- §11.10 Task status enum

---

## P4 — Workflow & Process Logic

Multi-step flows, approval chains, conditional logic. Assumes P3 fields
already exist where referenced.

**Onboarding**
- §2.2 Automatic email reminders
- §2.3 Save & Resume
- §2.8 Employer approval stage (submit → review → approve/reject → amend → final)
- §2.9 Confirmation email
- §2.12 GDPR/Privacy Notice 4-step consent flow + audit trail
- §2.13 Extended conditional questions
- §2.18 P45 conditional upload logic

**Access Levels & Permissions**
- §1.1 Clone Role
- §1.9 Prevent deletion of system roles (lock + clone)
- §1.11 Permission dependencies (auto-grant related permissions)

**Employee Kebab Menu**
- §3.1 Build "Resend Onboarding Invitation" and "View Activity Log" (new items)

**Employee Relations Cases**
- §5.2 Configurable case workflow per type
- §5.7 Employee-record linking (previous cases, warnings, absence, reviews, training)
- §5.12 Stage-gating on the existing case-detail flow

**Headcount Planning**
- §6.4 "Open Vacancies" → link into Recruitment
- §6.9, §6.36 Integrate Headcount Plan / Gap Report with Workforce Requests
- §6.10 Flexible "Set Target" dimensions
- §6.13, §6.28 Recommended Action fields (Attrition Risk, Gap Report)

**Workforce Requests**
- §7.7 Approve / Reject / Return for Amendment
- §7.11 JD upload or template selection
- §7.15 Publish scheduling controls
- §7.17 Pre-publish validation warnings

**Expenses**
- §8.6, §9.10 Duplicate detection (list view + claim form)
- §9.4 Merchant autocomplete
- §9.7 Currency defaults (preferred/last-used/auto-detect)

**Workflow Engine (Preboarding/Onboarding/Offboarding)**
- §11.1 Formal offer-acceptance step
- §11.2 Reorder payroll/bank/tax collection
- §11.3 Separate Right-to-Work verification sub-steps
- §11.4 Hiring Manager tasks
- §11.5 Expand onboarding to 11 steps
- §11.7 Expand offboarding steps

---

## P5 — Reporting, Analytics & Notifications ✅ BUILT

Cross-cutting; needs the P3 data in place first.

- §1.10 wraps into P6 (see below) — noting it's often mistaken for reporting, it isn't
- ✅ §2.10 Employer notifications (onboarding started/submitted/missing docs/amended)
- ✅ §5.9 ER case notifications — incl. a once-only SLA breach warning
- ✅ §5.10 ER case reporting (by type, department, outcome, resolution time, overdue)
- ✅ §6.24 Headcount trend analysis (QoQ, YoY) — new Trends tab
- ✅ §8.5 Expense Insights summary — **deterministic, not model-generated** (see note)
- ✅ §11.12 Workflow engine notifications (assignee/reviewer/owner)

---

## P6 — Major New Builds / Big-Bet Features ✅ FULLY BUILT

Largest effort, most ambiguity, or genuinely new capability. Sequence
these last and re-confirm scope with the client before starting.

- ✅ §1.10 "Test as Role" preview/impersonation mode
- ✅ §1.13 Multi-role support + conflict resolution model
- ✅ §4 Dashboard/nav IA restructure — built to the §4.15–4.16 groups
- ✅ §6.8 Headcount planning scenarios (forecasting/what-if)
- ✅ §6.23 Full Demographics expansion incl. D&I — per-jurisdiction, self-declared
- ✅ §7.13 Application Form Builder field types — **was already complete**; verified
  all 11 types round-trip through the editor and the applicant-facing renderer
- ✅ §7.18 Recruitment pipeline continuation (Applications → Screening → Offer →
  Employee Created) — the client's biggest flagged gap
- ✅ §8.8 Natural-language expense search
- ✅ §9.15 Expense nice-to-haves (mileage calc, save-as-draft, receipt extraction —
  **text, not image OCR**; see note)
- ✅ §10 Project Module — full project management (tasks, dependencies,
  milestones, Gantt, resourcing, timesheets)
- ✅ §11.6 Task dependencies (workflow engine)
- ✅ §11.8 Parallel task execution (workflow engine)
- ✅ §11.11 Conditional tasks (workflow engine)
- ✅ §11.13 Full workflow configuration model (owner/version/status/effective date/
  employment type)
- ✅ User Management module — Reset/Lock/Unlock/Restrict/Revoke access + audit (§4.14)

### Notes on what was actually delivered

**The "AI" items are deterministic (§8.5, §8.8).** The repo has no LLM
dependency and runs entirely on local demo data. Expense Insights is computed
from the claims themselves (top category, month-on-month movement, outliers,
duplicates, stale reimbursements) and is labelled "Expense Insights", not "AI
Insights" — the UI does not claim a model generated it. Natural-language search
is a small query grammar; every term it understands is shown as a removable
chip so a misparse is visible rather than silently returning nothing.

**Receipt extraction is not image OCR (§9.15).** Reading a photographed receipt
needs a vision service this project doesn't have. What shipped parses receipt
*text* (pasted from an email or PDF) via `extractFromText()`, which is
structured as a seam a real OCR provider can feed later. The UI says so
explicitly. **This is worth confirming with the client** — if they expected to
photograph a receipt, that needs a service decision.

**§11.6/8/11/13 were types without a UI.** The workflow types, labels and
helpers already existed and the workflow list already rendered them, but
`workflow-builder.tsx` could not *set* any of them — `handleSave` dropped every
field. Fixing that was the bulk of the work. Dependencies are stored as
positions rather than task ids, because the slice re-mints task ids on every
save and an id-based `dependsOn` would dangle on the first edit.

**"Employee created" already existed (§7.18).** Completing an onboarding
workflow already cleared the hire into the Employees module. What was missing
was the Offer stage before it and any signal that the handover happened; both
were added rather than rebuilding the existing path.

**A new audit write path.** The Audit Trail page could only show fixture
history — actions taken in the app left no trace. User Management actions
needed a record, so live entries now merge into that page.

---

### The three previously-parked items — built, with assumptions stated

These were built without the source `MOTEE_Client_Feedback_Batch3.txt`, which
is not in the repo. **Each carries an assumption the client should confirm.**

**§4 — Nav restructure.** Built to the §4.15–4.16 groups. `Talent`,
`Time & Payroll` and `Operations` are gone; `Employee Services`,
`Health & Wellbeing`, `Knowledge & Resources` and `Insights` replace them.
All 42 existing routes are still reachable — nothing was dropped, only
regrouped. **Assumption:** the exact membership of each group is my reading of
the group names; the client may want individual items moved.

**§6.23 — D&I.** Two halves, and only one needed building:
- *Age, gender, job grade, work location* already existed on the employee
  record. The Demographics card reading "Not yet captured" was simply out of
  date. Now shown.
- *Ethnicity / disability / religion / veteran status* are new, and built to a
  deliberate standard: **self-declared only** (there is no HR-facing setter
  anywhere in the module), always optional with "Prefer not to say", withdrawable
  at any time, and reported **aggregate-only with groups under 5 suppressed**.
  UK uses ONS/Equality Act categories; Nigeria uses a narrower set and is **not**
  asked for ethnicity-by-tribe or sexual orientation — neither is safe or lawful
  for an employer to hold there.
  **Confirm with the client:** which characteristics they actually want to
  monitor, and that a privacy notice covering this exists.

**§10 — Project Module.** Built as full project management per instruction:
projects, tasks with dependencies, milestones, a Gantt with critical-path and
schedule-conflict detection, resourcing with cross-project over-allocation
warnings, and timesheets with an approval step. Projects charge to the §7.3
cost centres rather than owning a parallel set of codes.
**Flagged once and worth repeating:** this overlaps the existing Workflows
module — both now schedule dependent, assignable work. The dependency logic is
shared rather than duplicated, but if the client only wanted "who is working on
what", a good deal of this is more than they asked for. **No spec existed for
this module at all**; the scope above is an assumption.

---

## Notes Carried Over From the Source File

- The kebab-menu overlap (§3) and Onboarding Method field (§2.19) were
  already logged once from your own dictation earlier in this project —
  don't double-build.
- The Workspace/Knowledge & Resources/Health & Wellbeing/Employee
  Services grouping (§4.15–4.16) feeds into the Self-Service/Admin split
  you already spec'd separately — treat §4 as input to that work, not a
  second initiative.
