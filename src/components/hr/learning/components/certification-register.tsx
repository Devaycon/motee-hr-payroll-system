"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { EmployeeLink, employeeProfileHref } from "@/src/components/shared/employee-link";
import { CertStatusBadge } from "@/src/components/shared/cert-status-badge";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  CERT_CATEGORY_LABELS,
  daysToExpiry,
  type CertificationRecord,
} from "@/src/lib/certifications/status";
import type { LearningPerson } from "../hooks";

/** The slice the compliance cards drill into. */
export type RegisterFilter =
  | "all"
  | "valid"
  | "expiring_30"
  | "expiring_90"
  | "expired";

export const REGISTER_FILTER_LABELS: Record<RegisterFilter, string> = {
  all: "All statuses",
  valid: "Active (not expired)",
  expiring_30: "Expiring in 30 days",
  expiring_90: "Expiring in 90 days",
  expired: "Expired",
};

export function matchesRegisterFilter(
  c: Pick<CertificationRecord, "expiresAt">,
  filter: RegisterFilter,
): boolean {
  if (filter === "all") return true;
  const d = daysToExpiry(c.expiresAt);
  if (filter === "expired") return d != null && d < 0;
  if (filter === "valid") return d == null || d >= 0;
  if (filter === "expiring_30") return d != null && d >= 0 && d <= 30;
  return d != null && d >= 0 && d <= 90;
}

interface RegisterRow extends CertificationRecord {
  person?: LearningPerson;
}

interface CertificationRegisterProps {
  certifications: CertificationRecord[];
  people: LearningPerson[];
  statusFilter: RegisterFilter;
  onStatusFilterChange: (f: RegisterFilter) => void;
}

/**
 * Every credential held across the organisation — professional certifications
 * (PMP, ACCA, NEBOSH…) alongside course completion certificates — with who
 * issued it and when it lapses. Answers "which certifications need renewal
 * next month?" without opening each profile.
 */
export function CertificationRegister({
  certifications,
  people,
  statusFilter,
  onStatusFilterChange,
}: CertificationRegisterProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [kind, setKind] = useState("all");

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const rows = useMemo<RegisterRow[]>(() => {
    const q = search.trim().toLowerCase();
    return certifications
      .map((c) => ({ ...c, person: peopleById.get(c.employeeId) }))
      // Branch scope: only people in view.
      .filter((c) => c.person)
      .filter((c) => matchesRegisterFilter(c, statusFilter))
      .filter((c) => category === "all" || (c.category ?? "training") === category)
      .filter((c) => kind === "all" || (c.kind ?? "course") === kind)
      .filter(
        (c) =>
          !q ||
          [c.title, c.issuingBody, c.person?.fullName, c.credentialId, c.person?.departmentName]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q)),
      )
      .sort((a, b) => (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999"));
  }, [certifications, peopleById, statusFilter, category, kind, search]);

  const categories = useMemo(
    () => [...new Set(certifications.map((c) => c.category ?? "training"))].sort(),
    [certifications],
  );

  const columns = useMemo<ColumnDef<RegisterRow>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (r) => r.person?.fullName ?? "",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <EmployeeLink
              name={row.original.person?.fullName ?? row.original.employeeId}
              employeeId={row.original.employeeId}
              gender={row.original.person?.gender}
            />
            <p className="ml-7 text-[10px] text-muted-foreground truncate">
              {row.original.person?.departmentName}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: sortableHeader("Certification"),
        cell: ({ row }) => (
          <div className="max-w-60">
            <p className="text-xs font-medium truncate">
              {row.original.title.replace(/ - Certificate$/, "")}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {row.original.kind === "professional" ? "Professional credential" : "Course certificate"}
              {row.original.credentialId ? ` · ${row.original.credentialId}` : ""}
            </p>
          </div>
        ),
      },
      {
        id: "issuingBody",
        accessorFn: (r) => r.issuingBody ?? "",
        header: sortableHeader("Issuing Body"),
        cell: ({ row }) => (
          <span className="text-xs">{row.original.issuingBody ?? "—"}</span>
        ),
      },
      {
        id: "category",
        accessorFn: (r) => r.category ?? "training",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {CERT_CATEGORY_LABELS[row.original.category ?? "training"] ?? row.original.category}
          </span>
        ),
      },
      {
        accessorKey: "issuedAt",
        header: sortableHeader("Issue Date"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{formatDate(row.original.issuedAt)}</span>
        ),
      },
      {
        id: "expiresAt",
        accessorFn: (r) => r.expiresAt ?? "9999",
        header: sortableHeader("Expiry Date"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.expiresAt ? formatDate(row.original.expiresAt) : "No expiry"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <CertStatusBadge expiresAt={row.original.expiresAt} />,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, certification, issuing body or credential ID..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as RegisterFilter)}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(REGISTER_FILTER_LABELS) as RegisterFilter[]).map((f) => (
              <SelectItem key={f} value={f} className="text-xs">
                {REGISTER_FILTER_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">
                {CERT_CATEGORY_LABELS[c] ?? c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            <SelectItem value="professional" className="text-xs">Professional credentials</SelectItem>
            <SelectItem value="course" className="text-xs">Course certificates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        exportTitle="Certification Register"
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(employeeProfileHref(r.employeeId, "training"))}
        emptyMessage="No certifications match this view."
      />
    </div>
  );
}
