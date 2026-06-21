"use client";

import {
  Search,
  SlidersHorizontal,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { EMPLOYMENT_TYPE_LABELS } from "../data";
import { useDepartmentOptions } from "../hooks";
import type { EmployeeRow } from "../types";
import type { ReportColumn } from "@/src/lib/reports/types";
import { exportCsv, exportXlsx, printPdf } from "@/src/lib/reports/export";

const EXPORT_COLUMNS: ReportColumn<EmployeeRow>[] = [
  { key: "name", header: "Name", value: (r) => r.name },
  { key: "email", header: "Email", value: (r) => r.email },
  { key: "phone", header: "Phone", value: (r) => r.phone ?? "" },
  { key: "department", header: "Department", value: (r) => r.department },
  { key: "jobTitle", header: "Job Title", value: (r) => r.jobTitle },
  {
    key: "employmentType",
    header: "Employment Type",
    value: (r) => EMPLOYMENT_TYPE_LABELS[r.employmentType] ?? r.employmentType,
  },
  { key: "status", header: "Status", value: (r) => r.status },
  { key: "startDate", header: "Start Date", value: (r) => r.startDate },
  { key: "managerName", header: "Line Manager", value: (r) => r.managerName ?? "—" },
  { key: "salary", header: "Salary", value: (r) => r.salary, money: true },
];

interface EmployeesToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  /** Rows to export — the currently filtered employee list. */
  exportRows: EmployeeRow[];
}

export function EmployeesToolbar({
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  exportRows,
}: EmployeesToolbarProps) {
  const { data: deptOptions } = useDepartmentOptions();
  const depts = deptOptions ?? ["all"];

  const hasActiveFilter =
    deptFilter !== "all" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="relative bg-pr flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or department..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              className="h-10 text-xs gap-1.5"
              data-active={hasActiveFilter}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilter && (
                <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold">
                  {
                    [
                      deptFilter !== "all",
                      typeFilter !== "all",
                      statusFilter !== "all",
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">
              Department
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={deptFilter}
              onValueChange={onDeptFilterChange}
            >
              {depts.map((d) => (
                <DropdownMenuRadioItem key={d} value={d} className="text-xs">
                  {d === "all" ? "All Departments" : d}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">
              Employment Type
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={typeFilter}
              onValueChange={onTypeFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Types
              </DropdownMenuRadioItem>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => (
                <DropdownMenuRadioItem key={k} value={k} className="text-xs">
                  {v}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={onStatusFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Statuses
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="active" className="text-xs">
                Active
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="on_leave" className="text-xs">
                On Leave
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="probation" className="text-xs">
                Probation
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="h-10 text-xs gap-1.5 bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">
              Export {exportRows.length} employees
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => exportCsv("employees", EXPORT_COLUMNS, exportRows)}
            >
              <FileText className="w-3.5 h-3.5" />
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => exportXlsx("employees", EXPORT_COLUMNS, exportRows)}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => printPdf("Employees", EXPORT_COLUMNS, exportRows)}
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
