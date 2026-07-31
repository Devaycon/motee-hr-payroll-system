import type { ChangeRequest } from "@/src/lib/types/profile-edits";

/**
 * Demo profile change requests, so the Profile Change Log has a history to show
 * instead of an empty state on a fresh session.
 *
 * Deterministic per employee — the same person always gets the same log, and
 * seeding twice can't duplicate rows (see `seedRequests`). Real requests raised
 * in the app are appended alongside these.
 *
 * The set deliberately covers all three outcomes, and both routes a request can
 * arrive by (raised by the employee, raised by HR on their behalf), because
 * that is what the detail view has to be able to explain.
 */

interface Template {
  field: string;
  label: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  status: ChangeRequest["status"];
  /** Days before "now" the request was raised. */
  raisedDaysAgo: number;
  /** Days after it was raised that it was decided. */
  decidedAfterDays?: number;
  decisionNote?: string;
  /** True when HR raised it for the employee rather than the employee. */
  byHr?: boolean;
}

const TEMPLATES: Template[] = [
  {
    field: "bankDetails.accountNumber",
    label: "Bank account number",
    currentValue: "•••• 4471",
    requestedValue: "•••• 9928",
    reason:
      "I've switched banks and closed the old account — payroll needs to go to the new one from next month.",
    status: "approved",
    raisedDaysAgo: 96,
    decidedAfterDays: 3,
    decisionNote:
      "Verified against the bank confirmation letter on file and confirmed by phone before releasing.",
  },
  {
    field: "addresses.home.line1",
    label: "Home address line 1",
    currentValue: "14 Elmwood Court",
    requestedValue: "3 Kingsley Terrace",
    reason: "Moved house at the end of last month.",
    status: "approved",
    raisedDaysAgo: 61,
    decidedAfterDays: 1,
  },
  {
    field: "phone",
    label: "Mobile number",
    currentValue: "+44 7700 900112",
    requestedValue: "+44 7700 900874",
    reason: "New phone contract, old number is no longer in service.",
    status: "approved",
    raisedDaysAgo: 40,
    decidedAfterDays: 2,
  },
  {
    field: "lastName",
    label: "Legal Last Name",
    currentValue: "—",
    requestedValue: "—",
    reason: "Changed my surname after getting married.",
    status: "rejected",
    raisedDaysAgo: 27,
    decidedAfterDays: 4,
    decisionNote:
      "A legal name change needs the marriage certificate attached. Please re-submit with the document and it'll go straight through.",
  },
  {
    field: "emergencyContacts.0.phone",
    label: "Emergency contact phone",
    currentValue: "+44 7700 900233",
    requestedValue: "+44 7700 900961",
    reason: "My sister changed her number.",
    status: "pending",
    raisedDaysAgo: 6,
  },
  {
    field: "workPattern.contractType",
    label: "Contract type",
    currentValue: "Full-time",
    requestedValue: "Part-time",
    reason:
      "Flexible working request approved by my manager — dropping to four days from the start of next quarter.",
    status: "pending",
    raisedDaysAgo: 2,
    byHr: true,
  },
];

/** Stable hash, so each employee gets a consistent slice of the templates. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function demoChangeRequests(
  employeeId: string,
  employeeName: string,
  hrName = "Chidinma Okeke",
): ChangeRequest[] {
  const seed = hash(employeeId);
  // Three to six entries per person, so the log doesn't look copy-pasted.
  const count = 3 + (seed % 4);
  const offset = seed % TEMPLATES.length;

  return Array.from({ length: count }, (_, i) => {
    const t = TEMPLATES[(offset + i) % TEMPLATES.length];
    const requestedAt = isoDaysAgo(t.raisedDaysAgo);
    const decided =
      t.status !== "pending" && t.decidedAfterDays != null
        ? isoDaysAgo(t.raisedDaysAgo - t.decidedAfterDays)
        : undefined;

    // The surname case only makes sense against the person's real name.
    const surname = employeeName.split(/\s+/).slice(-1)[0];
    const isNameChange = t.field === "lastName";

    return {
      id: `CR-DEMO-${employeeId}-${i}`,
      employeeId,
      field: t.field,
      label: t.label,
      currentValue: isNameChange ? surname : t.currentValue,
      requestedValue: isNameChange ? `${surname}-Adeyemi` : t.requestedValue,
      reason: t.reason,
      status: t.status,
      requestedBy: t.byHr ? hrName : employeeName,
      requestedById: t.byHr ? undefined : employeeId,
      requestedAt,
      decidedBy: decided ? hrName : undefined,
      decidedAt: decided,
      decisionNote: decided ? t.decisionNote : undefined,
    } satisfies ChangeRequest;
  });
}
