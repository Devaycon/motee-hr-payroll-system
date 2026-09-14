# MOTEE / MSL — Project Module Feedback

Source: `Project_Recommendation.odt` — client feedback on the Projects
widget/screen, using a real example project ("HRIS Platform Rollout") as
the walkthrough.

---

## ⚠️ Cross-reference before doing anything else

**This resolves an open question from the last feedback batch.**
`Batch 3 §10` flagged "The Project Module" as `[NEW / CONCEPTUAL]` —
no screenshot evidence it existed, and it was logged as a `P0` item to
confirm with you before scoping. **This document proves it already
exists and is populated with a real project** (screenshot below,
confirmed). Update Batch 3's status on that item — it's a `[CONFIRMED
EXISTING - MODIFY]`, not a new build.

**However — likely two different features sharing one name.** Batch 3's
`The_Project_Module_in_Motee_Solutions.docx` described a Workday-style
concept: workers logging billable time against customer/departmental
projects for cost/payroll/billing integration. **This** document is
about something else — internal HR project management, i.e. tracking
the rollout of HRIS itself (vendor selection, data migration, milestones,
go-live). Both got called "Project(s)." Confirm with the client whether:
  (a) these are meant to be the same module and the time-tracking/billing
      concept was just an early description of what became this screen, or
  (b) these are two genuinely separate features that happen to share a
      name, in which case they need distinct naming before both get built.
Don't assume either answer — this is worth a direct question to the
client, not a guess.

**One data discrepancy to check while you're in there:** the client's
written text says "Spend: ₦1,112 of ₦480k" (Naira), but the actual
screenshot embedded in the same document shows "£1,112 ... of £480k"
(GBP). Given MOTEE is multi-tenant across UK and Nigeria, this might be
correct (this particular demo project may sit on the UK tenant) — or it
might be a genuine currency-handling bug. Worth a quick check before
treating either symbol as the target.

---

## Confirmed Existing — Current Project Page

Screenshot confirms the following is live today:

```
HRIS Platform Rollout   [Active]  [HRIS-2026]
Replace the legacy HR system across all entities, including data
migration and staff training.
2026-01-12 → 2026-09-30 · Owned by Amara Okafor · Internal — People Operations

[Progress: 49%, 2 of 6 tasks done]  [Team: 3, 2.1 FTE committed]
[Hours Logged: 15.5, Approved time only]  [Spend: £1,112, 0% of £480k]

Tabs: Timeline | Tasks (6) | Milestones (3) | Team (3) | Timesheets

Legend: Task (blue) · Critical path (pink) · Blocked (grey) · Milestone (orange)
```

Tasks (6): Requirements & discovery, Vendor selection, Data migration
mapping, Payroll integration, User acceptance testing, Training & go-live.

Milestones (3): Vendor contract signed, Build complete, Go-live.

---

## 1. Project Health Indicator (new)

Add a top-level health rollup, separate from the existing % progress:

```
Project Health: 🟠 At Risk

Area          Status
Overall       🟠 At Risk
Schedule      🟠 At Risk
Budget        🟢 On Track
Resources     🟢 On Track
Critical Path 🔴 Blocked
Scope         🟢 On Track
```

Each area gets its own status, not just one overall number.

---

## 2. Critical Path — keep, but change how it's calculated

**Current behaviour (per client):** critical path appears to be
manually labelled per task (a task gets flagged "critical" by a person).

**Requested change:** the system should **automatically calculate** the
critical path from task dependencies and durations, not rely on manual
tagging. Client's framing: "that will make the feature much more
meaningful and reliable" — this is a correction to existing logic, not
just a display change.

---

## 3. Surface Critical Path much more prominently

Currently critical path is stated as plain text lower on the page:
*"Critical path runs through 5 tasks — a day lost on any of them is a
day lost to the project."*

**Move this to immediately under the project summary header**, and turn
it into an actionable alert block:

```
⚠ Critical Path Alert
5 tasks are currently on the critical path.

Current blocker: Vendor selection / contract dependency
Potential impact: Go-live date
Action required: Daniel Reyes
Due: [date]
```

---

## 4. Explain how the 49% progress figure is calculated

**Current issue:** page shows "49%, 2 of 6 tasks done." 2/6 is 33% by
raw task count, not 49% — so the discrepancy is confusing even if the
underlying weighting is legitimate (tasks may carry different weights).

**Requested fix — show the breakdown, not just the headline number:**

```
Overall Progress: 49%
- Tasks completed: 2/6 (33%)
- Weighted task progress: 49%
- Milestones completed: 0/3
- Critical-path progress: 35%
```

---

## 5. Add a "Risks & Issues" section (new)

Called out as **"probably the biggest missing project-management
feature."**

```
Risks & Issues
Type   Issue/Risk              Owner          Impact   Due    Status
Issue  Vendor selection blocked Daniel Reyes  High     Date   Open
Risk   Data migration delay     Priya Nair    High     Date   Monitoring
Risk   Training readiness       Amara Okafor  Medium   Date   Open
```

- Each row should be clickable → opens issue/risk detail.
- Client's stated rationale: HRIS implementations touch employee data,
  payroll, access permissions, documents, and sensitive HR information —
  so risk tracking matters more here than on a generic project.

---

## 6. Add a "Next Actions" section (new)

The page currently shows what the project *contains*, not what the
viewer needs to *do*.

```
Next Actions

Today
- Complete vendor selection
- Review data migration mapping
- Confirm payroll integration requirements

This week
- Finalise UAT preparation
- Confirm training materials
- Review go-live readiness
```

Each action needs: **Owner | Due date | Priority | Status**.

---

## 7. Improve the task table

**Current display:** task name only (Requirements & discovery, Vendor
selection, Data migration mapping, Payroll integration, User acceptance
testing, Training & go-live) — no other columns visible.

**Requested columns:**
`Task | Owner | Start | Due | Status | % Complete | Dependency | Priority`

Example row:
```
Vendor selection
Daniel Reyes · Due 15 May · 🔴 Blocked · 60%
Dependency: Requirements & discovery
```

---

## 8. Add task-level status (separate from project-level status)

**Current gap:** the project itself is labelled "Active," but individual
tasks have no status field of their own.

**Requested status set:**
```
🟢 Completed
🔵 In Progress
⚪ Not Started
🟠 At Risk
🔴 Blocked
```
(Cancelled also mentioned in the body text as a status to support.)

**Colour-legend correction requested for the Timeline view specifically:**
Currently: Task (blue) · Critical Path (pink) · **Blocked (grey)** ·
Milestone (orange).
Client's recommendation: change **Blocked from grey → red**. Rationale:
grey conventionally reads as "inactive/neutral/not started," while red
reads as "needs attention" — Blocked should use red, and grey should be
reserved for **Not Started** instead. Gives a logical progression:
🟢 On Track → 🟠 At Risk → 🔴 Blocked, with Critical Path treated as a
separate task *characteristic* (a flag), not a status/health value.

---

## 9. Fix the budget section

**Current display (confirmed on screen):** `Spend: £1,112 / 0% of £480k`

**Problem:** £1,112 of £480,000 is ≈0.23%, which rounds to 0% — but
showing a bare "0%" reads as if nothing has been spent at all.

**Requested fix:**
```
Spend: £1,112 / £480,000
0.23% utilised
```

**Also add these fields** (currently missing):
- Approved budget
- Actual spend
- Committed spend
- Remaining budget
- Forecast final cost
- Variance

*(Currency symbol in this section should match whatever gets resolved
from the ₦/£ discrepancy flagged above.)*

---

## 10. Expand the Team section

**Current display:** `Team: 3 / 2.1 FTE committed` — no per-person
breakdown.

**Requested table:**
```
Team member    Role            Allocation  Hours  Tasks
Amara Okafor   Project Owner   0.8 FTE     6h     2
Daniel Reyes   Implementation  0.7 FTE     5h     2
Priya Nair     Data            0.6 FTE     4.5h   2
```
Client's stated purpose: lets the project owner see who's overloaded vs.
under-utilised — not just a headcount.

---

## 11. Add a "Project Documents" section (new)

For an HRIS rollout specifically. Suggested categories:
- Project charter
- Business requirements
- Process maps
- Data migration plan
- Payroll integration specification
- UAT plan
- Training plan
- Go-live checklist
- Risk register
- Project status reports
- Vendor contract
- Change requests

---

## 12. Add "Change Requests" (new)

Framed around scope-creep control.

```
CR-001 — Additional payroll integration
Requested by:
Date:
Reason:
Impact on timeline:
Impact on budget:
Impact on resources:
Approval:
Status:
```

**Explicit integration note from client:** this should link into the
**existing Submissions & Approvals and Workflows functionality** already
present in the HRIS navigation — not be built as a standalone,
disconnected feature. Cross-check against the Workflow engine spec
already logged (Batch 3 §11) before building this in isolation.

---

## 13. Make milestones clickable, with full detail

**Current:** three milestones shown as flat markers — Vendor contract
signed, Build complete, Go-live.

**Requested — each milestone opens a detail view:**
```
Milestone: Vendor Contract Signed
- Target date
- Actual date
- Status
- Completion %
- Dependencies
- Responsible person
- Related tasks
- Risks
- Approval
```

---

## 14. Add a dedicated "Go-Live Readiness" checklist (new)

Specifically because this is an HRIS implementation. Five categories:

```
People
- Staff trained
- Super users identified
- Support team briefed

Data
- Employee data migrated
- Data validation completed
- Data reconciliation completed

Systems
- Payroll integration tested
- User accounts created
- Permissions tested

Compliance
- Access controls reviewed
- Data protection requirements reviewed
- Audit requirements confirmed

Support
- Helpdesk ready
- Escalation process confirmed
- Post-go-live support agreed
```

Rolls up into a single score: **"Go-live readiness: 72%"**

---

## 15. Explicit final asks (client's own words: "Please can you add the below?")

- Automated project notifications
- Project reporting/export
- Project dashboard analytics

These three are stated as flat asks with no further detail — treat as
requiring a follow-up scoping conversation rather than building from
assumption (e.g. "notifications" could mean task-due alerts, status
changes, risk escalation, or all three; "export" format — PDF, CSV,
both — isn't specified).

---

## Suggested Phase Grouping

| Phase | Items |
|---|---|
| **P0 — Confirm first** | Project-module naming collision with Batch 3's time-tracking/billing concept; ₦/£ currency discrepancy |
| **P1 — Copy/display fixes** | §4 progress breakdown, §9 budget percentage display, §8 Blocked colour swap |
| **P2 — UI additions to existing screen** | §1 Health indicator, §3 Critical path alert placement, §7 task table columns, §10 team table |
| **P3 — Data model** | §8 task-level status field, critical-path-as-flag vs status separation, budget fields (committed/remaining/forecast/variance) |
| **P4 — New sections/features** | §5 Risks & Issues, §6 Next Actions, §11 Project Documents, §13 milestone detail view, §14 Go-Live Readiness checklist |
| **P5 — Logic change** | §2 auto-calculated critical path from dependencies/durations (this is a real algorithm, not a UI change) |
| **P6 — Needs scoping conversation** | §12 Change Requests (ties to existing Workflow/Approvals engine — don't build standalone), §15 notifications/export/analytics (all three underspecified) |
