import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import { setByPath } from "./fields";

export type EmployeeOverrides = Record<string, string>; // path -> value
export type OverridesMap = Record<string, EmployeeOverrides>; // employeeId -> overrides

/** Returns a copy of `emp` with any field overrides applied. */
export function applyEmployeeOverrides(
  emp: LocaleEmployee,
  ov?: EmployeeOverrides,
): LocaleEmployee {
  if (!ov || Object.keys(ov).length === 0) return emp;
  const clone = structuredClone(emp) as LocaleEmployee & Record<string, unknown>;
  for (const [path, value] of Object.entries(ov)) {
    setByPath(clone, path, value);
  }
  // Recompute derived name fields when first/last name changed.
  if ("firstName" in ov || "lastName" in ov) {
    clone.fullName = `${clone.firstName ?? ""} ${clone.lastName ?? ""}`.trim();
    clone.initials =
      `${clone.firstName?.[0] ?? ""}${clone.lastName?.[0] ?? ""}`.toUpperCase();
  }
  // Keep the single emergencyContact in sync with the primary array entry.
  if (Array.isArray(clone.emergencyContacts) && clone.emergencyContacts[0]) {
    clone.emergencyContact = clone.emergencyContacts[0];
  }
  return clone;
}

/** Returns a copy of the bundle with overrides applied to every employee. */
export function applyBundleOverrides(
  bundle: LocaleBundle,
  map: OverridesMap,
): LocaleBundle {
  if (!map || Object.keys(map).length === 0) return bundle;
  return {
    ...bundle,
    employees: bundle.employees.map((e) => applyEmployeeOverrides(e, map[e.id])),
  };
}
