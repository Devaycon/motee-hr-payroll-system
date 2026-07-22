# MOTEE / MSL HR Platform — Client Feedback Change Log

Source: `System_Correction.docx` (89 annotated screenshots + inline instructions)

**Coverage note:** items marked `[VERIFIED]` were read directly from the annotated screenshot. Items marked `[TEXT-ONLY]` come from the document's written instructions where the accompanying screenshot could not be read. Items marked `[UNREAD]` are placeholders where a screenshot exists but its content is unknown — these need a manual look before building.

---

## 1. DASHBOARD — Welcome Card

| # | Change | Detail | Status |
|---|---|---|---|
| 1.1 | Bold the welcome text | `Welcome back, William!` and subtitle to be bolded | `[VERIFIED]` |
| 1.2 | Reduce card height | Hero card too tall — compress "as discussed" | `[VERIFIED]` |
| 1.3 | Exact copy | L1: **Welcome back, William!** · L2: **Here's an overview of today's workforce activity and key HR metrics.** | `[VERIFIED]` |

Current copy being replaced: *"Stay on top of employee activities, workforce updates, and HR operations from one place."*

---

## 2. DASHBOARD — KPI Card **Titles** (9 renames)

> This table was missing from my first pass. It is a separate set of changes from the sub-label renames in section 3.

| Current | New | Status |
|---|---|---|
| Total Employees | **Total Employees** (no change — client ticked it) | `[VERIFIED]` |
| New Hire This Month | **New Hires This Month** | `[VERIFIED]` |
| Leavers This Month | **Employee Leavers** *or* **Leavers This Month** (client offered both) | `[VERIFIED]` |
| Remote Employees Today | **Employees Working Remotely Today** | `[VERIFIED]` |
| Birthdays (Next 7 Days) | **Upcoming Birthdays** | `[VERIFIED]` |
| Annual Leave | **Annual Leave Requests** | `[VERIFIED]` |
| Sick Leave | **Sick Leave Requests** | `[VERIFIED]` |
| Other Leave Types | **Other Leave Requests** | `[VERIFIED]` |
| Turnover Rate | **Employee Turnover Rate** | `[VERIFIED]` |

---

## 3. DASHBOARD — KPI Card **Sub-labels** (7 renames)

| Current | New | Status |
|---|---|---|
| Active headcount | **Active employees** | `[VERIFIED]` |
| Joined this month | **Employees hired this month** | `[VERIFIED]` |
| Left this month | **Employees who left this month** | `[VERIFIED]` |
| Within next 7 days | **Celebrating within the next 7 days** | `[VERIFIED]` |
| Active sick leave requests | **Current sick leave requests** | `[VERIFIED]` |
| Other active leave types | **Other leave requests** | `[VERIFIED]` |
| ↓1.3% vs last quarter | **1.3% lower than last quarter** (drop the arrow glyph) | `[VERIFIED]` |

---

## 4. DASHBOARD — Attendance Chart

| # | Change | Detail | Status |
|---|---|---|---|
| 4.1 | Rename chart | "Attendance Overview" → **Attendance Trends** | `[VERIFIED]` |
| 4.2 | Thin out X-axis labels | Currently every single date (06 Oct, 07 Oct, 08 Oct, 09 Oct…). Client wants **every 2nd or 3rd date**. Worked example steps in 4s: 06 Oct, 10 Oct, 14 Oct, 18 Oct, 22 Oct, 26 Oct, 30 Oct, 03 Nov, 07 Nov, 11 Nov | `[VERIFIED]` |
| 4.3 | Redesign the summary row into **KPI badges** | Current flat list: `Avg present 12 / Avg late 4 / Avg absent 1`. New grouped badge block titled **"Average Attendance"** with coloured dots: 🟢 Present 12 · 🟠 Late 4 · 🟣 Absent 1. Rationale: "stronger visual separation" | `[VERIFIED]` |
| 4.4 | More whitespace | Client: "This creates more breathing space" | `[VERIFIED]` |

---

## 5. ⚠️ CRITICAL BUG — Attendance Rate Calculation

Client flagged this as **"One Critical Issue to Fix Before Release."** This is the only item in the entire document escalated to blocker status.

```
Present / Attended : 1,042
Absent / Leave     :    46
Total Records      : 1,088

Correct rate = 1042 / 1088 × 100 = 95.8%
Gauge currently displays 50%
```

**Action:** the attendance gauge must show ~**96%**, not 50%. Client's note: once corrected and terminology made consistent, the section will be on par with the rest of the dashboard.

`[VERIFIED]`

---

## 6. DASHBOARD — HR Action Centre (formerly Pending Approvals)

| # | Change | Detail | Status |
|---|---|---|---|
| 6.1 | Rename section | "Pending Approvals & Alerts" → **HR Action Centre** (British spelling) | `[TEXT-ONLY]` |
| 6.2 | Rename counter | "56 open" → **56 Open Items** | `[TEXT-ONLY]` |
| 6.3 | Add Due Dates | Every action/approval row must show a due date | `[TEXT-ONLY]` |

### 6.4 Shorten category labels `[VERIFIED]`

| Current | New |
|---|---|
| Right to Work & Compliance | **Right to Work** |
| Employee Data Compliance | **Employee Data** |
| Payroll & Finance | **Payroll** |
| Recruitment & Talent | **Recruitment** |
| Employee Relations | **Employee Relations** (unchanged) |

Rationale: *"The screen becomes cleaner while still being clear."*

### 6.5 Vary the icons `[VERIFIED]`

Currently **every row uses the same shield icon.** Client wants distinct icons per issue type:

- 🛡️ Right to Work
- 📄 P45
- 🛂 Visa
- 👤 Employee Data
- 💵 Payroll
- 📋 Checklist
- 📁 Document Missing

Rationale: *"Users recognise categories much faster through iconography."*

### 6.6 Countdown wording — "biggest improvement I'd recommend" `[VERIFIED]`

| Current | Better |
|---|---|
| `Visa expiry within 90 days` | **`Visa expires in 68 days`** |

Show the **actual remaining days**, not the policy threshold bucket. Apply this pattern to every expiry/deadline string in the action centre.

### 6.7 Employee identity line `[VERIFIED]`

| Current | Better |
|---|---|
| Oliver Hughes<br>Operations | Oliver Hughes<br>**Operations • Employee ID: 10238** |

Combine department and employee ID onto one meta line.

---

## 7. GLOBAL NAVIGATION — Sidebar / Module Names

Client: *"Shorter labels reduce visual clutter without losing meaning."* `[VERIFIED]`

| Current | New |
|---|---|
| Performance Management | **Performance** |
| Leave & Attendance | **Leave & Attendance** (no change — ticked) |
| Learning & Compliance | **Learning** (or keep if compliance training is included) |
| IT & Asset | **IT & Assets** |
| Management Action Items | **Management Actions** |
| Executive / HR Risk | **HR Risk** |
| Self-Onboarding | **Onboarding** |

---

## 8. GLOBAL SEARCH

| # | Change | Detail | Status |
|---|---|---|---|
| 8.1 | Make the search bar **global** | Current placeholder: *"Search employees, documents…"* — scoped too narrowly | `[VERIFIED]` |
| 8.2 | New placeholder text | **"Search employees, leave, payroll, assets, documents and more."** | `[VERIFIED]` |

Search must span: employees, leave, payroll, assets, documents — and more.

---

## 9. WORKFORCE CHART (Employment Type)

| # | Element | Current | New | Status |
|---|---|---|---|---|
| 9.1 | Chart title | Employment Type | **Employment Type Distribution** *or* **Workforce by Employment Type** | `[VERIFIED]` |
| 9.2 | Chart subtitle | Workforce by contract type | **Employee distribution by employment type** *or* **Workforce composition** | `[VERIFIED]` |

Client's reasoning on 9.2: *"Intern is not a contract type in many organisations"* — so calling it a contract-type breakdown is factually wrong. On 9.1: the title should say distribution *because the chart represents a distribution*.

---

## 10. EMPLOYEE PROFILE — Header & Cards

| # | Change | Detail | Status |
|---|---|---|---|
| 10.1 | Leave balance wording | "321 days leave remaining" → **321 days Available** | `[TEXT-ONLY]` |
| 10.2 | **Tenure — reformat and move up** | Current: `6 years 11 months`. New three-line block: **Employee since / July 2019 / 6 Years 11 Months**. Client: *"I would actually move it higher"* — promote it in the visual hierarchy. Rationale: gives users a stronger sense of employment history | `[VERIFIED]` |
| 10.3 | **Line Manager Card — expand** | Current: `Arjun Taylor / CEO`. New: **Arjun Taylor / Chief Executive Officer / ✉️ Email / 📞 Phone / View Profile →**. Spell out the full job title, add contact actions and a profile link. Rationale: *"This makes collaboration easier"* | `[VERIFIED]` |

---

## 11. EMPLOYEE PROFILE — Tabs

| # | Change | Detail | Status |
|---|---|---|---|
| 11.1 | Rename tab | "My Requests" → **Profile Change Requests** | `[VERIFIED]` |

Tab bar confirmed as: Details · Contact · Address · Bank · ~~My Requests~~ → **Profile Change Requests**

---

## 12. EMPLOYEE PROFILE — Documents Tab

| # | Change | Detail | Status |
|---|---|---|---|
| 12.1 | Rewrite subtitle | *"ID numbers, KYC pack and all submitted documents — switch type with the tabs."* → **"Manage employee identification, compliance and employment documents."** | `[VERIFIED]` |
| 12.2 | Add an **"Expired"** KPI | Add a KPI card: **Expired / 0**. Client: *"This is often more actionable than 'Pending.'"* | `[VERIFIED]` |
| 12.3 | Override-warning dialog | Confirmed existing modal — *"Override system-driven data? Document records are managed by the document module. Adding one here overrides system-driven data for this employee and may diverge from the source until reconciled. Continue?"* with Cancel / I understand, continue. Appears retained as-is | `[VERIFIED]` |

---

## 13. WORK PATTERN & HOLIDAY ALLOWANCE

### 13.1 Add missing subtitle `[TEXT-ONLY]`
**"View and manage an employee's working pattern, contracted hours and holiday entitlement."**

### 13.2 Contract type formatting `[VERIFIED]`

| Current | Display as |
|---|---|
| `Part_time` | **Part-Time** |

Client: *"This looks like a database value… Keep database formatting hidden from users."*
**Apply globally** — every enum surfaced to the UI needs a display transform.

### 13.3 Replace the work pattern layout `[VERIFIED]`

**Current (rejected):** a two-column key/value dump — `MON start: 09:00` / `MON end: 15:30` / `TUE start: 09:00` / `TUE end: 17:30` … 14 separate rows split awkwardly across columns.

**Required — "Recommended Layout":**

| Day | Start | End | Hours |
|---|---|---|---|
| Monday | 09:00 | 15:30 | 6.5 |
| Tuesday | 09:00 | 17:30 | 8.5 |
| Wednesday | 09:00 | 17:30 | 8.5 |
| Thursday | — | — | Off |
| Friday | — | — | Off |
| Saturday | — | — | Off |
| Sunday | — | — | Off |

Note: **Hours column is computed per day**, and non-working days show **"Off"** rather than a dash. Client: *"This format is much easier to read and immediately shows the employee's schedule."*

### 13.4 Holiday Allowance — show the breakdown `[VERIFIED]`

| Instead of | Show |
|---|---|
| `25 Holiday Days` | **Annual Entitlement 25 Days**<br>**Taken 12**<br>**Remaining 13** |

Rationale: *"This gives immediate context."*

### 13.5 Public Holidays — clarify the treatment `[VERIFIED]`

Currently just displays `8`. Client wants it explicit whether public holidays are:
- Included in entitlement, **or**
- In addition to entitlement

Accepted formats:
- **8 Public Holidays (in addition to annual leave)**
- **Public Holiday Entitlement: 8 Days**

This is a **data-model question, not just copy** — the system needs to know which model the tenant uses.

---

## 14. LEAVE MODULE — Naming & Copy

| # | Element | Current | New | Status |
|---|---|---|---|---|
| 14.1 | Module name | Leave | **Leave Management** *or* **Leave & Absence** | `[VERIFIED]` |
| 14.2 | Module subtitle | "Submit a new leave request or manage your existing ones." | **"View your leave balances, submit requests and track approval status."** | `[VERIFIED]` |
| 14.3 | Primary button | `+ New Request` | **`+ Request Leave`** *or* **`+ New Leave Request`** | `[VERIFIED]` |

Client on 14.1: *"This better reflects both leave balances and requests."* On 14.2 the current copy was rated "Very good" — the change is to make it more descriptive, not to fix an error.

### 14.4 Minor wording table `[VERIFIED]`

| Current | New |
|---|---|
| Leave | Leave Management |
| New Request | Request Leave |
| Annual Remaining | **Annual Leave Remaining** |
| Sick Remaining | **Sick Leave Remaining** |
| Compassionate Remaining | **Compassionate Leave Remaining** |
| Study Remaining | **Study Leave Remaining** |
| "No past leave requests." | **"No leave requests have been submitted yet."** |

---

## 15. LEAVE MODULE — Structural Additions

### 15.1 Leave History Table `[VERIFIED]`

Once requests exist, display these columns:

| Date | Leave Type | Days | Status | Approver |
|---|---|---|---|---|
| 12 Jul 2026 | Annual | 5 | Approved | Sarah Brown |
| 28 May 2026 | Sick | 2 | Approved | System |
| 18 Mar 2026 | Study | 1 | Pending | HR |

Note the **Approver** column supports a `System` value for auto-approved entries. Client: *"This provides meaningful history."*

### 15.2 Calendar View — "the biggest missing feature" `[VERIFIED]`

Client's framing: *"Employees think about leave using a calendar."*

Add a **monthly calendar** showing:
- Approved leave
- Pending leave
- Public holidays
- Company shutdowns

Company shutdowns is a **new data concept** — check whether the model supports it.

### 15.3 Leave Breakdown — five-value model, not just balances `[VERIFIED]`

Client explicitly said *"instead of only balances."* Required per leave type:

```
Annual Leave
  Entitlement  25
  Used          5
  Remaining    20
  Booked        3
  Available    17
```

**This is a modelling change, not a display change.** `Remaining` (25−5) and `Available` (25−5−3) are different numbers. Client: *"This is how many enterprise HR systems present leave because it distinguishes approved future leave from remaining entitlement."*

Ties directly to item 10.1 — "321 days Available" uses the `Available` figure.

### 15.4 Rejection reasons `[VERIFIED]`

When a request is rejected, display the reason:

```
Rejected
Reason
Project deadline during requested period.
```

Requires a mandatory reason field on the reject action.

### 15.5 Team Leave Calendar (Managers) `[VERIFIED]`

Managers need a clickable **"Team Leave Calendar"** to see who else is away.

### 15.6 Leave Policy tooltips `[TEXT-ONLY]`

Each leave type needs a **tooltip or quick link** explaining eligibility and rules. Client's rationale: compassionate leave often varies by organisation, so employees need policy info available inline to understand their entitlement.

---

## 16. SMART LEAVE ASSISTANT — Major New Feature

Client's explicit instruction: *"Because MSL aims to be an AI-powered HRIS, I would combine all four ideas into a **Smart Leave Assistant** rather than presenting them as separate features."*

Ship as **one panel on the Leave Dashboard**, not four features.

### 16.1 Suggested Leave Windows `[VERIFIED]`

**Inputs the engine must consume:**
- Team leave calendar
- Public holidays
- Existing approved leave
- Busy periods (optional)
- Minimum staffing rules

**Worked example — Engineering Team (10 employees):**

| Employee | Leave |
|---|---|
| Sarah | 4–8 Aug |
| David | 5–10 Aug |
| James | 6–8 Aug |

William requests 4–8 August. System detects three engineers already away and staffing below minimum.

**Required employee-facing UI:**

```
Request Annual Leave

Requested Dates
4–8 August

⚠  Staffing levels will be low during these dates.

Recommended Dates
✓  11–15 August
✓  18–22 August
✓  1–5 September
```

Employee picks one of the suggested periods. Client: *"Instead of just approving leave, MSL helps employees choose dates that are less likely to be rejected."*

### 16.2 Overlapping Leave Warnings `[VERIFIED]`

Fires at **approval time**, aimed at the manager.

**Worked example:** Customer Service, team size 12, policy = minimum 9 available. Sarah, James, David already approved. William submits.

**Required warning:**

```
Warning

Approving this request will leave only 8 employees available.

Minimum required coverage is 9.

Review carefully before approving.
```

Requires a **minimum coverage threshold** configurable per team/department.

**Stated benefits:** managers don't check calendars manually; system prevents accidental understaffing.

### 16.3 Leave Expiry Alerts `[VERIFIED]`

Client: *"This is one of my favourite features."*

**Policy rules to support:**
- Leave expires 31 December
- Carry-forward cap (e.g. 5 days)
- Anything above the cap is lost

**Worked example:** William has 12 days remaining, carry-forward allowed 5 days. On 1 November MSL displays:

```
Leave Alert

You have 12 days remaining.

Only 5 days may be carried forward.

Book your remaining leave before 31 December.
```

**Stated benefits:** employees don't lose leave unexpectedly · reduced complaints · better year-end workforce planning · reduced leave accrual liability.

### 16.4 HR-side "Employees At Risk" panel `[VERIFIED]`

On the HR Dashboard:

```
Employees At Risk
15 employees
Over 10 days remaining
View Employees →
```

Client: *"HR can proactively remind staff."*

### 16.5 Year-end usage recommendations `[TEXT-ONLY]`
Recommend employees use remaining annual leave before year-end.

---

## 17. SICKNESS MODULE

| # | Change | Detail | Status |
|---|---|---|---|
| 17.1 | Rename module | "Sickness" → **Sickness & Absence** *or* **Sickness Management**. Rationale: *"more professional and reflects the module's broader purpose"* | `[TEXT-ONLY]` |
| 17.2 | Rewrite subtitle | *"Sick-leave absences and Bradford Factor."* → **"View sickness history, absence trends, Bradford Factor and return-to-work records."** Rationale: *"This immediately tells users what the page contains"* | `[TEXT-ONLY]` |
| 17.3 | KPI cards | Flagged for change | `[UNREAD]` |
| 17.4 | KPI enhancement | Additional KPI work requested | `[UNREAD]` |
| 17.5 | Bradford Factor colour-coding | Rated ⭐⭐⭐⭐⭐ *"Excellent feature"* — **but** *"most employees won't know what the number means. I'd colour-code it."* Banding thresholds shown in an unread screenshot | `[TEXT-ONLY]` |
| 17.6 | Table columns | Current: From · To · Days · Reason · Status — rated "Good". Client wants additional columns; the specific list is in an unread screenshot | `[TEXT-ONLY]` |
| 17.7 | Return-to-Work Interview | Add as a tracked record/workflow step | `[UNREAD]` |

### 17.8 Replace "Personal" as a sickness reason `[TEXT-ONLY]`

Client: *"I'd avoid using Personal for sickness because it doesn't distinguish illness."*

New categories:
- Cold / Flu
- Migraine
- Musculoskeletal
- Mental Health
- Medical Appointment
- Surgery Recovery
- Other

**Confidentiality requirement:** *"If confidentiality is a concern, HR can categorise without exposing sensitive medical details to managers."* → build **role-based visibility** on the reason field. Managers see absence; HR sees category.

---

## 18. OCCUPATIONAL HEALTH — New Sub-Module

Client is explicit that **OH is not the same as normal sickness absence.** It is a formal process in which HR seeks advice from an Occupational Health professional regarding an employee's ability to work.

**What OH determines:**
- Whether an employee is fit to work
- Whether adjustments are required
- When an employee can safely return to work
- Whether the employee meets Equality Act 2010 (UK) requirements

### ⚠️ Data-privacy constraint

> *"The Occupational Health clinician does not tell the employer the employee's medical diagnosis. Instead, they advise on the employee's fitness for work and any workplace adjustments."*

The schema must make it **structurally impossible** to store or surface a diagnosis in the OH record. Store fitness status + recommended adjustments only.

### 18.1 Required workflow (implement as a state machine) `[TEXT-ONLY]`

```
Employee Reports Sick
        ↓
Absence Recorded
        ↓
System Monitors Duration
        ↓
28 Days Reached            ← automated trigger, not manual
        ↓
MSL Alerts HR
        ↓
Refer to Occupational Health
        ↓
Assessment Completed
        ↓
Recommendations Received
        ↓
HR Reviews
        ↓
Manager Implements Adjustments
        ↓
Employee Returns
        ↓
Return-to-Work Interview
        ↓
Case Closed
```

The **28-day threshold** should be tenant-configurable — 28 days is the UK convention but this is a multi-tenant platform.

---

## 19. EMPLOYEE / WORKER TYPES

| # | Change | Detail | Status |
|---|---|---|---|
| 19.1 | Add **field-based worker** to the worker type list | Existing list is in an unread screenshot | `[TEXT-ONLY]` |

---

## Cross-Cutting Themes

1. **UK localisation.** British spelling throughout: *Centre*, *organisation*, *favourite*, *analyses*, *recognise*. Equality Act 2010, Bradford Factor, P45, 28-day OH referral, and the 31 December leave year all confirm UK compliance context. Since MOTEE is multi-tenant across UK and Nigeria, decide which of these are tenant-configurable vs. hardcoded.
2. **Plain-English copy.** Systematic move from dashboard shorthand to full descriptive phrasing. Audit *every* label, not only the flagged ones.
3. **Never leak database values to the UI.** `Part_time` → `Part-Time` is the flagged instance; treat it as a global rule for all enums.
4. **Show real numbers, not policy buckets.** "Visa expiry within 90 days" → "Visa expires in 68 days." Same principle everywhere a threshold is displayed.
5. **Every module page needs a descriptive subtitle.** Several were missing entirely.
6. **Whitespace and density.** Cards too tall, labels too cramped, axes overcrowded. Global spacing pass.
7. **AI positioning.** Client repeatedly frames MSL as an "intelligent HR platform" / "AI-powered HRIS." The Smart Leave Assistant is the proof point — treat it as the flagship, not a nice-to-have.

---

## Work Breakdown

| Phase | Scope | Notes |
|---|---|---|
| **P0 — Blocker** | §5 Attendance rate calculation | Client called this out as the one thing to fix before release |
| **P1 — Copy & labels** | §1, §2, §3, §4.1, §6.1–6.2, §6.4, §7, §8.2, §9, §10.1, §11, §12.1, §13.1–13.2, §14 | Mostly string changes + one global enum formatter |
| **P2 — UI / layout** | §4.2–4.4, §6.3, §6.5–6.7, §10.2–10.3, §12.2, §13.3, §17.5 | Component-level rework |
| **P3 — Data model** | §13.4–13.5, §15.1, §15.3, §15.4, §17.8, §19.1 | Schema changes — do before P4 |
| **P4 — Feature builds** | §8.1 global search, §15.2 calendar, §15.5–15.6, §17.6–17.7 | |
| **P5 — Major builds** | §16 Smart Leave Assistant, §18 Occupational Health | Need workflow engine + rules config |

---

## Items Needing a Manual Look

These screenshots could not be read. Check them directly in the document before building:

**Confirmed to carry unique content (prose gives partial context only):**
- Images 76–80 — Sickness KPI cards, Bradford Factor colour bands, revised table columns
- Image 81 — Return-to-Work Interview design
- Images 82–88 — Occupational Health screens and referral detail
- Image 89 — current worker type list (to confirm where "field-based worker" slots in)
- Images 73–74 — Smart Leave Assistant combined panel mockup

**Unknown content:**
- Images 15, 24, 25, 28, 29, 30, 32, 33, 36, 37, 39, 40, 42, 45, 50, 51, 56, 59

The prose text for the Sickness and Occupational Health sections is fairly complete on its own, so the risk is concentrated in the visual specifics — Bradford banding thresholds and the exact Return-to-Work field set.
