# MOTEE / MSL — Complete Employee Lifecycle Feedback

Source: `Lifecyle_Stages.docx`

---

## ⚠️ Read this first — this document is a different KIND of feedback

Everything processed so far in this project has been screen-level: "this
label is wrong," "this card should be clickable," "this field is
missing." **This document is not that.** It's a strategic/architectural
proposal — an end-to-end employee lifecycle model meant to reframe how
Motee's existing modules connect to each other, plus several genuinely
new stages that don't exist yet. Treat it as an information-architecture
review to validate with the client, not a punch list to implement
line-by-line.

**The single most important catch: the document doesn't agree with
itself on the stage model.** It presents the "same" 8-stage lifecycle
four separate times, and the stage names/groupings differ each time:

| # | Section-header text | "Motee dashboard" mockup (text) | Infographic (image3) | Full poster (image4) |
|---|---|---|---|---|
| 1 | Workforce Planning | PLAN | Plan | Workforce Planning |
| 2 | Requisition | RECRUIT *(merged)* | Requisition | Requisition |
| 3 | Attract | *(merged into RECRUIT)* | Attract | Attract |
| 4 | Select | SELECT | Select | Select |
| 5 | Offer & Pre-employment | PRE-BOARD | Pre-employment | Pre-employment |
| 6 | Onboarding | ONBOARD | Onboard | Onboard |
| 7 | Manage, Develop, Perform & Retain | DEVELOP & PERFORM | Develop, Perform & **Manage** | Develop, Perform & **Retain** |
| 8 | Offboarding | ENGAGE & RETAIN, then OFFBOARD *(separate)* | Engage, Retain **& Offboard** *(merged)* | Offboard *(Engage/Retain missing from the label entirely)* |

Before any of this becomes navigation labels, a dashboard, or database
enum values, **get one canonical 8-stage list signed off with the
client.** Building three slightly different versions into three
different screens (as happened with "Departments On Target" vs
"Departments at Target" in an earlier batch) is exactly the failure mode
this note is trying to prevent.

**Second catch — likely a copy/paste error in the full poster
(image4):** the "Ongoing People Management" band lists nine circles,
but two of them are both labelled **"Engagement"** (one plain, one with
the tagline "Listen. Involve. Belong."). That's almost certainly a
duplicate that should be two different labels, or a duplicate that
should be deleted — flag it back to the client rather than guessing
which.

---

## How this maps onto work already logged

A lot of this document describes modules that **already exist or are
already scoped** elsewhere in this project — it's giving them a new
narrative frame, not asking for a rebuild. Cross-check before treating
anything below as new work:

| This document's concept | Already logged as | Relationship |
|---|---|---|
| Position Request → HR Review → Budget/Finance Approval → Management Approval | Batch 3 §7 "Workforce Requests" (Total Requests/In Approval Chain/Approved/Converted, routes HR→Finance→Executive) | Very likely **the same feature, different name.** Confirm "Position Request" and "Workforce Request" aren't meant to be two separate things before building either. |
| Requisition → Publish → Recruitment pipeline (Applied→Under Review→Shortlisted→Interview→Scored→Decision) | Batch 3 §7.18, flagged as "the biggest missing piece" in the whole feedback set | This document gives the missing pipeline detail Batch 3 was asking for. Read them together. |
| Onboarding stage, progress-percentage display | Batch 3 §2 (Onboarding corrections) | Overlaps directly — this document adds the Employee-owned vs. HR-owned field split, which Batch 3 didn't specify. |
| Offboarding stage, employee status states | Devaycon's own dictated **Offboarding Table** spec (tabs: Pending / Approved / Disapproved / Reactivated / All) | **These look like two different state models for the same underlying thing.** This document proposes: Active Employee → Leaving → Offboarding in Progress → Employment Ended → Former Employee/Archived. Devaycon's own spec proposes a tab-based Pending/Approved/Disapproved/Reactivated model. Reconcile these into ONE state machine before building either — don't ship two competing offboarding status systems. |
| Assets, Learning & Development, Performance, Engagement modules | Existing/previously-referenced MOTEE modules | This document just re-frames them as continuously-running "Ongoing People Management" rather than one-time stage steps — narrative reframing, not new features. |
| Action Centre, Workflows, Documents, Compliance, Analytics, Audit Trail | Already-existing/logged platform features (Batch 3 §4.13, dashboard KPI work, etc.) | Same story — re-framed as a "Services Supporting Everything" layer, not new builds. |

---

## The 8-Stage Model (using the text version as the most detailed source)

### 1. Workforce Planning
**Question it answers:** *"What workforce do we need now and in the future?"*

Flow: `Workforce Analytics → Headcount Planning → Skills Gap Analysis →
Succession Planning → Scenario Planning → Budget & Cost Planning →
Identify Workforce Need`

This overlaps heavily with the already-built/logged **Headcount
Planning module** (Batch 3 §6) — Workforce Analytics, Skills Gap
Analysis, Succession Planning, and Scenario Planning appear to be
new/adjacent capabilities rather than things already confirmed to exist.

**Leads to a Position Request**, which can arise from: New Headcount,
Replacement, Growth, Restructure, Succession, Skills Gap, or
Temporary/Project Need.

**Position Request fields:** job title, department, reporting manager,
reason, new-or-replacement headcount, number of positions, employment
type, proposed salary/band, location, target start date, business
justification, budget/cost centre.

**Approval flow:** `Position Request → HR Review → Budget/Finance
Approval (if required) → Management Approval → Position Approved`. If
rejected/returned, the manager gets a reason and can amend/resubmit.

**Suggested dashboard metrics:**
```
Workforce Planning: 5 Plans in Progress · 8 Identified Skills Gaps · 4 Forecast Vacancies
Position Requests: 3 Awaiting Approval · 2 Awaiting Finance · 1 Returned to Manager · 4 Approved This Month
```

**Suggested Action Centre alerts:**
```
🔴 Position Request overdue for approval — Head of Finance, submitted 8 days ago
🟠 Workforce gap identified — Operations forecast indicates 4 additional roles required by January
```

---

### 2. Requisition
**Distinction the client wants preserved:** a Position Request asks *"Can
we hire this person?"* — a Requisition says *"We're authorised to
recruit for this position, start the process."* Keep these as two
distinct concepts/records, not one collapsed into the other.

Flow: `Approved Position → Create Requisition → Complete Job Description
→ Approve Requisition → Publish`

---

### 3. Attract
Flow: `Vacancy Published → Applications → Screening → Shortlist →
Interview → Offer`

Suggested summary tile: `ATTRACT — 12 Open Vacancies · 184 Applications
· 6 Closing Soon`, clickable into Recruitment.

---

### 4. Select

**This is where the client wants real structure, not manual folder-
moving.** Pipeline: `Applied → Under Review → Shortlisted → Interview →
Scored → Decision`

**Interview Scorecard** — confirmed via screenshot, structured scoring
against predefined criteria:
```
Criteria                Score
Experience              4/5
Technical competency    5/5
Communication           4/5
Values/culture          4/5
Role-specific questions 18/20
Overall                 88%
```
Stated purpose: *"a defensible record of why a candidate was selected,
rather than simply recording 'successful.'"* — relevant for audit/
compliance, not just UX polish.

Successful candidate → Generate Offer. Unsuccessful candidates →
appropriate communication/talent pool, "subject to your policies and
applicable data-protection requirements" (client's own phrasing —
worth treating as a compliance flag, not just a feature note).

---

### 5. Offer & Pre-employment

Client explicitly wants this as **its own distinct lifecycle stage**,
reasoning: significant activity happens between "we want this
candidate" and "this person is now an employee," and it shouldn't be
buried inside either Select or Onboarding.

Flow: `Offer Generated → Offer Sent → Candidate Accepts → Pre-employment
Checks → Ready to Onboard`

**Once offer is accepted, checks trigger automatically:**
- **References:** Candidate nominates referees → Motee sends reference
  request → referee completes form → HR reviews → Complete.
- **Guarantors** (where applicable): Candidate nominates guarantor →
  request sent → information returned → HR verifies → Complete. *(New
  concept — not previously logged anywhere in this project.)*
- **Other checks, conditional by role/country/organisation:** Right to
  Work, DBS/background checks, professional registrations,
  qualifications, occupational health, etc.

**Core requirement: rules-based, not one-size-fits-all.** Client's own
example: a care worker, an accountant, and a software engineer may all
need different checks. This needs a configurable rules engine behind
it, not a fixed checklist.

---

### 6. Onboarding

Status changes: **Candidate → New Starter**, triggering a secure
employee-portal invitation.

**Explicit information-ownership split requested:**
- **Employee completes:** personal details, address, emergency
  contacts, bank details, tax information, next of kin, requested
  documents, acknowledgements.
- **HR completes:** employee ID, position, department, reporting
  manager, salary, employment type, start date, probation period,
  working pattern, location, cost centre.

This is more specific than what's currently logged for onboarding in
Batch 3 — worth reconciling the two specs rather than building Batch
3's version and missing this ownership split.

**Progress display, shown with a concrete example:**
```
Sarah Johnson — Onboarding 76%
✓ Personal details
✓ Contract signed
✓ Right to Work
✓ Bank details
○ Laptop allocation
○ Mandatory training
○ Manager induction
```
Client's framing: *"much more useful than simply saying 'Onboarding.'"*

---

### 7. Manage, Develop, Perform & Retain

The lifecycle continues past hire rather than the recruitment workflow
just ending. Client wants these existing/adjacent modules explicitly
connected here:

- **Assets** — laptop, phone, keys, ID/access card, equipment, vehicle.
  Each asset needs: owner, issue date, condition, serial number,
  expected return.
- **Learning & Development** — mandatory training by role/department/
  location, induction training, skills development, certifications and
  renewals.
- **Performance** — probation review → objectives → check-ins →
  performance reviews → development plans → promotion/career
  progression.
- **Engagement & Retention** — recognition, surveys, employee feedback,
  wellbeing, attendance/absence trends, benefits, retention indicators.

**Client's suggested pitch line** (worth keeping verbatim for
marketing/sales use, not just engineering): *"Motee doesn't stop once
you've hired someone. Their recruitment record becomes their employee
record, which then drives onboarding, assets, learning, performance,
engagement and eventually offboarding."*

---

### 8. Offboarding

Flow: `Resignation/Termination → Approval → Offboarding Plan →
Knowledge Transfer → Asset Return → Access Removal → Final Documents →
Exit Interview → Employee Archived`

**Core principle:** assets allocated during onboarding should
automatically appear on the offboarding checklist — same asset record,
not a re-entered one. Example given:
```
John Smith — Leaving 30 September
✓ Manager notified
✓ Exit interview scheduled
⚠ MacBook Pro — Return required
⚠ Building pass — Return required
○ IT account closure
○ Final payroll
○ P45/final documents (depending on the country)
```

#### Knowledge Transfer — proposed as a formal, dedicated offboarding stage

Not just a note that a handover happened. Purpose: capture critical
knowledge from the departing employee and transfer it to the right
people before their last day.

**Recommended offboarding flow (more detailed than the summary above):**
`Notification & Approval → Handover Planning → Knowledge Transfer →
Asset Return → Access Removal → Final Documents → Exit Interview →
Complete & Archive`

**Six-step process:**
1. Define what knowledge must be transferred (manager + departing
   employee identify key responsibilities, critical info, open work,
   exposure risk).
2. Assign handover recipient(s) — different topics can go to different
   people.
3. Document the knowledge in a structured record (not just conversations/email).
4. Conduct handover meetings between departing employee and recipients.
5. Recipient confirms the knowledge was received and gaps resolved.
6. Manager sign-off confirming the stage is complete before offboarding closes.

**Knowledge Transfer Checklist (12 items):** current projects/status/
priorities/next actions; outstanding tasks/deadlines/commitments;
recurring processes/routines/procedures; key internal contacts and
responsibilities; key clients/suppliers/partners/stakeholders;
important shared folders/files/document locations; systems and tools
used, **with access ownership transferred through approved IT
processes** (client explicitly notes: never store personal passwords);
reports/templates/trackers/working documents; role-specific procedures
and practical know-how; known issues/risks/workarounds/lessons learned;
upcoming meetings/events/renewals/key dates; responsibilities that must
be reassigned after departure.

**Example status table:**
```
Knowledge Item              Owner/Recipient        Status
Current projects            Replacement / Manager  In Progress
Key stakeholder relationships Named team member    Not Started
Recurring processes         Replacement            Completed
Outstanding deadlines       Manager                In Progress
Known issues and lessons    Team / Replacement     Completed
```

**Action Centre integration** — surface incomplete handovers
automatically, e.g.: *"Knowledge transfer is 60% complete — 5 working
days until James Carter's last day"* or *"2 critical handover items
have no assigned recipient."* Stated purpose: makes this trackable
rather than something that can quietly get missed.

#### Employee status state machine (proposed)

`Active Employee → Leaving → Offboarding in Progress → Employment Ended
→ Former Employee / Archived`

Archived = no longer part of active workforce, but authorised
historical records retained per applicable retention rules.

**⚠ Reconcile with Devaycon's own dictated Offboarding Table spec**
(tabs: Pending Offboarding / Approved Offboarding / Disapproved
Offboarding / Reactivated / All) before building either — see the
cross-reference table above. These are two different ways of modelling
the same lifecycle and only one should ship.

---

## Master Lifecycle Dashboard (proposed, new)

**Top-level stage bar:**
`PLAN → RECRUIT → SELECT → PRE-BOARD → ONBOARD → DEVELOP & PERFORM →
ENGAGE & RETAIN → OFFBOARD`
*(Note: this text version merges Requisition+Attract into one "RECRUIT"
label — yet another variant of the stage list; see the inconsistency
table at the top.)*

**Sub-steps per stage**, e.g.:
```
PLAN — Position Request → Approval → Requisition
RECRUIT — Requisition Approval → Advertise → Applications
SELECT — Screen → Shortlist → Interview → Score → Select
PRE-BOARD — Offer → Acceptance → References → Guarantor → Checks
ONBOARD — Employee Details → HR Details → Documents → Assets → Induction
DEVELOP & PERFORM — Training → Objectives → Probation → Reviews → Development
ENGAGE & RETAIN — Recognition → Surveys → Benefits → Career → Retention
OFFBOARD — Exit → Handover → Asset Return → Access → Final Documents
```

**Dashboard doesn't need every sub-step — just clickable stage counts:**
```
PLAN 3 requests → RECRUIT 12 vacancies → SELECT 47 candidates →
PRE-BOARD 6 offers → ONBOARD 8 starters → DEVELOP 36 plans →
ENGAGE 72% → OFFBOARD 3 leavers
```
Clicking any stage opens its detailed workflow.

---

## Supporting Infographic Structure (image4 — full poster)

Beyond the 8 linear stages, the poster proposes two cross-cutting
layers that run underneath/alongside the whole lifecycle rather than
belonging to one stage:

**"Ongoing People Management"** (continuous, not stage-bound):
Employee Relations, Attendance, Leave, Wellbeing, Compensation &
Benefits, Learning & Development, Performance, Engagement *(shown
twice — see duplicate-label flag above)*.

**"Services Supporting Everything"** (platform-level, not stage-bound):
Action Centre, Workflows, Documents, Assets, Compliance, Analytics,
Audit Trail.

As noted above, these mostly restate modules already built or already
logged elsewhere — their value here is the *framing* (continuous
services vs. one-time stages), which matters for navigation/IA
decisions and for how this gets pitched to prospective clients, more
than it does for new engineering scope.

---

## Suggested Approach (this document needs a different phase model)

Because this is architectural rather than tactical, "P0–P5 build
phases" doesn't quite fit. Suggested approach instead:

| Step | What | Why first |
|---|---|---|
| **1. Reconcile the model** | Pick one canonical 8-stage list and one canonical set of stage names; resolve Position Request vs. Workforce Request; resolve the two competing offboarding state machines; resolve the duplicate "Engagement" label | Everything downstream (nav labels, dashboard, database enums) depends on this being decided once, not three times |
| **2. Map, don't rebuild** | Go through "Ongoing People Management" and "Services Supporting Everything" and match each item to what's already built/logged. Most of this is relabelling existing work under a new narrative, not new code | Avoids rebuilding things that already exist under a different name |
| **3. Scope the genuinely new pieces** | Interview Scorecard, rules-based pre-employment checks (References/Guarantor/conditional checks), Onboarding's employee-vs-HR field split, the formal Knowledge Transfer stage, the Action Centre integrations for handover tracking | These are real, undelivered features with enough detail here to actually estimate |
| **4. Build the master lifecycle dashboard** | The PLAN→RECRUIT→...→OFFBOARD clickable summary bar | Depends on step 1 being settled and step 3's underlying data existing |
| **5. Keep the pitch value separate from the build** | The "connected employee lifecycle platform" narrative and the sample pitch line are genuinely useful for sales/marketing | Don't let positioning language drive engineering priority — flag it as valuable, but track it separately from the build backlog |
