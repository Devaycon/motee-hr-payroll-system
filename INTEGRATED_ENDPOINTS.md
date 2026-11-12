# MOTEE HRIS — Integrated API Endpoints Log

> **Branch:** `feat/temitope-branch` · **Base commit:** `76ab733` + the 2026-11-08 integration · **Updated:** 2026-11-08
> **Source of truth:** `src/store/services/*.ts` (RTK Query), checked against the live spec at `https://api.develop.moteesolutionsltd.com/openapi/v1.json` (416 operations — every one now has a hook). Usage was traced to the screens, hooks and listeners that call each endpoint.

---

## 1. Summary

| Item | Value |
| --- | --- |
| Base URL | `NEXT_PUBLIC_MOTEE_BASE_URL` (from `.env.local`) |
| API prefix | `/api/v1` |
| Auth | `Authorization: Bearer <token>`, auto-refresh on 401 via `POST /api/v1/auth/refresh` |
| Service files | 50 |
| Unique backend endpoints | **416** (415 in services + the token refresh) |
| ✅ Live — called by the app | **289** |
| 🔁 Live via the collection helper | **24** (paged list endpoints read in full by `collections.ts` / `employee-directory.ts`) |
| ⚪ Defined but not called yet | **103** (self-service `/mine` endpoints, and actions with no control on the approved screens — see section 3) |

### Change log

| Date | Change |
| --- | --- |
| 2026-10-24 | First log: 151 endpoints across 16 modules. |
| 2026-10-24 | **+57 endpoints:** Attendance, corrections, timesheets, work schedules (31) and Performance goals, reviews, feedback (26). HR **Attendance** and **Performance** pages switched to live. |
| 2026-10-30 | **+94 endpoints:** Announcements (11), Calendar (6), Candidates (13), Interviews (6), Requisitions (11), Contracts (13), Dashboard (2), Documents (17), Expense claims (10), Notifications (5). Switched to live: **Dashboard** (People and Attendance tabs), **Calendar**, **Announcements**, **Recruitment**, **Contracts**, **Documents**, **Expense Claims**, and the notifications bell. Existing schemas gained `dottedLineManagerId`/`dottedLineManagerName` (employees), `accessLevelId` (invite), `emailSentAt`/`accessLevelName` (pending invitation), `reviewUnavailableReason` (onboarding) and the `companyDocument` file purpose. |
| 2026-11-08 | **+114 endpoints:** Benefit plans (13), Diversity (3), Employee checklist (12), Employment types (7), Headcount (7), Hire tracker (1), Kudos (12), Loans (12), Positions (10), Sickness (16), Tasks (10), Workforce (3), Workforce requests (8). Switched to live: **Employment Types**, **Roles & Positions**, **Benefits**, **Employee Checklist**, **Loans**, **Headcount Planning**, **Workforce Planning** (except Skills Gap), **Hire Tracker**, **Workforce Requests**, **Kudos**, **Sickness & Absence** (except Schemes and Approval Chain), **My Work** (Personal tasks tab), the dashboard **Sickness** tab and **Loans** tile, and the first self-service pages: My Tasks, My Loans, Diversity, Sickness, Community (Kudos tab). Existing schemas: `CalendarCategory` gained `sickness`. |

### Status legend

| Icon | Meaning |
| --- | --- |
| ✅ | Wired and called by a screen, hook or listener |
| 🔁 | The URL is called, but through a whole-collection reader (`fetchAllPages`) instead of the paged hook |
| ⚪ | The hook exists, but nothing in the app calls it yet |

### Modules marked live in the UI

From `src/lib/permissions/live-modules.ts` (everything else is shown blurred as "not integrated"):

`/welcome` · `/hr` (People, Attendance and Sickness tabs; the other tabs and the EOR map, certification, mandatory training, Occupational Health and untaken-leave tiles stay blurred) · `/hr-action-center/events` · `/hr-action-center/tasks` (Personal tasks tab only) · `/workspace/kudos` · `/organization/employment-types` · `/organization/roles` · `/organization/benefit-plans` · `/organization/employee-checklist` · `/organization/loans` · `/organization/headcount` · `/operations/workforce` (except Skills Gap) · `/talent/hire-tracker` · `/talent/workforce-requests` · `/time-payroll/sickness` (except `/schemes` and `/approval-chain`, listed in `DEMO_ONLY_LINKS`) · `/workspace/announcements` · `/organization/branches` · `/organization/departments` · `/organization/employees` · `/talent/onboarding` · `/talent/offboarding` · `/talent/performance` · `/talent/recruitment` · `/operations/assets` · `/operations/contracts` · `/operations/documents` (except the **My Documents** review queue) · `/time-payroll/leave` (except **Schemes**) · `/time-payroll/attendance` (except **Deduction Policy** and **Presence Checks**) · `/time-payroll/expenses` · `/admin/access-levels` · `/admin/users` · `/admin/audit-trail`

Self-service pages lifted out of the blur by `SELF_SERVICE_LIVE_LINKS` (same file): `/employee/tasks`, `/employee/loans`, `/profile/diversity`, `/time-off/sickness`, `/company/community` (Kudos tab only).

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
| 2 | GET | `/calendar/upcoming` | `useGetUpcomingCalendarQuery` | — | ⚪ |
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

### 2.26 Documents — `documents.ts` *(new)*

| # | Method | Endpoint | Hook | Used in | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/documents/mine` | `useGetMyDocumentsQuery` | — (self-service) | ⚪ |
| 2 | POST | `/documents/mine/{id}/acknowledge` | `useAcknowledgeMyDocumentMutation` | — (self-service) | ⚪ |
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
| 2 | GET | `/notifications/unread-count` | `useGetUnreadNotificationCountQuery` | — | ⚪ |
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
| 3 | GET | `/kudos/summary` | `useGetKudosSummaryQuery` | `kudos/components/stat-cards` | ✅ |
| 4 | GET | `/kudos/leaderboard` | `useGetKudosLeaderboardQuery` | `hr/kudos/hooks` (leaderboard, top recipient) | ✅ |
| 5 | GET | `/kudos/me` | `useGetMyKudosQuery` | `employee/community/components/kudos-tab` (my received / sent) | ✅ |
| 6 | GET | `/kudos/{id}` | `useGetKudosPostQuery` | — (the feed already holds each post) | ⚪ |
| 7 | DELETE | `/kudos/{id}` | `useDeleteKudosMutation` | `hr/kudos` (moderation) | ✅ |
| 8 | POST | `/kudos/{id}/pin` | `usePinKudosMutation` | `useKudosActions.togglePin` — no pin control | ⚪ |
| 9 | DELETE | `/kudos/{id}/pin` | `useUnpinKudosMutation` | `useKudosActions.togglePin` — no pin control | ⚪ |
| 10 | POST | `/kudos/{id}/reactions` | `useReactToKudosMutation` | `hr/kudos`, self-service Kudos tab | ✅ |
| 11 | POST | `/kudos/{id}/comments` | `useCommentOnKudosMutation` | `hr/kudos/components/kudos-feed` | ✅ |
| 12 | DELETE | `/kudos/{id}/comments/{commentId}` | `useDeleteKudosCommentMutation` | `useKudosActions.removeComment` — no control | ⚪ |

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
| 3 | GET | `/workforce/hiring` | `useGetWorkforceHiringQuery` | `workforce/components/hiring-section`, overview | ✅ |

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

## 3. Defined but not called yet (⚪)

These hooks exist and point at real endpoints, but nothing calls them yet. They're ready to use when needed.

### 3.1 Waiting on the self-service portal (36)

Most of the employee portal is still shown as "not integrated" (only the pages in `SELF_SERVICE_LIVE_LINKS` are live), so these `/mine` endpoints wait for it:

- **Attendance (13):** `/attendance/mine` (+ `/days`, `/summary`, `/clock-in`, `/break/start`, `/break/end`, `/clock-out`, `/location`), `/attendance/corrections/mine` (GET, POST), `/attendance/timesheets/mine` (+ `/submit`), `/attendance/schedules/mine`
- **Performance (10):** `/performance/reviews/mine` (+ self-assessment PUT/POST), `/performance/goals/mine` (GET, POST), `/performance/feedback/mine`, `/performance/feedback/requests/mine`, `/requests/awaiting-me`, `POST /requests`, `/requests/{id}/decline`
- **Announcements (3):** `/announcements/feed`, `/feed/{id}/view`, `/feed/{id}/acknowledge`
- **Contracts (2):** `/contracts/mine`, `/contracts/mine/{id}/sign`
- **Documents (2):** `/documents/mine`, `/documents/mine/{id}/acknowledge`
- **Expense claims (6):** `/expenses/claims/mine` (GET, POST, PUT, DELETE, `/submit`, `/withdraw`)
- **Notifications (0):** the panel is shared, so the bell is already live in both shells

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
| GET | `/calendar/upcoming`, `/calendar/events/{id}` | `useGetUpcomingCalendarQuery`, `useGetCalendarEventQuery` | `calendar.ts` |
| PUT | `/calendar/events/{id}` | `useUpdateCalendarEventMutation` (the workspace has no edit) | `calendar.ts` |
| GET | `/candidates/{id}`, `/candidates/{id}/can-move` | `useGetCandidateQuery`, `useCanMoveCandidateQuery` | `candidates.ts` |
| GET/PUT | `/interviews/candidate/{candidateId}`, `PUT /interviews/{id}` | `useGetCandidateInterviewsQuery`, `useUpdateInterviewMutation` | `interviews.ts` |
| GET/DELETE | `/requisitions/{id}`, `/requisitions/{id}/warnings`, `DELETE /requisitions/{id}` | `useGetRequisitionQuery`, `useGetRequisitionWarningsQuery`, `useDeleteRequisitionMutation` | `requisitions.ts` |
| GET | `/contracts/{id}` | `useGetContractQuery` | `contracts.ts` |
| POST | `/contracts/{id}/terminate`, `/sign`, `/notes` | `useTerminateContractMutation`, `useSignContractMutation`, `useAddContractNoteMutation` (signing goes through the demo `/sign` page; no terminate or note form) | `contracts.ts` |
| PUT/DELETE | `/documents/folders/{id}` | `useRenameDocumentFolderMutation`, `useDeleteDocumentFolderMutation` | `documents.ts` |
| GET/PUT/POST | `/documents/{id}`, `PUT /documents/{id}`, `/documents/{id}/versions`, `/documents/{id}/acknowledgements` | `useGetDocumentQuery`, `useUpdateDocumentMutation`, `useAddDocumentVersionMutation`, `useGetDocumentAcknowledgementsQuery` | `documents.ts` |
| GET | `/expenses/claims/{id}` | `useGetExpenseClaimQuery` | `expenses.ts` |
| GET/POST | `/notifications/unread-count`, `/notifications/{id}/dismiss` | `useGetUnreadNotificationCountQuery`, `useDismissNotificationMutation` (no badge or dismiss control) | `notifications.ts` |

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
- **Notifications:** polled every 60 s. Notifications a screen raises in the session are shown alongside the server's.

### 3.5 2026-11-08 modules — not yet checked with a real login

- **Headcount periods:** the spec types `period` as a plain string. The app sends `2026-Q1` (and `2026` for a full year) and reads back `2026-Q1`, `Q1 2026`, `2026Q1`, `FY 2026` or `2026`. Change `periodToApi` in `src/lib/headcount/api-mapping.ts` if the server expects another form. The plan board is read once per period (10 reads).
- **Sickness** works like leave: the API is mirrored into the sickness slice (`useSicknessLiveRecords`) and `src/lib/stores/sickness-api-listener.ts` sends the screens' actions. The report form creates the record itself and opens it by the server id. Sick-pay schemes, enrolments, review cases, OH referrals and settings have no endpoint and stay local (the schemes page is blurred). A fit-note status change on its own has no API field and is not sent. Bradford figures are the server's, laid over the local episode breakdown.
- **Benefit plans:** mirrored into the benefit-plans slice. Seeded plans (`seedKey`) cannot be deleted. Country is sent as `NG` / `GB`.
- **Kudos:** the API only says whether *you* reacted, so other people's names are not shown on a reaction. Sending the same reaction again is assumed to remove it.
- **Loans:** a self-service request sends no `employeeId` (the server uses the caller's). Repayments are recorded as `bankTransfer`, dated today.
- **Workforce requests:** mirrored into the slice so the hire tracker and requisition builder see them. "Create requisition" calls `/convert` instead of opening the (still demo) requisition builder. A cancelled request shows as Rejected.
- **Employee checklist:** deleting an item that hires have already completed retires it instead (the server's `canDelete`).
- **Positions:** the server works out a position's status from its holders, so the form's filled/vacant choice is not sent. Headcount stays as the server holds it (the form has no field for it).

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
