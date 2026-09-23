# MOTEE / MSL — Feedback: Onboarding, Assets, Kudos, Surveys, Documents,
# Help Desk, Occupational Health, Settings, Recruitment

Source: `Correction.docx` (1.4MB, 17 screenshots) — **not the same file**
as the earlier `Correction.docx` from Batch 3 (373KB, 9 screenshots).
Same generic filename, completely different content. Referenced below
as **Correction 2** to keep them apart.

---

## ⚠️ Read this first

**1. This document proves a lot of earlier-recommended work is now
built.** Several things flagged as *recommendations* in earlier
feedback rounds now appear as real, working screens with real data in
these screenshots:
- The **Occupational Health module** (originally recommended in the
  very first document processed for this project, `System_Correction
  .docx`) is confirmed live — real cases (Grace Adeyemi, Daniel Okoro),
  staged workflow (Stage 7 of 12, Stage 3 of 12), and the exact
  confidentiality wording that was originally recommended: *"Clinical
  diagnoses are never requested, stored, or shown — managers see
  adjustments, not medical detail."*
- **User Management's account-status model** (recommended in Batch 3
  §4.14: Active/Locked/Revoked) is confirmed live with those exact
  states.
- The **"Workflow Preview"** feature — flagged as a wishlist "feature
  I'd love to see" in the most recent onboarding-wizard feedback
  (`Client_Login_Dashboard.xlsx`) — is confirmed **already built**
  (screenshot shows `Employee → Manager → Approved` rendering live for
  the "Direct Manager" option). That earlier file's framing of this as
  a pure wishlist item should be corrected — it exists; what's still
  open is whether it correctly extends to the "Manager & HR" case.
- The **HR Help Desk already has a ticket reference number** (`HD-001`
  in the Ref # column) — the client's ask below isn't "build this from
  scratch," it's about whether that reference reaches the requester and
  shows up in notifications.

**2. This directly continues an open question from the last feedback
batch.** `Client_Login_Dashboard.xlsx` (previous feedback round) had the
client asking, in caps: *"PLEASE DO WE CURRENTLY HAVE APPROVAL
DELEGATION."* This document is effectively the detailed follow-up to
that exact question — a full spec for Approval Delegation & Escalation.
Treat these two as one continuous thread, not two separate asks.

**3. A genuine multi-tenant data bug, not a UI complaint.** The Manual
Entry ("Add New Employee") flow is showing **Nigerian-specific identity
fields (NIN, TIN, Pension PFA, NHF Number) inside what should be the UK
tenant's onboarding form.** Given MOTEE is explicitly multi-tenant
across UK and Nigeria, this is a real tenant-scoping bug — the wrong
field set is being served to the wrong tenant — not a copy or layout
fix. Flagged at the top because it's the most structurally serious item
in this document.

**4. "Benefits" keeps showing up as missing, in three unrelated
places.** It's absent from the module picker in the tenant-onboarding
wizard (already flagged in the previous xlsx feedback), absent from the
module toggle list in Settings & Configuration (this document, §11
below), and the client is separately asking for a Benefits column on
Employment Types (§14 below). Worth treating as one cross-cutting gap —
Benefits appears to have been under-integrated system-wide — rather
than three unrelated small asks.

---

## 1. Self-Invite Onboarding Flow

**Confirmed existing (screenshots):** dark-themed 6-step wizard —
Personal Details, Bank & Identity, Documents, Emergency Contact,
Starter Checklist, Review & Submit. Includes a Privacy Notice consent
gate (*"I have read and understood the Privacy Notice... Privacy
Notice version 2026.1 — your acceptance is recorded against this
version"*) — this matches the GDPR consent flow already logged in Batch
3 §2.12, confirmed as built. Also confirms **Save & finish later**
already exists, matching Batch 3 §2.3 (Save & Resume) — also already
built.

**1.1 Make three documents optional, not mandatory.** Screenshot
confirms Passport, Right to Work evidence, and Proof of Address are
all marked with a red required asterisk. Client's direct ask: *"Please
do not make Passport, right to work evidence, proof of Address
compulsory."*

**1.2 Fix the name casing.** The current screen renders the employee's
name in all-caps throughout (*"Hi OLAYINKA"*). Client's suggested
revision uses normal casing (*"Hi Olayinka"*) — looks like a display
bug (name stored/rendered upper-case) rather than a deliberate style
choice, worth checking whether the underlying stored value is also
upper-cased or if it's just a display transform.

**1.3 Answer this workflow question directly before changing anything
else here:** *"Could you please confirm where the information
completed by the employee via the self-invite goes after completion?
Does it appear in Onboarding as Pending, and once both HR and the IT
Manager approve it, does it move to the Employee Dashboard?"* This
reads as the client not knowing the actual current behaviour — answer
it factually first, the same way the approval-delegation question in
§4 below needs answering before it gets built around.

---

## 2. Manual Entry — "Add New Employee" (HR-initiated onboarding)

**Confirmed existing (screenshot):** 8-step wizard — Personal,
Employment, Bank Details, Documents, Emergency, Medical, Assets,
Review.

**2.1 ⚠️ Tenant-localization bug.** The Documents step of this wizard
shows: NIN (National Identification Number), TIN (Tax Identification
Number), Pension ID (PFA), NHF Number — all Nigeria-specific identity
fields — with a Passport Issuing Country field defaulting to "e.g.
Nigeria." Client's exact words: *"The above is showing in UK manual
ENTRY for onboarding — please can you amend, as NIN, TIN, pension PFA,
NHF"* [are Nigeria-specific]. This needs tenant-aware field rendering
(UK tenants should see NI Number / UTR-style fields, not NIN/PFA/NHF),
not a copy fix.

---

## 3. Assets (within Manual Entry)

**3.1 Allow multiple assets per employee at onboarding time.**
Confirmed via screenshot: the "Assets to Assign" step only provides one
set of fields (Asset Tag, Asset Name, Category, Serial Number, Assigned
Date) with no way to add a second asset. Client's ask: *"The asset to
assigns only allow one asset to be assigned — Can you allow more asset
to be allocated if required?"*

---

## 4. Client/Tenant Onboarding Wizard — Workflow Configuration step

This is the same wizard already covered by `Client_Login_Dashboard.xlsx`
(Company → Structure → Roles → Modules → **Workflow** → Review).
Screenshot confirms the current Workflow step: three radio options
(Direct Manager / HR Department / Manager & HR) with a live "Workflow
Preview" already rendering (`Employee → Manager → Approved` for the
Direct Manager option — confirming this feature already exists, per
the note at the top).

**4.1 Add "Delegate & Absence Rules" to this step.** Full spec supplied
by the client:

**Approval Delegation — "What happens when the approver is
unavailable?"**
- Toggle: *automatically delegate approval* if the direct manager is
  unavailable/on leave.
- Delegate-to options: HR Department / Manager's next-level manager /
  Specific designated delegate.
- Delegation triggers: manager marked On Leave/Unavailable, OR manager
  doesn't respond within `[X]` hours/days (optional escalation).
- Example preview when a manager is absent:
  `Employee → Manager (On Leave) → Delegate / HR → Approved`

**Two distinct mechanisms requested** (client is explicit these solve
different problems and both should exist):
1. **Pre-configured delegation** — a manager sets a date range (e.g.
   "While I'm away from 20–25 September, route my approvals to Jane
   Smith") and the system automatically reassigns during that window.
2. **Hierarchy-based fallback** — when no delegate is configured:
   `Employee → Line Manager → Manager's Manager → HR`, with the
   fallback order configurable per company, e.g.:
   ```
   Fallback approval chain
   1. Designated delegate
   2. Manager's manager
   3. HR
   ```
   Client's stated rationale: *"more robust than simply sending
   everything to HR, because it preserves the organisational approval
   hierarchy."*

**Audit trail required** on every delegated approval:
```
Approved by: Jane Smith
On behalf of: John Smith (Line Manager)
Reason: John Smith was on leave
Delegation period: 20 Sep – 25 Sep
```
Stated purpose: makes clear the delegate didn't permanently become the
employee's manager — they were temporarily authorised.

**Naming recommendation:** call this feature **"Approval Delegation &
Escalation,"** not just "Delegate Approval" — client's reasoning: the
name should cover both planned absence and automatic escalation when an
approver doesn't act, not just the manual-delegation case.

---

## 5. Kudos

**Confirmed existing (screenshot):** Send Kudos modal — Recipient field
is a single-colleague dropdown only. Recognition Type (Teamwork,
Innovation, Leadership, Customer Focus, Excellence, Growth, Custom),
optional Company Value tags, message field.

**5.1 Regression — restore department/team as a recipient option.**
Client's exact words: *"Why is the recipient of Kudos limited to an
individual? Why can't we select a department or team as the recipient?
The department option was available previously."* This reads as
something that used to work and no longer does — worth confirming it's
a regression rather than a deliberate removal before rebuilding it.

---

## 6. Surveys and Engagement

**Not reacting to a current screen — this is a new taxonomy proposal.**

**6.1 Add Exit Survey.** Client's framing: *"You have Onboarding, but
you're missing the other end of the employee lifecycle."* Suggested
questions: main reason for leaving, overall experience rating, felt
supported by manager, had career development opportunities, what could
have been done differently, would recommend the organisation. Gives a
*"Join → Experience → Leave"* journey.
**Cross-reference:** this connects directly to the Offboarding stage in
`Lifecyle_Stages.docx` — worth building alongside that stage's Exit
Interview step rather than as an unrelated survey feature.

**6.2 Add Manager/Leadership Survey.** Example questions: *"My manager
communicates expectations clearly," "I receive useful feedback from my
manager," "My manager recognises my contributions," "Leadership
communicates important changes effectively."* Suggest anonymous
responses where appropriate.

**6.3 Explicitly do NOT add a separate "Satisfaction Survey" category.**
Client's reasoning: satisfaction is already measurable via Engagement,
Pulse, Benefits, and Onboarding surveys — a dedicated category would
duplicate those and confuse HR admins choosing between near-identical
survey types.

**6.4 Suggested final survey menu structure:**
```
Employee Surveys
📊 Engagement
💓 Pulse
⭐ eNPS
👋 Onboarding
🚪 Exit
👥 Manager & Leadership
🎓 Training & Learning
🧑‍💼 Candidate Experience
+ Create Custom Survey (catch-all)
```

---

## 7. Navigation Restructuring

**Both of these overlap directly with the nav restructure already
logged in Batch 3 §4 — fold into that same piece of work, don't scope
as separate nav changes:**

**7.1** Move **Asset Management** into the **Employee Management**
section.

**7.2** Move **Contracts** from **Knowledge & Resources** into
**Employee Management**.

---

## 8. Documents & Compliance — module redesign

Client's framing: current page *"feels quite busy"* with duplication
between Company Documents, Personnel/Employee Files, Contracts,
Policies, and Certificates.

**8.1 Proposed restructure, organised by ownership/purpose rather than
document type:**
```
Company Documents — Policies, procedures, templates, compliance docs
Employee Documents — employee-specific records, accessed by searching/selecting an employee
My Documents — self-service area for employees' own documents
Archive — archived/inactive documents
```

**8.2 Employee Documents — search-first, then categorised.** Rather
than showing all employee documents together, HR should first
search/select an employee, then see that employee's documents grouped
into: Personal Documents, Right to Work, Employment Documents,
Qualifications/Certificates, Other Documents.

**8.3 "My Documents" self-service area (new).** Employees upload their
own documents (passport, right-to-work evidence, proof of address,
driving licence, certificates), optionally entering an expiry date,
with the upload routed to HR for review/approval.

**8.4 Remove duplicate folder categories** — Contracts, Policies, and
Certificates should each have one clear location rather than appearing
in multiple places in the current structure.

**8.5 Stated goal:** cleaner and easier to navigate for both HR admins
and employees, while keeping the existing compliance/expiry monitoring
functionality intact.

---

## 9. HR Help Desk

**Confirmed existing (screenshot):** "HR Help Desk" screen with Total
Cases / Open-Active / Resolved Today / Overdue (SLA) cards, tabs (Open
Cases, All Cases, FAQ Library, Analytics), and a case table **that
already includes a Ref # column** (e.g. `HD-001`).

**9.1 Since the reference number already exists in the admin view, the
actual gap is surfacing it to the requester and in notifications.**
Client's ask: *"a unique Service Request/Reference Number... should be
automatically generated and displayed to the requester so they can
track the status and follow up... also included in all related Service
Desk notifications and communications."* Scope this as "surface the
existing Ref # to the employee-facing side," not as building a
reference-numbering system from zero.

---

## 10. Occupational Health

**Confirmed existing and already fairly mature (screenshot):** page
header, confidentiality banner (quoted above), 5 summary cards (Open
cases / Awaiting referral / In assessment / Adjustments in place /
Total cases), and employee cards showing name, department, absence
length, OH status badge, workflow stage (e.g. Grace Adeyemi — Operations
· 50 days absence · "Fit with adjustments" · Stage 7 of 12).

Client's overall take: *"The underlying concept is good... I'd
recommend you evolve it from a status dashboard into an OH
case-management workflow"* rather than a redo.

**10.1 Change the 28-day auto-referral logic and wording.** Current
header text: *"Referrals are triggered automatically after 28 days of
continuous absence."* Client's objection: the system should trigger a
**review**, not silently create an actual OH referral — a person
should decide whether a referral is appropriate. Proposed flow:
`28-day threshold reached → HR/Manager prompted to review → Referral
appropriate? → Referral created → Employee notified/consent process →
OH assessment`. Suggested replacement wording: *"A review is
automatically triggered after 28 days of continuous absence.
Occupational Health referrals can also be initiated earlier where
appropriate."* Also explicitly allows earlier referrals when warranted,
rather than treating 28 days as a universal threshold.

**10.2 Add a "Next Action" to each case — called out as the single
biggest practical UI improvement requested.** Currently a card shows
status/stage but not what needs to happen next. Example for Daniel
(currently: Pending assessment → Threshold reached → Stage 3 of 12):
```
Next action: Review OH referral
Owner: Line Manager
Due: 21 September
[Review referral]
```
Stated purpose: turns the dashboard into an action centre rather than a
status screen.

**10.3 Add filtering/search and tabs** — needed before the caseload
grows to 50–100 cases. Suggested filter row: `Search employee | Status
| Department | Case owner | Stage | Adjustments required | Overdue`.
Suggested tabs: `All | Action Required | Awaiting OH | Adjustments |
Follow-up | Closed`.

**10.4 Clarify the "Equality Act 2010" badge.** Client's direct
question: *"What does the badge exactly mean and who determines it?"*
If it means "legally disabled under the Equality Act," the client is
cautious about presenting that as a plain system-generated label.
Suggested rename to a more operational label — **"Reasonable
adjustments consideration"** or **"Workplace adjustments"** — with the
underlying record explaining the actual HR/OH assessment. Stated
rationale: aligns better with the page's own stated principle of
showing adjustments, not medical/legal classifications.

**10.5 Give Adjustments their own proper management area**, not just a
count. Opening an adjustment should show:
```
Recommended adjustment: Phased return / altered hours / equipment / amended duties
Date recommended
Agreed by
Implementation owner
Effective date
Review date
Status: Proposed / Agreed / Implemented / Reviewed / Closed
```

**10.6 Rework the summary cards to emphasise action, not just
counting.** Current: `3 Open cases | 1 Awaiting referral | 1 In
assessment | 1 Adjustments in place | 4 Total cases`. Proposed:
`Open Cases | Action Required | Awaiting OH | Adjustments to Implement
| Reviews Due | Overdue`. Client's reasoning: "Total cases" is useful
for reporting but less operationally useful than knowing 3 cases need
action today.

**10.7 Data-quality issue on case closure.** Priya's card shows "Fit
for work," absent for 97 days, AND "Case closed — Stage 12 of 12"
simultaneously. Client isn't certain this is a bug (could be a separate
absence episode), but flags that a closed case should show a return
date instead of continuing to show an absence-day counter:
```
Returned to work: 10 August 2026
```
rather than `Absent 97 days`, to avoid HR misreading a closed case as
an employee still absent.

**10.8 Make the confidentiality model role-based, not just a
statement.** The confidentiality banner text is good, but client wants
it enforced via actual permissions — HR/OH admin, line manager, and
employee should see different information, not identical data with a
disclaimer. Example — a manager should see only: Fit for work / Fit
with adjustments / Not currently fit for work / Recommended adjustments
/ Review date — without confidential OH correspondence.

**10.9 Make the employee cards clickable (CTA)** — explicit, direct
ask.

**10.10 Full proposed information architecture** (client: *"I wouldn't
radically redesign the visual style — it's already clean. I'd improve
the information architecture"*):
```
Occupational Health
Manage OH referrals, fitness-for-work recommendations and workplace adjustments.

[Open | Action Required | Awaiting OH | Adjustments | Reviews Due]
[filters/search]

Grace Adeyemi
Operations · 50 days absence
Fit with adjustments
Current stage: Recommendations received
Next action: Manager to review recommended adjustments
Owner: Sarah Jones
Due: 21 Sep 2026
[View Case] [Review Adjustments]
```
`View Case` opens the full timeline and audit history.

**10.11 Client's own priority summary:** replace automatic 28-day
referral with an automatic *review* trigger; add Next Action/Owner/Due
Date; introduce search and filters; improve adjustment tracking;
clarify the Equality Act badge; make confidentiality role-based rather
than relying on what's merely stored/not stored.

---

## 11. Settings & Configuration

**Confirmed existing (screenshot):** module toggle list (Enabled /
Sidebar columns) showing Leave & Time-Off, Attendance, Payroll,
Recruitment, Onboarding, Performance, Training, Assets. **No Benefits
row visible.**

**11.1** Client's question: *"Please could confirm if Benefit is not
supposed to be here?"* — third occurrence of the Benefits-module gap
noted at the top of this file. Answer this directly, then fix
consistently across all three locations rather than patching this one
in isolation.

---

## 12. Audit Trail

**Confirmed existing (screenshot):** Total Actions / Error Rate / Avg
Response / Suspicious cards, filterable log table (Timestamp, Action,
Module, Description, Performed By, IP Address, Status, Time).

**12.1** Add an **Approximate Location** column next to IP Address.

---

## 13. User Management

**Confirmed existing (screenshot):** Total Accounts / Active / Locked /
Revoked cards (matches Batch 3 §4.14's recommendation, now confirmed
built), user table with User / Roles / Department / Status / **Last
change** columns.

**13.1** Add a **Last Login** column — distinct from the existing "Last
change" column, which tracks account modifications, not sign-in
activity.

---

## 14. Employment Types

**Confirmed existing (screenshot):** table with Type Name, Contract
Duration, Leave Entitlement, Payroll, Statutory Deductions, Employees,
Status — 9 employment types shown (Full-time, Part-time, Contract,
Intern, Apprentice, Temporary, Freelance/Self-employed, Casual,
Seasonal).

**14.1** Add a **Benefits** column to the header — second occurrence of
the Employment Types thread, and third overall occurrence of the
Benefits gap flagged at the top of this file.

---

## 15. Offer Letter

**Confirmed existing (screenshot):** "Email [Candidate]" modal —
template picker, subject, message body, "Open in mail client" button.
No attachment support, no e-signature.

**15.1** Add the ability to **attach the offer letter** at this stage,
preferably as an **editable Word document** the candidate can review
and sign.

**15.2 Alternative/preferred option — DocuSign or equivalent
e-signature integration.** Send the offer letter directly for
electronic signing, with the signed document automatically captured
back into the system. Client presents this as the better option, not
just an alternative to the Word-doc approach — worth treating attachment
support as the minimum bar and e-signature as the target.

---

## 16. Recruitment — chronology check (confirmed correct, no action needed)

Client's ask: *"Could you check if the following are in chronological
order and included in Recruitment as stated in the employee lifecycle
below?"* — referencing the "Attract" stage screenshot (**Stage 3 of
8**: `Vacancy Published → Applications → Screening → Shortlist →
Interview → Offer`).

**Good news: this already matches.** `Lifecyle_Stages.docx` (previous
feedback round) specifies stage 3, "Attract," with the exact same flow:
`Vacancy Published → Applications → Screening → Shortlist → Interview →
Offer`. **No discrepancy found** — this can be confirmed back to the
client as correct rather than treated as an open item.

**Worth noting separately:** this screenshot is proof the 8-stage
lifecycle model from `Lifecyle_Stages.docx` is already being built into
the product as a real "Stage X of 8" UI pattern. That raises the stakes
on resolving the stage-naming inconsistency flagged in that document's
own feedback file (stages 7 and 8 were named differently in four
different places in that document) — if stage 3 is already live and
correctly labelled, stages 7 and 8 are presumably coming next and need
one settled name before they're built the same way.

---

## Suggested Phase Grouping

| Phase | Items |
|---|---|
| **P0 — Bugs, not features** | §2.1 Nigerian ID fields leaking into UK manual entry (data-integrity/tenant-scoping bug); §10.7 OH case showing contradictory closed/absent status |
| **P0 — Answer directly before scoping** | §1.3 self-invite data-flow question; §11.1 Benefits-module status question (ties to the xlsx feedback's open question too) |
| **P1 — Copy/config only** | §1.1 make 3 documents optional; §1.2 name casing; §10.1 28-day wording change; §10.4 Equality Act badge rename |
| **P2 — UI additions to existing screens** | §3.1 multiple assets; §9.1 surface existing Ref # to requester; §10.2 Next Action block; §10.3 filters/tabs; §10.6 summary card rework; §10.9 clickable OH cards; §12.1 Approximate Location column; §13.1 Last Login column; §14.1 Benefits column |
| **P3 — Data model / permissions** | §10.5 full Adjustments management fields; §10.8 role-based OH confidentiality enforcement |
| **P4 — Restructuring (overlaps existing work — merge, don't duplicate)** | §7.1–7.2 nav moves (→ Batch 3 §4); §8 Documents & Compliance redesign |
| **P5 — New feature builds** | §4.1 Approval Delegation & Escalation (full spec, continues the xlsx feedback's open question); §5.1 Kudos department/team recipient (confirm regression first); §6 new survey types; §8.3 "My Documents" self-service; §15.1–15.2 offer letter attachment/e-signature |
| **No action needed** | §16 — recruitment stage order already matches the lifecycle spec, confirmed correct |
