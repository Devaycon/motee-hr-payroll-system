import type { ClearanceItem } from "@/src/lib/types/offboarding";

interface DefaultClearanceDef {
  label: string;
  department: string;
}

/** Standard offboarding clearance checklist used for every leaver. */
const DEFAULT_CLEARANCE_DEFS: DefaultClearanceDef[] = [
  { label: "Acknowledge resignation", department: "HR" },
  { label: "Handover document", department: "Employee" },
  { label: "Knowledge transfer meeting", department: "Manager" },
  { label: "Return company laptop & badge", department: "Employee" },
  { label: "Revoke system access", department: "IT" },
  { label: "Exit interview", department: "HR" },
  { label: "Final-pay processed", department: "Finance" },
];

/** Build the standard clearance items for an offboarding record. */
export function buildClearanceItems(recordId: string): ClearanceItem[] {
  return DEFAULT_CLEARANCE_DEFS.map((d, i) => ({
    id: `${recordId}-c${i + 1}`,
    label: d.label,
    department: d.department,
    completed: false,
  }));
}
