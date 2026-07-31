import type { ProfileField } from "./fields";
import { currentCurrencyCode } from "@/src/lib/hooks/use-currency";
import { SICKNESS_REASON_CATEGORIES } from "@/src/lib/constants/sickness";

/** The sick-leave policy every locale bundle defines. */
const SICK_LEAVE_POLICY_ID = "LP-02";

export interface CollectionSchema {
  key: string;
  singular: string;
  /** Plural form, when {@link pluralize} would get it wrong ("feedback"). */
  plural?: string;
  idPrefix: string;
  idField?: string; // default "id"
  addable?: boolean; // default true
  /**
   * Owning system module, named in full in the override warning — required, so
   * the warning can never fall back to the singular and say "the booking
   * module". Use the module's own label, e.g. "Location Bookings".
   */
  source: string;
  fields: ProfileField[];
  /** System fields seeded on create (employee linkage, currency, defaults). */
  defaults?: (employeeId: string) => Record<string, unknown>;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Plural of a collection's `singular`, for copy that talks about the set
 * ("Leave requests are managed by…"). Only handles the shapes our singulars
 * actually take; anything irregular sets `plural` on the schema instead.
 */
export function pluralize(schema: CollectionSchema): string {
  if (schema.plural) return schema.plural;
  const s = schema.singular;
  if (/s$/i.test(s)) return s; // "kudos", "medical facts" — already plural
  if (/[^aeiou]y$/i.test(s)) return `${s.slice(0, -1)}ies`; // disciplinary
  if (/(ch|sh|x|z)$/i.test(s)) return `${s}es`;
  return `${s}s`;
}

function f(
  key: string,
  label: string,
  type: ProfileField["type"] = "text",
  options?: string[],
): ProfileField {
  return { key, label, group: "personal", type, options };
}

export const COLLECTION_SCHEMAS: Record<string, CollectionSchema> = {
  tasks: {
    key: "tasks",
    singular: "task",
    source: "Tasks",
    idPrefix: "TSK",
    fields: [
      f("title", "Title"),
      f("description", "Description", "textarea"),
      f("dueDate", "Due date", "date"),
      f("priority", "Priority", "select", ["low", "medium", "high"]),
      f("status", "Status", "select", ["todo", "in_progress", "done", "blocked"]),
      f("linkedTo", "Linked to"),
    ],
    defaults: (employeeId) => ({ assigneeId: employeeId, status: "todo", priority: "medium" }),
  },
  documents: {
    key: "documents",
    singular: "document",
    idPrefix: "DOC",
    source: "Document Management",
    fields: [
      f("name", "Name"),
      f("category", "Category", "select", [
        "identity", "right_to_work", "proof_of_address", "tax", "banking",
        "pension", "education", "employment", "medical", "reference", "photo", "dbs",
      ]),
      f("issuer", "Issuer"),
      f("status", "Status", "select", ["verified", "pending", "rejected", "expired"]),
      f("expiresAt", "Expires", "date"),
      f("fileUrl", "File URL"),
      // Normally authored through the Review dialog, which enforces that a
      // rejection carries one — editable here so a wrong reason can be fixed.
      f("rejectionReason", "Rejection reason", "textarea"),
    ],
    defaults: (employeeId) => ({ employeeId, uploadedAt: new Date().toISOString(), status: "pending", visibility: "hr_and_self" }),
  },
  disciplinaries: {
    key: "disciplinaries",
    singular: "disciplinary",
    source: "Disciplinaries",
    idPrefix: "DISC",
    fields: [
      f("date", "Date", "date"),
      f("type", "Type", "select", ["verbal_warning", "written_warning", "final_warning", "dismissal"]),
      f("reason", "Reason", "textarea"),
      f("issuedBy", "Issued by"),
      f("status", "Status", "select", ["active", "expired", "withdrawn"]),
      f("outcome", "Outcome"),
      f("documentUrl", "Document URL"),
    ],
    defaults: (employeeId) => ({ employeeId, date: today(), status: "active" }),
  },
  employeeNotes: {
    key: "employeeNotes",
    singular: "note",
    source: "Notes & Reminders",
    idPrefix: "NOTE",
    fields: [
      f("type", "Type", "select", ["note", "reminder"]),
      f("body", "Body", "textarea"),
      f("visibility", "Visibility", "select", ["hr_only", "manager_and_hr"]),
      f("remindAt", "Remind at", "date"),
    ],
    defaults: (employeeId) => ({ employeeId, createdAt: new Date().toISOString(), type: "note", pinned: false, visibility: "hr_only" }),
  },
  locationBookings: {
    key: "locationBookings",
    singular: "booking",
    source: "Location Bookings",
    idPrefix: "LB",
    fields: [
      f("locationType", "Type", "select", ["desk", "meeting_room", "parking"]),
      f("locationName", "Location"),
      f("date", "Date", "date"),
      f("startTime", "Start time"),
      f("endTime", "End time"),
      f("status", "Status", "select", ["confirmed", "cancelled"]),
      f("notes", "Notes"),
    ],
    defaults: (employeeId) => ({ employeeId, date: today(), status: "confirmed" }),
  },
  dbsChecks: {
    key: "dbsChecks",
    singular: "check",
    source: "DBS & Background Checks",
    idPrefix: "DBS",
    fields: [
      f("kind", "Kind", "select", ["dbs", "background_check"]),
      f("type", "Type"),
      f("certificateNumber", "Certificate number"),
      f("issuedDate", "Issued", "date"),
      f("expiryDate", "Expires", "date"),
      f("status", "Status", "select", ["clear", "pending", "expired"]),
    ],
    defaults: (employeeId) => ({ employeeId, status: "clear" }),
  },
  payHistory: {
    key: "payHistory",
    singular: "pay change",
    source: "Compensation",
    idPrefix: "PAY",
    fields: [
      f("effectiveDate", "Effective date", "date"),
      f("previousAmount", "Previous amount", "number"),
      f("newAmount", "New amount", "number"),
      f("changeType", "Type", "select", ["increment", "promotion", "adjustment", "bonus"]),
      f("reason", "Reason"),
      f("approvedBy", "Approved by"),
    ],
    defaults: (employeeId) => ({ employeeId, currency: currentCurrencyCode(), effectiveDate: today() }),
  },
  leaveRequests: {
    key: "leaveRequests",
    singular: "leave request",
    source: "Leave Management",
    idPrefix: "LR",
    fields: [
      f("leaveType", "Type"),
      f("startDate", "Start date", "date"),
      f("endDate", "End date", "date"),
      f("days", "Days", "number"),
      f("reason", "Reason", "textarea"),
      f("status", "Status", "select", ["pending", "approved", "rejected"]),
    ],
    defaults: (employeeId) => ({ employeeId, status: "pending" }),
  },
  /**
   * Sickness absences are leave requests against the sick-leave policy — the
   * Sickness module reads them straight back out of `leaveRequests`, which is
   * why this schema writes to that key rather than one of its own.
   *
   * `reason` is a fixed list rather than free text: the module classifies it
   * into a clinical category, and typing "off sick" would only ever land in
   * "Other". The values round-trip through `sicknessReasonCategory` unchanged.
   */
  sickness: {
    key: "leaveRequests",
    singular: "sickness absence",
    idPrefix: "SICK",
    source: "Sickness & Absence",
    fields: [
      f("startDate", "First day absent", "date"),
      f("endDate", "Last day absent", "date"),
      f("days", "Working days", "number"),
      f("reason", "Reason", "select", [...SICKNESS_REASON_CATEGORIES]),
      f("status", "Status", "select", ["approved", "pending", "rejected"]),
    ],
    defaults: (employeeId) => ({
      employeeId,
      leavePolicyId: SICK_LEAVE_POLICY_ID,
      leaveType: "Sick Leave",
      status: "approved",
      submittedAt: new Date().toISOString(),
    }),
  },
  leaveAdjustments: {
    key: "leaveAdjustments",
    singular: "adjustment",
    source: "Leave Management",
    idPrefix: "ADJ",
    fields: [
      f("policyId", "Policy"),
      f("delta", "Delta (days)", "number"),
      f("reason", "Reason"),
      f("date", "Date", "date"),
    ],
    defaults: (employeeId) => ({ employeeId, date: today() }),
  },
  "perf.goals": {
    key: "perf.goals",
    singular: "goal",
    source: "Performance",
    idPrefix: "GOAL",
    fields: [
      f("title", "Title"),
      f("type", "Type", "select", ["SMART", "OKR"]),
      f("progress", "Progress %", "number"),
      f("status", "Status", "select", ["on_track", "at_risk", "completed", "overdue"]),
      f("cycleId", "Cycle"),
    ],
    defaults: (employeeId) => ({ employeeId, progress: 0, status: "on_track" }),
  },
  "perf.reviews": {
    key: "perf.reviews",
    singular: "review",
    source: "Performance",
    idPrefix: "REV",
    fields: [
      f("cycleId", "Cycle"),
      f("selfRating", "Self rating", "number"),
      f("managerRating", "Manager rating", "number"),
      f("calibratedRating", "Calibrated rating", "number"),
      f("summary", "Summary", "textarea"),
      f("completedAt", "Completed", "date"),
    ],
    defaults: (employeeId) => ({ employeeId }),
  },
  "perf.oneOnOnes": {
    key: "perf.oneOnOnes",
    singular: "1:1 note",
    source: "Performance",
    idPrefix: "ONE",
    fields: [
      f("date", "Date", "date"),
      f("notes", "Notes", "textarea"),
    ],
    defaults: (employeeId) => ({ employeeId, date: today() }),
  },
  "perf.feedback": {
    key: "perf.feedback",
    singular: "feedback",
    plural: "Feedback entries",
    source: "Performance",
    idPrefix: "FB",
    fields: [
      f("type", "Type", "select", ["upward", "peer", "downward"]),
      f("message", "Message", "textarea"),
      f("fromEmployeeId", "From (employee id)"),
    ],
    defaults: (employeeId) => ({ toEmployeeId: employeeId, createdAt: today() }),
  },
  "learning.enrollments": {
    key: "learning.enrollments",
    singular: "enrolment",
    source: "Learning & Development",
    idPrefix: "ENR",
    fields: [
      f("courseTitle", "Course"),
      f("progress", "Progress %", "number"),
      f("status", "Status", "select", ["in_progress", "completed", "not_started"]),
      f("enrolledAt", "Enrolled", "date"),
      f("completedAt", "Completed", "date"),
    ],
    defaults: (employeeId) => ({ employeeId, progress: 0, status: "in_progress", enrolledAt: today() }),
  },
  "learning.certifications": {
    key: "learning.certifications",
    singular: "certification",
    source: "Learning & Development",
    idPrefix: "CERT",
    fields: [
      f("title", "Title"),
      f("issuedAt", "Issued", "date"),
      f("expiresAt", "Expires", "date"),
      f("certificateUrl", "Certificate URL"),
    ],
    defaults: (employeeId) => ({ employeeId, issuedAt: today() }),
  },
  kudos: {
    key: "kudos",
    singular: "kudos",
    source: "Kudos",
    idPrefix: "KUD",
    fields: [
      f("value", "Badge", "select", ["Teamwork", "Excellence", "Ownership", "Innovation"]),
      f("message", "Message", "textarea"),
      f("fromEmployeeId", "From (employee id)"),
      f("fromName", "From (name)"),
    ],
    defaults: (employeeId) => ({ toEmployeeId: employeeId, createdAt: today(), reactions: 0, visibility: "public" }),
  },
  employmentHistory: {
    key: "employmentHistory",
    singular: "history event",
    source: "Employment History",
    idPrefix: "EH",
    fields: [
      f("date", "Date", "date"),
      f("type", "Type", "select", ["hired", "role_change", "salary_change", "department_change", "promotion", "probation_passed"]),
      f("from", "From"),
      f("to", "To"),
      f("reason", "Reason"),
    ],
    defaults: (employeeId) => ({ employeeId, date: today() }),
  },
  attendance: {
    key: "attendance",
    singular: "time log",
    source: "Time Logs",
    idPrefix: "ATT",
    fields: [
      f("date", "Date", "date"),
      f("clockIn", "Clock in"),
      f("clockOut", "Clock out"),
      f("hoursWorked", "Hours", "number"),
      f("status", "Status", "select", ["present", "late", "absent", "remote"]),
      f("location", "Location"),
    ],
    defaults: (employeeId) => ({ employeeId, date: today(), status: "present" }),
  },
  assets: {
    key: "assets",
    singular: "asset",
    source: "Assigned Assets",
    idPrefix: "AST",
    fields: [
      f("assetTag", "Asset tag"),
      f("name", "Name"),
      f("category", "Category"),
      f("serialNumber", "Serial number"),
      f("value", "Value", "number"),
      f("condition", "Condition", "select", ["excellent", "good", "fair", "poor"]),
      f("status", "Status", "select", ["in_use", "returned", "maintenance"]),
      f("assignedDate", "Assigned date", "date"),
    ],
    defaults: (employeeId) => ({ assignedTo: employeeId, currency: currentCurrencyCode(), assignedDate: today(), status: "in_use" }),
  },
  grievances: {
    key: "grievances",
    singular: "grievance",
    source: "Grievances",
    idPrefix: "GRV",
    fields: [
      f("category", "Category"),
      f("severity", "Severity", "select", ["low", "medium", "high"]),
      f("status", "Status", "select", ["open", "investigating", "resolved", "closed"]),
      f("summary", "Summary", "textarea"),
      f("openedAt", "Opened", "date"),
    ],
    defaults: (employeeId) => ({ raisedBy: employeeId, openedAt: today(), status: "open" }),
  },
  medicalFacts: {
    key: "medicalFacts",
    singular: "medical facts",
    idPrefix: "MED",
    idField: "employeeId",
    addable: false,
    source: "Medical Facts",
    fields: [
      f("allergies", "Allergies (comma-separated)"),
      f("conditions", "Conditions (comma-separated)"),
      f("medications", "Medications (comma-separated)"),
      f("dietaryRequirements", "Dietary (comma-separated)"),
      f("accessibilityNeeds", "Accessibility needs"),
    ],
  },
  jobPostings: {
    key: "jobPostings",
    singular: "job posting",
    idPrefix: "JOB",
    source: "Recruitment",
    fields: [
      f("title", "Title"),
      f("location", "Location"),
      f("employmentType", "Employment type", "select", ["full_time", "part_time", "contract"]),
      f("status", "Status", "select", ["open", "closed", "on_hold"]),
      f("postedAt", "Posted", "date"),
      f("closingDate", "Closes", "date"),
    ],
    defaults: (employeeId) => ({ hiringManagerId: employeeId, status: "open", postedAt: today() }),
  },
  permissions: {
    key: "permissions",
    singular: "permission",
    idPrefix: "PERM",
    idField: "id",
    addable: false,
    source: "Access Control",
    fields: [
      f("view", "View", "boolean"),
      f("create", "Create", "boolean"),
      f("edit", "Edit", "boolean"),
      f("delete", "Delete", "boolean"),
      f("approve", "Approve", "boolean"),
    ],
  },
  recurringDeductions: {
    key: "recurringDeductions",
    singular: "recurring deduction",
    idPrefix: "RDED",
    source: "Payroll",
    fields: [
      f("label", "Label"),
      f("amount", "Amount", "number"),
      f("frequency", "Frequency", "select", ["monthly", "weekly", "quarterly", "annually"]),
      f("startDate", "Start date", "date"),
    ],
    defaults: (employeeId) => ({ employeeId, currency: currentCurrencyCode(), frequency: "monthly", startDate: today() }),
  },
  oneTimePayments: {
    key: "oneTimePayments",
    singular: "one-time payment",
    idPrefix: "OTP",
    source: "Payroll",
    fields: [
      f("label", "Label"),
      f("amount", "Amount", "number"),
      f("date", "Date", "date"),
    ],
    defaults: (employeeId) => ({ employeeId, currency: currentCurrencyCode(), date: today() }),
  },
  oneTimeDeductions: {
    key: "oneTimeDeductions",
    singular: "one-time deduction",
    idPrefix: "OTD",
    source: "Payroll",
    fields: [
      f("label", "Label"),
      f("amount", "Amount", "number"),
      f("date", "Date", "date"),
    ],
    defaults: (employeeId) => ({ employeeId, currency: currentCurrencyCode(), date: today() }),
  },
};
