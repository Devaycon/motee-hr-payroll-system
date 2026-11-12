# MOTEE HRIS — End-to-end API test report

> **Run:** 2026-11-08 against `https://api.develop.moteesolutionsltd.com` (spec: 416 operations)
> **Account:** the company owner login supplied for testing (role `owner`, no employee record)
> **Method:** a script logged in and called every operation in dependency order, seeding the records each step needed. Destructive calls were only made on records the test created (named `E2E …`). The raw request/response log is kept outside the repo.

## 1. Summary

| Result | Endpoints | What it means |
| --- | --- | --- |
| ✅ Works | **104** | Returned 2xx with real data, or refused bad input the right way (wrong OTP, invalid refresh token) |
| ❌ Broken (500) | **143** | The server answered 500 "Something went wrong. Please try again." — a backend fault |
| 👤 Needs an employee login | **42** | Self-service (`/mine`, `/me`) and personal endpoints. The owner account has no employee record, so the server refuses these by design |
| 🟡 Reachable, not verified | **118** | Needs a parent record that could not be created (mostly an employee). Called with a placeholder id: the route answered 400/404 as expected, so it exists and validates, but the happy path is untested |
| ⛔ Forbidden | **3** | Platform-console endpoints; this account is not platform staff |
| ⏭ Skipped | **6** | Deliberately not run: they would create a tenant, re-run company setup, close the leave year or change platform staff |
| **Total** | **416** | |

### Per module

| Module | Ops | ✅ | ❌ | 👤 | 🟡 | ⛔ | ⏭ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AccessLevels | 9 | 9 |  |  |  |  |  |
| Announcements | 11 |  | 7 | 3 | 1 |  |  |
| ApprovalDelegations | 4 |  | 1 | 2 | 1 |  |  |
| ApprovalTemplates | 6 | 6 |  |  |  |  |  |
| Approvals | 7 | 2 |  |  | 5 |  |  |
| Assets | 8 | 6 |  |  | 2 |  |  |
| Attendance | 11 | 2 |  | 7 | 2 |  |  |
| AttendanceCorrections | 5 |  | 2 | 1 | 2 |  |  |
| AuditTrail | 2 | 2 |  |  |  |  |  |
| Auth | 9 | 8 |  |  |  |  | 1 |
| BenefitPlans | 13 |  | 9 |  | 4 |  |  |
| Branches | 5 | 5 |  |  |  |  |  |
| BusinessUnits | 5 | 5 |  |  |  |  |  |
| Calendar | 6 |  | 5 |  | 1 |  |  |
| Candidates | 13 |  | 7 |  | 6 |  |  |
| Contracts | 13 |  | 5 | 1 | 7 |  |  |
| Dashboard | 2 | 2 |  |  |  |  |  |
| Departments | 5 | 5 |  |  |  |  |  |
| Diversity | 3 | 2 |  | 1 |  |  |  |
| Documents | 17 |  | 10 | 2 | 5 |  |  |
| EmployeeChecklist | 12 |  | 7 | 1 | 4 |  |  |
| Employees | 17 | 6 | 5 |  | 6 |  |  |
| EmploymentTypes | 7 |  | 6 |  | 1 |  |  |
| ExpenseClaims | 10 |  | 3 | 4 | 3 |  |  |
| Exports | 2 | 2 |  |  |  |  |  |
| Files | 5 | 5 |  |  |  |  |  |
| Headcount | 7 | 1 | 5 |  | 1 |  |  |
| HireTracker | 1 |  | 1 |  |  |  |  |
| Interviews | 6 |  | 4 |  | 2 |  |  |
| Join | 12 |  | 5 |  | 7 |  |  |
| Kudos | 12 | 1 | 6 | 2 | 3 |  |  |
| Leave | 6 | 1 |  | 1 | 4 |  |  |
| LeaveBalances | 6 | 3 |  | 1 | 1 |  | 1 |
| LeavePolicies | 12 | 8 | 3 |  | 1 |  |  |
| Loans | 12 | 1 | 9 |  | 2 |  |  |
| Locale | 3 | 3 |  |  |  |  |  |
| Notifications | 5 |  | 5 |  |  |  |  |
| Offboarding | 12 | 2 |  |  | 10 |  |  |
| Onboarding | 6 | 1 | 3 | 1 | 1 |  |  |
| PerformanceFeedback | 7 |  | 1 | 4 | 2 |  |  |
| PerformanceGoals | 9 | 1 |  | 1 | 7 |  |  |
| PerformanceReviews | 10 | 1 |  | 3 | 6 |  |  |
| Platform | 5 |  |  |  |  | 3 | 2 |
| Positions | 10 |  | 7 |  | 3 |  |  |
| Requisitions | 11 |  | 10 |  | 1 |  |  |
| Sickness | 16 |  | 8 |  | 8 |  |  |
| Tasks | 10 | 3 |  | 5 | 2 |  |  |
| TenantSetup | 4 | 2 |  |  |  |  | 2 |
| Timesheets | 6 | 1 |  | 1 | 4 |  |  |
| Users | 1 | 1 |  |  |  |  |  |
| WorkSchedules | 9 | 6 | 1 | 1 | 1 |  |  |
| Workforce | 3 | 1 | 2 |  |  |  |  |
| WorkforceRequests | 8 |  | 6 |  | 2 |  |  |

## 2. Blockers (fix these first)

1. **Employees cannot be created — by any route.** `POST /employees`, `POST /employees/invite` and `POST /employees/import` all pass validation and then return **500 "Something went wrong. Please try again."** (tried with only the required fields, and with each optional field added one at a time). Every employee-based flow is blocked behind this: leave requests, attendance, timesheets, performance reviews and goals, contracts, expenses, loans, sickness, kudos, onboarding, offboarding, asset assignment, checklist tasks, approval delegations. This is why 118 endpoints could only be probed.
2. **Most modules added since 24 October return 500 on every call, including empty lists.** Reading an empty list should never fail, so this looks like the develop database missing these modules' tables/migrations rather than bad requests. Affected: announcements, benefit plans, calendar, candidates, contracts, documents, employee checklist, employment types, expense claims, headcount (plans, series, attrition), hire tracker, interviews, kudos, leave blackouts, loans, notifications, onboarding list, performance feedback, positions, requisitions, sickness, workforce (overview, hiring), workforce requests, attendance corrections, approval delegations, employee invitations, join. Re-checked a few minutes later: still 500.
3. **The test account has no employee record**, so none of the self-service pages can be tested with it. A second login for an ordinary employee is needed once blocker 1 is fixed.

## 3. Findings for the app

| # | Finding | Evidence | Fix |
| --- | --- | --- | --- |
| 1 | **Headcount period format is wrong in the app.** The app sends `2026-Q1`; the server only accepts `Q1 2026` / `FY 2026`. | `PUT /headcount/plans` with `2026-Q1` → 400 *"A period reads like "Q3 2026" or "FY 2026"."* | `periodToApi` in `src/lib/headcount/api-mapping.ts` should return the screen label unchanged (the screens already use "Q1 2026"). |
| 2 | **Phone is required to create an employee, but the spec marks it optional.** | `POST /employees` without `phone` → 400 *"Phone number is required."* | Make phone required on the Add Employee form (and ask the backend to mark it required in the spec). |
| 3 | Validation failures come back without a top-level `message`, only an `errors` map. | e.g. `POST /access-levels/{id}/status` with a wrong body → 400, `errors.status` | Already handled: `getApiErrorMessage` in `src/lib/utils.ts` reads `errors`. No change needed. |
| 4 | Plain-text files are refused by upload. | `POST /files` with `text/plain` → 400 *"That file type is not accepted here."*; PDF works | Make sure upload pickers only offer accepted types. |
| 5 | Request shapes checked against the server and correct: file upload field `file` + `purpose`, access-level `{ status }` and `{ userId }`, work-schedule day keys `monday…`, departments/branches/business units/leave types/approval templates/assets bodies. | 2xx responses | — |

## 4. Endpoint detail

### ❌ Broken (500) (143)

Every one of these answered HTTP 500 with the message *"Something went wrong. Please try again."* Rows marked *probe* were called with a placeholder id because their parent could not be created; a 500 there means the route fails before it even looks the record up.

| Module | Endpoint | Response |
| --- | --- | --- |
| Announcements | `GET /announcements` | Something went wrong. Please try again. |
| Announcements | `POST /announcements` | Something went wrong. Please try again. |
| Announcements | `GET /announcements/{id}` | Something went wrong. Please try again. |
| Announcements | `DELETE /announcements/{id}` | Something went wrong. Please try again. |
| Announcements | `GET /announcements/{id}/acknowledgements` | Something went wrong. Please try again. |
| Announcements | `POST /announcements/{id}/publish` | Something went wrong. Please try again. |
| Announcements | `POST /announcements/{id}/archive` | Something went wrong. Please try again. |
| ApprovalDelegations | `GET /approval-delegations` | Something went wrong. Please try again. |
| AttendanceCorrections | `GET /attendance/corrections` | Something went wrong. Please try again. |
| AttendanceCorrections | `POST /attendance/corrections/{id}/approve` | Something went wrong. Please try again. |
| BenefitPlans | `GET /benefit-plans` | Something went wrong. Please try again. |
| BenefitPlans | `POST /benefit-plans` | Something went wrong. Please try again. |
| BenefitPlans | `GET /benefit-plans/summary` | Something went wrong. Please try again. |
| BenefitPlans | `GET /benefit-plans/coverage-levels` | Something went wrong. Please try again. |
| BenefitPlans | `POST /benefit-plans/coverage-levels` | Something went wrong. Please try again. |
| BenefitPlans | `DELETE /benefit-plans/coverage-levels/{id}` | Something went wrong. Please try again. |
| BenefitPlans | `GET /benefit-plans/{id}` | Something went wrong. Please try again. |
| BenefitPlans | `DELETE /benefit-plans/{id}` | Something went wrong. Please try again. |
| BenefitPlans | `POST /benefit-plans/{id}/duplicate` | Something went wrong. Please try again. |
| Calendar | `GET /calendar` | Something went wrong. Please try again. |
| Calendar | `GET /calendar/upcoming` | Something went wrong. Please try again. |
| Calendar | `GET /calendar/events/{id}` | Something went wrong. Please try again. |
| Calendar | `DELETE /calendar/events/{id}` | Something went wrong. Please try again. |
| Calendar | `POST /calendar/events` | Something went wrong. Please try again. |
| Candidates | `GET /candidates` | Something went wrong. Please try again. |
| Candidates | `GET /candidates/{id}` | Something went wrong. Please try again. |
| Candidates | `GET /candidates/{id}/can-move` | Something went wrong. Please try again. |
| Candidates | `POST /candidates/{id}/restore` | Something went wrong. Please try again. |
| Candidates | `POST /candidates/{id}/owner` | Something went wrong. Please try again. |
| Candidates | `POST /candidates/{id}/offers` | Something went wrong. Please try again. |
| Candidates | `POST /candidates/{id}/send-to-onboarding` | Something went wrong. Please try again. |
| Contracts | `GET /contracts` | Something went wrong. Please try again. |
| Contracts | `GET /contracts/{id}` | Something went wrong. Please try again. |
| Contracts | `DELETE /contracts/{id}` | Something went wrong. Please try again. |
| Contracts | `POST /contracts/{id}/send` | Something went wrong. Please try again. |
| Contracts | `POST /contracts/{id}/activate` | Something went wrong. Please try again. |
| Documents | `GET /documents/folders` | Something went wrong. Please try again. |
| Documents | `POST /documents/folders` | Something went wrong. Please try again. |
| Documents | `DELETE /documents/folders/{id}` | Something went wrong. Please try again. |
| Documents | `GET /documents` | Something went wrong. Please try again. |
| Documents | `GET /documents/{id}` | Something went wrong. Please try again. |
| Documents | `POST /documents/{id}/archive` | Something went wrong. Please try again. |
| Documents | `POST /documents/{id}/trash` | Something went wrong. Please try again. |
| Documents | `POST /documents/{id}/restore` | Something went wrong. Please try again. |
| Documents | `DELETE /documents/{id}/shares/{employeeId}` | Something went wrong. Please try again. |
| Documents | `GET /documents/{id}/acknowledgements` | Something went wrong. Please try again. |
| EmployeeChecklist | `GET /employee-checklist/items` | Something went wrong. Please try again. |
| EmployeeChecklist | `POST /employee-checklist/items` | Something went wrong. Please try again. |
| EmployeeChecklist | `DELETE /employee-checklist/items/{id}` | Something went wrong. Please try again. |
| EmployeeChecklist | `POST /employee-checklist/items/{id}/retire` | Something went wrong. Please try again. |
| EmployeeChecklist | `POST /employee-checklist/items/{id}/restore` | Something went wrong. Please try again. |
| EmployeeChecklist | `GET /employee-checklist/hires` | Something went wrong. Please try again. |
| EmployeeChecklist | `DELETE /employee-checklist/employees/{employeeId}/tasks/{itemId}` | Something went wrong. Please try again. |
| Employees | `DELETE /employees/{id}` | Something went wrong. Please try again. |
| Employees | `POST /employees/invite` | Something went wrong. Please try again. |
| Employees | `POST /employees/{id}/invitation` | Something went wrong. Please try again. |
| Employees | `GET /employees/invitations` | Something went wrong. Please try again. |
| Employees | `POST /employees/import` | Something went wrong. Please try again. |
| EmploymentTypes | `GET /employment-types` | Something went wrong. Please try again. |
| EmploymentTypes | `POST /employment-types` | Something went wrong. Please try again. |
| EmploymentTypes | `GET /employment-types/{id}` | Something went wrong. Please try again. |
| EmploymentTypes | `DELETE /employment-types/{id}` | Something went wrong. Please try again. |
| EmploymentTypes | `POST /employment-types/{id}/deactivate` | Something went wrong. Please try again. |
| EmploymentTypes | `POST /employment-types/{id}/reactivate` | Something went wrong. Please try again. |
| ExpenseClaims | `GET /expenses/claims` | Something went wrong. Please try again. |
| ExpenseClaims | `GET /expenses/claims/{id}` | Something went wrong. Please try again. |
| ExpenseClaims | `POST /expenses/claims/{id}/reimburse` | Something went wrong. Please try again. |
| Headcount | `GET /headcount/plans` | Something went wrong. Please try again. |
| Headcount | `PUT /headcount/plans` | 500 Something went wrong. Please try again. (with the period format the server asks for, "Q1 2026"; "2026-Q1" → 400 "A period reads like Q3 2026 or FY 2026") |
| Headcount | `GET /headcount/series` | Something went wrong. Please try again. |
| Headcount | `GET /headcount/attrition` | Something went wrong. Please try again. |
| Headcount | `DELETE /headcount/plans/{id}` | Something went wrong. Please try again. |
| HireTracker | `GET /hire-tracker` | Something went wrong. Please try again. |
| Interviews | `GET /interviews` | Something went wrong. Please try again. |
| Interviews | `GET /interviews/candidate/{candidateId}` | Something went wrong. Please try again. |
| Interviews | `POST /interviews/{id}/complete` | Something went wrong. Please try again. |
| Interviews | `POST /interviews/{id}/cancel` | Something went wrong. Please try again. |
| Join | `GET /join/{token}/requirements` | Something went wrong. Please try again. |
| Join | `GET /join/{token}/pack` | Something went wrong. Please try again. |
| Join | `POST /join/{token}/consent` | Something went wrong. Please try again. |
| Join | `DELETE /join/{token}/documents/{kind}` | Something went wrong. Please try again. |
| Join | `GET /join/{token}` | Something went wrong. Please try again. |
| Kudos | `GET /kudos` | Something went wrong. Please try again. |
| Kudos | `GET /kudos/summary` | Something went wrong. Please try again. |
| Kudos | `GET /kudos/leaderboard` | Something went wrong. Please try again. |
| Kudos | `GET /kudos/{id}` | Something went wrong. Please try again. |
| Kudos | `POST /kudos/{id}/pin` | Something went wrong. Please try again. |
| Kudos | `DELETE /kudos/{id}/pin` | Something went wrong. Please try again. |
| LeavePolicies | `GET /leave/blackouts` | Something went wrong. Please try again. |
| LeavePolicies | `POST /leave/blackouts` | Something went wrong. Please try again. |
| LeavePolicies | `DELETE /leave/blackouts/{id}` | Something went wrong. Please try again. |
| Loans | `GET /loans` | Something went wrong. Please try again. |
| Loans | `GET /loans/summary` | Something went wrong. Please try again. |
| Loans | `GET /loans/employees/{employeeId}` | Something went wrong. Please try again. |
| Loans | `GET /loans/{id}` | Something went wrong. Please try again. |
| Loans | `POST /loans/{id}/approve` | Something went wrong. Please try again. |
| Loans | `POST /loans/{id}/reject` | Something went wrong. Please try again. |
| Loans | `DELETE /loans/{id}/repayments/{repaymentId}` | Something went wrong. Please try again. |
| Loans | `POST /loans/{id}/default` | Something went wrong. Please try again. |
| Loans | `POST /loans/{id}/reinstate` | Something went wrong. Please try again. |
| Notifications | `GET /notifications` | Something went wrong. Please try again. |
| Notifications | `GET /notifications/unread-count` | Something went wrong. Please try again. |
| Notifications | `POST /notifications/{id}/read` | Something went wrong. Please try again. |
| Notifications | `POST /notifications/read-all` | Something went wrong. Please try again. |
| Notifications | `POST /notifications/{id}/dismiss` | Something went wrong. Please try again. |
| Onboarding | `GET /onboarding` | Something went wrong. Please try again. |
| Onboarding | `GET /onboarding/{id}` | Something went wrong. Please try again. |
| Onboarding | `POST /onboarding/{id}/complete` | Something went wrong. Please try again. |
| PerformanceFeedback | `GET /performance/feedback` | Something went wrong. Please try again. |
| Positions | `GET /positions` | Something went wrong. Please try again. |
| Positions | `POST /positions` | Something went wrong. Please try again. |
| Positions | `GET /positions/summary` | Something went wrong. Please try again. |
| Positions | `GET /positions/{id}` | Something went wrong. Please try again. |
| Positions | `DELETE /positions/{id}` | Something went wrong. Please try again. |
| Positions | `POST /positions/{id}/retire` | Something went wrong. Please try again. |
| Positions | `POST /positions/{id}/restore` | Something went wrong. Please try again. |
| Requisitions | `GET /requisitions` | Something went wrong. Please try again. |
| Requisitions | `POST /requisitions` | Something went wrong. Please try again. |
| Requisitions | `GET /requisitions/{id}` | Something went wrong. Please try again. |
| Requisitions | `DELETE /requisitions/{id}` | Something went wrong. Please try again. |
| Requisitions | `GET /requisitions/{id}/warnings` | Something went wrong. Please try again. |
| Requisitions | `POST /requisitions/{id}/publish` | Something went wrong. Please try again. |
| Requisitions | `POST /requisitions/{id}/hold` | Something went wrong. Please try again. |
| Requisitions | `POST /requisitions/{id}/resume` | Something went wrong. Please try again. |
| Requisitions | `POST /requisitions/{id}/close` | Something went wrong. Please try again. |
| Requisitions | `POST /requisitions/{id}/cancel` | Something went wrong. Please try again. |
| Sickness | `GET /sickness` | Something went wrong. Please try again. |
| Sickness | `GET /sickness/{id}` | Something went wrong. Please try again. |
| Sickness | `GET /sickness/summary` | Something went wrong. Please try again. |
| Sickness | `GET /sickness/alerts` | Something went wrong. Please try again. |
| Sickness | `POST /sickness/{id}/approve` | Something went wrong. Please try again. |
| Sickness | `DELETE /sickness/{id}/exclusion` | Something went wrong. Please try again. |
| Sickness | `GET /sickness/bradford/{employeeId}` | Something went wrong. Please try again. |
| Sickness | `GET /sickness/bradford` | Something went wrong. Please try again. |
| Workforce | `GET /workforce/overview` | Something went wrong. Please try again. |
| Workforce | `GET /workforce/hiring` | Something went wrong. Please try again. |
| WorkforceRequests | `GET /workforce-requests` | Something went wrong. Please try again. |
| WorkforceRequests | `POST /workforce-requests` | Something went wrong. Please try again. |
| WorkforceRequests | `GET /workforce-requests/{id}` | Something went wrong. Please try again. |
| WorkforceRequests | `DELETE /workforce-requests/{id}` | Something went wrong. Please try again. |
| WorkforceRequests | `POST /workforce-requests/{id}/submit` | Something went wrong. Please try again. |
| WorkforceRequests | `POST /workforce-requests/{id}/convert` | Something went wrong. Please try again. |
| WorkSchedules | `PUT /attendance/schedules/employees/{employeeId}` | Something went wrong. Please try again. |

### 👤 Needs an employee login (42)

The owner account has no employee record. Responses are the server's own messages.

| Module | Endpoint | Response |
| --- | --- | --- |
| Announcements | `GET /announcements/feed` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Announcements | `POST /announcements/feed/{id}/view` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Announcements | `POST /announcements/feed/{id}/acknowledge` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| ApprovalDelegations | `GET /approval-delegations/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| ApprovalDelegations | `DELETE /approval-delegations/{id}` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Attendance | `GET /attendance/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Attendance | `GET /attendance/mine/days` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Attendance | `GET /attendance/mine/summary` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Attendance | `POST /attendance/mine/clock-in` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Attendance | `POST /attendance/mine/break/start` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Attendance | `POST /attendance/mine/break/end` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Attendance | `POST /attendance/mine/clock-out` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| AttendanceCorrections | `GET /attendance/corrections/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Contracts | `GET /contracts/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Diversity | `PUT /diversity/me` | 404 There is no employee record against this account to declare against. |
| Documents | `GET /documents/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Documents | `POST /documents/mine/{id}/acknowledge` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| EmployeeChecklist | `GET /employee-checklist/me` | 404 Your account has no employee record, so there is no checklist to show. |
| ExpenseClaims | `GET /expenses/claims/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| ExpenseClaims | `DELETE /expenses/claims/mine/{id}` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| ExpenseClaims | `POST /expenses/claims/mine/{id}/submit` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| ExpenseClaims | `POST /expenses/claims/mine/{id}/withdraw` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Kudos | `DELETE /kudos/{id}` | Your account has no employee record, so it cannot give or receive kudos. |
| Kudos | `DELETE /kudos/{id}/comments/{commentId}` | Your account has no employee record, so it cannot give or receive kudos. |
| LeaveBalances | `GET /leave/balances/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Leave | `GET /leave/requests/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Onboarding | `GET /onboarding/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| PerformanceFeedback | `GET /performance/feedback/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| PerformanceFeedback | `GET /performance/feedback/requests/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| PerformanceFeedback | `GET /performance/feedback/requests/awaiting-me` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| PerformanceFeedback | `POST /performance/feedback/requests/{id}/decline` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| PerformanceGoals | `GET /performance/goals/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| PerformanceReviews | `GET /performance/reviews/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| PerformanceReviews | `PUT /performance/reviews/mine/{id}/self-assessment` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| PerformanceReviews | `POST /performance/reviews/mine/{id}/self-assessment` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| Tasks | `POST /tasks` | Your account has no employee record, so it has no task list. |
| Tasks | `DELETE /tasks/{id}` | Your account has no employee record, so it has no task list. |
| Tasks | `POST /tasks/{id}/complete` | Your account has no employee record, so it has no task list. |
| Tasks | `DELETE /tasks/{id}/complete` | Your account has no employee record, so it has no task list. |
| Tasks | `POST /tasks/reorder` | Your account has no employee record, so it has no task list. |
| Timesheets | `GET /attendance/timesheets/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |
| WorkSchedules | `GET /attendance/schedules/mine` | This account manages the company rather than working in it, so it has no employee record and nothing of its own here. |

### 🟡 Reachable, not verified (118)

Called with a placeholder id or empty body because the parent record could not be created. The response shows the route exists and validates; the happy path still needs testing once employees can be created.

| Module | Endpoint | Response |
| --- | --- | --- |
| Announcements | `PUT /announcements/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Announcements.AnnouncementRequest' was missing required properties including: 'title', 'body', 'type'.; request: The request field is required. |
| ApprovalDelegations | `POST /approval-delegations` | 400 $: JSON deserialization for type 'Motee.Application.Approvals.ApprovalDelegationRequest' was missing required properties including: 'delegateEmployeeId', 'startDate', 'endDate'.; request: The request field is required. |
| Approvals | `GET /approvals/{id}` | 404 Approval not found. |
| Approvals | `POST /approvals/{id}/decide` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.DecideApprovalRequest' was missing required properties including: 'decision'.; request: The request field is required. |
| Approvals | `POST /approvals/{id}/resubmit` | 404 Approval not found. |
| Approvals | `POST /approvals/{id}/reresolve` | 404 Approval not found. |
| Approvals | `POST /approvals/{id}/cancel` | 404 Approval not found. |
| Assets | `POST /assets/{id}/assign` | 400 $: JSON deserialization for type 'Motee.Application.Assets.AssignAssetRequest' was missing required properties including: 'employeeId'.; request: The request field is required. |
| Assets | `POST /assets/{id}/return` | 404 Asset not found. |
| Attendance | `PUT /attendance/mine/location` | 400 $: JSON deserialization for type 'Motee.Application.Attendance.SetWorkLocationRequest' was missing required properties including: 'location'.; request: The request field is required. |
| Attendance | `POST /attendance/log` | 400 $: JSON deserialization for type 'Motee.Application.Attendance.LogAttendanceRequest' was missing required properties including: 'employeeId', 'date'.; request: The request field is required. |
| AttendanceCorrections | `POST /attendance/corrections/mine` | 400 $: JSON deserialization for type 'Motee.Application.Attendance.RequestCorrectionRequest' was missing required properties including: 'date', 'reason'.; request: The request field is required. |
| AttendanceCorrections | `POST /attendance/corrections/{id}/reject` | 400 Say what was wrong with the day. Whoever reviews it has nothing to decide on otherwise. |
| BenefitPlans | `PUT /benefit-plans/coverage-levels/{id}` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.CoverageLevelRequest' was missing required properties including: 'name'.; request: The request field is required. |
| BenefitPlans | `GET /benefit-plans/employees/{employeeId}` | 404 Employee not found. |
| BenefitPlans | `PUT /benefit-plans/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Benefits.BenefitPlanRequest' was missing required properties including: 'name', 'description'.; request: The request field is required. |
| BenefitPlans | `POST /benefit-plans/{id}/status` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.BenefitPlanStatusRequest' was missing required properties including: 'status'.; request: The request field is required. |
| Calendar | `PUT /calendar/events/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Calendar.CalendarEventRequest' was missing required properties including: 'title', 'date'.; request: The request field is required. |
| Candidates | `POST /candidates` | 400 $: JSON deserialization for type 'Motee.Application.Recruitment.CandidateRequest' was missing required properties including: 'requisitionId', 'firstName', 'lastName', 'email'.; request: The request field is required. |
| Candidates | `PUT /candidates/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Recruitment.CandidateRequest' was missing required properties including: 'requisitionId', 'firstName', 'lastName', 'email'.; request: The request field is required. |
| Candidates | `POST /candidates/{id}/move` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.MoveCandidateRequest' was missing required properties including: 'to'.; request: The request field is required. |
| Candidates | `POST /candidates/{id}/reject` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.RejectCandidateRequest' was missing required properties including: 'reason'.; request: The request field is required. |
| Candidates | `POST /candidates/{id}/scorecards` | 400 $: JSON deserialization for type 'Motee.Application.Recruitment.ScorecardRequest' was missing required properties including: 'criteria'.; request: The request field is required. |
| Candidates | `POST /candidates/{id}/offers/{offerId}/respond` | 400 $: JSON deserialization for type 'Motee.Application.Recruitment.OfferResponseRequest' was missing required properties including: 'status'.; request: The request field is required. |
| Contracts | `POST /contracts/mine/{id}/sign` | 400 $: JSON deserialization for type 'Motee.Application.Contracts.SignContractRequest' was missing required properties including: 'signedAs'.; request: The request field is required. |
| Contracts | `POST /contracts` | 400 $: JSON deserialization for type 'Motee.Application.Contracts.ContractRequest' was missing required properties including: 'employeeId', 'title', 'contractType', 'startDate'.; request: The request field is required. |
| Contracts | `PUT /contracts/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Contracts.ContractRequest' was missing required properties including: 'employeeId', 'title', 'contractType', 'startDate'.; request: The request field is required. |
| Contracts | `POST /contracts/{id}/terminate` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.TerminateContractRequest' was missing required properties including: 'reason'.; request: The request field is required. |
| Contracts | `POST /contracts/{id}/sign` | 400 $: JSON deserialization for type 'Motee.Application.Contracts.SignContractRequest' was missing required properties including: 'signedAs'.; request: The request field is required. |
| Contracts | `POST /contracts/{id}/file-to-documents` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.FileContractRequest' was missing required properties including: 'storedFileId'.; request: The request field is required. |
| Contracts | `POST /contracts/{id}/notes` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.ContractNoteRequest' was missing required properties including: 'content'.; request: The request field is required. |
| Documents | `PUT /documents/folders/{id}` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.RenameFolderRequest' was missing required properties including: 'name'.; request: The request field is required. |
| Documents | `POST /documents` | 400 $: JSON deserialization for type 'Motee.Application.Documents.CreateDocumentRequest' was missing required properties including: 'name', 'category', 'folderId', 'storedFileId'.; request: The request field is required. |
| Documents | `PUT /documents/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Documents.UpdateDocumentRequest' was missing required properties including: 'name', 'category', 'folderId'.; request: The request field is required. |
| Documents | `POST /documents/{id}/versions` | 400 $: JSON deserialization for type 'Motee.Application.Documents.AddVersionRequest' was missing required properties including: 'storedFileId'.; request: The request field is required. |
| Documents | `POST /documents/{id}/shares` | 400 $: JSON deserialization for type 'Motee.Application.Documents.ShareDocumentRequest' was missing required properties including: 'employeeId'.; request: The request field is required. |
| EmployeeChecklist | `PUT /employee-checklist/items/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Checklists.ChecklistItemRequest' was missing required properties including: 'title'.; request: The request field is required. |
| EmployeeChecklist | `POST /employee-checklist/items/{id}/move` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.MoveChecklistItemRequest' was missing required properties including: 'up'.; request: The request field is required. |
| EmployeeChecklist | `GET /employee-checklist/employees/{employeeId}` | 404 Employee not found. |
| EmployeeChecklist | `POST /employee-checklist/employees/{employeeId}/tasks/{itemId}` | 404 That person does not work here. |
| Employees | `POST /employees` | 400 Phone number is required. |
| Employees | `GET /employees/{id}` | 404 Employee not found. |
| Employees | `PUT /employees/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Employees.EmployeeRequest' was missing required properties including: 'firstName', 'lastName', 'email', 'jobTitle', 'departmentId'.; request: The request field is required. |
| Employees | `GET /employees/{id}/medical` | 404 Employee not found. |
| Employees | `POST /employees/{id}/status` | 400 $: JSON deserialization for type 'Motee.Api.Contracts.Employees.ChangeEmployeeStatusRequest' was missing required properties including: 'status'.; request: The request field is required. |
| Employees | `DELETE /employees/{id}/invitation` | 404 Employee not found. |
| EmploymentTypes | `PUT /employment-types/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Organisation.EmploymentTypeRequest' was missing required properties including: 'name'.; request: The request field is required. |
| ExpenseClaims | `POST /expenses/claims/mine` | 400 $: JSON deserialization for type 'Motee.Application.Expenses.ExpenseClaimRequest' was missing required properties including: 'title', 'category', 'amount', 'merchant', 'incurredOn'.; request: The request field is required. |
| ExpenseClaims | `PUT /expenses/claims/mine/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Expenses.ExpenseClaimRequest' was missing required properties including: 'title', 'category', 'amount', 'merchant', 'incurredOn'.; request: The request field is required. |
| ExpenseClaims | `POST /expenses/claims/{id}/return` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.ReturnClaimRequest' was missing required properties including: 'reason'.; request: The request field is required. |
| Headcount | `GET /headcount/trend` | 400 period is required (only reached without a period, because no plan could be saved) |
| Interviews | `POST /interviews` | 400 $: JSON deserialization for type 'Motee.Application.Recruitment.InterviewRequest' was missing required properties including: 'candidateId', 'round', 'scheduledAt'.; request: The request field is required. |
| Interviews | `PUT /interviews/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Recruitment.InterviewRequest' was missing required properties including: 'candidateId', 'round', 'scheduledAt'.; request: The request field is required. |
| Join | `PUT /join/{token}/documents/{kind}` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.AttachJoinerDocumentRequest' was missing required properties including: 'fileId'.; request: The request field is required. |
| Join | `PUT /join/{token}/guarantors` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.SaveGuarantorsRequest' was missing required properties including: 'guarantors'.; request: The request field is required. |
| Join | `PUT /join/{token}/starter-tax` | 400 $: JSON deserialization for type 'Motee.Application.Onboarding.StarterTaxRequest' was missing required properties including: 'source'.; request: The request field is required. |
| Join | `PUT /join/{token}/draft` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.SaveJoinerDraftRequest' was missing required properties including: 'draftJson'.; request: The request field is required. |
| Join | `POST /join/{token}/declare` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.DeclareJoinerPackRequest' was missing required properties including: 'signedName'.; request: The request field is required. |
| Join | `POST /join/{token}` | 400 $: JSON deserialization for type 'Motee.Application.Employees.AcceptInviteRequest' was missing required properties including: 'password'.; request: The request field is required. |
| Join | `POST /join/{token}/photo` | 400 file: The file field is required. |
| Kudos | `POST /kudos` | 400 $: JSON deserialization for type 'Motee.Application.Recognition.KudosRequest' was missing required properties including: 'message'.; request: The request field is required. |
| Kudos | `POST /kudos/{id}/reactions` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.ReactionRequest' was missing required properties including: 'type'.; request: The request field is required. |
| Kudos | `POST /kudos/{id}/comments` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.KudosCommentRequest' was missing required properties including: 'message'.; request: The request field is required. |
| LeaveBalances | `POST /leave/balances/adjust` | 400 $: JSON deserialization for type 'Motee.Application.Leave.LeaveAdjustmentRequest' was missing required properties including: 'employeeId', 'leaveTypeId', 'days', 'reason'.; request: The request field is required. |
| Leave | `POST /leave/requests` | 400 $: JSON deserialization for type 'Motee.Application.Leave.LeaveRequestSubmission' was missing required properties including: 'employeeId', 'leaveTypeId', 'startDate', 'endDate'.; request: The request field is required. |
| Leave | `GET /leave/requests/{id}` | 404 Leave request not found. |
| Leave | `POST /leave/requests/quote` | 400 $: JSON deserialization for type 'Motee.Application.Leave.LeaveQuoteRequest' was missing required properties including: 'employeeId', 'leaveTypeId', 'startDate', 'endDate'.; request: The request field is required. |
| Leave | `POST /leave/requests/{id}/cancel` | 404 Leave request not found. |
| LeavePolicies | `PUT /leave/blackouts/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Leave.LeaveBlackoutRequest' was missing required properties including: 'name', 'startDate', 'endDate', 'leaveTypeIds'.; request: The request field is required. |
| Loans | `POST /loans` | 400 $: JSON deserialization for type 'Motee.Application.Loans.LoanRequest' was missing required properties including: 'loanType', 'amount', 'repaymentMonths', 'purpose'.; request: The request field is required. |
| Loans | `POST /loans/{id}/repayments` | 400 $: JSON deserialization for type 'Motee.Application.Loans.LoanRepaymentRequest' was missing required properties including: 'amount'.; request: The request field is required. |
| Offboarding | `POST /offboarding` | 400 $: JSON deserialization for type 'Motee.Application.Offboarding.InitiateOffboardingRequest' was missing required properties including: 'employeeId', 'exitReason', 'lastWorkingDate'.; request: The request field is required. |
| Offboarding | `GET /offboarding/{id}` | 404 Offboarding record not found. |
| Offboarding | `PUT /offboarding/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Offboarding.UpdateOffboardingRequest' was missing required properties including: 'exitReason', 'lastWorkingDate'.; request: The request field is required. |
| Offboarding | `DELETE /offboarding/{id}` | 404 Offboarding record not found. |
| Offboarding | `POST /offboarding/{id}/actions/{action}` | 404 < 0 bytes> |
| Offboarding | `POST /offboarding/{id}/clearance/{itemId}` | 404 Offboarding record not found. |
| Offboarding | `POST /offboarding/{id}/revoke-access` | 404 Offboarding record not found. |
| Offboarding | `POST /offboarding/{id}/exit-interview/schedule` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.ScheduleInterviewRequest' was missing required properties including: 'scheduledAt'.; request: The request field is required. |
| Offboarding | `POST /offboarding/{id}/exit-interview/complete` | 404 Offboarding record not found. |
| Offboarding | `POST /offboarding/{id}/exit-documents` | 404 Offboarding record not found. |
| Onboarding | `POST /onboarding/{id}/stage` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.MoveStageRequest' was missing required properties including: 'stage'.; request: The request field is required. |
| PerformanceFeedback | `POST /performance/feedback/requests` | 400 $: JSON deserialization for type 'Motee.Application.Performance.AskForFeedbackRequest' was missing required properties including: 'colleagueId'.; request: The request field is required. |
| PerformanceFeedback | `POST /performance/feedback` | 400 $: JSON deserialization for type 'Motee.Application.Performance.GiveFeedbackRequest' was missing required properties including: 'aboutEmployeeId', 'message'.; request: The request field is required. |
| PerformanceGoals | `POST /performance/goals/mine` | 400 $: JSON deserialization for type 'Motee.Application.Performance.GoalRequest' was missing required properties including: 'title', 'category', 'dueDate'.; request: The request field is required. |
| PerformanceGoals | `POST /performance/goals/{id}/progress` | 400 $: JSON deserialization for type 'Motee.Application.Performance.ProgressUpdateRequest' was missing required properties including: 'progress'.; request: The request field is required. |
| PerformanceGoals | `GET /performance/goals/{id}` | 404 Goal not found. |
| PerformanceGoals | `PUT /performance/goals/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Performance.GoalRequest' was missing required properties including: 'title', 'category', 'dueDate'.; request: The request field is required. |
| PerformanceGoals | `DELETE /performance/goals/{id}` | 404 Goal not found. |
| PerformanceGoals | `POST /performance/goals/employees/{employeeId}` | 400 $: JSON deserialization for type 'Motee.Application.Performance.GoalRequest' was missing required properties including: 'title', 'category', 'dueDate'.; request: The request field is required. |
| PerformanceGoals | `POST /performance/goals/{id}/status` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.ChangeGoalStatusRequest' was missing required properties including: 'status'.; request: The request field is required. |
| PerformanceReviews | `POST /performance/reviews` | 400 $: JSON deserialization for type 'Motee.Application.Performance.OpenReviewRequest' was missing required properties including: 'employeeId', 'reviewType', 'period', 'dueDate'.; request: The request field is required. |
| PerformanceReviews | `GET /performance/reviews/{id}` | 404 Review not found. |
| PerformanceReviews | `DELETE /performance/reviews/{id}` | 404 Review not found. |
| PerformanceReviews | `PUT /performance/reviews/{id}/manager-review` | 404 Review not found. |
| PerformanceReviews | `POST /performance/reviews/{id}/complete` | 404 Review not found. |
| PerformanceReviews | `POST /performance/reviews/{id}/calibrate` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.CalibrateReviewRequest' was missing required properties including: 'rating'.; request: The request field is required. |
| Positions | `PUT /positions/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Organisation.PositionRequest' was missing required properties including: 'title'.; request: The request field is required. |
| Positions | `POST /positions/{id}/assign` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.AssignPositionRequest' was missing required properties including: 'employeeId'.; request: The request field is required. |
| Positions | `POST /positions/unassign` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.AssignPositionRequest' was missing required properties including: 'employeeId'.; request: The request field is required. |
| Requisitions | `PUT /requisitions/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Recruitment.RequisitionRequest' was missing required properties including: 'positionTitle', 'employmentType'.; request: The request field is required. |
| Sickness | `POST /sickness` | 400 $: JSON deserialization for type 'Motee.Application.Sickness.SicknessRequest' was missing required properties including: 'employeeId', 'startDate'.; request: The request field is required. |
| Sickness | `PUT /sickness/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Sickness.SicknessRequest' was missing required properties including: 'employeeId', 'startDate'.; request: The request field is required. |
| Sickness | `POST /sickness/{id}/reject` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.SicknessReasonRequest' was missing required properties including: 'reason'.; request: The request field is required. |
| Sickness | `POST /sickness/{id}/cancel` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.SicknessReasonRequest' was missing required properties including: 'reason'.; request: The request field is required. |
| Sickness | `POST /sickness/{id}/return` | 400 $: JSON deserialization for type 'Motee.Application.Sickness.ReturnRequest' was missing required properties including: 'lastSickDay'.; request: The request field is required. |
| Sickness | `POST /sickness/{id}/return-to-work` | 400 $: JSON deserialization for type 'Motee.Application.Sickness.ReturnToWorkRequest' was missing required properties including: 'safeToReturn'.; request: The request field is required. |
| Sickness | `POST /sickness/{id}/documents` | 400 $: JSON deserialization for type 'Motee.Application.Sickness.SicknessDocumentRequest' was missing required properties including: 'kind', 'name'.; request: The request field is required. |
| Sickness | `POST /sickness/{id}/exclusion` | 400 $: JSON deserialization for type 'Motee.Application.Sickness.ExclusionRequest' was missing required properties including: 'category', 'reason'.; request: The request field is required. |
| Tasks | `GET /tasks/{id}` | 404 Task not found. |
| Tasks | `PUT /tasks/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Work.TaskItemRequest' was missing required properties including: 'title'.; request: The request field is required. |
| Timesheets | `POST /attendance/timesheets/mine/submit` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.SubmitTimesheetRequest' was missing required properties including: 'weekStart'.; request: The request field is required. |
| Timesheets | `GET /attendance/timesheets/{id}` | 404 Timesheet not found. |
| Timesheets | `POST /attendance/timesheets/{id}/approve` | 404 Timesheet not found. |
| Timesheets | `POST /attendance/timesheets/{id}/reject` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.RejectTimesheetRequest' was missing required properties including: 'reason'.; request: The request field is required. |
| WorkforceRequests | `PUT /workforce-requests/{id}` | 400 $: JSON deserialization for type 'Motee.Application.Workforce.WorkforceRequestRequest' was missing required properties including: 'position', 'justification'.; request: The request field is required. |
| WorkforceRequests | `POST /workforce-requests/{id}/cancel` | 400 $: JSON deserialization for type 'Motee.Api.Controllers.WorkforceCancelRequest' was missing required properties including: 'reason'.; request: The request field is required. |
| WorkSchedules | `DELETE /attendance/schedules/{id}` | 404 Work schedule not found. |

### ⛔ Forbidden (3)

Platform console endpoints, which need a platform-staff account.

| Module | Endpoint | Response |
| --- | --- | --- |
| Platform | `GET /platform/tenants` | 403 (not platform staff) |
| Platform | `GET /platform/tenants/{id}` | 403 (not platform staff) |
| Platform | `GET /platform/staff` | 403 (not platform staff) |

### ⏭ Skipped (6)

Not run, by agreement, because they act on the whole account or tenant.

| Module | Endpoint | Response |
| --- | --- | --- |
| Auth | `POST /auth/register` | would create a new tenant (excluded by the agreed rules) |
| LeaveBalances | `POST /leave/balances/year-end/close` | account-level: closes the tenant's leave year (excluded by the agreed rules) |
| Platform | `POST /platform/staff` | platform-admin action (excluded); account is not platform staff (GET /platform/* → 403) |
| Platform | `DELETE /platform/staff/{userId}` | platform-admin action (excluded) |
| TenantSetup | `PUT /tenant/setup` | re-saves the company setup (excluded by the agreed rules) |
| TenantSetup | `POST /tenant/setup/complete` | re-completes tenant setup (excluded by the agreed rules) |

### ✅ Works (104)

Returned 2xx (or refused bad input correctly).

| Module | Endpoint | Response |
| --- | --- | --- |
| AccessLevels | `GET /access-levels` |  |
| AccessLevels | `POST /access-levels` |  |
| AccessLevels | `GET /access-levels/catalogue` |  |
| AccessLevels | `GET /access-levels/{id}` |  |
| AccessLevels | `PUT /access-levels/{id}` |  |
| AccessLevels | `DELETE /access-levels/{id}` |  |
| AccessLevels | `POST /access-levels/{id}/status` |  |
| AccessLevels | `POST /access-levels/{id}/holders` | owner as holder |
| AccessLevels | `DELETE /access-levels/{id}/holders/{userId}` |  |
| Approvals | `GET /approvals/my-queue` |  |
| Approvals | `GET /approvals/for/{subjectType}/{subjectId}` | probe: placeholder id / empty body — parent record could not be created |
| ApprovalTemplates | `GET /approval-templates` |  |
| ApprovalTemplates | `POST /approval-templates` |  |
| ApprovalTemplates | `GET /approval-templates/catalogue` |  |
| ApprovalTemplates | `GET /approval-templates/{id}` |  |
| ApprovalTemplates | `PUT /approval-templates/{id}` |  |
| ApprovalTemplates | `DELETE /approval-templates/{id}` |  |
| Assets | `GET /assets` |  |
| Assets | `POST /assets` |  |
| Assets | `GET /assets/{id}` |  |
| Assets | `PUT /assets/{id}` |  |
| Assets | `GET /assets/{id}/history` |  |
| Assets | `POST /assets/{id}/status` |  |
| Attendance | `GET /attendance` |  |
| Attendance | `GET /attendance/summary` |  |
| AuditTrail | `GET /audit-trail` |  |
| AuditTrail | `GET /audit-trail/catalogue` |  |
| Auth | `POST /auth/verify-otp` | correctly refuses a wrong code: 400 That code is not correct. |
| Auth | `POST /auth/resend-otp` | unknown address |
| Auth | `POST /auth/login` |  |
| Auth | `POST /auth/forgot-password` | unknown address (not the owner's, to avoid emailing them) |
| Auth | `POST /auth/reset-password` | correctly refuses a wrong code: 400 That code is not correct. |
| Auth | `POST /auth/refresh` | refuses an invalid token with 401; a valid-token refresh was not run |
| Auth | `POST /auth/logout` | run last |
| Auth | `GET /auth/me` |  |
| Branches | `GET /branches` |  |
| Branches | `POST /branches` |  |
| Branches | `GET /branches/{id}` |  |
| Branches | `PUT /branches/{id}` |  |
| Branches | `DELETE /branches/{id}` |  |
| BusinessUnits | `GET /business-units` |  |
| BusinessUnits | `POST /business-units` |  |
| BusinessUnits | `GET /business-units/{id}` |  |
| BusinessUnits | `PUT /business-units/{id}` |  |
| BusinessUnits | `DELETE /business-units/{id}` |  |
| Dashboard | `GET /dashboard/people` |  |
| Dashboard | `GET /dashboard/attendance` |  |
| Departments | `GET /departments` |  |
| Departments | `POST /departments` |  |
| Departments | `GET /departments/{id}` |  |
| Departments | `PUT /departments/{id}` |  |
| Departments | `DELETE /departments/{id}` |  |
| Diversity | `GET /diversity/me` |  |
| Diversity | `GET /diversity/report` |  |
| Employees | `GET /employees` |  |
| Employees | `GET /employees/stats` |  |
| Employees | `POST /employees/export` |  |
| Employees | `GET /employees/export/columns` |  |
| Employees | `GET /employees/import/template` |  |
| Employees | `GET /employees/import/columns` |  |
| Exports | `GET /exports/{id}` |  |
| Exports | `POST /exports/{id}/link` |  |
| Files | `POST /files` | pdf, purpose companyDocument |
| Files | `GET /files` |  |
| Files | `GET /files/{id}` |  |
| Files | `DELETE /files/{id}` |  |
| Files | `GET /files/{id}/download` |  |
| Headcount | `GET /headcount/demographics` |  |
| Kudos | `GET /kudos/me` |  |
| LeaveBalances | `GET /leave/balances` |  |
| LeaveBalances | `GET /leave/balances/{employeeId}` | probe: placeholder id / empty body — parent record could not be created |
| LeaveBalances | `GET /leave/balances/year-end/preview` |  |
| Leave | `GET /leave/requests` |  |
| LeavePolicies | `GET /leave/types` |  |
| LeavePolicies | `POST /leave/types` |  |
| LeavePolicies | `PUT /leave/types/{id}` |  |
| LeavePolicies | `DELETE /leave/types/{id}` |  |
| LeavePolicies | `GET /leave/holidays` |  |
| LeavePolicies | `POST /leave/holidays` |  |
| LeavePolicies | `POST /leave/holidays/generate/{year}` |  |
| LeavePolicies | `DELETE /leave/holidays/{id}` |  |
| Loans | `GET /loans/me` |  |
| Locale | `GET /locale/detect` |  |
| Locale | `GET /locale` |  |
| Locale | `GET /locale/countries` |  |
| Offboarding | `GET /offboarding` |  |
| Offboarding | `GET /offboarding/stats` |  |
| Onboarding | `GET /onboarding/catalogue` |  |
| PerformanceGoals | `GET /performance/goals` |  |
| PerformanceReviews | `GET /performance/reviews` |  |
| Tasks | `GET /tasks` |  |
| Tasks | `GET /tasks/assigned-by-me` |  |
| Tasks | `GET /tasks/summary` |  |
| TenantSetup | `GET /tenant/setup/options` |  |
| TenantSetup | `GET /tenant/setup` |  |
| Timesheets | `GET /attendance/timesheets` |  |
| Users | `GET /users` |  |
| Workforce | `GET /workforce/turnover` |  |
| WorkSchedules | `GET /attendance/schedules` |  |
| WorkSchedules | `POST /attendance/schedules` |  |
| WorkSchedules | `GET /attendance/schedules/{id}` |  |
| WorkSchedules | `PUT /attendance/schedules/{id}` |  |
| WorkSchedules | `GET /attendance/schedules/for/{employeeId}` | probe: placeholder id / empty body — parent record could not be created |
| WorkSchedules | `POST /attendance/schedules/{id}/default` |  |


## 5. Data seeded into the tenant (kept)

| Type | Record | Id |
| --- | --- | --- |
| Business unit | E2E Operations Group | `91776a14-fe14-4003-8306-c05b87ff6453` |
| Department | E2E-ENG | `25ab7367-916f-4bdd-81e7-6c1b38e74316` |
| Department | E2E-FIN | `fac765c4-b503-4123-8427-8013b965fcfe` |
| Department | E2E-HR | `6465d383-1930-432e-83d5-5a43ca179662` |
| Branch | E2E-LOS | `a9fff77f-c39a-489c-95c2-6e0e21ca0f94` |
| Branch | E2E-ABJ | `30bb0f8c-40ee-40d8-b236-e04d669f0783` |
| Access level | E2E Line Manager | `e5d3cc71-ba70-474f-b73a-b2738d4e5787` |
| Leave type | E2E Study Leave | `edca600d-edf7-4e41-8654-03137168db24` |
| Public holidays | Generated for 2027 (POST /leave/holidays/generate/2027) | `—` |
| Approval template | E2E Loan approval (loan_request, set as default) | `c9119aad-22d2-4e8d-a75a-56e7d766cd4f` |
| Assets | E2E-LAP-001 MacBook Pro, E2E-MON-001 monitor, E2E-PHN-001 iPhone | `e523c789-752e-46d2-97af-0d019060c02e` |
| Work schedule | E2E Standard 9-5 (set as default) | `e78fc36d-c004-4826-a3e7-6deabf0436c1` |
| File | e2e-policy.pdf (companyDocument) | `b173578b-e0a2-4907-a17d-e880ef09feb5` |
| Export | Employee export job | `484250b5-138a-4f2b-9457-5f780606aaf9` |

Employees, leave requests, loans, sickness records, kudos, tasks, benefit plans, checklist items, headcount targets and workforce requests could **not** be seeded: their create endpoints return 500 or need an employee (see section 2).

Temporary records the test created to exercise delete endpoints (a department, branch, business unit, leave type, holiday, access level, approval template and file, all named "… (delete me)") were deleted again.

## 6. Re-running

Once the backend fixes blockers 1 and 2, re-run the same script with the owner login (and an employee login for self-service). It is idempotent for the org records above and will pick up from them.
