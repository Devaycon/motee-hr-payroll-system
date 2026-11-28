# MOTEE HRIS — Integrated API Endpoints Log

> **Branch:** `feat/temitope-branch` · **Updated:** 2026-11-27 (spec grew to 678 operations)
> **Source of truth:** `src/store/services/*.ts` (RTK Query), checked against the live spec at `https://api.develop.moteesolutionsltd.com/openapi/v1.json` (640 operations — every one has a hook). Usage was traced to the screens, hooks and listeners that call each endpoint.

---

## 1. Summary

| Item | Value |
| --- | --- |
| Base URL | `NEXT_PUBLIC_MOTEE_BASE_URL` (from `.env.local`) |
| API prefix | `/api/v1` |
| Auth | `Authorization: Bearer <token>`, auto-refresh on 401 via `POST /api/v1/auth/refresh` |
| Service files | 76 (21 new on 2026-11-25, `change-requests.ts` and `reports.ts` on 2026-11-27, plus 2 workspace loaders) |
| Unique backend endpoints | **678** |
| ✅ + 🔁 Live — called by the app | **678 — all of them** (counted from the code on 2026-11-28: every spec operation traced to a screen, hook or listener; 5 project reads are made by the Projects workspace loader rather than their own hooks) |
| ⚪ Defined but not called yet | **0** (sections 3.x below are historical) |

### Change log

| Date | Change |
| --- | --- |
| 2026-10-24 | First log: 151 endpoints across 16 modules. |
| 2026-10-24 | **+57 endpoints:** Attendance, corrections, timesheets, work schedules (31) and Performance goals, reviews, feedback (26). HR **Attendance** and **Performance** pages switched to live. |
| 2026-10-30 | **+94 endpoints:** Announcements (11), Calendar (6), Candidates (13), Interviews (6), Requisitions (11), Contracts (13), Dashboard (2), Documents (17), Expense claims (10), Notifications (5). Switched to live: **Dashboard** (People and Attendance tabs), **Calendar**, **Announcements**, **Recruitment**, **Contracts**, **Documents**, **Expense Claims**, and the notifications bell. Existing schemas gained `dottedLineManagerId`/`dottedLineManagerName` (employees), `accessLevelId` (invite), `emailSentAt`/`accessLevelName` (pending invitation), `reviewUnavailableReason` (onboarding) and the `companyDocument` file purpose. |
| 2026-11-08 | **+114 endpoints:** Benefit plans (13), Diversity (3), Employee checklist (12), Employment types (7), Headcount (7), Hire tracker (1), Kudos (12), Loans (12), Positions (10), Sickness (16), Tasks (10), Workforce (3), Workforce requests (8). Switched to live: **Employment Types**, **Roles & Positions**, **Benefits**, **Employee Checklist**, **Loans**, **Headcount Planning**, **Workforce Planning** (except Skills Gap), **Hire Tracker**, **Workforce Requests**, **Kudos**, **Sickness & Absence** (except Schemes and Approval Chain), **My Work** (Personal tasks tab), the dashboard **Sickness** tab and **Loans** tile, and the first self-service pages: My Tasks, My Loans, Diversity, Sickness, Community (Kudos tab). Existing schemas: `CalendarCategory` gained `sickness`. |
| 2026-11-25 | **+224 endpoints (640 in all):** Account settings (5), Certifications (6), Community (12), Company (8), Employee notes (5), EOR + EOR invoices (19), ER cases (18), Help desk (10), Knowledge (13), Learning (17), My reminders (1), Occupational health (13), Pick lists (6), Platform verifications (2), Projects + documents/go-live/risks/time (34), Settings (7), Shifts (5), Suggestions (13), Surveys (12), Workflows (7), Workflow runs (11). Switched to live — HR: **Company Profile**, **Settings**, **Help Desk**, **Knowledge Base**, **Community**, **Suggestions**, **Surveys**, **EOR** (+ dashboard map), **Learning & Development** (+ certification and mandatory-training tiles), **Employee Relations** (`/admin/grievance`), **Occupational Health** (+ dashboard OH tiles), **Shifts**, **Projects**, **Workflows**, the My Work workflow tabs, and the employee profile's **Notes & Reminders** and **Certifications** modules. Self-service: Dashboard, Events, Attendance clock, Shifts, Leave balance, Leave request, Expenses, Documents, Contracts, Assets, My Profile, Org chart, Announcements, Knowledge, Community (feed + suggestions), Help desk, Relations, Performance and Training. Existing schemas only gained enum values: `FilePurpose` (+`projectDocument`, `caseEvidence`, `companyVerificationDocument`) and `NotificationKind` (+`noteReminderDue`). |
| 2026-11-27 | **+9 endpoints (649 in all)**, answering the 25 November request document: `GET /approvals`, `GET /approvals/mine`, `GET /assets/mine`, `GET /employees/{id}/guarantors`, `GET /exports/mine`, `GET /kudos/{id}/reactions`, `PUT /leave/holidays/{id}`, `DELETE /suggestions/{id}`, `PUT /occupational-health/{id}/sickness-records`, and later the same day `GET /dashboard/lifecycle` (650). Switched to live: **Employee Lifecycle** (`/lifecycle`, Journey Map counts), **Submissions & Approvals** (`/hr-action-center/submissions`) and self-service **My Submissions** (`/employee/submissions`) — New Submission, My Delegation and Approval Chains stay held; the employee profile **Guarantors** module (read only). Existing schemas gained fields: `ApprovalDto` (`submittedByUserId`, `submittedByEmployeeId`, `submittedByName`), `PublicHolidayDto` (`isNonWorking`, `excludedDepartmentIds`, `excludedDepartmentNames`, `closesEveryone`), `PublicHolidayRequest` (`isNonWorking`, defaults to true, and `excludedDepartmentIds`), `RunTaskDto` (`assigneeAccessLevelId`) and `OhCaseDto` (`linkedAbsences[]`). |
| 2026-11-27 (pm) | **+3 endpoints (653 in all)** with the backend's written answers: `GET /dashboard/hr-actions`, `GET /dashboard/untaken-leave`, `GET /dashboard/mine`. Switched to live: the HR dashboard **Priorities** tab and **Untaken Leave** card, the **HR Action Centre** page (alerts; its upcoming events, checklist and recent activity held), and the self-service dashboard's **day stats** and **Team on Leave**. `CalendarCategory` gained `starter` and `leaver`. Answers applied: approval event types are a fixed set (adds `skipped`, `reresolved`); skipped reasons are free sentences (shown as the step's note); headcount periods go as `Q1 2026` / `FY 2026`; lifecycle keys confirmed. Then, from existing endpoints, the HR dashboard **Events**, **Resourcing** and **Engagement** tabs and the HR Action Centre events card. |
| 2026-11-28 (Phases B and C) | **The remaining 91 endpoints wired — every endpoint in the spec is now called.** **HR queues and actions (new buttons/tabs):** Attendance **Corrections** tab (list, approve/reject with a note), Work Patterns ⋯ *Set as default* and *Assign to employees*; Contracts detail *Sign for Company*, *Terminate* (reason), *Add Note*; Documents folder ⋯ *Rename/Delete*, document *Edit* details and *New Version* upload, acknowledgement lists (who has / hasn't); My Documents folder *Rename*; profile Notes *Pin/Unpin*, **Grievances** and **Disciplinaries** modules unblurred (the employee's ER cases); EOR *End engagement*, compliance item status ⋯, compliance board overlay, invoices *New / Edit / Delete / Mark as paid*; ER case **Evidence & Meetings** card (upload, download, delete; delete meetings) and note delete; Recruitment requisition *Delete* and pre-publish warnings, the stage move asks `can-move` first (refusal reason shown), interview *Reschedule*, the candidate's own interview list; Performance goal editing (title, category, due date, description), review *Calibrate*, "Feedback received" in the review; Learning enrollment ⋯ *Mark …* and the server's mandatory-training tally; Occupational Health referral *Delete*, server audit trail, adjustment remove, **Suggested referrals** banner; Calendar event *Edit*; Community *Edit Post* and comment delete; Suggestions comment delete; Announcements acknowledgement lists; notification *Dismiss*; Company Profile *Withdraw submission*; Projects document upload (was held) and download; Platform console **Verifications** tab (start review / verify / reject). **Summaries on stat cards (signed in):** employees, attendance, help desk, knowledge, suggestions, learning, certifications, EOR, ER cases, OH, community, projects (+ per-project risk and time tallies), and a workflows strip. **Single-record reads:** opening a details view re-reads it (announcement, timesheet, work pattern, review, goal, suggestion, help-desk case, article, EOR worker and provider, course, pick list, candidate, kudos thread), and the employee profile's Work Pattern uses their assigned schedule; expense claim, OH case and requisition pages also open from a link when the item isn't in the loaded list. |
| 2026-11-28 (Phase A) | **+17 endpoints wired, self-service gaps.** **My Attendance:** history from `GET /attendance/mine/days` (the live bundle has no attendance, so it only showed the current session before), this week's totals and punctuality from `/attendance/mine/summary`, the week's timesheet status from `/attendance/timesheets/mine`, per-day correction status from `/attendance/corrections/mine` (new "Correction pending/approved/rejected" line in the weekly timesheet), working hours and grace from `/attendance/schedules/mine`. **My Performance:** feedback received (`/performance/feedback/mine`), open requests you made (`/feedback/requests/mine`), new **Asked of You** card (`/feedback/requests/awaiting-me`) with ⋯ Give feedback / Decline, new **Give Feedback** button and dialog (`POST /performance/feedback`, `POST /feedback/requests/{id}/decline`). **New page: Company → Surveys** (`/company/surveys`): `GET /surveys/mine`, take-survey dialog from `GET /surveys/{id}`, read-back from `/{id}/my-response`, `POST /surveys/{id}/responses`. **Community → My Suggestions** from `GET /suggestions/mine`. **My Work** tabs classified by `GET /workflow-runs/my-work`. **New "Exports" button** on Reports: `GET /exports/mine` with download links. |
| 2026-11-28 | **Backend answers to follow-up (2) applied, no new endpoints.** **403 change:** 13 registers (`/contracts`, `/leave/requests`, `/leave/balances`, `/attendance`, `/attendance/timesheets`, `/attendance/corrections`, `/expenses/claims`, `/performance/reviews`, `/performance/goals`, `/performance/feedback`, `/certifications`, `/approvals`, `/documents`) now refuse ordinary employees; HR users only see the departments their access level covers. Self-service audit: My Contracts no longer also reads `/contracts`; My Profile → Contracts reads `/contracts/mine` and → Certifications reads `/certifications/mine` on your own profile; My Submissions already used `/approvals/mine` + `/my-queue` (HR falls back to them on a refusal); the other self-service pages already used `/mine` routes. **Reports:** pages of 200 (the server's cap), stops on `rows.totalItems`, null cells shown as a dash, PascalCase enum cells (`FullTime`) shown as words; server export is CSV only and is also emailed. **Approvals:** attachments shown on `permits`, enforced on `required`; summary optional; empty-state text for "no default chain yet"; history actor shown by name when the server sends an email (backend defect, not yet fixed). **Change requests:** field keys confirmed flat (31 fields; the profile's mapping already matches); photo requests stopped (the API has no photo field). Confirmed: upload form field `file`; `employeeDocument` for own uploads; own guarantors via `/employees/{id}/guarantors`; `documentType` keys are the same snake_case everywhere. |
| 2026-11-27 (night) | **+17 endpoints (678 in all).** **Reports** (`reports.ts`, new): `GET /reports/datasets`, `POST /reports/run`, `POST /reports/export` — the **Reports** module (`/operations/reports`) is live: the landing cards, record counts and quick export, each report's table, search, filters and export dialog, and Build Custom Report all use the server's datasets. Analytics stays held (its "View analytics" button on a report is blurred). **Self-service documents:** `POST /documents/mine`, `GET`/`POST /documents/mine/folders`, `PUT`/`DELETE /documents/mine/folders/{id}`, `POST /documents/mine/{id}/move`, `/trash`, `/restore` — My Documents uploads (the dialog's drop zone now takes the file), your own folders (with colour), move, trash and restore; permanent delete stays held. **HR review:** `GET /documents/reviews`, `POST /documents/reviews/{id}/approve`, `/reject` — the Documents & Compliance **My Documents** review tab is unblurred. **Approvals:** `GET /approvals/document-types`, `POST /approvals`, `POST /approvals/{id}/comments` — **New Submission** (HR and My Submissions) raises on the API with the server's request types and intake forms; comments on a submission post. Existing schemas: `ApprovalDto` (+`title`, `summary`, `fields`, `fieldSchema`), `ApprovalStepDto` (+`signatureFileId`, `signatureUrl`), `DecideApprovalRequest` (+`signatureFileId`), `DocumentDto` (+`uploadedByEmployeeId`, `uploadedByName`, `reviewStatus`, `reviewNote`, `isMine`), `FolderDto` (+`colour`), `FilePurpose` (+`approvalSignature`). |
| 2026-11-27 (late) | **+8 endpoints (661 in all): profile change requests** — `GET /change-requests`, `POST /change-requests/{id}/approve`, `POST /change-requests/{id}/reject`, `GET /employees/{id}/change-requests`, `GET /employees/me/change-requests`, `GET /employees/me/change-requests/fields`, `POST /employees/me/change-requests`, `POST /employees/me/change-requests/{id}/withdraw`. Switched to live: the **Profile Change Request Log** module (HR profile and My Profile), raising requests from the profile screens (including photo requests, uploaded as the new `profileChangeEvidence` file purpose), and HR approve / reject / employee withdraw. Also from existing endpoints: the navbar **notifications bell** (unblurred; badge from `GET /notifications/unread-count`), navbar **Send kudos** (`POST /kudos`) and the profile menu's **Company Profile** link. |

### Status legend

| Icon | Meaning |
| --- | --- |
| ✅ | Wired and called by a screen, hook or listener |
| 🔁 | The URL is called, but through a whole-collection reader (`fetchAllPages`) instead of the paged hook |
| ⚪ | The hook exists, but nothing in the app calls it yet |

### Modules marked live in the UI

From `src/lib/permissions/live-modules.ts` (everything else is shown blurred as "not integrated"):

`/welcome` · `/hr` (every dashboard tab live since 2026-11-27: People, Attendance, Sickness, Priorities, Events, Resourcing, Engagement) · `/hr-action-center/events` · `/hr-action-center/tasks` (Personal tasks tab only) · `/workspace/kudos` · `/organization/employment-types` · `/organization/roles` · `/organization/benefit-plans` · `/organization/employee-checklist` · `/organization/loans` · `/organization/headcount` · `/operations/workforce` (except Skills Gap) · `/talent/hire-tracker` · `/talent/workforce-requests` · `/time-payroll/sickness` (except `/schemes` and `/approval-chain`, listed in `DEMO_ONLY_LINKS`) · `/workspace/announcements` · `/organization/branches` · `/organization/departments` · `/organization/employees` · `/talent/onboarding` · `/talent/offboarding` · `/talent/performance` · `/talent/recruitment` · `/operations/assets` · `/operations/contracts` · `/operations/documents` (except the **My Documents** review queue) · `/time-payroll/leave` (except **Schemes**) · `/time-payroll/attendance` (except **Deduction Policy** and **Presence Checks**) · `/time-payroll/expenses` · `/admin/access-levels` · `/admin/users` · `/admin/audit-trail` · **2026-11-25:** `/organization/company` · `/organization/eor` · `/admin/settings` (2FA, API keys, billing history and clearing demo data blurred inline) · `/admin/grievance` · `/workspace/helpdesk` (FAQ blurred) · `/workspace/knowledge` · `/workspace/community` · `/workspace/suggestions` · `/workspace/surveys` · `/workspace/projects` · `/talent/training` · `/time-payroll/shifts` · `/time-payroll/occupational-health` · `/hr-action-center/workflows` · **2026-11-27:** `/lifecycle` · `/hr-action-center` (alerts and upcoming events live; the checklist and recent activity held) · `/organization/structure` (live directory; reporting-line edits save the employee's `managerId`) · `/sign` (Docu-Sign; filed through Documents) · `/hr-action-center/submissions` (New Submission, My Delegation and the Approval Chains tab held)

Self-service pages lifted out of the blur by `SELF_SERVICE_LIVE_LINKS` (same file): `/employee/dashboard` (recent activity blurred), `/employee/tasks`, `/employee/loans`, `/employee/events`, `/employee/documents`, `/employee/expenses`, `/time-off/attendance`, `/time-off/shifts`, `/time-off/balance`, `/time-off/request`, `/time-off/sickness`, `/profile/my-profile`, `/profile/diversity`, `/profile/contracts`, `/profile/documents`, `/profile/assets`, `/company/org-chart`, `/company/announcements`, `/company/knowledge`, `/company/community`, `/company/helpdesk` (FAQ blurred), `/company/relations`, `/growth/performance`, `/growth/training`, and since 2026-11-27 `/employee/submissions` (New Submission and My Delegation held).

Also live outside the HR shell: auth pages, company setup wizard, the new-joiner (`/join`) flow, the platform console (`platform-live`), and the notifications panel in every navbar.

---

## 2. Endpoints by module

All paths below are relative to `/api/v1`.

### 2.1 Authentication — `auth.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | POST | `/auth/register` | `useRegisterMutation` | `components/auth/register-form` | ✅ |
| 2 | POST | `/auth/verify-otp` | `useVerifyOtpMutation` | `components/auth/verify-otp` | ✅ |
| 3 | POST | `/auth/resend-otp` | `useResendOtpMutation` | `components/auth/verify-otp` | ✅ |
| 4 | POST | `/auth/login` | `useLoginMutation` | `components/auth/login-form` | ✅ |
| 5 | POST | `/auth/forgot-password` | `useForgotPasswordMutation` | `auth/forgot-password`, `auth/forgot-password-verify-otp`, `hr/users` (reset link) | ✅ |
| 6 | POST | `/auth/reset-password` | `useResetPasswordMutation` | `components/auth/reset-password` | ✅ |
| 7 | POST | `/auth/logout` | `useLogoutMutation` | `lib/auth/session`, HR navbar, platform shell | ✅ |
| 8 | GET | `/auth/me` | `useGetCurrentUserQuery` | `lib/auth/session` | ✅ |
| 9 | POST | `/auth/refresh` | *(internal, `api/index.ts`)* | Automatic token refresh on 401 | ✅ |

### 2.2 Tenant setup & locale — `tenant-setup.ts`, `locale.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/tenant/setup/options` | `useGetTenantSetupOptionsQuery` | `auth/company-onboarding` (index, steps 4, 7, 8) | ✅ |
| 2 | GET | `/tenant/setup` | `useGetTenantSetupQuery` | `auth/company-onboarding` | ✅ |
| 3 | PUT | `/tenant/setup` | `useUpdateTenantSetupMutation` | `company-onboarding/steps/step-7-review` | ✅ |
| 4 | POST | `/tenant/setup/complete` | `useCompleteTenantSetupMutation` | `company-onboarding/steps/step-7-review` | ✅ |
| 5 | GET | `/locale/detect` | `useDetectLocaleQuery` | `auth/register-form` | ✅ |
| 6 | GET | `/locale/countries` | `useGetSupportedCountriesQuery` | `auth/register-form` | ✅ |
| 7 | GET | `/locale` | `useGetTenantLocaleQuery` | `lib/hooks/use-tenant`, `lib/live/use-live-bundle` | ✅ |

### 2.3 Organisation — `branches.ts`, `departments.ts`, `business-units.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/branches` | `useGetBranchesQuery` | `lib/live/use-live-bundle` | ✅ |
| 2 | POST | `/branches` | `useCreateBranchMutation` | `hr/branches/hooks` | ✅ |
| 3 | GET | `/branches/{id}` | `useGetBranchQuery` | `hr/branches/hooks` | ✅ |
| 4 | PUT | `/branches/{id}` | `useUpdateBranchMutation` | `hr/branches/hooks` | ✅ |
| 5 | DELETE | `/branches/{id}` | `useDeleteBranchMutation` | `hr/branches/hooks` | ✅ |
| 6 | GET | `/departments` | `useGetDepartmentsQuery` | `hr/departments/hooks`, `hr/employees/hooks`, `use-live-bundle` | ✅ |
| 7 | POST | `/departments` | `useCreateDepartmentMutation` | `hr/departments/hooks` | ✅ |
| 8 | GET | `/departments/{id}` | `useGetDepartmentQuery` | `departments/components/department-detail-page` | ✅ |
| 9 | PUT | `/departments/{id}` | `useUpdateDepartmentMutation` | `hr/departments/hooks` | ✅ |
| 10 | DELETE | `/departments/{id}` | `useDeleteDepartmentMutation` | `hr/departments/hooks` | ✅ |
| 11 | GET | `/business-units` | `useGetBusinessUnitsQuery` | `departments/components/business-units-card` | ✅ |
| 12 | POST | `/business-units` | `useCreateBusinessUnitMutation` | `business-units-card` | ✅ |
| 13 | GET | `/business-units/{id}` | `useGetBusinessUnitQuery` | — | ⚪ |
| 14 | PUT | `/business-units/{id}` | `useUpdateBusinessUnitMutation` | `business-units-card` | ✅ |
| 15 | DELETE | `/business-units/{id}` | `useDeleteBusinessUnitMutation` | `business-units-card` | ✅ |

### 2.4 Employees — `employees.ts`, `employee-directory.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/employees` | `useGetEmployeesQuery` / `useGetEmployeeDirectoryQuery` (all pages) | `hr/employees/hooks`, `use-live-bundle` | 🔁 |
| 2 | POST | `/employees` | `useCreateEmployeeMutation` | `hr/onboarding/hooks` | ✅ |
| 3 | GET | `/employees/stats` | `useGetEmployeeStatsQuery` | — | ⚪ |
| 4 | POST | `/employees/export` | `useExportEmployeesMutation` | `lib/employees/use-employee-export` | ✅ |
| 5 | GET | `/employees/export/columns` | `useGetEmployeeExportColumnsQuery` | `use-employee-export` | ✅ |
| 6 | GET | `/employees/{id}` | `useGetEmployeeQuery` | `employee-detail/hooks`, `profile-edits-listener` | ✅ |
| 7 | PUT | `/employees/{id}` | `useUpdateEmployeeMutation` | `use-employee-actions`, `profile-edits-listener` | ✅ |
| 8 | DELETE | `/employees/{id}` | `useDeleteEmployeeMutation` | `use-employee-actions` | ✅ |
| 9 | GET | `/employees/{id}/medical` | `useGetEmployeeMedicalQuery` | `employee-detail/hooks` | ✅ |
| 10 | POST | `/employees/{id}/status` | `useChangeEmployeeStatusMutation` | `use-employee-actions`, `profile-edits-listener` | ✅ |
| 11 | POST | `/employees/invite` | `useInviteEmployeeMutation` | `hr/onboarding/hooks` | ✅ |
| 12 | GET | `/employees/invitations` | `useGetEmployeeInvitationsQuery` | `onboarding/components/invitations-panel` | ✅ |
| 13 | POST | `/employees/{id}/invitation` | `useResendEmployeeInvitationMutation` | `invitations-panel`, `onboarding/hooks`, `use-employee-actions` | ✅ |
| 14 | DELETE | `/employees/{id}/invitation` | `useRevokeEmployeeInvitationMutation` | `invitations-panel`, `onboarding/hooks`, `use-employee-actions` | ✅ |
| 15 | GET | `/employees/import/columns` | `useGetEmployeeImportColumnsQuery` | `invitations-panel` | ✅ |
| 16 | GET | `/employees/import/template` | `useDownloadEmployeeImportTemplateMutation` | `invitations-panel` | ✅ |
| 17 | POST | `/employees/import` | `useImportEmployeesMutation` | `hr/onboarding/hooks` | ✅ |
| 18 | GET | `/employees/{id}/guarantors` *(2026-11-27)* | `useGetEmployeeGuarantorsQuery` | `employee-detail/modules` (Guarantors) | ✅ |

### 2.5 Exports & files — `exports.ts`, `files.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/exports/{id}` | `useGetExportJobQuery` | `use-employee-export` | ✅ |
| 2 | POST | `/exports/{id}/link` | `useCreateExportLinkMutation` | `use-employee-export` | ✅ |
| 3 | POST | `/files` | `useUploadFileMutation` | `employee-detail/live-modules`, `onboarding/join-live`, `profile-edits-listener` | ✅ |
| 4 | GET | `/files` | `useGetFilesQuery` | `employee-detail/live-modules` | ✅ |
| 5 | GET | `/files/{id}` | `useGetFileQuery` | — | ⚪ |
| 6 | DELETE | `/files/{id}` | `useDeleteFileMutation` | `employee-detail/live-modules` | ✅ |
| 7 | GET | `/files/{id}/download` | `useDownloadFileMutation` | `employee-detail/live-modules` | ✅ |
| 8 | GET | `/exports/mine` *(2026-11-27)* | `useGetMyExportJobsQuery` | — (no export history on the screens) | ⚪ |

### 2.6 Users & access levels — `users.ts`, `access-levels.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/users` | `useGetUsersQuery` | `hr/users/hooks`, `lib/auth/session` | ✅ |
| 2 | GET | `/access-levels` | `useGetAccessLevelsQuery` | `use-live-bundle` | ✅ |
| 3 | POST | `/access-levels` | `useCreateAccessLevelMutation` | `hr/access-levels` | ✅ |
| 4 | GET | `/access-levels/catalogue` | `useGetAccessLevelCatalogueQuery` | `hr/access-levels` | ✅ |
| 5 | GET | `/access-levels/{id}` | `useGetAccessLevelQuery` | — | ⚪ |
| 6 | PUT | `/access-levels/{id}` | `useUpdateAccessLevelMutation` | `hr/access-levels` | ✅ |
| 7 | DELETE | `/access-levels/{id}` | `useDeleteAccessLevelMutation` | `hr/access-levels` | ✅ |
| 8 | POST | `/access-levels/{id}/status` | `useChangeAccessLevelStatusMutation` | `hr/access-levels` | ✅ |
| 9 | POST | `/access-levels/{id}/holders` | `useAssignAccessLevelMutation` | `hr/users` | ✅ |
| 10 | DELETE | `/access-levels/{id}/holders/{userId}` | `useUnassignAccessLevelMutation` | `hr/users` | ✅ |

### 2.7 Onboarding — `onboarding.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/onboarding` | `useGetOnboardingsQuery` / `useGetAllOnboardingsQuery` (all pages) | `hr/onboarding/hooks` | 🔁 |
| 2 | GET | `/onboarding/catalogue` | `useGetOnboardingCatalogueQuery` | `onboarding/detail/stage-control` | ✅ |
| 3 | GET | `/onboarding/mine` | `useGetMyOnboardingQuery` | `welcome/components/my-workspace` | ✅ |
| 4 | GET | `/onboarding/{id}` | `useGetOnboardingQuery` | `onboarding/detail` | ✅ |
| 5 | POST | `/onboarding/{id}/stage` | `useMoveOnboardingStageMutation` | `hr/onboarding/hooks` | ✅ |
| 6 | POST | `/onboarding/{id}/complete` | `useCompleteOnboardingMutation` | `hr/onboarding/hooks` | ✅ |

### 2.8 New-joiner portal — `join.ts`

Public, token-based flow used by `components/onboarding/join-live`.

| # | Method | Endpoint | Hook | Status |
| --- | --- | --- | --- | --- |
| 1 | GET | `/join/{token}` | `useGetInvitationQuery` | ✅ |
| 2 | POST | `/join/{token}` | `useAcceptInvitationMutation` | ✅ |
| 3 | GET | `/join/{token}/requirements` | `useGetJoinRequirementsQuery` | ✅ |
| 4 | GET | `/join/{token}/pack` | `useGetJoinPackQuery` | ✅ |
| 5 | POST | `/join/{token}/consent` | `useAcceptJoinConsentMutation` | ✅ |
| 6 | PUT | `/join/{token}/documents/{kind}` | `useAttachJoinDocumentMutation` | ✅ |
| 7 | DELETE | `/join/{token}/documents/{kind}` | `useRemoveJoinDocumentMutation` | ✅ |
| 8 | PUT | `/join/{token}/guarantors` | `useSaveJoinGuarantorsMutation` | ✅ |
| 9 | PUT | `/join/{token}/starter-tax` | `useSaveJoinStarterTaxMutation` | ✅ |
| 10 | PUT | `/join/{token}/draft` | `useSaveJoinDraftMutation` | ✅ |
| 11 | POST | `/join/{token}/photo` | `useUploadJoinPhotoMutation` | ✅ |
| 12 | POST | `/join/{token}/declare` | `useDeclareJoinPackMutation` | ✅ |

### 2.9 Offboarding — `offboarding.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/offboarding` | `useGetOffboardingsQuery` / `useGetOffboardingRecordsQuery` (all pages) | `hr/offboarding/hooks` | 🔁 |
| 2 | POST | `/offboarding` | `useInitiateOffboardingMutation` | `hr/employees`, `offboarding-listener` | ✅ |
| 3 | GET | `/offboarding/stats` | `useGetOffboardingStatsQuery` | `hr/offboarding/hooks` | ✅ |
| 4 | GET | `/offboarding/{id}` | `useGetOffboardingQuery` (fetched per record by `getOffboardingRecords`) | `hr/offboarding/hooks` | 🔁 |
| 5 | PUT | `/offboarding/{id}` | `useUpdateOffboardingMutation` | `offboarding-listener` | ✅ |
| 6 | DELETE | `/offboarding/{id}` | `useDeleteOffboardingMutation` | `offboarding-listener` | ✅ |
| 7 | POST | `/offboarding/{id}/actions/{action}` | `useRunOffboardingActionMutation` | `offboarding-listener` | ✅ |
| 8 | POST | `/offboarding/{id}/clearance/{itemId}` | `useCompleteClearanceItemMutation` | `offboarding-listener` | ✅ |
| 9 | POST | `/offboarding/{id}/revoke-access` | `useRevokeOffboardingAccessMutation` | `offboarding-listener` | ✅ |
| 10 | POST | `/offboarding/{id}/exit-interview/schedule` | `useScheduleExitInterviewMutation` | `offboarding-listener` | ✅ |
| 11 | POST | `/offboarding/{id}/exit-interview/complete` | `useCompleteExitInterviewMutation` | `offboarding-listener` | ✅ |
| 12 | POST | `/offboarding/{id}/exit-documents` | `useGenerateExitDocumentsMutation` | `offboarding-listener` | ✅ |

### 2.10 Leave requests — `leave.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/leave/requests` | `useGetLeaveRequestsQuery` / `useGetAllLeaveRequestsQuery` (all pages) | `hr/leave/hooks` | 🔁 |
| 2 | POST | `/leave/requests` | `useCreateLeaveRequestMutation` | `leave-listener` | ✅ |
| 3 | GET | `/leave/requests/mine` | `useGetMyLeaveRequestsQuery` | `welcome/components/my-workspace` | ✅ |
| 4 | GET | `/leave/requests/{id}` | `useGetLeaveRequestQuery` | `leave-listener` | ✅ |
| 5 | POST | `/leave/requests/quote` | `useQuoteLeaveRequestMutation` | `leave-listener` | ✅ |
| 6 | POST | `/leave/requests/{id}/cancel` | `useCancelLeaveRequestMutation` | `leave-listener` | ✅ |

### 2.11 Leave balances — `leave-balances.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/leave/balances` | `useGetLeaveBalancesQuery` / `useGetAllLeaveBalancesQuery` (all pages) | `hr/leave/hooks` | 🔁 |
| 2 | GET | `/leave/balances/mine` | `useGetMyLeaveBalancesQuery` | `welcome/components/my-workspace` | ✅ |
| 3 | GET | `/leave/balances/{employeeId}` | `useGetEmployeeLeaveBalancesQuery` | `employee-detail/live-modules` | ✅ |
| 4 | POST | `/leave/balances/adjust` | `useAdjustLeaveBalanceMutation` | `leave-listener` | ✅ |
| 5 | GET | `/leave/balances/year-end/preview` | `usePreviewLeaveYearEndQuery` | `leave/components/leave-calendar-rules` | ✅ |
| 6 | POST | `/leave/balances/year-end/close` | `useCloseLeaveYearMutation` | `leave-calendar-rules` | ✅ |

### 2.12 Leave types, holidays & blackouts — `leave-policies.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/leave/types` | `useGetLeaveTypesQuery` | `hr/leave/hooks`, `leave-calendar-rules` | ✅ |
| 2 | POST | `/leave/types` | `useCreateLeaveTypeMutation` | `leave-listener` | ✅ |
| 3 | PUT | `/leave/types/{id}` | `useUpdateLeaveTypeMutation` | `leave-listener` | ✅ |
| 4 | DELETE | `/leave/types/{id}` | `useDeleteLeaveTypeMutation` | `leave-listener` | ✅ |
| 5 | GET | `/leave/holidays` | `useGetPublicHolidaysQuery` | `leave-calendar-rules` | ✅ |
| 6 | POST | `/leave/holidays` | `useCreatePublicHolidayMutation` | `leave-calendar-rules` | ✅ |
| 7 | POST | `/leave/holidays/generate/{year}` | `useGeneratePublicHolidaysMutation` | `leave-calendar-rules` | ✅ |
| 8 | DELETE | `/leave/holidays/{id}` | `useDeletePublicHolidayMutation` | `leave-calendar-rules` | ✅ |
| 9 | GET | `/leave/blackouts` | `useGetLeaveBlackoutsQuery` | `leave-calendar-rules` | ✅ |
| 10 | POST | `/leave/blackouts` | `useCreateLeaveBlackoutMutation` | `leave-calendar-rules` | ✅ |
| 11 | PUT | `/leave/blackouts/{id}` | `useUpdateLeaveBlackoutMutation` | `leave-calendar-rules` | ✅ |
| 12 | DELETE | `/leave/blackouts/{id}` | `useDeleteLeaveBlackoutMutation` | `leave-calendar-rules` | ✅ |
| 13 | PUT | `/leave/holidays/{id}` *(2026-11-27)* | `useUpdatePublicHolidayMutation` | `hr/settings/live` (Company Holidays) | ✅ |

### 2.13 Assets — `assets.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/assets` | `useGetAssetsQuery` / `useGetAssetInventoryQuery` (all pages) | `hr/assets/hooks` | 🔁 |
| 2 | POST | `/assets` | `useCreateAssetMutation` | `hr/assets/hooks` | ✅ |
| 3 | GET | `/assets/{id}` | `useGetAssetQuery` | `hr/assets/hooks` | ✅ |
| 4 | PUT | `/assets/{id}` | `useUpdateAssetMutation` | `hr/assets/hooks` | ✅ |
| 5 | POST | `/assets/{id}/assign` | `useAssignAssetMutation` | `hr/assets/hooks` | ✅ |
| 6 | POST | `/assets/{id}/return` | `useReturnAssetMutation` | `hr/assets/hooks` | ✅ |
| 7 | GET | `/assets/{id}/history` | `useGetAssetHistoryQuery` | `hr/assets/hooks` | ✅ |
| 8 | POST | `/assets/{id}/status` | `useChangeAssetStatusMutation` | `hr/assets/hooks` | ✅ |
| 9 | GET | `/assets/mine` *(2026-11-27)* | `useGetMyAssetsQuery` | `hr/assets/hooks` → self-service My Assets | ✅ |

### 2.14 Approvals — `approvals.ts`, `approval-templates.ts`, `approval-delegations.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/approvals/my-queue` | `useGetMyApprovalQueueQuery` | `approvals/live/queue-tab` | ✅ |
| 2 | GET | `/approvals/{id}` | `useGetApprovalQuery` | `approvals/live/detail-page` | ✅ |
| 3 | GET | `/approvals/for/{subjectType}/{subjectId}` | `useGetApprovalsForSubjectQuery` | `approvals/live/detail-page` | ✅ |
| 4 | POST | `/approvals/{id}/decide` | `useDecideApprovalMutation` | `approvals/live/shared`, `onboarding/hooks`, `leave-listener` | ✅ |
| 5 | POST | `/approvals/{id}/resubmit` | `useResubmitApprovalMutation` | `approvals/live/shared` | ✅ |
| 6 | POST | `/approvals/{id}/reresolve` | `useReresolveApprovalMutation` | `approvals/live/shared` | ✅ |
| 7 | POST | `/approvals/{id}/cancel` | `useCancelApprovalMutation` | `approvals/live/shared` | ✅ |
| 8 | GET | `/approval-templates` | `useGetApprovalTemplatesQuery` | `approvals/live/templates-tab` | ✅ |
| 9 | POST | `/approval-templates` | `useCreateApprovalTemplateMutation` | `templates-tab` | ✅ |
| 10 | GET | `/approval-templates/catalogue` | `useGetApprovalTemplateCatalogueQuery` | `templates-tab` | ✅ |
| 11 | GET | `/approval-templates/{id}` | `useGetApprovalTemplateQuery` | `templates-tab` | ✅ |
| 12 | PUT | `/approval-templates/{id}` | `useUpdateApprovalTemplateMutation` | `templates-tab` | ✅ |
| 13 | DELETE | `/approval-templates/{id}` | `useDeleteApprovalTemplateMutation` | `templates-tab` | ✅ |
| 14 | GET | `/approval-delegations` | `useGetApprovalDelegationsQuery` | `approvals/live/delegations-tab` | ✅ |
| 15 | GET | `/approval-delegations/mine` | `useGetMyApprovalDelegationsQuery` | `delegations-tab` | ✅ |
| 16 | POST | `/approval-delegations` | `useCreateApprovalDelegationMutation` | `delegations-tab` | ✅ |
| 17 | DELETE | `/approval-delegations/{id}` | `useDeleteApprovalDelegationMutation` | `delegations-tab` | ✅ |
| 18 | GET | `/approvals` *(2026-11-27)* | `useGetApprovalsQuery` (`useGetAllApprovalsQuery` reads every page) | `approvals/use-live-approvals` (Submissions register) | 🔁 |
| 19 | GET | `/approvals/mine` *(2026-11-27)* | `useGetMyApprovalsQuery` (`useGetAllMyApprovalsQuery`) | `approvals/use-live-approvals` (My Submissions) | 🔁 |
| 20 | GET | `/approvals/document-types` *(2026-11-27 night)* | `useGetRaisableTypesQuery` | `approvals/components/intake-modal` (New Submission types and form) | ✅ |
| 21 | POST | `/approvals` *(2026-11-27 night)* | `useRaiseApprovalMutation` | `intake-modal` (attachments via `POST /files` purpose `approvalAttachment`) | ✅ |
| 22 | POST | `/approvals/{id}/comments` *(2026-11-27 night)* | `useCommentOnApprovalMutation` | `lib/stores/approvals-api-listener` ("Just comment" on a submission) | ✅ |

New Submission, signed in: the types offered and each type's questions (text, number, date, choice; required ones starred) come from the server, and the server picks the chain, so the Workflow picker and the submitter signature are not shown. A raised request's `title`, `summary` and form answers show on its detail page. Approver signatures: the decide call now sends `signatureFileId` when a signature was drawn (uploaded as `approvalSignature`), and signed steps show their `signatureUrl`. **Gap:** the API has no flag saying a step must be signed, so the signature dialog only opens for demo chains; signed-in approvals are approved without one unless the backend adds that flag.

### 2.15 Audit trail — `audit-trail.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/audit-trail` | `useGetAuditTrailQuery`, `useGetRecentAuditEntriesQuery` (3 pages) | `audit-trail/live`, `audit-trail/hooks` | ✅ |
| 2 | GET | `/audit-trail/catalogue` | `useGetAuditTrailCatalogueQuery` | `audit-trail/live` | ✅ |

### 2.16 Platform console — `platform.ts`

Used by `components/motee/platform-live`.

| # | Method | Endpoint | Hook | Status |
| --- | --- | --- | --- | --- |
| 1 | GET | `/platform/tenants` | `useGetPlatformTenantsQuery` | ✅ |
| 2 | GET | `/platform/tenants/{id}` | `useGetPlatformTenantQuery` | ✅ |
| 3 | GET | `/platform/staff` | `useGetPlatformStaffQuery` | ✅ |
| 4 | POST | `/platform/staff` | `useGrantPlatformRoleMutation` | ✅ |
| 5 | DELETE | `/platform/staff/{userId}` | `useRevokePlatformRoleMutation` | ✅ |

### 2.17 Attendance & time — `attendance.ts` *(new)*

HR screen: `components/hr/attendance` (Today, Timesheets, Work Patterns tabs + detail page). Data mapping in `lib/attendance/api-mapping.ts`.

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/attendance` | `useGetAttendanceQuery` / `useGetAttendanceForDateQuery` (all pages, today) | `hr/attendance/hooks` → Today tab, detail page | 🔁 |
| 2 | GET | `/attendance/summary` | `useGetAttendanceSummaryQuery` | — | ⚪ |
| 3 | POST | `/attendance/log` | `useLogAttendanceMutation` | `hr/attendance/hooks` → Log Attendance modal | ✅ |
| 4 | GET | `/attendance/mine` | `useGetMyAttendanceDayQuery` | — (self-service) | ⚪ |
| 5 | GET | `/attendance/mine/days` | `useGetMyAttendanceDaysQuery` | — (self-service) | ⚪ |
| 6 | GET | `/attendance/mine/summary` | `useGetMyAttendanceSummaryQuery` | — (self-service) | ⚪ |
| 7 | POST | `/attendance/mine/clock-in` | `useClockInMutation` | — (self-service) | ⚪ |
| 8 | POST | `/attendance/mine/break/start` | `useStartBreakMutation` | — (self-service) | ⚪ |
| 9 | POST | `/attendance/mine/break/end` | `useEndBreakMutation` | — (self-service) | ⚪ |
| 10 | POST | `/attendance/mine/clock-out` | `useClockOutMutation` | — (self-service) | ⚪ |
| 11 | PUT | `/attendance/mine/location` | `useSetWorkLocationMutation` | — (self-service) | ⚪ |
| 12 | GET | `/attendance/corrections` | `useGetAttendanceCorrectionsQuery` | — | ⚪ |
| 13 | POST | `/attendance/corrections/{id}/approve` | `useApproveAttendanceCorrectionMutation` | — | ⚪ |
| 14 | POST | `/attendance/corrections/{id}/reject` | `useRejectAttendanceCorrectionMutation` | — | ⚪ |
| 15 | GET | `/attendance/corrections/mine` | `useGetMyAttendanceCorrectionsQuery` | — (self-service) | ⚪ |
| 16 | POST | `/attendance/corrections/mine` | `useRequestAttendanceCorrectionMutation` | — (self-service) | ⚪ |
| 17 | GET | `/attendance/timesheets` | `useGetTimesheetsQuery` / `useGetAllTimesheetsQuery` (all pages) | `hr/attendance/hooks` → Timesheets tab | 🔁 |
| 18 | GET | `/attendance/timesheets/{id}` | `useGetTimesheetQuery` | — | ⚪ |
| 19 | POST | `/attendance/timesheets/{id}/approve` | `useApproveTimesheetMutation` | `hr/attendance/hooks` → approve button / modal | ✅ |
| 20 | POST | `/attendance/timesheets/{id}/reject` | `useRejectTimesheetMutation` | `hr/attendance/hooks` → reject in modal | ✅ |
| 21 | GET | `/attendance/timesheets/mine` | `useGetMyTimesheetQuery` | — (self-service) | ⚪ |
| 22 | POST | `/attendance/timesheets/mine/submit` | `useSubmitMyTimesheetMutation` | — (self-service) | ⚪ |
| 23 | GET | `/attendance/schedules` | `useGetWorkSchedulesQuery` | `hr/attendance/hooks` → Work Patterns tab | ✅ |
| 24 | POST | `/attendance/schedules` | `useCreateWorkScheduleMutation` | `hr/attendance/hooks` → Add pattern | ✅ |
| 25 | GET | `/attendance/schedules/{id}` | `useGetWorkScheduleQuery` | — | ⚪ |
| 26 | PUT | `/attendance/schedules/{id}` | `useUpdateWorkScheduleMutation` | `hr/attendance/hooks` → Edit pattern | ✅ |
| 27 | DELETE | `/attendance/schedules/{id}` | `useDeleteWorkScheduleMutation` | `hr/attendance/hooks` → Delete pattern | ✅ |
| 28 | POST | `/attendance/schedules/{id}/default` | `useSetDefaultWorkScheduleMutation` | — | ⚪ |
| 29 | GET | `/attendance/schedules/mine` | `useGetMyWorkScheduleQuery` | — (self-service) | ⚪ |
| 30 | GET | `/attendance/schedules/for/{employeeId}` | `useGetEmployeeWorkScheduleQuery` | — | ⚪ |
| 31 | PUT | `/attendance/schedules/employees/{employeeId}` | `useAssignWorkScheduleMutation` | — | ⚪ |

### 2.18 Performance — `performance.ts` *(new)*

HR screen: `components/hr/performance` (Reviews and Goals tabs). Data mapping in `lib/performance/api-mapping.ts`.

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/performance/reviews` | `useGetReviewsQuery` / `useGetAllPerformanceReviewsQuery` (all pages) | `hr/performance/hooks` → Reviews tab | 🔁 |
| 2 | POST | `/performance/reviews` | `useOpenReviewMutation` | `hr/performance/hooks` → New review | ✅ |
| 3 | GET | `/performance/reviews/{id}` | `useGetReviewQuery` | — | ⚪ |
| 4 | DELETE | `/performance/reviews/{id}` | `useDeleteReviewMutation` | `hr/performance/hooks` → Delete review | ✅ |
| 5 | PUT | `/performance/reviews/{id}/manager-review` | `useSaveManagerReviewMutation` | `hr/performance/hooks` → Complete review (step 1) | ✅ |
| 6 | POST | `/performance/reviews/{id}/complete` | `useCompleteReviewMutation` | `hr/performance/hooks` → Complete review (step 2) | ✅ |
| 7 | POST | `/performance/reviews/{id}/calibrate` | `useCalibrateReviewMutation` | — | ⚪ |
| 8 | GET | `/performance/reviews/mine` | `useGetMyReviewsQuery` | — (self-service) | ⚪ |
| 9 | PUT | `/performance/reviews/mine/{id}/self-assessment` | `useSaveSelfAssessmentMutation` | — (self-service) | ⚪ |
| 10 | POST | `/performance/reviews/mine/{id}/self-assessment` | `useSubmitSelfAssessmentMutation` | — (self-service) | ⚪ |
| 11 | GET | `/performance/goals` | `useGetGoalsQuery` / `useGetAllPerformanceGoalsQuery` (all pages) | `hr/performance/hooks` → Goals tab | 🔁 |
| 12 | POST | `/performance/goals/employees/{employeeId}` | `useCreateEmployeeGoalMutation` | `hr/performance/hooks` → Add goal | ✅ |
| 13 | GET | `/performance/goals/{id}` | `useGetGoalQuery` | — | ⚪ |
| 14 | PUT | `/performance/goals/{id}` | `useUpdateGoalMutation` | — | ⚪ |
| 15 | DELETE | `/performance/goals/{id}` | `useDeleteGoalMutation` | `hr/performance/hooks` → Delete goal | ✅ |
| 16 | POST | `/performance/goals/{id}/progress` | `useUpdateGoalProgressMutation` | `hr/performance/hooks` → Update goal progress | ✅ |
| 17 | POST | `/performance/goals/{id}/status` | `useChangeGoalStatusMutation` | `hr/performance/hooks` → Update goal status | ✅ |
| 18 | GET | `/performance/goals/mine` | `useGetMyGoalsQuery` | — (self-service) | ⚪ |
| 19 | POST | `/performance/goals/mine` | `useCreateMyGoalMutation` | — (self-service) | ⚪ |
| 20 | GET | `/performance/feedback` | `useGetFeedbackQuery` | — | ⚪ |
| 21 | POST | `/performance/feedback` | `useGiveFeedbackMutation` | — | ⚪ |
| 22 | GET | `/performance/feedback/mine` | `useGetMyFeedbackQuery` | — (self-service) | ⚪ |
| 23 | GET | `/performance/feedback/requests/mine` | `useGetMyFeedbackRequestsQuery` | — (self-service) | ⚪ |
| 24 | GET | `/performance/feedback/requests/awaiting-me` | `useGetFeedbackRequestsAwaitingMeQuery` | — (self-service) | ⚪ |
| 25 | POST | `/performance/feedback/requests` | `useAskForFeedbackMutation` | — (self-service) | ⚪ |
| 26 | POST | `/performance/feedback/requests/{id}/decline` | `useDeclineFeedbackRequestMutation` | — (self-service) | ⚪ |

### 2.19 Announcements — `announcements.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/announcements/feed` | `useGetAnnouncementFeedQuery` | — | ⚪ |
| 2 | POST | `/announcements/feed/{id}/view` | `useMarkAnnouncementViewedMutation` | — | ⚪ |
| 3 | POST | `/announcements/feed/{id}/acknowledge` | `useAcknowledgeAnnouncementMutation` | — | ⚪ |
| 4 | GET | `/announcements` | `useGetAnnouncementsQuery` / `useGetAllAnnouncementsQuery` (all pages) | `hr/announcements/hooks` | 🔁 |
| 5 | POST | `/announcements` | `useCreateAnnouncementMutation` | `hr/announcements/hooks` | ✅ |
| 6 | GET | `/announcements/{id}` | `useGetAnnouncementQuery` | — | ⚪ |
| 7 | PUT | `/announcements/{id}` | `useUpdateAnnouncementMutation` | `hr/announcements/hooks` | ✅ |
| 8 | DELETE | `/announcements/{id}` | `useDeleteAnnouncementMutation` | `hr/announcements/hooks` | ✅ |
| 9 | GET | `/announcements/{id}/acknowledgements` | `useGetAnnouncementAcknowledgementsQuery` | — | ⚪ |
| 10 | POST | `/announcements/{id}/publish` | `usePublishAnnouncementMutation` | `hr/announcements/hooks` | ✅ |
| 11 | POST | `/announcements/{id}/archive` | `useArchiveAnnouncementMutation` | `hr/announcements/hooks` | ✅ |

### 2.20 Calendar — `calendar.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/calendar` | `useGetCalendarQuery` | `hr/calendar/workspace/use-calendar-data` | ✅ |
| 2 | GET | `/calendar/upcoming` | `useGetUpcomingCalendarQuery` | `employee/dashboard/live`; `hr/dashboard/components/upcoming-events-card` (dashboard Events tab, HR Action Centre events) | ✅ |
| 3 | POST | `/calendar/events` | `useCreateCalendarEventMutation` | `hr/calendar/workspace/use-calendar-data` | ✅ |
| 4 | GET | `/calendar/events/{id}` | `useGetCalendarEventQuery` | — | ⚪ |
| 5 | PUT | `/calendar/events/{id}` | `useUpdateCalendarEventMutation` | — | ⚪ |
| 6 | DELETE | `/calendar/events/{id}` | `useDeleteCalendarEventMutation` | `hr/calendar/workspace/use-calendar-data` | ✅ |

### 2.21 Recruitment: candidates — `candidates.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/candidates` | `useGetCandidatesQuery` / `useGetAllCandidatesQuery` (all pages) | `hr/recruitment/hooks` | 🔁 |
| 2 | POST | `/candidates` | `useCreateCandidateMutation` | `lib/stores/recruitment-listener` | ✅ |
| 3 | GET | `/candidates/{id}` | `useGetCandidateQuery` | — | ⚪ |
| 4 | PUT | `/candidates/{id}` | `useUpdateCandidateMutation` | `lib/stores/recruitment-listener` | ✅ |
| 5 | GET | `/candidates/{id}/can-move` | `useCanMoveCandidateQuery` | — | ⚪ |
| 6 | POST | `/candidates/{id}/move` | `useMoveCandidateMutation` | `lib/stores/recruitment-listener` | ✅ |
| 7 | POST | `/candidates/{id}/reject` | `useRejectCandidateMutation` | `lib/stores/recruitment-listener` | ✅ |
| 8 | POST | `/candidates/{id}/restore` | `useRestoreCandidateMutation` | `lib/stores/recruitment-listener` | ✅ |
| 9 | POST | `/candidates/{id}/owner` | `useAssignCandidateOwnerMutation` | `lib/stores/recruitment-listener` | ✅ |
| 10 | POST | `/candidates/{id}/scorecards` | `useAddCandidateScorecardMutation` | `lib/stores/recruitment-listener` | ✅ |
| 11 | POST | `/candidates/{id}/offers` | `useMakeCandidateOfferMutation` | `lib/stores/recruitment-listener` | ✅ |
| 12 | POST | `/candidates/{id}/offers/{offerId}/respond` | `useRespondToCandidateOfferMutation` | `lib/stores/recruitment-listener` | ✅ |
| 13 | POST | `/candidates/{id}/send-to-onboarding` | `useSendCandidateToOnboardingMutation` | `lib/stores/recruitment-listener` | ✅ |

### 2.22 Recruitment: interviews — `interviews.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/interviews` | `useGetInterviewsQuery` | `hr/recruitment/hooks` | ✅ |
| 2 | POST | `/interviews` | `useScheduleInterviewMutation` | `lib/stores/recruitment-listener` | ✅ |
| 3 | GET | `/interviews/candidate/{candidateId}` | `useGetCandidateInterviewsQuery` | — | ⚪ |
| 4 | PUT | `/interviews/{id}` | `useUpdateInterviewMutation` | — | ⚪ |
| 5 | POST | `/interviews/{id}/complete` | `useCompleteInterviewMutation` | `lib/stores/recruitment-listener` | ✅ |
| 6 | POST | `/interviews/{id}/cancel` | `useCancelInterviewMutation` | `lib/stores/recruitment-listener` | ✅ |

### 2.23 Recruitment: vacancies — `requisitions.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/requisitions` | `useGetRequisitionsQuery` / `useGetAllRequisitionsQuery` (all pages) | `hr/recruitment/hooks` | 🔁 |
| 2 | POST | `/requisitions` | `useCreateRequisitionMutation` | `lib/stores/recruitment-listener` | ✅ |
| 3 | GET | `/requisitions/{id}` | `useGetRequisitionQuery` | — | ⚪ |
| 4 | PUT | `/requisitions/{id}` | `useUpdateRequisitionMutation` | `lib/stores/recruitment-listener` | ✅ |
| 5 | DELETE | `/requisitions/{id}` | `useDeleteRequisitionMutation` | — | ⚪ |
| 6 | GET | `/requisitions/{id}/warnings` | `useGetRequisitionWarningsQuery` | — | ⚪ |
| 7 | POST | `/requisitions/{id}/publish` | `usePublishRequisitionMutation` | `lib/stores/recruitment-listener` | ✅ |
| 8 | POST | `/requisitions/{id}/hold` | `useHoldRequisitionMutation` | `lib/stores/recruitment-listener` | ✅ |
| 9 | POST | `/requisitions/{id}/resume` | `useResumeRequisitionMutation` | `lib/stores/recruitment-listener` | ✅ |
| 10 | POST | `/requisitions/{id}/close` | `useCloseRequisitionMutation` | `lib/stores/recruitment-listener` | ✅ |
| 11 | POST | `/requisitions/{id}/cancel` | `useCancelRequisitionMutation` | `lib/stores/recruitment-listener` | ✅ |

### 2.24 Contracts — `contracts.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/contracts/mine` | `useGetMyContractsQuery` | — (self-service) | ⚪ |
| 2 | POST | `/contracts/mine/{id}/sign` | `useSignMyContractMutation` | — (self-service) | ⚪ |
| 3 | GET | `/contracts` | `useGetContractsQuery` / `useGetAllContractsQuery` (all pages) | `hr/contracts/hooks` | 🔁 |
| 4 | POST | `/contracts` | `useCreateContractMutation` | `hr/contracts/hooks` | ✅ |
| 5 | GET | `/contracts/{id}` | `useGetContractQuery` | — | ⚪ |
| 6 | PUT | `/contracts/{id}` | `useUpdateContractMutation` | `hr/contracts/hooks` | ✅ |
| 7 | DELETE | `/contracts/{id}` | `useDeleteContractMutation` | `hr/contracts/hooks` | ✅ |
| 8 | POST | `/contracts/{id}/send` | `useSendContractMutation` | `hr/contracts/hooks` | ✅ |
| 9 | POST | `/contracts/{id}/activate` | `useActivateContractMutation` | `hr/contracts/hooks` | ✅ |
| 10 | POST | `/contracts/{id}/terminate` | `useTerminateContractMutation` | — | ⚪ |
| 11 | POST | `/contracts/{id}/sign` | `useSignContractMutation` | — | ⚪ |
| 12 | POST | `/contracts/{id}/file-to-documents` | `useFileContractToDocumentsMutation` | `hr/contracts/hooks` | ✅ |
| 13 | POST | `/contracts/{id}/notes` | `useAddContractNoteMutation` | — | ⚪ |

### 2.25 Dashboard — `dashboard.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/dashboard/people` | `useGetPeopleDashboardQuery` | `hr/dashboard/live` | ✅ |
| 2 | GET | `/dashboard/attendance` | `useGetAttendanceDashboardQuery` | `hr/dashboard/live` | ✅ |
| 3 | GET | `/dashboard/lifecycle` *(2026-11-27)* | `useGetLifecycleDashboardQuery` | `hr/lifecycle/hooks` (Journey Map stage counts) | ✅ |
| 4 | GET | `/dashboard/hr-actions` *(2026-11-27)* | `useGetHrActionsDashboardQuery` | `hr/hr-alerts` (dashboard Priorities tab, HR Action Centre alerts) | ✅ |
| 5 | GET | `/dashboard/untaken-leave` *(2026-11-27)* | `useGetUntakenLeaveDashboardQuery` | `hr/dashboard/components/employees-at-risk` | ✅ |
| 6 | GET | `/dashboard/mine` *(2026-11-27)* | `useGetMyDashboardQuery` | `employee/dashboard/live` (day stats, pending items, team on leave) | ✅ |

### 2.26 Documents — `documents.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/documents/mine` | `useGetMyDocumentsQuery` | `employee/documents` (My Documents) | ✅ |
| 2 | POST | `/documents/mine/{id}/acknowledge` | `useAcknowledgeMyDocumentMutation` | `employee/documents` | ✅ |
| 3 | GET | `/documents/folders` | `useGetDocumentFoldersQuery` | `hr/documents/hooks` | ✅ |
| 4 | POST | `/documents/folders` | `useCreateDocumentFolderMutation` | `hr/documents/hooks` | ✅ |
| 5 | PUT | `/documents/folders/{id}` | `useRenameDocumentFolderMutation` | — | ⚪ |
| 6 | DELETE | `/documents/folders/{id}` | `useDeleteDocumentFolderMutation` | — | ⚪ |
| 7 | GET | `/documents` | `useGetDocumentsQuery` / `useGetAllDocumentsQuery` (all pages) | `hr/documents/hooks` | 🔁 |
| 8 | POST | `/documents` | `useCreateDocumentMutation` | `hr/documents/hooks` | ✅ |
| 9 | GET | `/documents/{id}` | `useGetDocumentQuery` | — | ⚪ |
| 10 | PUT | `/documents/{id}` | `useUpdateDocumentMutation` | — | ⚪ |
| 11 | POST | `/documents/{id}/versions` | `useAddDocumentVersionMutation` | — | ⚪ |
| 12 | POST | `/documents/{id}/archive` | `useArchiveDocumentMutation` | `hr/documents/hooks` | ✅ |
| 13 | POST | `/documents/{id}/trash` | `useTrashDocumentMutation` | `hr/documents/hooks` | ✅ |
| 14 | POST | `/documents/{id}/restore` | `useRestoreDocumentMutation` | `hr/documents/hooks` | ✅ |
| 15 | POST | `/documents/{id}/shares` | `useShareDocumentMutation` | `hr/documents/hooks` | ✅ |
| 16 | DELETE | `/documents/{id}/shares/{employeeId}` | `useUnshareDocumentMutation` | `hr/documents/hooks` | ✅ |
| 17 | GET | `/documents/{id}/acknowledgements` | `useGetDocumentAcknowledgementsQuery` | — | ⚪ |
| 18 | POST | `/documents/mine` *(2026-11-27)* | `useUploadMyDocumentMutation` | `employee/documents` (Upload, after `POST /files` purpose `employeeDocument`) | ✅ |
| 19 | GET | `/documents/mine/folders` *(2026-11-27)* | `useGetMyFoldersQuery` | `employee/documents` | ✅ |
| 20 | POST | `/documents/mine/folders` *(2026-11-27)* | `useCreateMyFolderMutation` | `employee/documents` (New Folder) | ✅ |
| 21 | PUT | `/documents/mine/folders/{id}` *(2026-11-27)* | `useUpdateMyFolderMutation` | — (the design has no rename) | ⚪ |
| 22 | DELETE | `/documents/mine/folders/{id}` *(2026-11-27)* | `useDeleteMyFolderMutation` | `employee/documents` (folder ⋯ → Move to Trash) | ✅ |
| 23 | POST | `/documents/mine/{id}/move` *(2026-11-27)* | `useMoveMyDocumentMutation` | `employee/documents` (Move to Folder) | ✅ |
| 24 | POST | `/documents/mine/{id}/trash` *(2026-11-27)* | `useTrashMyDocumentMutation` | `employee/documents` | ✅ |
| 25 | POST | `/documents/mine/{id}/restore` *(2026-11-27)* | `useRestoreMyDocumentMutation` | `employee/documents` (Trash → Restore) | ✅ |
| 26 | GET | `/documents/reviews` *(2026-11-27)* | `useGetDocumentReviewsQuery` | `hr/documents/components/my-documents-tab`, `hr/documents` (pending count) | ✅ |
| 27 | POST | `/documents/reviews/{id}/approve` *(2026-11-27)* | `useApproveDocumentReviewMutation` | `my-documents-tab` | ✅ |
| 28 | POST | `/documents/reviews/{id}/reject` *(2026-11-27)* | `useRejectDocumentReviewMutation` | `my-documents-tab` | ✅ |

Self-service: only documents the employee uploaded (`isMine`) can be moved, trashed or restored; HR's documents answer with a message. A document is shown inside a folder only when the folder is one of the employee's own (`personal`/`custom`). The upload dialog's type is mapped onto the server's categories (Contract/Offer Letter → contract, Policy, Certificate, otherwise other). Permanent delete has no self-service endpoint and stays held. **Known gap (28 Nov):** `GET /documents/mine` leaves out trashed documents, so a trashed upload disappears and Restore is only reachable in the same session; the backend will add a trash listing together with `DELETE /documents/mine/{id}`. HR review: the tab's one-click Reject sends the reason "Rejected by HR", because the design has no reason box.

### 2.27 Expense claims — `expenses.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/expenses/claims/mine` | `useGetMyExpenseClaimsQuery` | — (self-service) | ⚪ |
| 2 | POST | `/expenses/claims/mine` | `useCreateMyExpenseClaimMutation` | — (self-service) | ⚪ |
| 3 | PUT | `/expenses/claims/mine/{id}` | `useUpdateMyExpenseClaimMutation` | — (self-service) | ⚪ |
| 4 | DELETE | `/expenses/claims/mine/{id}` | `useDeleteMyExpenseClaimMutation` | — (self-service) | ⚪ |
| 5 | POST | `/expenses/claims/mine/{id}/submit` | `useSubmitMyExpenseClaimMutation` | — (self-service) | ⚪ |
| 6 | POST | `/expenses/claims/mine/{id}/withdraw` | `useWithdrawMyExpenseClaimMutation` | — (self-service) | ⚪ |
| 7 | GET | `/expenses/claims` | `useGetExpenseClaimsQuery` / `useGetAllExpenseClaimsQuery` (all pages) | `hr/expenses/hooks` | 🔁 |
| 8 | GET | `/expenses/claims/{id}` | `useGetExpenseClaimQuery` | — | ⚪ |
| 9 | POST | `/expenses/claims/{id}/return` | `useReturnExpenseClaimMutation` | `hr/expenses/hooks` | ✅ |
| 10 | POST | `/expenses/claims/{id}/reimburse` | `useReimburseExpenseClaimMutation` | `hr/expenses/hooks` | ✅ |

### 2.28 Notifications — `notifications.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/notifications` | `useGetNotificationsQuery` | `lib/notifications/use-notification-feed` | ✅ |
| 2 | GET | `/notifications/unread-count` | `useGetUnreadNotificationCountQuery` | `lib/notifications/use-notification-feed` (navbar bell badge, both portals) | ✅ |
| 3 | POST | `/notifications/{id}/read` | `useMarkNotificationReadMutation` | `lib/notifications/use-notification-feed` | ✅ |
| 4 | POST | `/notifications/read-all` | `useMarkAllNotificationsReadMutation` | `lib/notifications/use-notification-feed` | ✅ |
| 5 | POST | `/notifications/{id}/dismiss` | `useDismissNotificationMutation` | — | ⚪ |

### 2.29 Benefit plans — `benefit-plans.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/benefit-plans` | `useGetBenefitPlansQuery` | `hr/benefit-plans/hooks` (sync into the benefit-plans slice) | ✅ |
| 2 | POST | `/benefit-plans` | `useCreateBenefitPlanMutation` | `hr/benefit-plans/hooks` | ✅ |
| 3 | GET | `/benefit-plans/summary` | `useGetBenefitPlansSummaryQuery` | `hr/benefit-plans` analytics strip | ✅ |
| 4 | GET | `/benefit-plans/coverage-levels` | `useGetCoverageLevelsQuery` | `hr/benefit-plans/hooks` (sync), `coverage-manage-dialog` | ✅ |
| 5 | POST | `/benefit-plans/coverage-levels` | `useCreateCoverageLevelMutation` | `benefit-plans/components/coverage-manage-dialog` | ✅ |
| 6 | PUT | `/benefit-plans/coverage-levels/{id}` | `useUpdateCoverageLevelMutation` | `coverage-manage-dialog` (rename) | ✅ |
| 7 | DELETE | `/benefit-plans/coverage-levels/{id}` | `useDeleteCoverageLevelMutation` | `coverage-manage-dialog` (remove) | ✅ |
| 8 | GET | `/benefit-plans/employees/{employeeId}` | `useGetEmployeeBenefitsQuery` | `employees/employee-detail/benefits-module` | ✅ |
| 9 | GET | `/benefit-plans/{id}` | `useGetBenefitPlanQuery` | `hr/benefit-plans` (edit opens on the server copy) | ✅ |
| 10 | PUT | `/benefit-plans/{id}` | `useUpdateBenefitPlanMutation` | `hr/benefit-plans/hooks` | ✅ |
| 11 | DELETE | `/benefit-plans/{id}` | `useDeleteBenefitPlanMutation` | `hr/benefit-plans/hooks` | ✅ |
| 12 | POST | `/benefit-plans/{id}/duplicate` | `useDuplicateBenefitPlanMutation` | `hr/benefit-plans/hooks` | ✅ |
| 13 | POST | `/benefit-plans/{id}/status` | `useSetBenefitPlanStatusMutation` | `hr/benefit-plans/hooks` (archive / activate) | ✅ |

### 2.30 Diversity & inclusion — `diversity.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/diversity/me` | `useGetMyDiversityQuery` | `employee/diversity` (self-service) | ✅ |
| 2 | PUT | `/diversity/me` | `useUpdateMyDiversityMutation` | `employee/diversity` (save and withdraw) | ✅ |
| 3 | GET | `/diversity/report` | `useGetDiversityReportQuery` | `hr/headcount/use-diversity` (Demographics tab) | ✅ |

### 2.31 Employee checklist — `employee-checklist.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/employee-checklist/items` | `useGetChecklistItemsQuery` | `hr/employee-checklist/hooks` | ✅ |
| 2 | POST | `/employee-checklist/items` | `useCreateChecklistItemMutation` | `hr/employee-checklist/hooks` | ✅ |
| 3 | PUT | `/employee-checklist/items/{id}` | `useUpdateChecklistItemMutation` | `hr/employee-checklist/hooks` | ✅ |
| 4 | DELETE | `/employee-checklist/items/{id}` | `useDeleteChecklistItemMutation` | `hr/employee-checklist/hooks` (items nobody has completed) | ✅ |
| 5 | POST | `/employee-checklist/items/{id}/move` | `useMoveChecklistItemMutation` | `hr/employee-checklist/hooks` (up / down arrows) | ✅ |
| 6 | POST | `/employee-checklist/items/{id}/retire` | `useRetireChecklistItemMutation` | `hr/employee-checklist/hooks` (delete of an item already completed) | ✅ |
| 7 | POST | `/employee-checklist/items/{id}/restore` | `useRestoreChecklistItemMutation` | — (no retired-items view) | ⚪ |
| 8 | GET | `/employee-checklist/hires` | `useGetChecklistHiresQuery` | `collections.ts` → `hr/employee-checklist/hooks` (New Hire Status) | 🔁 |
| 9 | GET | `/employee-checklist/me` | `useGetMyChecklistQuery` | `hr/employee-checklist/hooks` `useEmployeeChecklistFor` — no screen yet | ⚪ |
| 10 | GET | `/employee-checklist/employees/{employeeId}` | `useGetEmployeeChecklistQuery` | `useEmployeeChecklistFor` — no screen yet | ⚪ |
| 11 | POST | `/employee-checklist/employees/{employeeId}/tasks/{itemId}` | `useCompleteChecklistTaskMutation` | `useChecklistActions.setTaskDone` — no screen yet | ⚪ |
| 12 | DELETE | `/employee-checklist/employees/{employeeId}/tasks/{itemId}` | `useUncompleteChecklistTaskMutation` | `useChecklistActions.setTaskDone` — no screen yet | ⚪ |

### 2.32 Employment types — `employment-types.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/employment-types` | `useGetEmploymentTypesQuery` | `hr/employment-types/hooks` | ✅ |
| 2 | POST | `/employment-types` | `useCreateEmploymentTypeMutation` | `hr/employment-types/hooks` (form and bulk upload) | ✅ |
| 3 | GET | `/employment-types/{id}` | `useGetEmploymentTypeQuery` | `employment-types/components/employment-type-detail-modal` | ✅ |
| 4 | PUT | `/employment-types/{id}` | `useUpdateEmploymentTypeMutation` | `hr/employment-types/hooks` | ✅ |
| 5 | DELETE | `/employment-types/{id}` | `useDeleteEmploymentTypeMutation` | — (the screen has no delete) | ⚪ |
| 6 | POST | `/employment-types/{id}/deactivate` | `useDeactivateEmploymentTypeMutation` | `hr/employment-types/hooks` (Deactivate) | ✅ |
| 7 | POST | `/employment-types/{id}/reactivate` | `useReactivateEmploymentTypeMutation` | `hr/employment-types/hooks` (Activate) | ✅ |

### 2.33 Headcount planning — `headcount.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/headcount/plans` | `useGetHeadcountPlansQuery` | `collections.ts` `getHeadcountPlanBoards` → `hr/headcount/hooks` (one read per period) | 🔁 |
| 2 | PUT | `/headcount/plans` | `useSaveHeadcountPlanMutation` | `hr/headcount/hooks` (create and edit target) | ✅ |
| 3 | GET | `/headcount/trend` | `useGetHeadcountTrendQuery` | `headcount/components/trends` (QoQ and YoY) | ✅ |
| 4 | GET | `/headcount/series` | `useGetHeadcountSeriesQuery` | `headcount/components/trends` (chart) | ✅ |
| 5 | GET | `/headcount/demographics` | `useGetHeadcountDemographicsQuery` | `hr/headcount/hooks`, `hr/workforce/hooks` (Demographics) | ✅ |
| 6 | GET | `/headcount/attrition` | `useGetHeadcountAttritionQuery` | `hr/headcount/hooks`, `hr/workforce/hooks` | ✅ |
| 7 | DELETE | `/headcount/plans/{id}` | `useDeleteHeadcountPlanMutation` | `hr/headcount/hooks` | ✅ |

### 2.34 Hire tracker — `hire-tracker.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/hire-tracker` | `useGetHireTrackerQuery` | `hr/hire-tracker/hooks` (list and detail) | ✅ |

### 2.35 Kudos — `kudos.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/kudos` | `useGetKudosQuery` | `collections.ts` → `hr/kudos/hooks` (HR feed and self-service Kudos tab) | 🔁 |
| 2 | POST | `/kudos` | `useCreateKudosMutation` | `hr/kudos/hooks` (both send forms) | ✅ |
| 3 | GET | `/kudos/summary` | `useGetKudosSummaryQuery` | `kudos/components/stat-cards`, dashboard engagement ring | ✅ |
| 4 | GET | `/kudos/leaderboard` | `useGetKudosLeaderboardQuery` | `hr/kudos/hooks` (leaderboard, top recipient) | ✅ |
| 5 | GET | `/kudos/me` | `useGetMyKudosQuery` | `employee/community/components/kudos-tab` (my received / sent) | ✅ |
| 6 | GET | `/kudos/{id}` | `useGetKudosPostQuery` | — (the feed already holds each post) | ⚪ |
| 7 | DELETE | `/kudos/{id}` | `useDeleteKudosMutation` | `hr/kudos` (moderation) | ✅ |
| 8 | POST | `/kudos/{id}/pin` | `usePinKudosMutation` | `useKudosActions.togglePin` — no pin control | ⚪ |
| 9 | DELETE | `/kudos/{id}/pin` | `useUnpinKudosMutation` | `useKudosActions.togglePin` — no pin control | ⚪ |
| 10 | POST | `/kudos/{id}/reactions` | `useReactToKudosMutation` | `hr/kudos`, self-service Kudos tab | ✅ |
| 11 | POST | `/kudos/{id}/comments` | `useCommentOnKudosMutation` | `hr/kudos/components/kudos-feed` | ✅ |
| 12 | DELETE | `/kudos/{id}/comments/{commentId}` | `useDeleteKudosCommentMutation` | `useKudosActions.removeComment` — no control | ⚪ |
| 13 | GET | `/kudos/{id}/reactions` *(2026-11-27)* | `useLazyGetKudosReactorsQuery` | `lib/kudos/use-reactor-names` (hover names on reaction chips, HR and self-service) | ✅ |

### 2.36 Staff loans — `loans.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/loans` | `useGetLoansQuery` | `collections.ts` → `lib/loans/use-loans` (register, dashboard tile) | 🔁 |
| 2 | POST | `/loans` | `useCreateLoanMutation` | `loans/components/loan-request-modal` (HR and self-service) | ✅ |
| 3 | GET | `/loans/summary` | `useGetLoanBookQuery` | `hr/loans` KPI cards | ✅ |
| 4 | GET | `/loans/me` | `useGetMyLoansQuery` | `lib/loans/use-loans` (`/employee/loans`) | ✅ |
| 5 | GET | `/loans/employees/{employeeId}` | `useGetEmployeeLoansQuery` | `lib/loans/use-loans` (employee profile Loans module) | ✅ |
| 6 | GET | `/loans/{id}` | `useGetLoanQuery` | `hr/loans/detail` (schedule from the server) | ✅ |
| 7 | POST | `/loans/{id}/approve` | `useApproveLoanMutation` | `hr/loans/detail` (Approve & issue) | ✅ |
| 8 | POST | `/loans/{id}/reject` | `useRejectLoanMutation` | `hr/loans/detail` | ✅ |
| 9 | POST | `/loans/{id}/repayments` | `useRecordLoanRepaymentMutation` | `hr/loans/detail` (Record repayment) | ✅ |
| 10 | DELETE | `/loans/{id}/repayments/{repaymentId}` | `useDeleteLoanRepaymentMutation` | `useLoanActions.removeRepayment` — no repayment list | ⚪ |
| 11 | POST | `/loans/{id}/default` | `useDefaultLoanMutation` | `hr/loans/detail` (Mark defaulted) | ✅ |
| 12 | POST | `/loans/{id}/reinstate` | `useReinstateLoanMutation` | `useLoanActions.setStatus` — no reinstate button | ⚪ |

### 2.37 Roles & positions — `positions.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/positions` | `useGetPositionsQuery` | `hr/roles/hooks` | ✅ |
| 2 | POST | `/positions` | `useCreatePositionMutation` | `hr/roles/hooks` | ✅ |
| 3 | GET | `/positions/summary` | `useGetPositionsSummaryQuery` | `roles/components/stat-cards` | ✅ |
| 4 | GET | `/positions/{id}` | `useGetPositionQuery` | `roles/components/position-detail-modal` | ✅ |
| 5 | PUT | `/positions/{id}` | `useUpdatePositionMutation` | `hr/roles/hooks` | ✅ |
| 6 | DELETE | `/positions/{id}` | `useDeletePositionMutation` | `hr/roles/hooks` | ✅ |
| 7 | POST | `/positions/{id}/assign` | `useAssignPositionMutation` | `usePositionActions.assign` — no assign control | ⚪ |
| 8 | POST | `/positions/unassign` | `useUnassignPositionMutation` | `usePositionActions.unassign` — no control | ⚪ |
| 9 | POST | `/positions/{id}/retire` | `useRetirePositionMutation` | `usePositionActions.retire` — no control | ⚪ |
| 10 | POST | `/positions/{id}/restore` | `useRestorePositionMutation` | `hr/roles/hooks` (editing an inactive position back to filled / vacant) | ✅ |

### 2.38 Sickness & absence — `sickness.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/sickness` | `useGetSicknessRecordsQuery` | `collections.ts` → `hr/sickness/hooks` (sync into the sickness slice) | 🔁 |
| 2 | POST | `/sickness` | `useCreateSicknessRecordMutation` | `hr/sickness/report-form` (HR and self-service) | ✅ |
| 3 | GET | `/sickness/{id}` | `useGetSicknessRecordQuery` | `hr/sickness/record-detail` | ✅ |
| 4 | PUT | `/sickness/{id}` | `useUpdateSicknessRecordMutation` | `lib/stores/sickness-api-listener` (`updateRecord`) | ✅ |
| 5 | GET | `/sickness/summary` | `useGetSicknessSummaryQuery` | `hr/sickness/records-page` KPI cards | ✅ |
| 6 | GET | `/sickness/alerts` | `useGetSicknessAlertsQuery` | `hr/sickness/alerts-reporting` | ✅ |
| 7 | POST | `/sickness/{id}/approve` | `useApproveSicknessRecordMutation` | `sickness-api-listener` (Confirm absence) | ✅ |
| 8 | POST | `/sickness/{id}/reject` | `useRejectSicknessRecordMutation` | `sickness-api-listener` (Reject) | ✅ |
| 9 | POST | `/sickness/{id}/cancel` | `useCancelSicknessRecordMutation` | `sickness-api-listener` — only the demo approvals engine cancels | ⚪ |
| 10 | POST | `/sickness/{id}/return` | `useRecordSicknessReturnMutation` | `sickness-api-listener` (return-to-work page, self-service I'm back) | ✅ |
| 11 | POST | `/sickness/{id}/return-to-work` | `useRecordReturnToWorkMutation` | `sickness-api-listener` (RTW interview form) | ✅ |
| 12 | POST | `/sickness/{id}/documents` | `useAttachSicknessDocumentMutation` | `sickness-api-listener` (report form, record detail, RTW, self-service) | ✅ |
| 13 | POST | `/sickness/{id}/exclusion` | `useSetSicknessExclusionMutation` | `sickness-api-listener` (Bradford exclusion dialog) | ✅ |
| 14 | DELETE | `/sickness/{id}/exclusion` | `useClearSicknessExclusionMutation` | `sickness-api-listener` | ✅ |
| 15 | GET | `/sickness/bradford/{employeeId}` | `useGetEmployeeBradfordQuery` | `sickness/bradford-dashboard` (employee breakdown) | ✅ |
| 16 | GET | `/sickness/bradford` | `useGetBradfordScoresQuery` | `hr/sickness/hooks` `bradfordFor` (every Bradford figure) | ✅ |

### 2.39 Tasks — `tasks.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/tasks` | `useGetTasksQuery` | `collections.ts` → `employee/tasks/hooks` (My Tasks, HR My Work) | 🔁 |
| 2 | POST | `/tasks` | `useCreateTaskMutation` | `employee/tasks` (add personal task) | ✅ |
| 3 | GET | `/tasks/assigned-by-me` | `useGetTasksAssignedByMeQuery` | `useTasksAssignedByMe` — no screen lists them | ⚪ |
| 4 | GET | `/tasks/summary` | `useGetTasksSummaryQuery` | `employee/tasks` header counts | ✅ |
| 5 | GET | `/tasks/{id}` | `useGetTaskQuery` | `useMyTaskActions.update` — no edit form | ⚪ |
| 6 | PUT | `/tasks/{id}` | `useUpdateTaskMutation` | `useMyTaskActions.update` — no edit form | ⚪ |
| 7 | DELETE | `/tasks/{id}` | `useDeleteTaskMutation` | `useMyTaskActions.remove` — no delete control | ⚪ |
| 8 | POST | `/tasks/{id}/complete` | `useCompleteTaskMutation` | `employee/tasks` (tick) | ✅ |
| 9 | DELETE | `/tasks/{id}/complete` | `useReopenTaskMutation` | `employee/tasks` (untick) | ✅ |
| 10 | POST | `/tasks/reorder` | `useReorderTasksMutation` | `useMyTaskActions.reorder` — no drag handle on the routed screen | ⚪ |

### 2.40 Workforce planning — `workforce.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/workforce/overview` | `useGetWorkforceOverviewQuery` | `hr/workforce` overview cards | ✅ |
| 2 | GET | `/workforce/turnover` | `useGetWorkforceTurnoverQuery` | `workforce/components/turnover-section`, overview | ✅ |
| 3 | GET | `/workforce/hiring` | `useGetWorkforceHiringQuery` | `workforce/components/hiring-section`, overview, dashboard Resourcing tab (open roles) | ✅ |

### 2.41 Workforce requests — `workforce-requests.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/workforce-requests` | `useGetWorkforceRequestsQuery` | `collections.ts` → `hr/workforce-requests/hooks` (sync into the slice) | 🔁 |
| 2 | POST | `/workforce-requests` | `useCreateWorkforceRequestMutation` | `hr/workforce-requests` (save draft) | ✅ |
| 3 | GET | `/workforce-requests/{id}` | `useGetWorkforceRequestQuery` | `hr/workforce-requests` (view opens the server copy) | ✅ |
| 4 | PUT | `/workforce-requests/{id}` | `useUpdateWorkforceRequestMutation` | `hr/workforce-requests` (edit draft) | ✅ |
| 5 | DELETE | `/workforce-requests/{id}` | `useDeleteWorkforceRequestMutation` | `useWorkforceRequestActions.remove` — no delete control | ⚪ |
| 6 | POST | `/workforce-requests/{id}/submit` | `useSubmitWorkforceRequestMutation` | `hr/workforce-requests` (Submit) | ✅ |
| 7 | POST | `/workforce-requests/{id}/cancel` | `useCancelWorkforceRequestMutation` | `useWorkforceRequestActions.cancel` — no cancel control | ⚪ |
| 8 | POST | `/workforce-requests/{id}/convert` | `useConvertWorkforceRequestMutation` | `hr/workforce-requests` (Create requisition) | ✅ |

---

### 2026-11-25 modules

The tables below are generated from the code: **Used in** lists the files (outside the service layer) that call each hook. 🔁 means the list is read in full by a loader (`collections.ts` or a `*-workspace.ts` file) rather than through the paged hook.

### 2.61 Company — `company.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/company` | `useGetCompanyQuery` | `components/hr/company-profile/hooks` | ✅ |
| 2 | PUT | `/company` | `useUpdateCompanyMutation` | `components/hr/company-profile/hooks` | ✅ |
| 3 | GET | `/company/org-chart` | `useGetCompanyOrgChartQuery` | `components/hr/company-profile/hooks` | ✅ |
| 4 | GET | `/company/notice` | `useGetCompanyNoticeQuery` | `components/hr/company-profile/hooks` | ✅ |
| 5 | GET | `/company/verification` | `useGetCompanyVerificationQuery` | `components/hr/company-profile/hooks` | ✅ |
| 6 | PUT | `/company/verification/{kind}` | `useSaveCompanyVerificationMutation` | `components/hr/company-profile/hooks` | ✅ |
| 7 | POST | `/company/verification/{kind}/submit` | `useSubmitCompanyVerificationMutation` | `components/hr/company-profile/hooks` | ✅ |
| 8 | POST | `/company/verification/{kind}/withdraw` | `useWithdrawCompanyVerificationMutation` | — | ⚪ |

### 2.62 Settings — `settings.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/settings/modules` | `useGetModuleSettingsQuery` | `components/hr/settings/live` | ✅ |
| 2 | PUT | `/settings/modules` | `useUpdateModuleSettingsMutation` | `components/hr/settings/live` | ✅ |
| 3 | GET | `/settings/password-policy` | `useGetPasswordPolicyQuery` | `components/hr/settings/live` | ✅ |
| 4 | PUT | `/settings/password-policy` | `useUpdatePasswordPolicyMutation` | `components/hr/settings/live` | ✅ |
| 5 | GET | `/settings/holiday-years` | `useGetHolidayYearsQuery` | `components/hr/settings/live` | ✅ |
| 6 | PUT | `/settings/holiday-year` | `useUpdateHolidayYearMutation` | `components/hr/settings/live` | ✅ |
| 7 | GET | `/settings/subscription` | `useGetSubscriptionQuery` | `components/hr/settings/live` | ✅ |

### 2.63 Pick lists — `pick-lists.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/settings/pick-lists` | `useGetPickListsQuery` | `components/hr/settings/live` | ✅ |
| 2 | GET | `/settings/pick-lists/{key}` | `useGetPickListQuery` | — | ⚪ |
| 3 | POST | `/settings/pick-lists/{key}/options` | `useAddPickListOptionMutation` | `components/hr/settings/live` | ✅ |
| 4 | PUT | `/settings/pick-lists/{key}/options/{id}` | `useUpdatePickListOptionMutation` | `components/hr/settings/live` | ✅ |
| 5 | DELETE | `/settings/pick-lists/{key}/options/{id}` | `useDeletePickListOptionMutation` | `components/hr/settings/live` | ✅ |
| 6 | PUT | `/settings/pick-lists/{key}/options/{id}/default` | `useSetDefaultPickListOptionMutation` | `components/hr/settings/live` | ✅ |

### 2.64 Account settings (your own) — `account-settings.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/settings/me/notifications` | `useGetMyNotificationSettingsQuery` | `components/hr/settings/live` | ✅ |
| 2 | PUT | `/settings/me/notifications` | `useUpdateMyNotificationSettingsMutation` | `components/hr/settings/live` | ✅ |
| 3 | GET | `/settings/me/sessions` | `useGetMySessionsQuery` | `components/hr/settings/live` | ✅ |
| 4 | DELETE | `/settings/me/sessions/{id}` | `useRevokeMySessionMutation` | `components/hr/settings/live` | ✅ |
| 5 | GET | `/settings/me/activity` | `useGetMyAccountActivityQuery` | `components/hr/settings/live` | ✅ |

### 2.65 Help desk — `helpdesk.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/helpdesk` | `useGetHelpdeskTicketsQuery` | `store/services/collections (full read)` | 🔁 |
| 2 | POST | `/helpdesk` | `useCreateHelpdeskTicketMutation` | `components/hr/helpdesk/hooks` | ✅ |
| 3 | GET | `/helpdesk/summary` | `useGetHelpdeskSummaryQuery` | — | ⚪ |
| 4 | GET | `/helpdesk/mine` | `useGetMyHelpdeskTicketsQuery` | `components/hr/helpdesk/hooks` | ✅ |
| 5 | GET | `/helpdesk/{id}` | `useGetHelpdeskTicketQuery` | — | ⚪ |
| 6 | DELETE | `/helpdesk/{id}` | `useDeleteHelpdeskTicketMutation` | `components/hr/helpdesk/hooks` | ✅ |
| 7 | POST | `/helpdesk/{id}/messages` | `useReplyToHelpdeskTicketMutation` | `components/hr/helpdesk/hooks` | ✅ |
| 8 | POST | `/helpdesk/{id}/status` | `useSetHelpdeskTicketStatusMutation` | `components/hr/helpdesk/hooks` | ✅ |
| 9 | POST | `/helpdesk/{id}/priority` | `useSetHelpdeskTicketPriorityMutation` | `components/hr/helpdesk/hooks` | ✅ |
| 10 | POST | `/helpdesk/{id}/assign` | `useAssignHelpdeskTicketMutation` | `components/hr/helpdesk/hooks` | ✅ |

### 2.66 Knowledge base — `knowledge.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/knowledge` | `useGetKnowledgeArticlesQuery` | `components/hr/knowledge/hooks` | ✅ |
| 2 | POST | `/knowledge` | `useCreateKnowledgeArticleMutation` | `components/hr/knowledge/hooks` | ✅ |
| 3 | GET | `/knowledge/published` | `useGetPublishedKnowledgeArticlesQuery` | `components/hr/knowledge/hooks` | ✅ |
| 4 | GET | `/knowledge/summary` | `useGetKnowledgeSummaryQuery` | — | ⚪ |
| 5 | GET | `/knowledge/{id}` | `useGetKnowledgeArticleQuery` | — | ⚪ |
| 6 | PUT | `/knowledge/{id}` | `useUpdateKnowledgeArticleMutation` | `components/hr/knowledge/hooks` | ✅ |
| 7 | DELETE | `/knowledge/{id}` | `useDeleteKnowledgeArticleMutation` | `components/hr/knowledge/hooks` | ✅ |
| 8 | POST | `/knowledge/{id}/status` | `useSetKnowledgeArticleStatusMutation` | `components/hr/knowledge/hooks` | ✅ |
| 9 | POST | `/knowledge/{id}/feature` | `useFeatureKnowledgeArticleMutation` | `components/hr/knowledge/hooks` | ✅ |
| 10 | DELETE | `/knowledge/{id}/feature` | `useUnfeatureKnowledgeArticleMutation` | `components/hr/knowledge/hooks` | ✅ |
| 11 | POST | `/knowledge/{id}/read` | `useMarkKnowledgeArticleReadMutation` | `components/hr/knowledge/hooks` | ✅ |
| 12 | POST | `/knowledge/{id}/feedback` | `useSendKnowledgeArticleFeedbackMutation` | `components/hr/knowledge/hooks` | ✅ |
| 13 | DELETE | `/knowledge/{id}/feedback` | `useClearKnowledgeArticleFeedbackMutation` | `components/hr/knowledge/hooks` | ✅ |

### 2.67 Community feed — `community.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/community` | `useGetCommunityPostsQuery` | `store/services/collections (full read)` | 🔁 |
| 2 | POST | `/community` | `useCreateCommunityPostMutation` | `lib/engagement/use-engagement` | ✅ |
| 3 | GET | `/community/summary` | `useGetCommunitySummaryQuery` | — | ⚪ |
| 4 | GET | `/community/{id}` | `useGetCommunityPostQuery` | — | ⚪ |
| 5 | PUT | `/community/{id}` | `useUpdateCommunityPostMutation` | — | ⚪ |
| 6 | DELETE | `/community/{id}` | `useDeleteCommunityPostMutation` | `lib/engagement/use-engagement` | ✅ |
| 7 | POST | `/community/{id}/pin` | `usePinCommunityPostMutation` | `lib/engagement/use-engagement` | ✅ |
| 8 | DELETE | `/community/{id}/pin` | `useUnpinCommunityPostMutation` | `lib/engagement/use-engagement` | ✅ |
| 9 | POST | `/community/{id}/like` | `useLikeCommunityPostMutation` | `lib/engagement/use-engagement` | ✅ |
| 10 | POST | `/community/{id}/comments` | `useCommentOnCommunityPostMutation` | `lib/engagement/use-engagement` | ✅ |
| 11 | DELETE | `/community/{id}/comments/{commentId}` | `useDeleteCommunityCommentMutation` | — | ⚪ |
| 12 | POST | `/community/{id}/poll-votes` | `useVoteOnCommunityPollMutation` | `lib/engagement/use-engagement` | ✅ |

### 2.68 Suggestions — `suggestions.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/suggestions` | `useGetSuggestionsQuery` | `store/services/collections (full read)` | 🔁 |
| 2 | POST | `/suggestions` | `useCreateSuggestionMutation` | `lib/engagement/use-engagement` | ✅ |
| 3 | GET | `/suggestions/summary` | `useGetSuggestionSummaryQuery` | — | ⚪ |
| 4 | GET | `/suggestions/mine` | `useGetMySuggestionsQuery` | — | ⚪ |
| 5 | GET | `/suggestions/{id}` | `useGetSuggestionQuery` | — | ⚪ |
| 6 | PUT | `/suggestions/{id}/status` | `useSetSuggestionStatusMutation` | `lib/engagement/use-engagement` | ✅ |
| 7 | PUT | `/suggestions/{id}/priority` | `useSetSuggestionPriorityMutation` | `lib/engagement/use-engagement` | ✅ |
| 8 | PUT | `/suggestions/{id}/response` | `useSetSuggestionResponseMutation` | `lib/engagement/use-engagement` | ✅ |
| 9 | POST | `/suggestions/{id}/feature` | `useFeatureSuggestionMutation` | `lib/engagement/use-engagement` | ✅ |
| 10 | DELETE | `/suggestions/{id}/feature` | `useUnFeatureSuggestionMutation` | `lib/engagement/use-engagement` | ✅ |
| 11 | POST | `/suggestions/{id}/upvote` | `useUpvoteSuggestionMutation` | `lib/engagement/use-engagement` | ✅ |
| 12 | POST | `/suggestions/{id}/comments` | `useCommentOnSuggestionMutation` | `lib/engagement/use-engagement` | ✅ |
| 13 | DELETE | `/suggestions/{id}/comments/{commentId}` | `useDeleteSuggestionCommentMutation` | — | ⚪ |
| 14 | DELETE | `/suggestions/{id}` *(2026-11-27)* | `useDeleteSuggestionMutation` | `lib/engagement/use-engagement` (HR table Delete) | ✅ |

### 2.69 Surveys — `surveys.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/surveys` | `useGetSurveysQuery` | `store/services/collections (full read)` | 🔁 |
| 2 | POST | `/surveys` | `useCreateSurveyMutation` | `components/hr/surveys/hooks` | ✅ |
| 3 | GET | `/surveys/summary` | `useGetSurveySummaryQuery` | dashboard engagement ring | ✅ |
| 4 | GET | `/surveys/engagement-trend` | `useGetEngagementTrendQuery` | `components/hr/surveys/hooks`, dashboard engagement ring | ✅ |
| 5 | GET | `/surveys/mine` | `useGetMySurveysQuery` | — | ⚪ |
| 6 | GET | `/surveys/{id}` | `useGetSurveyQuery` | — | ⚪ |
| 7 | PUT | `/surveys/{id}` | `useUpdateSurveyMutation` | `components/hr/surveys/hooks` | ✅ |
| 8 | DELETE | `/surveys/{id}` | `useDeleteSurveyMutation` | `components/hr/surveys/hooks` | ✅ |
| 9 | GET | `/surveys/{id}/results` | `useGetSurveyResultsQuery` | `components/hr/surveys/hooks` | ✅ |
| 10 | GET | `/surveys/{id}/my-response` | `useGetMySurveyResponseQuery` | — | ⚪ |
| 11 | POST | `/surveys/{id}/status` | `useSetSurveyStatusMutation` | `components/hr/surveys/hooks` | ✅ |
| 12 | POST | `/surveys/{id}/responses` | `useSubmitSurveyResponseMutation` | — | ⚪ |

### 2.70 Employer of Record — `eor.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/eor/providers` | `useGetEorProvidersQuery` | `lib/eor/use-eor` | ✅ |
| 2 | POST | `/eor/providers` | `useCreateEorProviderMutation` | `lib/eor/use-eor` | ✅ |
| 3 | GET | `/eor/providers/{id}` | `useGetEorProviderQuery` | — | ⚪ |
| 4 | PUT | `/eor/providers/{id}` | `useUpdateEorProviderMutation` | `lib/eor/use-eor` | ✅ |
| 5 | DELETE | `/eor/providers/{id}` | `useDeleteEorProviderMutation` | `lib/eor/use-eor` | ✅ |
| 6 | GET | `/eor/workers` | `useGetEorWorkersQuery` | `store/services/collections (full read)` | 🔁 |
| 7 | POST | `/eor/workers` | `useCreateEorWorkerMutation` | `lib/eor/use-eor` | ✅ |
| 8 | GET | `/eor/workers/{id}` | `useGetEorWorkerQuery` | — | ⚪ |
| 9 | PUT | `/eor/workers/{id}` | `useUpdateEorWorkerMutation` | `lib/eor/use-eor` | ✅ |
| 10 | DELETE | `/eor/workers/{id}` | `useDeleteEorWorkerMutation` | `lib/eor/use-eor` | ✅ |
| 11 | POST | `/eor/workers/{id}/end` | `useEndEorWorkerMutation` | — | ⚪ |
| 12 | GET | `/eor/summary` | `useGetEorSummaryQuery` | — | ⚪ |
| 13 | GET | `/eor/compliance` | `useGetEorComplianceQuery` | — | ⚪ |
| 14 | PUT | `/eor/workers/{id}/compliance/{key}` | `useUpdateEorWorkerComplianceMutation` | — | ⚪ |
| 15 | GET | `/eor/invoices` | `useGetEorInvoicesQuery` | `lib/eor/use-eor` | ✅ |
| 16 | POST | `/eor/invoices` | `useCreateEorInvoiceMutation` | — | ⚪ |
| 17 | PUT | `/eor/invoices/{id}` | `useUpdateEorInvoiceMutation` | — | ⚪ |
| 18 | DELETE | `/eor/invoices/{id}` | `useDeleteEorInvoiceMutation` | — | ⚪ |
| 19 | POST | `/eor/invoices/{id}/settle` | `useSettleEorInvoiceMutation` | — | ⚪ |

### 2.71 Learning — `learning.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/learning/courses` | `useGetLearningCoursesQuery` | `store/services/collections (full read)` | 🔁 |
| 2 | POST | `/learning/courses` | `useCreateLearningCourseMutation` | `lib/learning/use-learning-live` | ✅ |
| 3 | GET | `/learning/courses/{id}` | `useGetLearningCourseQuery` | — | ⚪ |
| 4 | PUT | `/learning/courses/{id}` | `useUpdateLearningCourseMutation` | `lib/learning/use-learning-live` | ✅ |
| 5 | DELETE | `/learning/courses/{id}` | `useDeleteLearningCourseMutation` | `lib/learning/use-learning-live` | ✅ |
| 6 | GET | `/learning/summary` | `useGetLearningSummaryQuery` | — | ⚪ |
| 7 | GET | `/learning/compliance` | `useGetLearningComplianceQuery` | — | ⚪ |
| 8 | GET | `/learning/courses/{id}/quiz` | `useGetLearningCourseQuizQuery` | `lib/learning/use-learning-live` | ✅ |
| 9 | PUT | `/learning/courses/{id}/quiz` | `useSaveLearningCourseQuizMutation` | `lib/learning/use-learning-live` | ✅ |
| 10 | GET | `/learning/enrollments` | `useGetLearningEnrollmentsQuery` | `store/services/collections (full read)` | 🔁 |
| 11 | POST | `/learning/courses/{id}/enrollments` | `useEnrollInLearningCourseMutation` | `lib/learning/use-learning-live` | ✅ |
| 12 | PATCH | `/learning/enrollments/{enrollmentId}/progress` | `useUpdateLearningEnrollmentProgressMutation` | `lib/learning/use-learning-live` | ✅ |
| 13 | PATCH | `/learning/enrollments/{enrollmentId}/status` | `useUpdateLearningEnrollmentStatusMutation` | — | ⚪ |
| 14 | DELETE | `/learning/enrollments/{enrollmentId}` | `useDeleteLearningEnrollmentMutation` | `lib/learning/use-learning-live` | ✅ |
| 15 | GET | `/learning/mine` | `useGetMyLearningQuery` | `lib/learning/use-learning-live` | ✅ |
| 16 | GET | `/learning/mine/{enrollmentId}/quiz` | `useGetMyLearningQuizQuery` | `lib/learning/use-learning-live` | ✅ |
| 17 | POST | `/learning/mine/{enrollmentId}/attempts` | `useSubmitMyLearningQuizAttemptMutation` | `lib/learning/use-learning-live` | ✅ |

### 2.72 Certifications — `certifications.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/certifications` | `useGetCertificationsQuery` | `components/hr/employees/employee-detail/hooks` | ✅ |
| 2 | POST | `/certifications` | `useCreateCertificationMutation` | `lib/learning/use-learning-live`, `lib/stores/collection-api-listener` | ✅ |
| 3 | GET | `/certifications/summary` | `useGetCertificationSummaryQuery` | — | ⚪ |
| 4 | GET | `/certifications/mine` | `useGetMyCertificationsQuery` | `lib/learning/use-learning-live` | ✅ |
| 5 | PUT | `/certifications/{id}` | `useUpdateCertificationMutation` | `lib/learning/use-learning-live`, `lib/stores/collection-api-listener` | ✅ |
| 6 | DELETE | `/certifications/{id}` | `useDeleteCertificationMutation` | `lib/learning/use-learning-live`, `lib/stores/collection-api-listener` | ✅ |

### 2.73 Employee notes — `employee-notes.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/employees/{employeeId}/notes` | `useGetEmployeeNotesQuery` | `components/hr/employees/employee-detail/hooks` | ✅ |
| 2 | POST | `/employees/{employeeId}/notes` | `useAddEmployeeNoteMutation` | `lib/stores/collection-api-listener` | ✅ |
| 3 | PUT | `/employees/{employeeId}/notes/{noteId}` | `useUpdateEmployeeNoteMutation` | `lib/stores/collection-api-listener` | ✅ |
| 4 | DELETE | `/employees/{employeeId}/notes/{noteId}` | `useDeleteEmployeeNoteMutation` | `lib/stores/collection-api-listener` | ✅ |
| 5 | POST | `/employees/{employeeId}/notes/{noteId}/pin` | `usePinEmployeeNoteMutation` | — | ⚪ |

### 2.74 Employee Relations cases — `er-cases.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/er-cases` | `useGetErCasesQuery` | `store/services/collections (full read)` | 🔁 |
| 2 | POST | `/er-cases` | `useCreateErCaseMutation` | `lib/stores/er-cases-api-listener` | ✅ |
| 3 | GET | `/er-cases/summary` | `useGetErCaseSummaryQuery` | — | ⚪ |
| 4 | GET | `/er-cases/mine` | `useGetMyErCasesQuery` | `components/hr/grievance/hooks` | ✅ |
| 5 | GET | `/er-cases/{id}` | `useGetErCaseQuery` | `components/hr/grievance/hooks` | ✅ |
| 6 | PUT | `/er-cases/{id}` | `useUpdateErCaseMutation` | `lib/stores/er-cases-api-listener` | ✅ |
| 7 | DELETE | `/er-cases/{id}` | `useDeleteErCaseMutation` | `lib/stores/er-cases-api-listener` | ✅ |
| 8 | GET | `/er-cases/{id}/activity` | `useGetErCaseActivityQuery` | `components/hr/grievance/hooks` | ✅ |
| 9 | PATCH | `/er-cases/{id}/stage` | `useMoveErCaseStageMutation` | `lib/stores/er-cases-api-listener` | ✅ |
| 10 | POST | `/er-cases/{id}/notes` | `useAddErCaseNoteMutation` | `lib/stores/er-cases-api-listener` | ✅ |
| 11 | DELETE | `/er-cases/{id}/notes/{noteId}` | `useDeleteErCaseNoteMutation` | — | ⚪ |
| 12 | POST | `/er-cases/{id}/meetings` | `useAddErCaseMeetingMutation` | `lib/stores/er-cases-api-listener` | ✅ |
| 13 | DELETE | `/er-cases/{id}/meetings/{meetingId}` | `useDeleteErCaseMeetingMutation` | — | ⚪ |
| 14 | POST | `/er-cases/{id}/evidence` | `useAddErCaseEvidenceMutation` | — | ⚪ |
| 15 | GET | `/er-cases/{id}/evidence/{evidenceId}/download` | `useDownloadErCaseEvidenceMutation` | — | ⚪ |
| 16 | DELETE | `/er-cases/{id}/evidence/{evidenceId}` | `useDeleteErCaseEvidenceMutation` | — | ⚪ |
| 17 | GET | `/employees/{employeeId}/grievances` | `useGetEmployeeGrievancesQuery` | — | ⚪ |
| 18 | GET | `/employees/{employeeId}/disciplinaries` | `useGetEmployeeDisciplinariesQuery` | — | ⚪ |

### 2.75 Occupational health — `occupational-health.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/occupational-health` | `useGetOhReferralsQuery` | `store/services/collections (full read)` | 🔁 |
| 2 | POST | `/occupational-health` | `useCreateOhReferralMutation` | `lib/stores/oh-api-listener` | ✅ |
| 3 | GET | `/occupational-health/{id}` | `useGetOhReferralQuery` | — | ⚪ |
| 4 | PUT | `/occupational-health/{id}` | `useUpdateOhReferralMutation` | `lib/stores/oh-api-listener` | ✅ |
| 5 | DELETE | `/occupational-health/{id}` | `useDeleteOhReferralMutation` | — | ⚪ |
| 6 | GET | `/occupational-health/summary` | `useGetOhSummaryQuery` | — | ⚪ |
| 7 | GET | `/occupational-health/candidates` | `useGetOhCandidatesQuery` | — | ⚪ |
| 8 | GET | `/occupational-health/{id}/history` | `useGetOhReferralHistoryQuery` | — | ⚪ |
| 9 | POST | `/occupational-health/{id}/stage` | `useMoveOhReferralStageMutation` | `lib/stores/oh-api-listener` | ✅ |
| 10 | POST | `/occupational-health/{id}/adjustments` | `useAddOhAdjustmentMutation` | `lib/stores/oh-api-listener` | ✅ |
| 11 | PUT | `/occupational-health/{id}/adjustments/{adjustmentId}` | `useUpdateOhAdjustmentMutation` | `lib/stores/oh-api-listener` | ✅ |
| 12 | DELETE | `/occupational-health/{id}/adjustments/{adjustmentId}` | `useDeleteOhAdjustmentMutation` | — | ⚪ |
| 13 | POST | `/occupational-health/{id}/adjustments/{adjustmentId}/stage` | `useMoveOhAdjustmentStageMutation` | `lib/stores/oh-api-listener` | ✅ |
| 14 | PUT | `/occupational-health/{id}/sickness-records` *(2026-11-27)* | `useLinkOhAbsencesMutation` | `lib/stores/oh-api-listener` (Link another absence; referrals that link earlier absences) | ✅ |

### 2.76 Shifts — `shifts.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/shifts/roster` | `useGetShiftRosterQuery` | `lib/shifts/use-shifts-live` | ✅ |
| 2 | GET | `/shifts/mine` | `useGetMyShiftsQuery` | `lib/shifts/use-shifts-live` | ✅ |
| 3 | POST | `/shifts/assignments` | `useCreateShiftAssignmentMutation` | `lib/stores/shifts-api-listener` | ✅ |
| 4 | POST | `/shifts/assignments/{id}/cancel` | `useCancelShiftAssignmentMutation` | `lib/stores/shifts-api-listener` | ✅ |
| 5 | DELETE | `/shifts/assignments/{id}` | `useDeleteShiftAssignmentMutation` | `lib/stores/shifts-api-listener` | ✅ |

### 2.77 Projects — `projects.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/projects/{projectId}/documents` | `useGetProjectDocumentsQuery` | `store/services/*-workspace (full read)` | 🔁 |
| 2 | POST | `/projects/{projectId}/documents` | `useAddProjectDocumentMutation` | — | ⚪ |
| 3 | GET | `/projects/{projectId}/documents/{documentId}/download` | `useDownloadProjectDocumentMutation` | — | ⚪ |
| 4 | DELETE | `/projects/{projectId}/documents/{documentId}` | `useDeleteProjectDocumentMutation` | `lib/stores/projects-api-listener` | ✅ |
| 5 | GET | `/projects/{projectId}/go-live` | `useGetProjectGoLiveQuery` | `store/services/*-workspace (full read)` | 🔁 |
| 6 | PUT | `/projects/{projectId}/go-live/{itemKey}` | `useUpdateProjectGoLiveItemMutation` | `lib/stores/projects-api-listener` | ✅ |
| 7 | GET | `/projects/{projectId}/risks` | `useGetProjectRisksQuery` | `store/services/*-workspace (full read)` | 🔁 |
| 8 | POST | `/projects/{projectId}/risks` | `useAddProjectRiskMutation` | `lib/stores/projects-api-listener` | ✅ |
| 9 | GET | `/projects/{projectId}/risks/tally` | `useGetProjectRiskTallyQuery` | — | ⚪ |
| 10 | PUT | `/projects/{projectId}/risks/{riskId}` | `useUpdateProjectRiskMutation` | `lib/stores/projects-api-listener` | ✅ |
| 11 | DELETE | `/projects/{projectId}/risks/{riskId}` | `useDeleteProjectRiskMutation` | `lib/stores/projects-api-listener` | ✅ |
| 12 | GET | `/projects` | `useGetProjectsQuery` | `store/services/projects-workspace` | ✅ |
| 13 | POST | `/projects` | `useCreateProjectMutation` | `lib/stores/projects-api-listener`, `store/services/projects-workspace` | ✅ |
| 14 | GET | `/projects/summary` | `useGetProjectSummaryQuery` | — | ⚪ |
| 15 | GET | `/projects/{id}` | `useGetProjectQuery` | `store/services/projects-workspace` | ✅ |
| 16 | PUT | `/projects/{id}` | `useUpdateProjectMutation` | `lib/stores/projects-api-listener`, `store/services/projects-workspace` | ✅ |
| 17 | DELETE | `/projects/{id}` | `useDeleteProjectMutation` | `lib/stores/projects-api-listener`, `store/services/projects-workspace` | ✅ |
| 18 | POST | `/projects/{id}/tasks` | `useAddProjectTaskMutation` | `lib/stores/projects-api-listener` | ✅ |
| 19 | PUT | `/projects/{id}/tasks/{taskId}` | `useUpdateProjectTaskMutation` | `lib/stores/projects-api-listener` | ✅ |
| 20 | DELETE | `/projects/{id}/tasks/{taskId}` | `useDeleteProjectTaskMutation` | `lib/stores/projects-api-listener` | ✅ |
| 21 | PATCH | `/projects/{id}/tasks/{taskId}/status` | `useSetProjectTaskStatusMutation` | `lib/stores/projects-api-listener` | ✅ |
| 22 | PATCH | `/projects/{id}/tasks/{taskId}/progress` | `useSetProjectTaskProgressMutation` | `lib/stores/projects-api-listener` | ✅ |
| 23 | POST | `/projects/{id}/milestones` | `useAddProjectMilestoneMutation` | `lib/stores/projects-api-listener` | ✅ |
| 24 | PUT | `/projects/{id}/milestones/{milestoneId}` | `useUpdateProjectMilestoneMutation` | `lib/stores/projects-api-listener` | ✅ |
| 25 | DELETE | `/projects/{id}/milestones/{milestoneId}` | `useDeleteProjectMilestoneMutation` | `lib/stores/projects-api-listener` | ✅ |
| 26 | POST | `/projects/{id}/milestones/{milestoneId}/toggle` | `useToggleProjectMilestoneMutation` | `lib/stores/projects-api-listener` | ✅ |
| 27 | PUT | `/projects/{id}/milestones/{milestoneId}/approval` | `useSetProjectMilestoneApprovalMutation` | `lib/stores/projects-api-listener` | ✅ |
| 28 | PUT | `/projects/{id}/allocations` | `useSetProjectAllocationMutation` | `lib/stores/projects-api-listener` | ✅ |
| 29 | DELETE | `/projects/{id}/allocations/{employeeId}` | `useRemoveProjectAllocationMutation` | `lib/stores/projects-api-listener` | ✅ |
| 30 | GET | `/projects/{projectId}/time` | `useGetProjectTimeEntriesQuery` | `store/services/*-workspace (full read)` | 🔁 |
| 31 | POST | `/projects/{projectId}/time` | `useLogProjectTimeMutation` | `lib/stores/projects-api-listener` | ✅ |
| 32 | GET | `/projects/{projectId}/time/tally` | `useGetProjectTimeTallyQuery` | — | ⚪ |
| 33 | PATCH | `/projects/{projectId}/time/{entryId}/status` | `useSetProjectTimeEntryStatusMutation` | `lib/stores/projects-api-listener` | ✅ |
| 34 | DELETE | `/projects/{projectId}/time/{entryId}` | `useDeleteProjectTimeEntryMutation` | `lib/stores/projects-api-listener` | ✅ |

### 2.78 Workflows — `workflows.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/workflows` | `useGetWorkflowsQuery` | `store/services/workflows-workspace` | ✅ |
| 2 | POST | `/workflows` | `useCreateWorkflowMutation` | `lib/stores/workflows-api-listener`, `store/services/workflows-workspace` | ✅ |
| 3 | GET | `/workflows/summary` | `useGetWorkflowSummaryQuery` | — | ⚪ |
| 4 | GET | `/workflows/{id}` | `useGetWorkflowQuery` | `store/services/workflows-workspace` | ✅ |
| 5 | PUT | `/workflows/{id}` | `useUpdateWorkflowMutation` | `lib/stores/workflows-api-listener`, `store/services/workflows-workspace` | ✅ |
| 6 | DELETE | `/workflows/{id}` | `useDeleteWorkflowMutation` | `lib/stores/workflows-api-listener`, `store/services/workflows-workspace` | ✅ |
| 7 | PATCH | `/workflows/{id}/status` | `useSetWorkflowStatusMutation` | `lib/stores/workflows-api-listener` | ✅ |

### 2.79 Workflow runs — `workflow-runs.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/workflow-runs` | `useGetWorkflowRunsQuery` | `store/services/workflows-workspace` | ✅ |
| 2 | POST | `/workflow-runs` | `useStartWorkflowRunMutation` | `lib/stores/workflows-api-listener`, `store/services/workflows-workspace` | ✅ |
| 3 | GET | `/workflow-runs/my-work` | `useGetMyWorkflowWorkQuery` | — | ⚪ |
| 4 | GET | `/workflow-runs/{id}` | `useGetWorkflowRunQuery` | `store/services/workflows-workspace` | ✅ |
| 5 | POST | `/workflow-runs/{id}/tasks/{taskId}/start` | `useStartWorkflowRunTaskMutation` | `lib/stores/workflows-api-listener` | ✅ |
| 6 | POST | `/workflow-runs/{id}/tasks/{taskId}/submit` | `useSubmitWorkflowRunTaskMutation` | `lib/stores/workflows-api-listener` | ✅ |
| 7 | POST | `/workflow-runs/{id}/tasks/{taskId}/approve` | `useApproveWorkflowRunTaskMutation` | `lib/stores/workflows-api-listener` | ✅ |
| 8 | POST | `/workflow-runs/{id}/tasks/{taskId}/reject` | `useRejectWorkflowRunTaskMutation` | `lib/stores/workflows-api-listener` | ✅ |
| 9 | POST | `/workflow-runs/{id}/tasks/{taskId}/skip` | `useSkipWorkflowRunTaskMutation` | `lib/stores/workflows-api-listener` | ✅ |
| 10 | POST | `/workflow-runs/{id}/tasks/{taskId}/reassign` | `useReassignWorkflowRunTaskMutation` | `lib/stores/workflows-api-listener` | ✅ |
| 11 | POST | `/workflow-runs/{id}/cancel` | `useCancelWorkflowRunMutation` | `lib/stores/workflows-api-listener` | ✅ |

### 2.80 My reminders — `my-reminders.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/my-reminders` | `useGetMyRemindersQuery` | `components/employee/dashboard/live` | ✅ |

### 2.81 Platform verifications — `platform-verifications.ts`

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/platform/verifications` | `useGetPlatformVerificationsQuery` | — | ⚪ |
| 2 | POST | `/platform/tenants/{tenantId}/verification/{kind}/review` | `useReviewTenantVerificationMutation` | — | ⚪ |

### 2.82 Profile change requests — `change-requests.ts` *(new 2026-11-27)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/change-requests` | `useGetAllChangeRequestsQuery` (all pages), `useGetChangeRequestsQuery` (pending count) | `hr/change-requests` (Profile Change Requests page), `layout/hr/sidebar/use-badges` | ✅ |
| 2 | POST | `/change-requests/{id}/approve` | `useApproveChangeRequestMutation` | `lib/stores/change-requests-api-listener` | ✅ |
| 3 | POST | `/change-requests/{id}/reject` | `useRejectChangeRequestMutation` | `lib/stores/change-requests-api-listener` | ✅ |
| 4 | GET | `/employees/{id}/change-requests` | `useGetEmployeeChangeRequestsQuery` | `employee-detail/use-demo-change-requests` | ✅ |
| 5 | GET | `/employees/me/change-requests` | `useGetMyChangeRequestsQuery` | `employee-detail/use-demo-change-requests` | ✅ |
| 6 | GET | `/employees/me/change-requests/fields` | `useGetRequestableFieldsQuery` | `lib/stores/change-requests-api-listener` | ✅ |
| 7 | POST | `/employees/me/change-requests` | `useRaiseChangeRequestMutation` | `lib/stores/change-requests-api-listener` | ✅ |
| 8 | POST | `/employees/me/change-requests/{id}/withdraw` | `useWithdrawChangeRequestMutation` | `lib/stores/change-requests-api-listener` | ✅ |

The profile screens record requests and decisions in the profile-edits slice, and the listener sends them. The server's log then replaces the slice's rows for that employee. Field keys are matched to the profile's own paths (the path itself, or the employee-record property it saves to, then the label), so a pending request still badges its field. Field keys confirmed 28 Nov: flat (e.g. `accountNumber`), 31 of them in groups personal, contact, address, emergency, bank and identity; email is not requestable. A field with no match is refused with a message. Photo requests are refused in the app: the API has no photo field and approval would not set the avatar. Withdrawn requests are hidden, as cancelling did before. **Profile Change Requests** (`/organization/change-requests`, Employee Management, new page added 2026-11-27) is the company-wide queue: Awaiting Review and All tabs, approve/reject from the row menu, sidebar badge with the pending total. It fills the same slice, so a decision there shows in the employee's own log. Approving does not also `PUT /employees`, because the server applies the change.

### 2.83 Reports — `reports.ts` *(new 2026-11-27)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/reports/datasets` | `useGetReportDatasetsQuery` | `hr/reports` (landing, report page, Build Custom Report) | ✅ |
| 2 | POST | `/reports/run` | `useRunFullReportQuery` (reads pages of 200 — the server's cap — up to 5,000 rows), `useRunReportQuery` | `hr/reports/report-detail`, `custom-report-modal` | ✅ |
| 3 | POST | `/reports/export` | `useExportReportMutation` | `lib/reports/use-report-export` (card quick export; job followed through `/exports/{id}` and `/exports/{id}/link`) | ✅ |

The datasets are the server's: the landing page groups them by the server's `group`, cards show `recordCount`, and a dataset whose key matches a demo report keeps that report's icon and description. On a report page the rows are read once and searched, filtered (the `filterable` text and yes/no columns) and exported in the browser, as before. Build Custom Report reads only the chosen columns when you export. Analytics has no endpoint, so the report page's "View analytics" button is blurred and `/operations/analytics` stays held.

---

## 3. Defined but not called yet (⚪)

These hooks exist and point at real endpoints, but nothing calls them yet. They're ready to use when needed.

### 3.1 Self-service portal — what is still idle (9 of the original 36, plus submissions)

Since 2026-11-25 the employee portal is live (section 1). Still not called:

- **Attendance (5):** `/attendance/mine/days`, `/attendance/mine/summary`, `GET /attendance/corrections/mine`, `GET /attendance/timesheets/mine`, `/attendance/schedules/mine` — the page's history, timesheet list and insights still read the attendance store; only today's punch is read from the API.
- **Performance (4):** `/performance/feedback/mine`, `/feedback/requests/mine`, `/feedback/requests/awaiting-me`, `/feedback/requests/{id}/decline` — received feedback has no mapping onto the page yet.
- **Submissions:** live since 2026-11-27 (`/approvals/mine` + `/approvals/my-queue`). The intake (New Submission) is still held: raising a request of a type with no module of its own (`POST /approvals`, `GET /approvals/document-types`) is not on the API yet.

### 3.2 No matching element in the HR screens (44)

The demo UI is frozen, so these wait until a screen needs them:

| Method | Endpoint | Hook | File |
| --- | --- | --- | --- |
| GET | `/access-levels/{id}` | `useGetAccessLevelQuery` | `access-levels.ts` |
| GET | `/business-units/{id}` | `useGetBusinessUnitQuery` | `business-units.ts` |
| GET | `/employees/stats` | `useGetEmployeeStatsQuery` | `employees.ts` |
| GET | `/files/{id}` | `useGetFileQuery` | `files.ts` |
| GET | `/attendance/summary` | `useGetAttendanceSummaryQuery` | `attendance.ts` |
| GET | `/attendance/corrections` | `useGetAttendanceCorrectionsQuery` | `attendance.ts` |
| POST | `/attendance/corrections/{id}/approve` | `useApproveAttendanceCorrectionMutation` | `attendance.ts` |
| POST | `/attendance/corrections/{id}/reject` | `useRejectAttendanceCorrectionMutation` | `attendance.ts` |
| GET | `/attendance/timesheets/{id}` | `useGetTimesheetQuery` | `attendance.ts` |
| GET | `/attendance/schedules/{id}` | `useGetWorkScheduleQuery` | `attendance.ts` |
| POST | `/attendance/schedules/{id}/default` | `useSetDefaultWorkScheduleMutation` | `attendance.ts` |
| GET | `/attendance/schedules/for/{employeeId}` | `useGetEmployeeWorkScheduleQuery` | `attendance.ts` |
| PUT | `/attendance/schedules/employees/{employeeId}` | `useAssignWorkScheduleMutation` | `attendance.ts` |
| GET | `/performance/reviews/{id}` | `useGetReviewQuery` | `performance.ts` |
| POST | `/performance/reviews/{id}/calibrate` | `useCalibrateReviewMutation` | `performance.ts` |
| GET | `/performance/goals/{id}` | `useGetGoalQuery` | `performance.ts` |
| PUT | `/performance/goals/{id}` | `useUpdateGoalMutation` | `performance.ts` |
| GET/POST | `/performance/feedback` | `useGetFeedbackQuery`, `useGiveFeedbackMutation` | `performance.ts` |
| GET | `/announcements/{id}`, `/announcements/{id}/acknowledgements` | `useGetAnnouncementQuery`, `useGetAnnouncementAcknowledgementsQuery` | `announcements.ts` |
| GET | `/calendar/events/{id}` | `useGetCalendarEventQuery` | `calendar.ts` |
| PUT | `/calendar/events/{id}` | `useUpdateCalendarEventMutation` (the workspace has no edit) | `calendar.ts` |
| GET | `/candidates/{id}`, `/candidates/{id}/can-move` | `useGetCandidateQuery`, `useCanMoveCandidateQuery` | `candidates.ts` |
| GET/PUT | `/interviews/candidate/{candidateId}`, `PUT /interviews/{id}` | `useGetCandidateInterviewsQuery`, `useUpdateInterviewMutation` | `interviews.ts` |
| GET/DELETE | `/requisitions/{id}`, `/requisitions/{id}/warnings`, `DELETE /requisitions/{id}` | `useGetRequisitionQuery`, `useGetRequisitionWarningsQuery`, `useDeleteRequisitionMutation` | `requisitions.ts` |
| GET | `/contracts/{id}` | `useGetContractQuery` | `contracts.ts` |
| POST | `/contracts/{id}/terminate`, `/sign`, `/notes` | `useTerminateContractMutation`, `useSignContractMutation`, `useAddContractNoteMutation` (signing goes through the demo `/sign` page; no terminate or note form) | `contracts.ts` |
| PUT/DELETE | `/documents/folders/{id}` | `useRenameDocumentFolderMutation`, `useDeleteDocumentFolderMutation` | `documents.ts` |
| GET/PUT/POST | `/documents/{id}`, `PUT /documents/{id}`, `/documents/{id}/versions`, `/documents/{id}/acknowledgements` | `useGetDocumentQuery`, `useUpdateDocumentMutation`, `useAddDocumentVersionMutation`, `useGetDocumentAcknowledgementsQuery` | `documents.ts` |
| GET | `/expenses/claims/{id}` | `useGetExpenseClaimQuery` | `expenses.ts` |
| POST | `/notifications/{id}/dismiss` | `useDismissNotificationMutation` (no dismiss control in the design) | `notifications.ts` |

### 3.2b 2026-11-08 endpoints with no control on the approved screens (23)

Each has a hook and, where it belongs to an action set, a ready action function. Only the button is missing from the frozen UI:

- **Employment types (1):** `DELETE /employment-types/{id}`
- **Positions (3):** `POST /positions/{id}/assign`, `POST /positions/unassign`, `POST /positions/{id}/retire`
- **Kudos (4):** `GET /kudos/{id}`, `POST` and `DELETE /kudos/{id}/pin`, `DELETE /kudos/{id}/comments/{commentId}`
- **Loans (2):** `POST /loans/{id}/reinstate`, `DELETE /loans/{id}/repayments/{repaymentId}`
- **Employee checklist (5):** `POST /items/{id}/restore`, `GET /me`, `GET /employees/{employeeId}`, `POST` and `DELETE /employees/{employeeId}/tasks/{itemId}` (no per-hire task view exists)
- **Tasks (6):** `GET /tasks/assigned-by-me`, `GET`, `PUT` and `DELETE /tasks/{id}`, `POST /tasks/reorder` (the sortable list in `hr/tasks` is not routed)
- **Sickness (1):** `POST /sickness/{id}/cancel` (only the demo approvals engine cancels an absence)
- **Workforce requests (2):** `DELETE /workforce-requests/{id}`, `POST /workforce-requests/{id}/cancel`

> **2026-11-08 — first run with a real login:** see `E2E_TEST_REPORT.md`. 104 endpoints verified working; 143 return 500 on develop (including employee creation, which blocks most flows); the rest need an employee login or a parent record. Confirmed app bug: headcount periods must be sent as `Q1 2026`, not `2026-Q1` (section 3.5 below).

### 3.3 Not yet checked with a real login

These Attendance & Performance details were taken from the spec and haven't been tested with a real account:

- **Work-pattern day keys:** the spec doesn't name them. The app sends `monday`…`sunday` and reads back any spelling.
- **Log Attendance:** the API works out the status itself, so the status picked in the modal is not sent. The free-text location goes in as `locationName`, with `location: "office"`.
- **Times:** "HH:MM" from the forms is sent as an ISO instant in the browser's time zone.

### 3.4 2026-10-30 modules — not yet checked with a real login

Every endpoint answers 401 without a token, so the routes exist, but none of these flows has been run against a real account:

- **Recruitment** works like leave: the API is mirrored into the recruitment slice and `src/lib/stores/recruitment-listener.ts` sends the screens' actions. The application form, advert, posting platforms, stage gates, communications and attachments have no API field and stay on the local copy (`mergeLocal`). Locally created vacancies, applicants and interviews take the server id (`adoptServerId`).
- **Recruitment → Requisition:** new vacancies still start from the Requisition module (`/talent/requisition`), which runs on the approvals engine and is still demo. Only real UUIDs are sent for the department, people and panel, so a vacancy built from a demo requisition is created without them.
- **Expense claims:** approve and reject go to the claim's approval (`POST /approvals/{id}/decide`); approving a claim the chain has cleared calls `/reimburse`. The stages shown are the latest claim's approval steps plus a "Reimburse claim" stage. The reviewer signature is not sent (no API field), and receipts are listed but not downloadable from the card.
- **Documents:** server folders of type `trash`, `shared` and `archive` (and the first root `system` and `personal` folders) take the screen's fixed ids. Documents in a personal folder shared with exactly one person show on that employee's folder. ID card and right-to-work have no API category and are sent as `other`. Permanent delete has no endpoint.
- **Contracts:** "Move to Documents" uploads the generated letter (HTML) as an `employeeDocument` file, then calls `/file-to-documents`. The status picked in the form is reached through `/send` and `/activate`.
- **Announcements:** "Role Specific" audience is sent as `managers`. Drafts are saved only; published and scheduled ones also call `/publish`.
- **Calendar:** reads one window, from the start of last year to the end of next year. Leave, cover and sickness still come from the live leave and sickness data, so the server's copies are skipped. `employeeIds` is sent as a repeated key.
- **Navbar search (HR):** still blurred, waiting on a global search endpoint (`GET /search`) from the backend.
- **Notifications:** polled every 60 s. The HR navbar bell is live (since 2026-11-27 it is no longer blurred with kudos, chat and screen share), and both portals' bell badges show `GET /notifications/unread-count` plus session-raised unread. Notifications a screen raises in the session are shown alongside the server's.

### 3.5 2026-11-08 modules — not yet checked with a real login

- **Headcount periods:** the spec types `period` as a plain string. Since 2026-11-27 (backend answer) the app sends `Q1 2026` and `FY 2026`; it still reads back `2026-Q1`, `Q1 2026`, `2026Q1`, `FY 2026` or `2026`. The plan board is read once per period (10 reads).
- **Sickness** works like leave: the API is mirrored into the sickness slice (`useSicknessLiveRecords`) and `src/lib/stores/sickness-api-listener.ts` sends the screens' actions. The report form creates the record itself and opens it by the server id. Sick-pay schemes, enrolments, review cases, OH referrals and settings have no endpoint and stay local (the schemes page is blurred). A fit-note status change on its own has no API field and is not sent. Bradford figures are the server's, laid over the local episode breakdown.
- **Benefit plans:** mirrored into the benefit-plans slice. Seeded plans (`seedKey`) cannot be deleted. Country is sent as `NG` / `GB`.
- **Kudos:** since 2026-11-27 the names behind a reaction come from `GET /kudos/{id}/reactions`, read the first time a chip is hovered and shown as its tooltip. Sending the same reaction again is assumed to remove it.
- **Loans:** a self-service request sends no `employeeId` (the server uses the caller's). Repayments are recorded as `bankTransfer`, dated today.
- **Workforce requests:** mirrored into the slice so the hire tracker and requisition builder see them. "Create requisition" calls `/convert` instead of opening the (still demo) requisition builder. A cancelled request shows as Rejected.
- **Employee checklist:** deleting an item that hires have already completed retires it instead (the server's `canDelete`).
- **Positions:** the server works out a position's status from its holders, so the form's filled/vacant choice is not sent. Headcount stays as the server holds it (the form has no field for it).

---

### 3.6 2026-11-25 endpoints with no control on the approved screens (58)

Hooks exist; the frozen UI has no control (summary tallies the screens work out themselves, single-record reads the lists already cover, and actions with no button):

- **certifications (1):** `GET /certifications/summary`
- **community (4):** `GET /community/summary`, `GET /community/{id}`, `PUT /community/{id}`, `DELETE /community/{id}/comments/{commentId}`
- **company (1):** `POST /company/verification/{kind}/withdraw`
- **employee-notes (1):** `POST /employees/{employeeId}/notes/{noteId}/pin`
- **eor (10):** `GET /eor/providers/{id}`, `GET /eor/workers/{id}`, `POST /eor/workers/{id}/end`, `GET /eor/summary`, `GET /eor/compliance`, `PUT /eor/workers/{id}/compliance/{key}`, `POST /eor/invoices`, `PUT /eor/invoices/{id}`, `DELETE /eor/invoices/{id}`, `POST /eor/invoices/{id}/settle`
- **er-cases (8):** `GET /er-cases/summary`, `DELETE /er-cases/{id}/notes/{noteId}`, `DELETE /er-cases/{id}/meetings/{meetingId}`, `POST /er-cases/{id}/evidence`, `GET /er-cases/{id}/evidence/{evidenceId}/download`, `DELETE /er-cases/{id}/evidence/{evidenceId}`, `GET /employees/{employeeId}/grievances`, `GET /employees/{employeeId}/disciplinaries`
- **helpdesk (2):** `GET /helpdesk/summary`, `GET /helpdesk/{id}`
- **knowledge (2):** `GET /knowledge/summary`, `GET /knowledge/{id}`
- **learning (4):** `GET /learning/courses/{id}`, `GET /learning/summary`, `GET /learning/compliance`, `PATCH /learning/enrollments/{enrollmentId}/status`
- **occupational-health (6):** `GET /occupational-health/{id}`, `DELETE /occupational-health/{id}`, `GET /occupational-health/summary`, `GET /occupational-health/candidates`, `GET /occupational-health/{id}/history`, `DELETE /occupational-health/{id}/adjustments/{adjustmentId}`
- **pick-lists (1):** `GET /settings/pick-lists/{key}`
- **platform-verifications (2):** `GET /platform/verifications`, `POST /platform/tenants/{tenantId}/verification/{kind}/review`
- **projects (5):** `POST /projects/{projectId}/documents`, `GET /projects/{projectId}/documents/{documentId}/download`, `GET /projects/{projectId}/risks/tally`, `GET /projects/summary`, `GET /projects/{projectId}/time/tally`
- **suggestions (4):** `GET /suggestions/summary`, `GET /suggestions/mine`, `GET /suggestions/{id}`, `DELETE /suggestions/{id}/comments/{commentId}`
- **surveys (5):** `GET /surveys/summary`, `GET /surveys/mine`, `GET /surveys/{id}`, `GET /surveys/{id}/my-response`, `POST /surveys/{id}/responses`
- **workflow-runs (1):** `GET /workflow-runs/my-work`
- **workflows (1):** `GET /workflows/summary`

Notably: there is no survey-taking screen in the portal (`/surveys/mine`, `my-response`, `responses`), no mounted platform console (`/platform/verifications`), no evidence upload on ER cases (the form collects names, not files), no project-document upload (same), no EOR invoice form, and no note-pin control.

### 3.7 2026-11-25 modules — not yet checked with a real login

- **How writes work:** the slice-backed screens (ER cases, expenses, shifts, projects, workflows/runs, occupational health, attendance clock, profile notes/certificates) change their store first; a listener (`src/lib/stores/*-api-listener.ts`, `attendance-mine-listener.ts`, `collection-api-listener.ts`) sends the change and the data is re-read. A refused call shows the server's message and the server copy comes back. Hook-direct screens (company, settings, help desk, knowledge, community, suggestions, surveys, EOR, learning) use `useLiveSender` from `src/lib/live/use-is-live.ts`.
- **Local caches:** once signed in, ER cases, expenses, shifts, projects, workflows and runs are no longer written to localStorage / the local `.data` snapshot.
- **Workflow runs:** signed in, the demo run engine (`workflow-runs-listener.ts`) stands down — the server starts runs from its own triggers. Role-based run assignees carry `assigneeAccessLevelId` since 2026-11-27 (mapped onto the task's role). The "Run" dialog still only sends notifications (it has no subject to start a run against). Demo approvals are left out of the My Work lists.
- **Names → ids:** where a form holds a person's name (help desk assignee, ER investigator/owner/panel, OH case owner, suggestion/case submitter) the id is looked up in the live directory by full name; an unknown name is sent as null.
- **EOR:** an engagement needs an existing employee (matched by email, then name). `countryOfEngagement` is sent as the country name; the spec does not say whether it wants a name or a code.
- **Shift templates** are the attendance work schedules; the API has no colour, so one is picked by position. An employee who cannot list schedules gets templates built from their own roster.
- **Surveys:** the results modal is fed by unrolling `/surveys/{id}/results` tallies back into anonymous responses.
- **Community / suggestions:** like, vote and upvote lists are rebuilt from the API's counts and "mine" flags; the like/upvote endpoints are assumed to toggle.
- **Holiday year:** the API derives every cycle from one start day, so only editing a cycle is offered (add/activate/remove answer "not integrated"). Company holidays are edited with `PUT /leave/holidays/{id}` (since 2026-11-27) and send `isNonWorking` and `excludedDepartmentIds`; the form's department names are matched to ids, and an unknown name is refused before anything is sent. Digest frequencies `hourly`/`never` are sent as `realtime`/`weekly`.
- **Learning:** quizzes are asked and graded by the server; the attempt limit is the server's.
- **Leave:** the self-service request list and balance cards read `/mine`; cancelling goes through the leave listener.

### 3.8 2026-11-27 endpoints — not yet checked with a real login

- **Submissions & Approvals:** the server's approvals are mirrored into the approvals slice (`approvals/use-live-approvals.ts`, `lib/approvals/api-mapping.ts`). HR reads `GET /approvals` (every page) plus `/approvals/my-queue`; self-service, or an HR viewer the register refuses, reads `/approvals/mine` plus `/my-queue`. Whether you can act is the server's `availableActions`, not the local chain. Approve, reject, return, resubmit and withdraw go out through `lib/stores/approvals-api-listener.ts`; comments have no endpoint and answer "not integrated". Reviewer signatures and resubmit edits are not sent. Demo requests other modules seed are kept out of the live view (non-UUID ids), and the demo sickness listener ignores server approvals so a decision is not sent twice.
- **Backend answers (27 Nov):** event types are a fixed lowercase set — submitted, approved, rejected, returned, resubmitted, cancelled, skipped, reresolved ("commented" comes with the comments endpoint); skipped reasons are sentences for people, shown as the step's note; only leave_request, expense_claim, loan_request, onboarding and workforce_request run through the engine; sickness is decided directly by `/sickness/{id}/approve`. Titles/summaries are agreed but not built. Guarantors: an employee reads their own with their own id; other people's now answer 404.
- **Document types** on an approval are free strings in the spec. The app turns them into snake_case and matches common forms (`leave`, `leaveRequest`, `expenseClaim`, `sicknessRecord`, `requisition`, …) onto the screen's types; anything else is labelled from its words.
- **Approval titles:** `ApprovalDto` has no title or summary, so a row reads "<type> — <employee>" and "<type> raised by <name>".
- **Guarantors:** read only on the profile (no write outside the joiner flow); an edit answers "not integrated". Not yet known whether an employee may read their own through this endpoint.
- **OH absence links:** `PUT …/sickness-records` replaces the whole set, so the full list is always sent. A referral made with several absences creates the case with the first and then sends the rest. The server's refusal for another person's absence is shown as it comes back.
- **Lifecycle stage keys** (confirmed by the backend: always all eight, hyphenated as on the page) are not listed in the spec. The app matches them (case and punctuation ignored) onto the page's stages: workforce planning/requests, requisitions, vacancies, candidates, pre-boarding, onboarding, active, offboarding. A key it does not recognise (e.g. people who left) is not shown.
- **HR actions:** category keys are the alerts file's (right_to_work, payroll, …), so labels and icons come from there; severity totals are the server's. `payroll` is always empty (no payroll yet).
- **Untaken leave:** rows are the server's at-risk list, ordered by `atRiskDays`; the card shows `remaining`.
- **My dashboard:** the "Tasks Due Today" card shows `tasksOutstanding` (the API has no due-today count). Pending items come from `pending`; your reminders show only until it answers.
- **Headcount:** periods are sent as the page holds them, `Q1 2026` and `FY 2026` (the backend refuses `2026`).
- **HR dashboard Events, Resourcing, Engagement tabs** (live since 2026-11-27, from existing endpoints, as the backend suggested):
    - Events: `/calendar/upcoming?days=7`, shared with the HR Action Centre's events card. One-to-ones show as meetings, leave requests and cover as leave; personal events and sickness are left off this organisation-wide view.
    - Resourcing: open roles by department are the open vacancies from `/workforce/hiring`; the hiring funnel is the live recruitment data (`useRecruitment`).
    - Engagement: the trend chart was already live; the ring now uses the latest month of `/surveys/engagement-trend` (every department with a score), and its summary adds the survey response count and this month's kudos.
    - Every HR dashboard tab is now live; inside them, only the EOR map, certification, mandatory-training and data-quality tiles still depend on their own modules.
- **Hook only:** `GET /exports/mine` — no screen lists past exports.

---

## 4. Not part of the backend API

These calls go to the Next.js app's own local routes (demo data snapshots), **not** to the MOTEE backend, so they aren't counted above:

- `src/lib/stores/*-persistence.ts` — `access-levels`, `approvals`, `attendance-deduction-policy`, `benefit-plans`, `collection-edits`, `er-cases`, `profile-edits`, `recruitment` (now only the fields the API does not store), `workflow-runs`
- `src/lib/stores/runtime-persistence.ts` → `src/app/api/runtime/[key]/route.ts` (branch performance, sickness, leave schemes — demo only)

---

## 5. How to keep this log up to date

1. New endpoint → add it to the right file in `src/store/services/` and to the matching table here.
2. New live screen → add its route to `LIVE_LINKS` in `src/lib/permissions/live-modules.ts` and to the list in section 1.
3. When a ⚪ hook gets used, change it to ✅ and move it out of section 3.
