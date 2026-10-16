"use client";

import { SelectItem } from "@/src/components/ui/select";
import { useDepartments } from "@/src/components/hr/departments/hooks";

/**
 * The departments created under Organisation › Departments, as select items.
 * The value is the department name — the onboarding hooks resolve it to the
 * department id when the record is sent.
 */
export function DepartmentSelectItems({ className }: { className?: string }) {
  const { data, loading } = useDepartments();
  const departments = (data ?? []).filter((d) => d.status !== "inactive");

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        Loading departments…
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        No departments yet. Create one under Departments first.
      </div>
    );
  }

  return (
    <>
      {departments.map((d) => (
        <SelectItem key={d.id} value={d.name} className={className}>
          {d.name}
        </SelectItem>
      ))}
    </>
  );
}
