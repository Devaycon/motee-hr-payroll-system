# Tenant Data Generation Plan

This document lists every module in the Motee HRIS system and the data that must be generated to fully populate a single tenant. Use it as the master checklist when seeding demo / staging / production-onboarding data.

> **Convention:** Modules are grouped by area (Platform → HR → Employee). Each module lists the core entity to seed, key fields, suggested record counts, and dependencies on other modules.

---

## 0. Tenant Foundation (seed FIRST)

These are the upstream entities every other module depends on. Generate them before anything else.

### 0.1 Tenant / Organization
- **Entity:** `Tenant`
- **Fields:** `id`, `name`, `slug`, `plan` (starter | growth | enterprise), `status` (active | trial | suspended), `industry`, `country`, `timezone`, `currency`, `logoUrl`, `primaryColor`, `createdAt`, `trialEndsAt`, `billingEmail`
- **Count:** 1 per tenant
- **Depends on:** —

### 0.2 Company Profile
- **Entity:** `CompanyProfile`
- **Fields:** legal name, RC number, TIN, addresses (HQ + branches), phone, support email, website, social handles, fiscal year start, workweek (Mon–Fri), mission, vision, values
- **Count:** 1
- **Depends on:** Tenant

### 0.3 Departments
- **Fields:** `id`, `name`, `code`, `parentDepartmentId`, `headEmployeeId`, `costCenter`, `headcountTarget`
- **Count:** 8–15 (e.g., Engineering, Product, People, Finance, Sales, Marketing, Operations, Customer Success, Legal, IT)
- **Depends on:** Tenant

### 0.4 Employment Types
- **Fields:** `id`, `name` (Full-time, Part-time, Contract, Intern, NYSC), `defaultLeaveDays`, `eligibleForBenefits`, `probationMonths`
- **Count:** 4–6
- **Depends on:** Tenant

### 0.5 Roles & Access Levels
- **Entities:** `Role`, `AccessLevel`, `Permission`
- **Fields:** role name, description, permission matrix (per module: view/create/edit/delete/approve)
- **Count:** ~10 roles (Super Admin, HR Admin, HR Manager, Finance, Line Manager, Employee, Recruiter, IT Admin, Auditor, Read-only)
- **Depends on:** Tenant

### 0.6 Organization Structure
- **Entity:** `OrgNode` (hierarchical)
- **Fields:** `employeeId`, `parentEmployeeId`, `level`, `reportsTo`
- **Count:** Mirrors employee list — 1 node per employee
- **Depends on:** Employees, Departments

---

## 1. Platform / Motee Admin Modules

These are visible to the Motee platform team (super-admin), not the tenant. Generate only if seeding the platform dashboard view.

| Module | Entity | Key Fields | Count |
|---|---|---|---|
| **Tenants** | `Tenant` | plan, status, MRR, seats used, last login | as needed (multi-tenant view) |
| **Billing** | `Invoice` | amount, currency, status (paid/unpaid/overdue), issuedAt, paidAt, planSnapshot | 12–24 per tenant |
| **Support** | `SupportTicket` | subject, severity, status, tenantId, openedAt, resolvedAt, agent | 20–40 |
| **Platform Stats** | `PlatformStats` | active tenants, MRR, churn, signups (daily/weekly/monthly) | rolling 90 days |
| **Settings** | platform-level config (regions, plans, feature flags) | — | 1 |

---

## 2. HR / Admin Modules

### 2.1 Employees (THE BACKBONE — seed second after foundation)
- **Entity:** `EmployeeRow`
- **Fields:** name, initials, email, phone, department, jobTitle, employmentType, status (active | on_leave | probation), startDate, salary, managerId, DOB, gender, nationality, marital status, address, state, country, workMode (remote/hybrid/onsite), workLocation, grade, bank details, emergency contact, NIN, passport, driver license, tax ID, pension ID, NHF number
- **Count:** 50–200 (recommended: 120 for realistic feel)
- **Depends on:** Departments, Employment Types, Roles
- **Notes:** Build a manager hierarchy 3–4 levels deep. Mix statuses (~80% active, 10% on_leave, 10% probation).

### 2.2 Headcount
- **Fields:** snapshots per month (total, by department, by employment type, joiners, leavers, attrition %)
- **Count:** 12–24 monthly snapshots
- **Depends on:** Employees

### 2.3 Workforce
- **Fields:** workforce analytics buckets (gender split, age bands, tenure bands, location, work mode)
- **Count:** computed aggregates
- **Depends on:** Employees

### 2.4 Contracts
- **Fields:** employeeId, type (employment/NDA/probation/contractor), template, signedDate, expiryDate, status, fileUrl, signatories
- **Count:** 1–3 per employee
- **Depends on:** Employees

### 2.5 Documents
- **Fields:** employeeId, category (ID, certificate, offer letter, payslip), name, fileUrl, uploadedAt, expiresAt, visibility
- **Count:** 4–8 per employee
- **Depends on:** Employees

### 2.6 Attendance
- **Fields:** employeeId, date, clockIn, clockOut, hoursWorked, status (present/late/absent/remote), location, source (web/mobile/biometric)
- **Count:** ~22 working days × employees × 3 months
- **Depends on:** Employees

### 2.7 Leave
- **Entities:** `LeavePolicy`, `LeaveBalance`, `LeaveRequest`
- **Fields:** leave types (annual, sick, maternity, paternity, study, compassionate), policy days, accrual, balance per employee, requests (start, end, days, reason, status, approver)
- **Count:** 5–8 leave types; balance per employee; 3–10 requests per employee
- **Depends on:** Employees

### 2.8 Recruitment
- **Entities:** `JobPosting`, `Candidate`, `Interview`, `Offer`
- **Fields:** job title, dept, location, status (open/closed/draft), candidates per stage (applied/screening/interview/offer/hired/rejected), interview schedule, offer details
- **Count:** 8–15 active postings, 20–40 candidates per posting
- **Depends on:** Departments, Employees (interviewers)

### 2.9 Onboarding
- **Entities:** `OnboardingTemplate`, `OnboardingJourney`, `OnboardingTask`
- **Fields:** template name, task list (pre-boarding/day 1/week 1/month 1), assignee, due date, completion status
- **Count:** 2–4 templates; 1 journey per new hire (last 90 days)
- **Depends on:** Employees, Tasks

### 2.10 Employee Checklist
- **Fields:** checklist items per stage (joining/probation/exit), owner, status
- **Count:** ~15–25 items per checklist
- **Depends on:** Employees

### 2.11 Offboarding
- **Entities:** `OffboardingCase`, `ExitInterview`, `ClearanceItem`
- **Fields:** employeeId, lastDay, reason (resigned/terminated/retired), clearance checklist (IT, Finance, Manager, HR), exit interview answers
- **Count:** 3–10 cases (historical + in-progress)
- **Depends on:** Employees, Assets

### 2.12 Performance
- **Entities:** `ReviewCycle`, `Goal`, `Review`, `OneOnOne`, `Feedback`
- **Fields:** cycle name (Q1/Q2/H1/Annual), goals (OKR/SMART), self-review, manager review, ratings, calibration, 1:1 notes
- **Count:** 2–4 cycles; 3–5 goals per employee; reviews for last 2 cycles
- **Depends on:** Employees

### 2.13 Learning
- **Entities:** `Course`, `Enrollment`, `Certification`
- **Fields:** course title, category, provider, duration, format, enrolled employees, progress %, completion date, certificate
- **Count:** 15–30 courses; 3–8 enrollments per employee
- **Depends on:** Employees

### 2.14 Assets
- **Fields:** asset tag, name, category (laptop/phone/monitor/access card/vehicle), serial, value, condition, assignedTo, assignedDate, returnDate, status (in-use/available/maintenance/retired)
- **Count:** 1.5× employee count (some have multiple)
- **Depends on:** Employees

### 2.15 Helpdesk
- **Entities:** `Ticket`, `TicketCategory`
- **Fields:** subject, category (IT/HR/Facilities/Finance), priority, status, requester, assignee, SLA, messages
- **Count:** 30–80
- **Depends on:** Employees

### 2.16 Grievance
- **Fields:** caseId, raisedBy (often anonymous), category, severity, status, assignedTo, timeline, resolution
- **Count:** 5–15
- **Depends on:** Employees

### 2.17 Suggestions
- **Fields:** title, description, submittedBy, category, votes, status (new/under-review/accepted/implemented/rejected)
- **Count:** 15–30
- **Depends on:** Employees

### 2.18 Surveys
- **Entities:** `Survey`, `Question`, `Response`
- **Fields:** survey title, type (engagement/pulse/eNPS/exit), questions, responses (anonymous or named), score
- **Count:** 3–6 surveys; 60–80% response rate
- **Depends on:** Employees

### 2.19 Announcements
- **Fields:** title, body, author, audience (all/dept/group), publishedAt, attachments, pinned, reactions
- **Count:** 15–30
- **Depends on:** Employees, Departments

### 2.20 Knowledge Base
- **Entities:** `Article`, `Category`
- **Fields:** title, category, author, body (markdown), tags, views, lastUpdated, visibility
- **Count:** 25–60 articles across 6–10 categories
- **Depends on:** Employees

### 2.21 Community
- **Entities:** `Post`, `Comment`, `Reaction`, `Group`
- **Fields:** post text, media, author, group, timestamp, reactions, comments
- **Count:** 50–150 posts; 5–10 groups
- **Depends on:** Employees

### 2.22 Kudos
- **Fields:** fromEmployeeId, toEmployeeId, message, value/badge (teamwork/innovation/excellence), visibility, reactions
- **Count:** 30–100
- **Depends on:** Employees

### 2.23 Calendar / Events
- **Fields:** title, type (holiday/birthday/anniversary/training/meeting/all-hands), start, end, location, attendees, recurring
- **Count:** Public holidays (Nigeria default), 1 event per employee birthday/anniversary, 10–20 company events
- **Depends on:** Employees

### 2.24 Tasks
- **Fields:** title, description, assignee, dueDate, priority, status, linkedTo (onboarding/offboarding/project)
- **Count:** 5–15 per employee
- **Depends on:** Employees

### 2.25 Audit Trail
- **Fields:** timestamp, actor (employeeId), action (created/updated/deleted/viewed/approved), entity, entityId, before/after, IP, userAgent
- **Count:** 500–2000 entries spanning 90 days
- **Depends on:** All modules

### 2.26 Settings (HR-level)
- **Fields:** working hours, holiday calendar, leave policies, approval workflows, notification preferences, integrations
- **Count:** 1 config
- **Depends on:** —

---

## 3. Employee Self-Service Modules

These reuse data seeded above but require a few extra entities scoped to each employee's view.

| Module | Entity / Data Needed | Notes |
|---|---|---|
| **My Dashboard** | aggregated widgets (next leave, pending tasks, announcements) | computed |
| **My Profile** | `MyProfile`, `EmergencyContact`, `BankAccount`, `Address` | 1 per employee |
| **Directory** | employee list (read view) | reuses §2.1 |
| **Payslips** | `Payslip` — period, gross, deductions (PAYE, pension, NHF), net, payDate, fileUrl | 12 per employee |
| **Benefits** | `Benefit` — health insurance, HMO plan, life cover, allowances, enrollment status | 3–6 per employee |
| **Leave Balance / Request** | reuses §2.7 | — |
| **My Attendance** | reuses §2.6 | — |
| **My Documents** | reuses §2.5 | — |
| **My Assets** | `MyAsset` — assigned list | reuses §2.14 |
| **My Tasks** | reuses §2.24 | — |
| **My Performance** | reuses §2.12 (own goals + reviews) | — |
| **Training** | reuses §2.13 (own enrollments) | — |
| **Contracts** | reuses §2.4 | — |
| **Helpdesk (self)** | reuses §2.15 (raised by me) | — |
| **Announcements / Knowledge / Community / Events** | read views of §2.19–2.23 | — |

---

## 4. Cross-Cutting Data

### 4.1 Notifications
- **Fields:** recipient, type (leave_approved, task_assigned, kudos_received, etc.), title, body, link, read, createdAt
- **Count:** 20–40 per active employee
- **Depends on:** All modules emitting events

### 4.2 Chat / Messaging
- **Entities:** `Conversation`, `Message`, `Participant`
- **Fields:** participants, lastMessage, timestamps, message body, attachments, read receipts
- **Count:** 1–3 conversations per employee, 10–30 messages each
- **Depends on:** Employees

### 4.3 Payroll Runs *(if payroll module is in scope)*
- **Entity:** `PayrollRun`
- **Fields:** period, status (draft/approved/paid), employee count, gross, deductions, net, runBy, approvedBy
- **Count:** 12 monthly runs
- **Depends on:** Employees, Payslips

---

## 5. Recommended Generation Order

1. **Foundation** — Tenant → Company Profile → Departments → Employment Types → Roles/Access Levels
2. **People** — Employees → Org Structure → Headcount snapshots
3. **Employment lifecycle** — Contracts → Documents → Assets → Onboarding (recent hires) → Offboarding (recent leavers)
4. **Operational** — Attendance → Leave Policies + Balances + Requests → Payslips → Benefits
5. **Talent** — Recruitment (jobs + candidates) → Performance (cycles + goals + reviews) → Learning (courses + enrollments)
6. **Engagement** — Announcements → Knowledge → Community → Kudos → Surveys → Suggestions → Events → Calendar
7. **Service** — Helpdesk → Grievance → Tasks
8. **Activity stream** — Notifications → Chat → Audit Trail (derive last, from all prior events)

---

## 6. Suggested Volumes Cheat-Sheet (for a "typical" mid-size tenant)

| Entity | Volume |
|---|---|
| Employees | 120 |
| Departments | 10 |
| Job postings | 12 (open) |
| Candidates | ~250 |
| Leave requests | ~600 |
| Attendance records | ~7,500 (90 days) |
| Payslips | 1,440 (12 months) |
| Assets | 180 |
| Helpdesk tickets | 60 |
| Knowledge articles | 40 |
| Community posts | 100 |
| Kudos | 80 |
| Announcements | 20 |
| Survey responses | ~300 |
| Audit log entries | ~1,500 |
| Notifications | ~3,000 |

---

## 7. Open Questions Before Generation

- [ ] Single tenant only, or multi-tenant fixture set?
- [ ] Locale: Nigeria-only (NGN, NIN, PAYE, NHF) or multi-country?
- [ ] Time horizon: last 90 days, 6 months, or 12 months of history?
- [ ] Deterministic (seeded faker) so re-runs are stable, or fresh randomness each run?
- [ ] Output format: TypeScript demo files in [src/data/](src/data/), JSON fixtures, or DB seed scripts?
- [ ] Should we generate avatars/photos, or use initials only?
