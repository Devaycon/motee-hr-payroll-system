# MOTEE — Employee Lifecycle Pipeline Audit (Code vs. Spec)

Scope: the **core hire-to-retire pipeline** — Workforce Planning → Requisition →
Attract/Select (Recruitment) → Pre-employment → Onboard → Offboard. Ongoing
modules (Performance, Training, Engagement) and platform services (Workflows
admin, Documents, Analytics, Audit Trail) are out of scope here except where
the pipeline is supposed to touch them (Assets, specifically).

**How to read this document:** this is a code audit, not a punch list to
implement line-by-line. Every claim below was verified by reading the actual
source (file:line references included) and cross-checked against
`changes/MOTEE_Employee_Lifecycle_Feedback.md` (the client's proposed 8-stage
spec). Some things already match spec, some differ, some don't exist, and one
area actively contradicts itself. Treat the punch list at the end as a
starting point for prioritization, not a queue to execute top-to-bottom
without re-confirming scope with the client where noted.

---

## Headline issue: the product documents a lifecycle it doesn't run

`/lifecycle`'s "Stage Guide" tab (`src/components/hr/lifecycle/guide-data.ts`)
presents the client's *proposed, unshipped* spec **verbatim** under the
heading "What actually happens at each stage" — including the exact example
`"Sarah Johnson — Onboarding" / "76% complete"` (lines ~223-224), the full
Employee-completes/HR-completes field split (lines ~202-219), and the entire
8-step offboarding flow plus the 6-step Knowledge Transfer process (lines
~283-329).

None of this is wired to real data — it's static copy describing a different
product than the one shipped at `/talent/onboarding` and `/talent/offboarding`
(see stages 6 and 8 below). A user who reads the guide and then opens the real
module will find a different model. This is the exact "conflicting models"
failure the client's own feedback doc warned about (§ "Read this first"),
except now it's user-visible rather than just a planning inconsistency.
**Recommendation:** either build the modules to match the guide, or change the
guide's framing so it stops asserting this is current behavior, before doing
anything else in this list.

## Reconciliation gap #2: two offboarding state models, only one is real

The client's feedback doc explicitly flagged this as unresolved and said "only
one should ship." Having now read the code: **it's not actually a fight
between two shipped systems** — only one is real.

- **Shipped and working:** `OffboardingStatus = pending | approved |
  disapproved | in_progress | completed | reactivated | cancelled`
  (`src/lib/types/offboarding.ts:9-16`), with real tabs (`Pending Offboarding /
  Approved Offboarding / Disapproved Offboarding / Reactivated / All`,
  `src/components/hr/offboarding/actions.ts:58-76`) and real reducers
  (`approveRecord` / `disapproveRecord` / `reactivateRecord`,
  `src/lib/stores/offboarding-slice.ts:74-108`).
- **Documented but fictional:** the client's `Active Employee → Leaving →
  Offboarding in Progress → Employment Ended → Former Employee/Archived`
  model appears **nowhere** in any type, store, or component — only as prose
  in `guide-data.ts:335-340`. There is no `"leaving"`, `"employment_ended"`,
  or `"archived"` value anywhere in the codebase.

**Recommendation:** get the client to sign off that the shipped
pending/approved/disapproved/reactivated model is the one going forward, then
fix the guide copy to describe it accurately — don't build the second model
just because it's described in the guide.

---

## Stage-by-stage findings

### 1. Workforce Planning — `/talent/workforce-requests`
### 2. Requisition — `/talent/requisition`

**What matches spec:**
- `WorkforceRequest` (`src/lib/stores/workforce-requests-slice.ts:37-62`) and
  `Requisition` (`src/lib/stores/requisitions-slice.ts:5-49`) are genuinely
  two distinct record types — the client's ask to keep "Position Request" and
  "Requisition" separate is already satisfied, just under different names.
- Approval chains are real, not stubbed: both route through the generic
  approvals engine (`src/lib/types/approvals.ts`,
  `src/lib/stores/approvals-slice.ts`) with seeded default chains matching the
  spec almost exactly — Workforce Request = HR Manager → Finance → Executive,
  Requisition = Line Manager → HR Manager → Finance
  (`src/lib/permissions/approval-seeds.ts:18-31`).
- The next hop (Requisition → Recruitment, via the 6-step requisition builder
  at `src/components/hr/recruitment/builder/requisition-builder.tsx`) **does**
  work correctly — publishing there dispatches `markConverted` on the
  Requisition and creates a live `JobRequisition` record.

**Broken:**
- The "Create requisition" button on an *approved* Workforce Request
  (`src/components/hr/workforce-requests/index.tsx:345-347`) is a dead-end
  navigation — it calls `router.push('/talent/requisition')` with no id/query
  param, discarding which request was clicked. The user then has to manually
  re-pick the same request from a dropdown in the requisition builder modal.
- The reverse link that would fix this — `markConverted` in
  `src/lib/stores/workforce-requests-slice.ts:157-171`, which would set
  `status: "converted"` and store `requisitionId` — is exported but **never
  dispatched anywhere in the codebase**. This means the "Converted" KPI card
  and tab on the Workforce Requests page is permanently unreachable dead UI;
  no seed data and no code path can ever populate it.
- **Permission bug:** `src/components/hr/requisitions/index.tsx:109` gates
  create/edit/delete/submit using `useCan("talent.workforce-requests",
  "create")` — there is no `talent.requisition` entry anywhere in
  `src/lib/permissions/modules.ts` or the role-seed map
  (`src/lib/permissions/seeds.ts:71`). Access control for Requisitions is
  currently indistinguishable from access control for Workforce Requests —
  likely copy-paste that was never corrected.
- Dead field: `JobRequisition.workforceRequestId`
  (`src/lib/types/recruitment.ts:278`) is declared but never set or read —
  actual lineage is tracked via `sourceRequisitionId` instead.

**UI notes:**
- Naming collision: `/operations/workforce` (an analytics dashboard — headcount,
  turnover, skills-gap) is *also* titled "Workforce Planning"
  (`src/app/(hr)/operations/workforce/page.tsx:4`), the same label the
  lifecycle stage-1 card uses for `/talent/workforce-requests`
  (`src/components/hr/lifecycle/data.ts:144-151`). Two different pages,
  same name.
- No `loading.tsx` on either route (unlike sibling routes such as
  `/talent/recruitment`); the Workforce Requests page's `<Suspense>` has no
  `fallback`, so a slow load renders nothing rather than a skeleton.
- Detail modals on both pages (`request-detail-modal.tsx`,
  `requisition-detail-modal.tsx`) are read-only — no approve/reject/edit
  actions live there; decisions happen in a separate generic approvals inbox
  (`src/components/hr/approvals/detail-page.tsx`), which can feel like a dead
  end when clicking into a row.
- Draft-delete asymmetry: Requisition drafts can be deleted
  (`requisitions/index.tsx:306-308`); Workforce Request drafts have no
  equivalent delete action.

### 3–4. Attract / Select — `/talent/recruitment`

Both lifecycle stages route to the same module
(`src/components/hr/lifecycle/data.ts:163-183`); there is no separate
"Attract" route.

**Pipeline stages today:** `applicants → interview → interviewed → offer →
hired` (`src/data/recruitment-demo.ts:109-133`), vs. the client's `Applied →
Under Review → Shortlisted → Interview → Scored → Decision`.

- **This is a regression, not just a naming gap.** "Shortlisted" is in a
  `RETIRED_STAGES` list (`src/lib/types/recruitment.ts:180`) with a
  `normaliseStage()` function that actively migrates any candidate still
  parked there back to `applicants` — the code comment says these stages
  "existed before the pipeline was flattened." The pipeline was deliberately
  simplified away from a stage the new client spec explicitly wants back.
- No distinct "Under Review," "Scored," or "Decision" stage — scoring happens
  inside "Interviewed" via a Scorecard tab, and "Offer" doubles as
  decision+offer.

**Interview Scorecard** (`src/components/hr/recruitment/components/candidate-drawer.tsx:745-856`)
exists and is genuinely gate-enforcing — a candidate cannot advance from
`interview` to `interviewed` without a score (`src/lib/types/recruitment.ts:544-546`).
But it differs from spec:
- Only 3 hardcoded criteria (`Technical, Communication, Culture fit`,
  `candidate-drawer.tsx:743`) vs. the client's 5 (missing **Experience** and
  **Role-specific questions**).
- Rollup is a 1-5 star average, not a percentage.
- `recommendation` is forced binary (`overall >= 4 ? "yes" : "no"`, line 778)
  even though the type supports 4 values (`strong_yes/yes/no/strong_no`) — the
  other two are dead/unreachable.
- No per-role/per-requisition customization of criteria.

**Offer flow** (`OffersTab`, `candidate-drawer.tsx:951-1116`) is a real,
persisted record (terms, status, accept/decline with timestamps) — not a
stub. By design, no offer letter/document is generated: the UI copy and code
comments are explicit that the negotiation happens over email and the system
only owns the recorded outcome. Worth confirming with the client whether that
manual-email model is acceptable or whether generated offer documents are
expected.

**Recruitment → Onboarding bridge:** a prior project note referenced an
in-memory `addPendingRecord` bridge — **this no longer exists** (confirmed via
`git log -S`, removed in commit `b186da2`). It has already been replaced with
a proper Redux-backed, de-duplicated single entry point
(`useOnboardingInvite` in `src/components/hr/recruitment/use-invite.ts` →
`candidateToOnboardingRecord()` in `to-onboarding.ts`). **Flag this as already
resolved**, not a live gap.

However, the handoff still **loses data**: CV/attachments, skills, experience
summary, scorecards, offer terms, and communications history are all dropped
— `OnboardingRecord` has no fields for any of them, so the new onboarding
record is a minimal shell (name, email, job title, department, start date
only).

**Other notes:**
- References tab in the candidate drawer (`candidate-drawer.tsx:1200-1262`) is
  a pure `mailto:` composer — no request status, response, or outcome is ever
  persisted. Easy to mistake for a tracked step.
- A `WF-DEFAULT-RECRUITMENT` workflow template with "Reference & background
  checks" and "Right-to-work pre-check" steps
  (`src/lib/permissions/workflow-seeds.ts:610`) is defined and will appear in
  the Workflows admin list looking live, but nothing in the real candidate
  pipeline ever executes it.

### 5. Pre-employment — no dedicated route; currently folded into `/talent/onboarding`

This is the largest gap relative to the client's spec, which calls it out as
a **core, explicit requirement**: rules-based checks, conditional by
role/country, not a fixed checklist.

| Check | Status |
|---|---|
| References | Not persisted — `mailto:` composer only (see above) |
| Guarantor | Not implemented anywhere (zero occurrences in the codebase) |
| DBS / background check | Exists only as a free-text rejection-reason string; no real check record |
| Professional registrations | Not implemented |
| Occupational health | A full module exists, but it's standalone case-management for existing staff off sick — not connected to hiring at all |
| Right to Work / qualifications | Exist only as a **fixed, hardcoded document checklist**, identical for every hire regardless of role/country (`src/lib/types/onboarding.ts:94-131, 177-196`) |

The one conditional/rules mechanism that exists in the codebase
(`WorkflowConditionKey`: `remote_worker | company_car | contractor |
visa_holder`, `src/lib/types/workflows.ts:105-116`) is generic and is **not
wired into** the real candidate/offer/onboarding flow — the actual bridge
(`buildTasksForSelection`) picks one single default template for every hire
with no role- or country-based branching.

**Recommendation:** this needs to be scoped as new work, not a UI fix — a
configurable rules engine deciding which checks apply per role/country is a
genuinely new capability with enough detail in the client's doc to estimate.

### 6. Onboard — `/talent/onboarding`

**Field-ownership split (Employee completes / HR completes):** implemented,
but **only for the invited/self-service path**. The joiner's form
(`src/components/onboarding/employee-wizard/index.tsx:118-163`) explicitly
excludes HR-owned fields (employee ID, job title, department, manager,
salary, start date, etc.) — this matches spec closely. The **manual** entry
path (`/talent/onboarding/new`, `onboarding-form-page.tsx`) and the **bulk**
path have no such boundary at all — HR fills in everything, including
employee-owned fields like bank details and emergency contacts, with no UI
acknowledgment that this bypasses the ownership model.

**Progress display:** a real percentage mechanism exists (task/approval-count
based, with a % badge and progress bar in `detail/index.tsx` and
`pipeline-table.tsx`), but it doesn't match the spec's named checklist (✓
Personal details / ✓ Contract signed / ○ Laptop allocation…) or the guide's
"{Name} — Onboarding {%}" combined heading — name and percentage are always
separate table columns, never combined. The self-service wizard uses a
numbered step stepper with no percentage at all.

A **second, fully disconnected** "new-hire checklist" concept exists at
`/organization/employee-checklist`
(`ChecklistItem.responsibleParty: hr|manager|it|employee|finance`,
`src/lib/types/employee-checklist.ts:1-26`) — shape-wise closer to the client's
spec, but it reads from separate fixture data and has zero relationship to the
real onboarding pipeline. Two systems modeling the same idea, not talking to
each other. It also has an unguarded divide-by-zero: `new-hires-table.tsx:76-78`
computes `completedItems/totalItems` with no zero-check, so a hire with an
empty checklist renders `NaN%` (the real onboarding pipeline table does guard
against this correctly).

**Severe data loss at the onboarding → Employee handoff**
(`src/lib/demo/pending-employees.ts:4-25`, function `toRow()`):
- Hardcodes `phone: ""`, `salary: 0`, `employmentType: "full_time"`,
  `managerId: null` — **regardless of what was actually collected** in the
  onboarding form, even though those fields exist on `ManualOnboardingData`.
- Drops entirely: bank details, tax/ID info (NI number, tax ID, pension ID,
  passport), emergency contact, medical info, uploaded documents,
  declaration/review metadata.
- This isn't purely a mapping-function bug — `EmployeeRow`
  (`src/lib/types/employees.ts:23-77`) doesn't have fields for some of this
  data (medical info, documents, declaration), so a schema extension is
  needed alongside the mapping fix.
- Net effect: an employee who fully self-onboarded — verified bank details,
  uploaded documents, signed declaration — shows up in the Employees table
  looking like a same-day walk-in with no salary, no phone, no manager, and a
  default employment type.

**Assets collected during onboarding go nowhere:** `assetTag`, `assetName`,
`assetSerialNumber`, etc. are captured in the onboarding form
(`onboarding-form-page.tsx:1246-1287`) but never dispatched to any store —
there is **no assets Redux slice at all**; `useAssets()` currently just reads
static fixture data. This blocks the offboarding "same record, not
re-entered" requirement at the source (see stage 8).

**Naming collision:** `src/lib/stores/onboarding-slice.ts` (the initial
company-setup wizard) vs. `src/lib/stores/onboarding-records-slice.ts` (the
real employee onboarding pipeline) — same domain word, completely unrelated
data, easy to import the wrong one.

### 8. Offboard — `/talent/offboarding`

(Stage 7, "Develop, Perform & Retain," is out of scope for this pass per the
agreed scope.)

Confirmed: the live UI implements the pending/approved/disapproved/reactivated
model exclusively (see reconciliation gap #2 above) — internally coherent,
and the Exit Interview sub-feature (scheduling, notes, completion gate) is the
most complete part of this module.

**Broken / missing relative to spec:**
- **Asset Return is a generic, unlinked checklist line** ("Return laptop and
  accessories," `src/data/offboarding-demo.ts:57-66`) — `ClearanceItem` has
  no `assetId` field and nothing in the offboarding module references the
  `Asset` type. Combined with there being no live Asset store (stage 6
  above), the client's explicit principle — the same asset record flows from
  onboarding into the offboarding checklist, not re-entered — has no
  implementation path on either end today.
- **Knowledge Transfer as a formal stage does not exist.** The entire
  client-proposed 6-step process (define → assign recipients → document →
  handover meetings → recipient confirmation → manager sign-off) and 12-item
  checklist reduces to one generic checkbox: `"Knowledge transfer
  documentation"` (`src/data/offboarding-demo.ts:64`).
- **Two independent "exit interview completed" flags that can disagree:** a
  checklist checkbox (`ci-006`) and a separate `exitInterviewCompleted`
  boolean — toggling one does not update the other.
- **`handleExit` on the Employees page hardcodes**
  `exitReason: "resignation"` and `lastWorkingDate: today`
  (`src/components/hr/employees/index.tsx:218-246`) for every exit initiated
  from that entry point, regardless of the actual reason or date. This
  silently corrupts offboarding reporting (exit-reason KPIs, labels) that
  assumes the data is accurate. Note: the Offboarding page's own "Initiate
  Offboarding" modal does ask for these properly — only this one entry point
  is wrong.
- **Employee status normalization loses exit nuance:** `mapStatus()`
  (`src/components/hr/employees/hooks.ts:36-42`) collapses `terminated`,
  `resigned`, `offboarded`, `left`, `deactivated` into one undifferentiated
  `"inactive"` badge — HR can no longer tell from the Employees table *why*
  someone left.

**UI note:** the offboarding candidate-search dropdown silently filters out
anyone not in `active/on_leave/probation/onboarded`
(`offboarding-modal.tsx:108-118`) — a person still mid-onboarding or already
offboarding simply won't appear, with only a generic "No employees found"
message and no explanation.

---

## Prioritized punch list

### P0 — breaks the "rock solid / well connected" bar, or actively misleads users
_All seven items below are implemented as of this pass — see the "Status" line under each._

1. `/lifecycle` Stage Guide documents unshipped behavior as current behavior —
   either build to match, or correct the guide copy so it stops claiming
   this is live, before anything else ships under this framing.
   **Status: done.** The Stage Guide banner no longer asserts "what actually
   happens" — it now says the guide is the design target, some of which is
   still being built (`src/components/hr/lifecycle/index.tsx`). The
   offboarding stage's "Employee status after departure" section was rewritten
   to describe the real shipped status flow instead of the client's unbuilt
   Active→Leaving→Archived model (`src/components/hr/lifecycle/guide-data.ts`).
2. Reconcile the two offboarding state models with the client — the
   pending/approved/disapproved/reactivated model is what's actually shipped;
   get sign-off on it and fix the guide, rather than building the
   documented-but-fictional model.
   **Status: guide corrected to match the shipped model (see #1); client
   sign-off on this decision is still a conversation to have, not something
   code can settle.**
3. Fix the Workforce Request → Requisition handoff: pass the source id
   through navigation, and either wire up `markConverted` or remove the
   unreachable "Converted" status/tab.
   **Status: done.** "Create requisition" now deep-links
   `/talent/requisition?workforceRequest=<id>`, which pre-selects that
   workforce in the builder; saving or submitting the requisition dispatches
   `markConverted` on the source workforce request, so the "Converted"
   KPI/tab is reachable for the first time.
4. Give Requisitions its own `talent.requisition` permission resource instead
   of borrowing Workforce Requests'.
   **Status: done.** Added as its own module in
   `src/lib/permissions/modules.ts` and `seeds.ts`; the Requisitions page now
   checks `talent.requisition`. This also fixed a second instance of the same
   bug — the `/talent/requisition` sidebar link had no module entry at all,
   so it was visible to every role regardless of permissions.
5. Fix the onboarding → Employee handoff: stop hardcoding
   phone/salary/employmentType/managerId, and extend `EmployeeRow` to carry
   through the bank/tax/emergency/medical/document data actually collected.
   **Status: done** for every field `EmployeeRow` already has a slot for
   (phone, salary, employment type, manager, bank details, emergency contact,
   passport/tax/pension IDs, address, etc.) — `toRow()` in
   `src/lib/demo/pending-employees.ts` now reads them from
   `record.joinerData`. Turned up a deeper issue while fixing this: the
   manual (`onboarding-form-page.tsx`) and bulk (`onboarding/index.tsx`)
   entry paths were discarding everything but name/email/job/department/
   start-date *before the record was even created* — `joinerData` was never
   populated for those two paths at all. Fixed by persisting the collected
   data onto `joinerData` at creation time. Medical facts, uploaded documents
   and declaration/review metadata still have no field on `EmployeeRow` — that
   part is genuine schema work, left as P1 item 12's neighbor rather than
   folded into this pass.
6. Stop hardcoding exit reason/date in `handleExit` on the Employees page —
   prompt for real values, matching what the Offboarding page's own modal
   already does correctly.
   **Status: done.** "Start Offboarding" is now a small dialog (reason +
   last working date) instead of a bare confirm
   (`employee-row-actions.tsx`), and `handleExit` uses the values entered
   instead of hardcoding `"resignation"` / today's date.
7. Reconcile the two "exit interview completed" flags into one source of
   truth.
   **Status: done.** `toggleClearanceItem` and `updateExitInterview` in
   `src/lib/stores/offboarding-slice.ts` now keep the checklist row and
   `exitInterviewCompleted` in sync in both directions.

### P1 — real spec gaps worth scoping deliberately
8. Design a rules-based pre-employment checks engine (role/country-
   conditional References, Guarantor, RTW, DBS, qualifications) — none of
   this exists as a configurable gate today.
9. Reinstate a "Shortlisted"/"Under Review" distinction in the recruitment
   pipeline instead of the current flattened 5-stage model — this is a
   deliberate regression relative to what the client is now asking for.
10. Expand the Interview Scorecard to the full 5-criterion, percentage-based
    model and unlock the 4-value recommendation scale.
11. Build a real Knowledge Transfer stage in offboarding — even a lightweight
    version of the 12-item checklist with recipient assignment would close
    most of the gap.
12. Stand up an actual Assets store so onboarding-collected asset data has
    somewhere to go, and can then carry into the offboarding checklist as the
    same record per the client's "not re-entered" principle.

### P2 — UI polish / consistency
13. Add `loading.tsx` to `/talent/workforce-requests`, `/talent/requisition`,
    and the recruitment/onboarding detail routes.
14. Either surface decision actions in the Workforce Request/Requisition
    detail modals, or make it clearer that decisions happen in the separate
    approvals inbox.
15. Fix the draft-delete asymmetry between Requisitions (has it) and
    Workforce Requests (doesn't).
16. Disambiguate naming collisions: `/operations/workforce` vs.
    `/talent/workforce-requests` (both "Workforce Planning");
    `onboarding-slice.ts` vs. `onboarding-records-slice.ts`; the disconnected
    `/organization/employee-checklist` vs. the real onboarding pipeline.
17. Fix the unguarded divide-by-zero (`NaN%`) in the employee-checklist
    new-hires table.
18. Extend the Employee/HR field-ownership split to the manual and bulk
    onboarding entry paths, or add UI copy acknowledging those paths bypass
    it.
19. The orphaned `WF-DEFAULT-RECRUITMENT` workflow template appears live in
    the Workflows admin UI but is never executed by the real pipeline —
    either wire it up or don't present it as functional.

---

## Suggested next step

Items 1–2 are decisions, not code — they need a quick confirmation from
whoever owns the client relationship before anything downstream is built
against either model. Items 3–7 (P0) are the connective-tissue bugs most
likely to cause visible data problems in a demo or real use and can be fixed
without any new design decisions. Items 8–12 (P1) are genuinely new
capabilities that deserve their own scoping/estimation pass rather than being
squeezed in as bug fixes. Happy to start on any of these once you've had a
chance to prioritize.
