# MOTEE / MSL HR Platform — Client Feedback Round 2

Source: `MOTEE_SOLUTIONS.odt`

**Coverage note:** this document is mostly prose — the client wrote out each point in full, with screenshots as illustration. Everything below is extracted from the written instructions. The 17 embedded images could not be rendered in this session; where an image likely holds a detail the text doesn't spell out, it's flagged `[CHECK IMAGE]`. Nothing critical appears to live in an image alone, but confirm the flagged ones.

This round splits into three areas: **Work Pattern page**, **Profile / Profile Change Requests**, and the **Leave Management admin console** (the biggest block).

---

## A. WORK PATTERN & HOLIDAY ALLOWANCE PAGE

### ⚠️ A1. Hours calculation is inconsistent — "the most important issue to correct"

The client's flagship complaint this round. Same class of bug as the attendance-rate issue from round 1.

```
Dashboard shows:
  Weekly Hours : 37.5
  Mon–Fri      : 8.5 hours/day

But 8.5 × 5 = 42.5, not 37.5
```

The numbers contradict each other. If the contract is genuinely 37.5 hrs/week, then either:
- each day includes a **1-hour unpaid lunch**, making paid hours **7.5/day**, or
- the Hours column is simply wrong and should read **7.5**, not 8.5.

**Action:** reconcile the daily-hours figure with weekly hours. Decide whether breaks are deducted, and make the maths tie out.

### A2. Show breaks explicitly

`09:00–17:30` is an 8.5-hour span and users can't tell if lunch is included. Display something like:

> **Working Time: 09:00–17:30 (includes 1 hour unpaid lunch)**

`[CHECK IMAGE]` — image2 shows the client's preferred format for the break line.

### A3. Simplify weekend rows

Currently Sat/Sun show `Start: — / End: — / Hours: Off`. Acceptable but visually noisy — simplify the display. `[CHECK IMAGE]` — image3.

### A4. Holiday allowance isn't actually shown

Page is titled **"Work Pattern & Holiday Allowance"** but only the work pattern renders. Add holiday cards:
- Holiday entitlement
- Annual leave balance
- Carry-over
- Holidays booked
- Remaining leave

Worked example: 28 days annual leave · 7 days booked · 21 days remaining.

> Note: this overlaps with round-1 §13.4 (Holiday Allowance breakdown). Same underlying gap — the holiday side of this page was never built out.

### A5. Consistent label casing

| Current | Use |
|---|---|
| Weekly hours | **Weekly Hours** |
| Days/week | **Working Days per Week** |
| Contract | **Contract Type** |

### A6. Accessibility pass
- Increase contrast on grey secondary text
- Proper row/column headers on the table for screen readers
- Hover/focus states if rows are clickable
- Keyboard navigation throughout

### A7. Highlight today's row
On an employee dashboard, mark the current day, e.g. `Monday | 09:00–17:30 | Today`.

### A8. Mobile responsiveness
The table gets cramped on small screens. `[CHECK IMAGE]` — images 4 & 5 show the client's suggested mobile layout (likely a card-per-day stack instead of a table).

---

## B. PROFILE PAGE

### B1. Convert profile stats to CTAs

The **Open Tasks, Pending Approvals, Assets, Kudos** items on the profile must become clickable CTAs, not static numbers. `[CHECK IMAGE]` — image6 shows the exact strip.

### B2. ⚠️ Profile Change Request feature is broken / incomplete

Client's core finding: *"nowhere can an employee indicate or highlight what needs to be updated."* The feature as built has no way to actually raise a change. This needs a proper build-out:

**B2a. Add a "Request Profile Change" button** (`+ Request Profile Change`) that opens a form letting the employee pick what to change:
- Personal Details
- Contact Details
- Address
- Bank Details
- Emergency Contact
- Next of Kin
- National Insurance
- Tax Details
- Profile Photo

**B2b. Status indicators** — show requests in a table with Pending / Approved / Rejected states, not just "No change requests." `[CHECK IMAGE]` — image8 shows the table design.

**B2c. Request history** — show Pending, Approved *and* Rejected. Employees want to know "Did HR approve my address change?"

**B2d. Better empty state** — replace "No change requests." with **"You haven't submitted any profile change requests."** or **"Your personal information is up to date."**

### B3. Profile picture upgrade

Current "Request image change" is liked but should gain: image preview · upload progress · cropping · rotate · file-type validation · max file size · approval workflow. If HR approval is required, show **"Pending approval"** rather than swapping the photo immediately. `[CHECK IMAGE]` — image9.

### B4. Tab change-indicators
Show a badge on tabs with pending changes, e.g. `Contact (1)`, `Profile Change Requests (2)`.

### B5. Timestamps
Add: Submitted date · Last updated · Approved by (e.g. "HR Team").

### B6. Confirmation workflow / progress indicator
Once submitted, show progress: Request received → Awaiting HR review → Approved → Profile updated.

### B7. Security requirements (client flagged as important for an HR system)
- Approval workflow before changes apply
- Audit logs of who requested and approved
- Version history
- **Mandatory reason for bank detail changes**
- Document upload support (proof of address, marriage certificate, etc.)
- Email notifications on submit / approve / reject
- Role-based permissions — employees access only their own profile

### B8. Tab accessibility
The orange selected tab needs: sufficient contrast · visible keyboard focus · tab navigation · ARIA roles on the tab list and panels · descriptive alt text on the profile image.

### B9. Minor UI polish
- Selected tab: add subtle shadow/border to make it more distinct
- Reduce empty white space below the change-request area (or fill it with recent activity / guidance)
- Make the employee photo clickable to view larger

---

## C. DASHBOARD — Leave visibility

### C1. Show leave **type** for employees on leave
Dashboard says three employees are on leave but doesn't show *what kind* of leave. Client notes this is also missing when you drill into the employee's personal details. Surface the leave type in both places. `[CHECK IMAGE]` — image10.

---

## D. EMPLOYEE PROFILE HEADER

### D1. Show Employee ID + onboarding method
Header should display the **employee ID** together with the **onboarding method** — indicating whether the employee was onboarded via:
- Manual Upload
- Bulk Upload
- Self-Onboarding (invitation link sent to the employee)

`[CHECK IMAGE]` — image11.

> Relates to round-1 §6.7 (employee ID on the meta line). This extends it with onboarding provenance.

---

## E. ⚠️ TWO BROKEN CTA REDIRECTS (bugs)

### E1. CTA redirects to wrong page (Attendance)
A CTA `[CHECK IMAGE — image12]` sends the user to the **Attendance** page instead of its intended destination. Investigate and fix the route.

### E2. CTA redirects to wrong page (Calendar)
A second CTA `[CHECK IMAGE — image13]` wrongly redirects to the **Calendar** page. Investigate and fix.

> I can't tell from the text which two CTAs these are — the identity is in images 12 and 13. Flagging for a manual look, but the fix itself is a routing bug on two buttons.

---

## F. LEAVE MANAGEMENT ADMIN CONSOLE (largest block)

This is a comprehensive review of the HR/manager leave console. Grouped by theme.

### F1. Additional dashboard metrics
Currently: Pending Requests · Currently on Leave · Approved This Month · Total Days Approved.

Add:
- Rejected Requests
- Cancelled Leave
- Upcoming Leave (next 7 / 30 days)
- Employees Returning Today
- Average Approval Time
- Department with Most Leave
- Bradford Factor Alerts (if applicable)
- Leave Cost (optional, for payroll)

### F2. "Currently on Leave" card → drill-down
Card only shows "0 Employees absent today." Clicking it should open a list. `[CHECK IMAGE]` — image15 shows what the list row should contain.

Employee info to show per person: Employee ID · Job Title · Manager · Leave Balance (on hover or expanded). Currently only name + department appear.

### F3. Request detail panel
Clicking a request should open a side panel / modal with:
- Leave reason
- Supporting documents
- Notes
- Approval history
- Approver comments
- Request creation date/time
- Last modified date

### F4. Multi-stage approval workflow
Replace the flat Pending/Approved with a visible chain:

```
Pending → Manager Review → HR Review → Approved
```

States to support: Pending · Awaiting Manager · Awaiting HR · Approved · Rejected · Cancelled.

### F5. Table enhancements
- Sort by employee / leave duration / submission date
- Export to CSV/Excel
- Pagination + adjustable rows per page
- Multi-select for bulk actions

### F6. Expanded filters
Add: Department · Leave Type · Status · Date Range · Manager · Location · Employment Type · Submitted By.

### F7. Approval Chain tab — visualise it
Show the workflow visually: `Employee → Line Manager → HR → Payroll (if applicable)`, with the current approver and any outstanding actions highlighted.

### F8. Leave Conflict Detection
When reviewing a request, show warnings like:
> ⚠ Three members of the Finance team are already on leave during these dates.
> ⚠ Approving this request would exceed the department's maximum simultaneous leave limit.

> This is the admin-side counterpart to round-1 §16.2 (Overlapping Leave Warnings). Same engine, manager-facing.

### F9. Team Calendar View
In addition to the table, a calendar showing approved leave · pending leave · public holidays · department leave.

> Overlaps round-1 §15.2 and §15.5. The calendar keeps coming up — treat it as a core requirement, not a nice-to-have.

### F10. Bulk Upload improvements
The Bulk Upload button needs: Download Template · Upload History · Validation Report · Error Summary · Successfully Imported Records.

### F11. Notifications
Notify on: leave requested · approved · rejected · cancelled · approaching · balances low.

### F12. Balances tab
`[CHECK IMAGE]` — image16 shows what the client wants added to the Balances tab.

### F13. Policies tab — policy integration
The Policies tab should provide: leave eligibility · carry-over rules · notice periods · attachment requirements · public holiday rules · links to policy documents.

> Overlaps round-1 §15.6 (leave policy tooltips). Same intent, fuller scope here.

### F14. Minor observations
- "Approved This Month" must dynamically reflect the current month (e.g. auto-update to "Requests approved in July")
- Show active filter count near the Filters button, e.g. "Filters (2)"
- Action menu (⋯) should expose: View · Approve · Reject · Edit (where permitted) · Cancel · View History
- Large gap between search bar and request table — fill with active filter chips or summary info

### F15. Suggested additional KPI cards (consolidated)
Pending Requests · Approved This Month · Currently on Leave · Upcoming Leave (Next 7 Days) · Rejected Requests · Employees Returning Today.

---

## G. EMPLOYEE PROFILE — Org Structure

### G1. Department Structure / organogram
Add a **Department Structure** section to the employee profile showing the org hierarchy for that employee's department: department head → team managers → team leads → employees. Lets users see the reporting structure and where the employee sits. `[CHECK IMAGE]` — image17.

### G2. Team Members widget
Display colleagues within the same department.

---

## Blockers & Bugs (pull-out)

| Ref | Issue | Type |
|---|---|---|
| **A1** | Weekly hours (37.5) don't match daily hours (8.5×5=42.5) | Calculation / data bug — client's top priority |
| **B2** | Profile Change Request feature has no way to raise a change | Broken feature |
| **E1** | CTA wrongly redirects to Attendance | Routing bug |
| **E2** | CTA wrongly redirects to Calendar | Routing bug |

---

## Overlaps with Round 1 (don't double-count)

| Round 2 | Round 1 | Note |
|---|---|---|
| A4 Holiday cards | §13.4 Holiday Allowance | Same gap |
| C1 Leave type visibility | §16 Smart Leave / dashboard | Related |
| D1 Employee ID in header | §6.7 ID on meta line | D1 adds onboarding method |
| F8 Conflict detection | §16.2 Overlap warnings | Same engine, admin-facing |
| F9 / F12 / F13 Calendar & policies | §15.2, §15.5, §15.6 | Calendar + policy integration recur |

The recurring themes across both rounds: **a calendar view of leave**, **multi-stage approval workflows**, **conflict/coverage detection**, and **getting the maths right** (attendance rate, then weekly hours). Those four are the backbone of what the client actually wants.

---

## Items Needing a Manual Look (images unreadable this session)

| Image | Likely content | Priority |
|---|---|---|
| 12, 13 | The two mis-routing CTAs (E1/E2) — need to know *which* buttons | High — can't fix the bug without them |
| 2 | Preferred break-line format (A2) | Low — text is clear enough |
| 3 | Simplified weekend row (A3) | Low |
| 4, 5 | Mobile layout for work-pattern table (A8) | Medium |
| 8 | Change-request table design (B2b) | Medium |
| 9 | Profile picture workflow (B3) | Low |
| 15 | "Currently on leave" list row contents (F2) | Low — text lists the fields |
| 16 | Balances tab additions (F12) | Medium |
| 17 | Department organogram design (G1) | Medium |
| 1, 6, 7, 10, 11, 14 | Illustrations of points already written out in full | Low |

Only images 12 and 13 are genuinely blocking — everything else is described well enough in the prose to build from.
