# MOTEE / MSL — Company Onboarding Wizard Feedback

Source: `Client_Login_Dashboard.xlsx` (sheet: `motee-onboarding-template`)

---

## ⚠️ Read this before scoping

**This is NOT the employee onboarding flow already logged in Batch 3.**
Despite sharing the word "onboarding," this spreadsheet is about the
**tenant/company setup wizard** — the flow a brand-new customer goes
through to configure their MOTEE instance (company name, terminology,
org structure, access model, roles, modules, approval rules). Batch 3
§2's "Onboarding" feedback was about individual **employee** onboarding
(P45s, right-to-work docs, digital declarations). These are two
completely different screens that happen to share a name — don't merge
this feedback into that backlog.

**The filename is also a bit of a red herring.** `Client_Login_Dashboard
.xlsx` suggests a login screen or a dashboard — the actual content has
nothing to do with either. It's entirely about the company-setup wizard.
Worth knowing so nobody goes looking for "login" changes that aren't
actually in here.

**Format note:** this feedback arrived as annotations layered directly
onto a data template (one real example row: "Acme Corp"), with comments
placed in the columns they relate to, plus 8 embedded screenshots.
Everything below is organized by wizard field/step instead, since that's
more useful for scoping than the raw cell layout.

---

## Confirmed Existing — Current Wizard Data Model

The template's real row confirms the wizard currently captures:

```
companyName: Acme Corp
industry: Technology
companySize: 50-200
country: Nigeria
companyEmailDomain: acme.com
managerTitle: Line Manager
departmentLabel: Department
structureType: hierarchical
accessControlModel: RBAC
roles: Admin, HR, Manager, Employee
permissions: view_employees, approve_leave
enabledModules: employee-management, attendance, leave-management
leaveApproval: manager
multiLevelApproval: False
managerLabel: Manager
employeeIdLabel: Employee ID
```

**Fields with no feedback at all** (clean, no action needed):
`companyName`, `companySize`, `country`, `companyEmailDomain`,
`managerLabel`, `employeeIdLabel`.

---

## 1. `industry` field

One ambiguous annotation: **"company policy? Missing here."**

Not enough context to build from as-is — could mean:
(a) a **Company Policy** field/step is missing from the wizard entirely, or
(b) the client expected industry selection to surface relevant policy
    templates and it doesn't.
Flag this one directly with the client rather than guessing — it's a
genuinely different scope depending on which they meant.

---

## 2. `managerTitle` / `departmentLabel` — terminology customization step

**Current:** wizard lets a tenant relabel what they call a manager and
what they call a department (sample: "Line Manager" / "Department").

**Requested prompt copy:**
- For `managerTitle`: *"What do you call your supervisor?"*
- For `departmentLabel`: client's sheet also says "What do you call
  supervisor" here — almost certainly copy-pasted by mistake. The
  correct question for this field should ask about the **grouping**
  (e.g. *"What do you call a department/team in your organisation?"*),
  not repeat the manager question. Flag and fix the copy-paste, don't
  ship the duplicate wording.

**Suggested example options to show the user:**

| managerTitle examples | departmentLabel examples |
|---|---|
| Team leader | Teams |
| Line Manager | unit |
| Supervisor | Division |
| Custom | custom |

**Also requested:** add tooltips to both fields (currently none).

---

## 3. `structureType` — organisation structure step

**Current:** two options — Hierarchical, Flat.

**Add a third option: Matrix Structure.** Client's full definition,
meant to appear as explanatory copy:
> "A Matrix Structure is an organisation structure where an employee
> reports to more than one manager. Instead of having a single
> reporting line, employees typically have: 1. A Functional Manager
> (their department manager) 2. A Project Manager (the manager for a
> specific project)."

**Add descriptive subtext under all three options**, with a
"Recommended for..." framing:

| Option | Description |
|---|---|
| Hierarchical | "Recommended for traditional organisations — a traditional reporting structure where authority flows from the top down." |
| Flat | "Recommended for startups and small businesses — a structure with very few management layers (minimal hierarchy, everyone reports to a central point)." |
| Matrix | "Recommended for enterprise and project-based organisations." |

**Add an information tooltip** on this field generally (separate ask,
confirmed by a dedicated annotation in the sheet).

**Additional enhancement — small visual diagram beside each option:**
```
Hierarchical          Flat                    Matrix
CEO                   CEO                     Engineering Manager ↘
 ↓                     ├─ Staff                              Employee
Manager                ├─ Staff                Project Manager ↗
 ↓                     ├─ Staff
Staff                  └─ Staff
```
Client's stated rationale: *"Users immediately understand the
difference without reading lengthy descriptions."*

---

## 4. `accessControlModel` — access control step

**Current:** sample data shows RBAC as the value; underlying options
include RBAC, Permission-Based, and Hybrid (per the descriptive text
supplied).

**Add descriptions to each option:**

| Option | Description |
|---|---|
| RBAC | "Users are assigned a role, and permissions are inherited from that role." — Recommended for most organisations |
| Permission-Based | "Permissions are assigned individually rather than through roles." — Advanced security configuration |
| Hybrid | "Start with roles and then add or remove individual permissions." — Recommended for enterprise organisations |

**Add an information tooltip (ⓘ) next to each option label**, showing
the same descriptions above on hover/tap — this was specified as a
distinct, more compact alternative to permanently-visible subtext, so
confirm with the client which presentation they actually want (inline
description vs. hover tooltip) rather than building both.

**Add a "Recommended" badge** on whichever option the wizard nudges
users toward.

**Final recommendation, stated explicitly by the client:**
```
Default Selection: ✅ Role-Based (RBAC) — "Most customers will use this."
Enterprise Recommendation: ⭐ Hybrid — "Best for growing and enterprise
organisations requiring both role-based access and permission exceptions."
```
i.e. RBAC should be the pre-selected default, but Hybrid should carry a
visible "recommended for enterprise" badge as a nudge for larger tenants.

---

## 5. `roles` / `permissions` — roles & permissions step

**Requested step label:** "Define and rename Roles" (currently appears
to just show the raw field name).

**Add tooltips** to this step (no detail given on content — confirm
scope with the client before building placeholder tooltips).

---

## 6. `enabledModules` — module selection step

**Confirmed current state (screenshot):** the module picker shows only
five tiles — **Employee Management, Attendance, Payroll, Recruitment,
Performance** — with no descriptions, just the name.

**Two separate problems here, don't conflate them:**

**(a) Missing modules.** The client flagged this directly: *"Missing
Learning & Training & Benefits."* Worth noting a real inconsistency
while you're in there: the sample data's `enabledModules` value already
includes `leave-management` (`employee-management,attendance,
leave-management`), but **Leave Management isn't one of the five tiles
shown in the picker screenshot at all.** So Leave Management exists in
the data model but isn't actually selectable in this screen — that's
worth fixing alongside adding Learning and Benefits, not a separate
follow-up.

**(b) No descriptions on any tile.** Client rated this "Areas for
Improvement #1" with 5 stars — highest-emphasis item in the whole sheet.
Add a one-line description to every module tile:

| Module | Description |
|---|---|
| Employee Management | Employee records, onboarding, documents and ESS |
| Attendance | Time tracking, shifts, GPS attendance and compliance |
| Leave Management | Leave requests, approvals and leave balances |
| Recruitment | Job requisitions, candidates and hiring pipeline |
| Performance | Goals, appraisals and performance reviews |
| Learning | Training, certifications and development plans |
| Payroll | Salary processing, taxes and payslips |
| Benefits | Pension, insurance, allowances and employee wellbeing programmes |

That's 8 modules total once Leave Management, Learning, and Benefits
are all properly represented as selectable tiles.

---

## 7. `leaveApproval` / `multiLevelApproval` — approval configuration step

**Direct question from the client, written in caps in the sheet —
answer this explicitly, don't just fold it into a build task:**
> "PLEASE DO WE CURRENTLY HAVE APPROVAL DELEGATION"

This reads as the client genuinely not knowing whether the system
already supports delegation and wanting a direct answer before deciding
what else to ask for here.

**Requested additions to this step:**
- Workflow diagrams
- Recommended badges
- Escalation rules
- Approval delegation
- Process-specific workflows
- Advanced auto-approval conditions

**Additional feature request — live Workflow Preview.** As the tenant
picks approvers during setup, show a dynamic preview of the resulting
chain. Example given:
```
Selected: Manager & HR

Workflow Preview
Employee → Manager → HR → Approved
```
Client's framing: *"This would make the setup experience feel much
more polished."* This should update live as approver selections
change, not just render once.

---

## Suggested Phase Grouping

| Phase | Items |
|---|---|
| **P0 — Answer directly, don't scope as a build yet** | §1 "company policy? Missing here" — ask the client what they meant; §7 "do we currently have approval delegation" — this is a factual question about existing capability, answer it before promising new delegation features |
| **P1 — Copy/content only** | §2 terminology prompt copy (fix the copy-pasted duplicate question), §3 structure-type descriptions, §4 access-control descriptions, §6 module descriptions |
| **P2 — UI additions to existing screens** | §2 tooltips, §3 tooltip + visual diagrams, §4 tooltips + Recommended badge, §5 tooltips |
| **P3 — Data model / new options** | §3 add Matrix as a third structure type, §6 add Leave Management as a selectable tile (already in data, missing from UI) + add Learning and Benefits as new modules entirely |
| **P4 — Defaults & recommendations logic** | §4 set RBAC as pre-selected default, surface Hybrid as the enterprise-recommended option with badge |
| **P5 — New feature work** | §7 workflow diagrams, escalation rules, process-specific workflows, advanced auto-approval conditions, and the live Workflow Preview (the last one is the most concrete/buildable of this group — the rest need scoping detail before estimation) |
