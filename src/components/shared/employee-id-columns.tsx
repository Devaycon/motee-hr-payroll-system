"use client";

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { sortableHeader } from "@/src/components/shared/data-table";
import type { EmployeeIdentityIndex } from "@/src/lib/hooks/use-employee-identity";
import { cn } from "@/src/lib/utils";

/** Stable column ids — also the labels shown in the Columns visibility menu. */
export const EMPLOYEE_ID_COLUMN = "employee id";
export const SYSTEM_ID_COLUMN = "system id";

/** Hides the System ID column on first render. Spread into `initialColumnVisibility`. */
export const HIDE_SYSTEM_ID: VisibilityState = { [SYSTEM_ID_COLUMN]: false };

function IdText({
  value,
  muted,
}: {
  value?: string | null;
  muted?: boolean;
}) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  return (
    <span
      className={cn(
        "font-mono text-xs whitespace-nowrap",
        muted ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {value}
    </span>
  );
}

interface EmployeeIdColumnOptions<T> {
  /** The row's system id ("NG-EMP-0001"), when it carries one. */
  systemId?: (row: T) => string | undefined | null;
  /** The row's employee number ("NG1001"), when it already carries one. */
  employeeId?: (row: T) => string | undefined | null;
  /** Display name, used to resolve identifiers the row doesn't carry itself. */
  name?: (row: T) => string | undefined | null;
  /** Index from `useEmployeeIdentity()`, used to fill in whatever is missing. */
  identity: EmployeeIdentityIndex;
}

/**
 * The Employee ID + System ID columns, for any table whose rows represent a
 * person. Whichever identifier the row doesn't carry is resolved through the
 * identity index by system id or by name, so tables keyed only on
 * `employeeName` still get both.
 *
 * Pair with `HIDE_SYSTEM_ID` on already-wide tables — HR can toggle System ID
 * back on from the Columns menu.
 */
export function employeeIdColumns<T>({
  systemId,
  employeeId,
  name,
  identity,
}: EmployeeIdColumnOptions<T>): ColumnDef<T>[] {
  const resolveRow = (row: T) => identity.resolve(systemId?.(row) ?? name?.(row));

  const employeeIdOf = (row: T) =>
    employeeId?.(row) ?? resolveRow(row)?.employeeId ?? null;
  const systemIdOf = (row: T) =>
    systemId?.(row) ?? resolveRow(row)?.systemId ?? null;

  return [
    {
      id: EMPLOYEE_ID_COLUMN,
      accessorFn: (row: T) => employeeIdOf(row) ?? "",
      header: sortableHeader("Employee ID"),
      meta: { label: "Employee ID" },
      cell: ({ row }) => <IdText value={employeeIdOf(row.original)} />,
    },
    {
      id: SYSTEM_ID_COLUMN,
      accessorFn: (row: T) => systemIdOf(row) ?? "",
      header: sortableHeader("System ID"),
      meta: { label: "System ID" },
      cell: ({ row }) => <IdText value={systemIdOf(row.original)} muted />,
    },
  ];
}

/**
 * Both identifiers as an inline block, for the surfaces that aren't tables —
 * directory cards, detail modals, person tiles.
 */
export function EmployeeIds({
  employeeId,
  systemId,
  showSystemId = true,
  className,
}: {
  employeeId?: string | null;
  systemId?: string | null;
  showSystemId?: boolean;
  className?: string;
}) {
  if (!employeeId && !systemId) return null;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      {employeeId && (
        <span className="font-mono text-[11px] text-foreground">{employeeId}</span>
      )}
      {showSystemId && systemId && (
        <span className="font-mono text-[11px] text-muted-foreground">
          {systemId}
        </span>
      )}
    </div>
  );
}
