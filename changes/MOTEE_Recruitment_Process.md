# MOTEE — The Recruitment Process, End to End

**From "we need someone" to "they are an employee."**

This document describes how hiring works in MOTEE today: the seven stages a hire passes through, who acts at each one, what the system does on its own, and where the record goes next. It is written to be read by anyone in HR, not only by the person who configured the system.

A companion document, `MOTEE_Recruitment_UX_Recommendations.md`, covers what should change and why.

---

## The chain at a glance

```
  Headcount gap
        │
        ▼
  1. WORKFORCE REQUEST ──── approval ────▶  HR Manager → Finance → Executive
        │
        ▼
  2. REQUISITION ────────── approval ────▶  Line Manager → HR Manager → Finance
        │
        ▼
  3. RECRUITMENT (the live vacancy)
        │
        ▼
  4. CANDIDATE PIPELINE
        Applicant → Scheduled for Interview → Interviewed → Offer → Hired
        │
        ▼
  5. PRE-EMPLOYMENT  (offer signed, checks done)
        │
        ▼
  6. ONBOARDING
        │
        ▼
  7. EMPLOYEE
```

Each stage produces a record that becomes the input to the next. Nothing skips a step: you cannot raise a requisition without an approved workforce request, and you cannot open a vacancy without an approved requisition. The system enforces this — the requisition builder's first step is a dropdown of *approved workforce requests only*, and the recruitment builder's first step is a dropdown of *approved requisitions only*.

---

## Stage 1 — Workforce Request

**The question it answers:** do we agree this headcount is needed and funded?

**Where it lives:** `Employee Management → Workforce Requests`

A department head raises a request stating the department, the number of hires, the reason, the estimated budget, the urgency and the expected start date. Requests can also be started directly from the **Headcount Gap Report**, which pre-fills the department, the number of hires and the reason.

The request captures *why* the headcount is needed — new position, replacement, internal transfer, or seasonal — because that drives how closely it is scrutinised. It also captures a cost centre code, which is how Finance books the spend.

**Approval chain (three desks, in order):**

| Order | Task | Reviewer |
|---|---|---|
| 1 | Review role justification | HR Manager |
| 2 | Confirm budget availability | Finance |
| 3 | Executive authorization | Executive |

**Statuses you will see:** Draft → Pending Approval → Approved / Rejected / Returned → Converted to Requisition.

**RACI**

| | Who |
|---|---|
| **Responsible** (does the work) | Department head / requesting manager |
| **Accountable** (owns the outcome) | HR Manager |
| **Consulted** | Finance (budget), Executive (authorisation) |
| **Informed** | The recruiter who will eventually run the hire |

**What happens next:** once approved, an "Create requisition" action carries the request straight into Stage 2 with its department, positions, start date and budget pre-filled. The original request is then stamped *Converted*.

---

## Stage 2 — Requisition

**The question it answers:** what exactly is the job, and who is going to run this hire?

**Where it lives:** `Employee Management → Requisition`

This is where the abstract headcount becomes a specific role. The requisition is built in a **three-step wizard**:

1. **Select workforce** — pick the approved workforce request this comes from.
2. **Requisition details** — job title, department, location, number of positions, salary band (name, min, max, currency), start date, duration, budget allocation, job description (written, from a template, or uploaded) and required qualifications.
3. **Review & submit** — save as draft, or submit for approval.

Step 2 is also where the **hiring team** is named for the first time:

- **Reporting Manager** — who the hire will report to
- **Hiring Manager** — *owns the hire*
- **Recruiter** — *runs the pipeline*
- **HR Business Partner**
- **Interview Panel**

> ⚠️ **Known gap.** These five fields are captured here, but only the Hiring Manager is carried forward into Stage 3. The recruiter, HR business partner and interview panel are dropped at the hop. This is a primary cause of the "who is doing what?" confusion and is the first thing addressed in the recommendations document.

**Approval chain (three desks, in order):**

| Order | Task | Reviewer |
|---|---|---|
| 1 | Approve role need | Line Manager |
| 2 | Confirm headcount & grade | HR Manager |
| 3 | Budget approval | Finance |

**RACI**

| | Who |
|---|---|
| **Responsible** | Hiring Manager (defines the role) |
| **Accountable** | HR Manager |
| **Consulted** | Line Manager, Finance |
| **Informed** | Recruiter, HR Business Partner, interview panel |

---

## Stage 3 — Recruitment (the live vacancy)

**The question it answers:** how do we advertise this, and how will applicants be assessed?

**Where it lives:** `Employee Management → Recruitment`

The approved requisition becomes an advertised vacancy through a **six-step, full-page builder**:

| Step | What it sets |
|---|---|
| 1 | **Select requisition** — the approved requisition this vacancy comes from |
| 2 | **Requisition details** — role, work mode, experience level, education, pay period |
| 3 | **Application form** — the questions applicants answer (short text, dropdown, file upload, yes/no, etc.) |
| 4 | **Job advert** — the board-facing copy |
| 5 | **Publish settings** — which platforms, scheduled publish date, auto-close on expiry |
| 6 | **Review** — save as draft, or publish |

Before publishing, the system checks the vacancy is complete. **Blocking problems** (a missing job description, no hiring manager, no posting platforms) stop the publish. **Advisory warnings** (no application questions, no salary, no assessment flow) let it through with a caution.

Step 3 is also where **stage gates** are configured — the rules that decide whether an applicant advances automatically, stays put, or is rejected. Gates can be criteria-based (field conditions) or quiz-based (a scored questionnaire with a pass threshold).

> ⚠️ **Known gap.** Every gate currently defaults to *manual*, so no applicant is ever auto-advanced or auto-rejected. The criteria and quiz engines are built and tested but never invoked. Likewise, scheduled publishing and auto-close-on-expiry are captured but never act.

**RACI**

| | Who |
|---|---|
| **Responsible** | Recruiter |
| **Accountable** | Hiring Manager |
| **Consulted** | HR Business Partner |
| **Informed** | Finance |

---

## Stage 4 — The Candidate Pipeline

**The question it answers:** who are we hiring?

**Where it lives:** `Employee Management → Recruitment → [open the vacancy]`

Every candidate walks a five-stage line, in order:

```
Applicant → Scheduled for Interview → Interviewed → Offer → Hired
```

The pipeline can be viewed two ways — as a **table** (one tab per stage) or as a **Kanban board** with drag-and-drop. Both enforce the same rules.

### The rules that govern movement

The system will refuse a move and tell you why:

| Attempted move | Refused when | Message |
|---|---|---|
| Any move | The candidate is already in that stage | — |
| Any move | The candidate has been rejected | "Restore them first." |
| Skipping ahead | More than one stage at a time | "Move them through *[next stage]* first." |
| → Interviewed | No interview scorecard exists | "Score their interview before moving them on." |
| → Hired | No accepted offer | "They have not accepted yet" / "They declined" / "No offer sent" |

Each candidate has a detail drawer with eight tabs: Profile, Application, Interviews, Score, Comms, Offers, Files, and References.

### The offer sequence — three separate actions

This is the part of the process most often misread. Sending, signing and accepting an offer are **three distinct events**, and a fourth action is needed to start onboarding:

1. **Send offer** — attaches the offer document, emails the candidate a signing link, marks the offer *Sent*.
2. **Candidate signs** — via the Docu-Sign page. This sets the signature status to *Signed*.
3. **Record acceptance** — HR separately records that the candidate accepted. *This* is what unlocks the Hired stage and moves them there automatically.
4. **Send onboarding invite** — a further, manual click.

> ⚠️ **Known gap.** A signature is not an acceptance, and an acceptance does not start onboarding. Steps 2, 3 and 4 are independent, so a candidate can sit signed-but-not-accepted, or hired-but-not-onboarded, with nothing flagging it.

**RACI**

| | Who |
|---|---|
| **Responsible** | Recruiter (pipeline), Interview Panel (assessment) |
| **Accountable** | Hiring Manager (the hire decision) |
| **Consulted** | HR Business Partner |
| **Informed** | Finance (offer salary), IT (start date) |

---

## Stage 5 — Pre-employment

**The question it answers:** are they cleared to start?

This is where references, guarantor checks, right-to-work verification and role-specific background checks belong. The intent is that a care worker, an accountant and a software engineer each get a *different* set of checks driven by rules, not one fixed checklist everyone walks through.

> ⚠️ **Known gap — this stage has no home.** There is no pre-employment route; the lifecycle map points this stage at the onboarding screen. The References tab composes an email but stores nothing. No offer letter is generated. There is no metric for this stage anywhere in the system, because no data source feeds it.

---

## Stage 6 — Onboarding

**The question it answers:** are they set up to succeed from day one?

**Where it lives:** `Employee Management → Onboarding`

A hire can enter onboarding three ways: **invited** (sent from the recruitment pipeline), **manual** (HR fills a wizard directly), or **bulk** (imported).

Onboarding has two halves running in parallel.

**The new joiner completes** a self-service wizard at a link they receive by email — no account needed. The steps adapt by country: Nigeria includes guarantors; the UK includes tax.

| Nigeria | UK |
|---|---|
| Personal → Financial → Documents → **Guarantors** → Emergency → Review | Personal → Financial → Documents → Emergency → **Tax** → Review |

Drafts save as they go, so a joiner can stop and resume. On submission, the record moves to *Awaiting review*, and HR approves, requests changes, or rejects.

**HR completes** the employment side — employee ID, position, manager, salary, start date, probation, working pattern and cost centre — plus a compliance checklist: personal details reviewed, right to work verified, bank verified, payroll created, contract issued, equipment assigned, manager notified, induction booked.

**The task list.** Each onboarding record carries a task list, and each task names a reviewer who must approve it. Onboarding stages run `Pre-boarding → Day One → First Week → 30 Day → 60 Day → 90 Day → Completed`.

> ⚠️ **Known gap — this is the root of the "who is doing what" problem.** The task list is generated from the *approval chain*, which is a list of **reviewers**, not doers. The system then guesses the doer by searching the reviewer's job title for a keyword. Because "Recru**it**er" and "Aud**it**or" both contain the letters "it", tasks reviewed by a Recruiter or an Auditor are assigned to **IT**. Due dates are sequential placeholders — Day 0, Day 1, Day 2 — and are never set from anything real.

**RACI**

| | Who |
|---|---|
| **Responsible** | New joiner (their details), HR Admin (employment setup), IT (equipment & accounts) |
| **Accountable** | HR Admin |
| **Consulted** | Line Manager (induction), Finance (payroll) |
| **Informed** | Hiring Manager |

---

## Stage 7 — Employee

**The question it answers:** are they on the books?

When the **last required onboarding task is approved**, the system automatically converts the onboarding record into an employee record and files it under Employees with the status *Onboarded*. The onboarding record is removed from the active list at the same moment. A notification confirms it.

Until that point, in-flight hires appear on the Employees screen under a **Pending** tab, so nobody is invisible while they are being onboarded.

> ⚠️ **Known gap.** The link runs one way. The new employee record does not carry a reference back to the candidate they came from, so you cannot open an employee and ask "which vacancy did this person come through?"

---

## Who holds which role

Two vocabularies exist side by side, and the difference matters:

- **Job roles** (HR Admin, HR Manager, Finance, Line Manager, Recruiter, IT Admin, Executive) — these are what approval chains and workflows point at.
- **Access levels** (18 of them, e.g. HR Admin, Finance, Recruiter, Payroll Administrator, Facilities Manager) — these decide which screens someone can open.

A job role is linked to exactly one employee and one access level.

> ⚠️ **Known gap.** In the demo data, **HR Admin, HR Manager and Recruiter all resolve to the same person.** A three-step approval chain therefore lands on one human three times, which makes every chain look meaningless. Separately, **Hiring Manager is not a role at all** — it is a free-text field on the requisition, so it can never be an approver and can never own a task.

---

## Summary of the gaps

Collected here so they can be tracked. All are addressed in `MOTEE_Recruitment_UX_Recommendations.md`.

| # | Stage | Gap |
|---|---|---|
| 1 | 2 → 3 | Recruiter, HR Business Partner and interview panel are dropped between Requisition and Recruitment |
| 2 | 3 | Stage gates, scheduled publish and auto-close are configured but never act |
| 3 | 4 | Candidates have no owner — the pipeline is a shared inbox |
| 4 | 4 | Interviews are created with an empty panel, so double-booking is never detected |
| 5 | 4 | Sign ≠ accept ≠ onboard: three manual clicks with nothing flagging a stall |
| 6 | 5 | Pre-employment has no screen, no stored references, no generated offer letter |
| 7 | 6 | Task owners are guessed from reviewer job titles; "Recruiter" and "Auditor" route to IT |
| 8 | 6 | Task due dates are placeholders, never derived from the start date |
| 9 | 7 | No back-link from employee to the candidate they came from |
| 10 | All | Three job roles map to one person; Hiring Manager is not a role |
| 11 | All | Notifications go to one shared list with no recipient; sidebar counts are fixed numbers |
