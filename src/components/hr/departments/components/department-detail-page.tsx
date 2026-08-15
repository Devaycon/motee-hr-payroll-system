"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Building2,
  Users,
  BriefcaseBusiness,
  CircleDollarSign,
  TrendingUp,
  CalendarDays,
  Hash,
  UserRound,
  UserPlus,
  Laptop,
  MapPin,
  Clock,
  CheckCircle2,
  PauseCircle,
  AlertCircle,
  Star,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import { STATUS_STYLES, formatBudget } from "../data";
import { useDepartments } from "../hooks";
import { useEmployees } from "@/src/components/hr/employees/hooks";
import { AddEmployeeModal } from "./add-employee-modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import type { EmployeeRow } from "@/src/lib/types/employees";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";

/** Mirrors the columns on screen, so an export reads the same as the table. */
const MEMBER_EXPORT_COLUMNS: ReportColumn<EmployeeRow>[] = [
  { key: "name", header: "Name", value: (m) => m.name },
  {
    key: "referenceId",
    header: "Employee ID",
    value: (m) => m.referenceId ?? m.id,
  },
  { key: "jobTitle", header: "Role", value: (m) => m.jobTitle },
  { key: "employmentType", header: "Type", value: (m) => m.employmentType },
  { key: "status", header: "Status", value: (m) => m.status },
  { key: "workMode", header: "Work Mode", value: (m) => m.workMode ?? "—" },
  { key: "startDate", header: "Since", value: (m) => m.startDate ?? "—" },
];

const STATUS_ICONS = {
  active: CheckCircle2,
  inactive: PauseCircle,
  restructuring: AlertCircle,
};

const MEMBER_STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  on_leave: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  probation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const MEMBER_TYPE_STYLES: Record<string, string> = {
  full_time: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  part_time: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  contract: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const BUDGET_ALLOCATIONS = [
  { label: "Salaries & Benefits", percent: 72 },
  { label: "Equipment & Tools", percent: 12 },
  { label: "Travel & Logistics", percent: 6 },
  { label: "Training & Learning", percent: 5 },
  { label: "Miscellaneous", percent: 5 },
];

const ACTIVITY_BY_DEPT: Record<
  string,
  { icon: React.ElementType; text: string; date: string; type: string }[]
> = {
  Engineering: [
    {
      icon: Users,
      text: "Emeka Nwosu joined as Mobile Engineer",
      date: "Jan 15, 2026",
      type: "hire",
    },
    {
      icon: TrendingUp,
      text: "Adaeze Okonkwo promoted to Senior Software Engineer",
      date: "Nov 1, 2025",
      type: "promotion",
    },
    {
      icon: BriefcaseBusiness,
      text: "3 new open positions approved by HR",
      date: "Oct 10, 2025",
      type: "headcount",
    },
    {
      icon: Star,
      text: "Department awarded Q3 Performance Excellence",
      date: "Oct 5, 2025",
      type: "award",
    },
    {
      icon: Users,
      text: "Ngozi Obi onboarded as QA Engineer (contract)",
      date: "Aug 1, 2025",
      type: "hire",
    },
  ],
  "Human Resources": [
    {
      icon: Users,
      text: "Amaka Chukwu joined as Talent Acquisition Specialist",
      date: "Jul 15, 2025",
      type: "hire",
    },
    {
      icon: TrendingUp,
      text: "Department restructured under new HR Director",
      date: "Apr 1, 2025",
      type: "restructure",
    },
    {
      icon: BriefcaseBusiness,
      text: "1 new open position approved",
      date: "Mar 5, 2025",
      type: "headcount",
    },
  ],
  Finance: [
    {
      icon: Users,
      text: "Ifeoma Nwachukwu went on maternity leave",
      date: "Feb 3, 2026",
      type: "leave",
    },
    {
      icon: TrendingUp,
      text: "Oluwaseun Afolabi promoted to CFO",
      date: "May 1, 2024",
      type: "promotion",
    },
    {
      icon: BriefcaseBusiness,
      text: "1 open position for Senior Accountant posted",
      date: "Jan 20, 2026",
      type: "headcount",
    },
  ],
  Marketing: [
    {
      icon: Users,
      text: "Kelechi Onyekachi joined as Digital Marketing Specialist",
      date: "May 1, 2025",
      type: "hire",
    },
    {
      icon: Star,
      text: "Campaign team won Best Brand Initiative award",
      date: "Dec 12, 2025",
      type: "award",
    },
    {
      icon: BriefcaseBusiness,
      text: "Part-time designer role closed",
      date: "Nov 30, 2025",
      type: "headcount",
    },
  ],
  Operations: [
    {
      icon: Users,
      text: "Abdullahi Musa joined as Logistics Officer",
      date: "Jan 5, 2026",
      type: "hire",
    },
    {
      icon: TrendingUp,
      text: "Chiamaka Eze promoted to Project Coordinator",
      date: "Sep 10, 2025",
      type: "promotion",
    },
    {
      icon: BriefcaseBusiness,
      text: "2 open senior analyst positions approved",
      date: "Aug 22, 2025",
      type: "headcount",
    },
  ],
};

const ACTIVITY_TYPE_STYLES: Record<string, string> = {
  hire: "bg-emerald-500/10 text-emerald-600",
  promotion: "bg-primary/10 text-primary",
  headcount: "bg-blue-500/10 text-blue-600",
  award: "bg-amber-500/10 text-amber-600",
  leave: "bg-orange-500/10 text-orange-600",
  restructure: "bg-rose-500/10 text-rose-600",
};

interface DepartmentDetailPageProps {
  id: string;
}

export function DepartmentDetailPage({ id }: DepartmentDetailPageProps) {
  const router = useRouter();
  const { data: deptData } = useDepartments();
  const { data: empData } = useEmployees();

  const dept = useMemo(
    () => (deptData ?? []).find((d) => d.id === id) ?? null,
    [deptData, id],
  );

  // Members come from the active locale (switches with the Nigeria/UK selector);
  // any locally-added employees are layered on top.
  const baseMembers = useMemo(
    () =>
      empData && dept
        ? empData.filter((e) => e.department === dept.name)
        : [],
    [empData, dept],
  );
  const [addedMembers, setAddedMembers] = useState<EmployeeRow[]>([]);
  const members = useMemo(
    () => [...baseMembers, ...addedMembers],
    [baseMembers, addedMembers],
  );
  const [addEmpOpen, setAddEmpOpen] = useState(false);

  if (!deptData || !empData) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Building2 className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Department not found
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[dept.status];
  // Budget is derived from the active locale's salaries (currency-correct).
  const budgetMonthly = members.reduce((sum, m) => sum + (m.salary ?? 0), 0);
  const annualBudget = budgetMonthly * 12;
  const activeMembers = members.filter((m) => m.status === "active").length;
  const onLeave = members.filter((m) => m.status === "on_leave").length;
  const activity = ACTIVITY_BY_DEPT[dept.name] ?? [];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-muted-foreground">Departments</span>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-foreground font-medium">{dept.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {dept.name}
              </h1>
              <Badge variant="outline" className="text-xs font-mono">
                {dept.code}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 capitalize gap-1",
                  STATUS_STYLES[dept.status],
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {dept.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
              {dept.description}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 shrink-0"
          onClick={() => setAddEmpOpen(true)}
        >
          <UserPlus className="w-3.5 h-3.5" /> Add Employee
        </Button>
        <AddEmployeeModal
          open={addEmpOpen}
          onOpenChange={setAddEmpOpen}
          departmentName={dept.name}
          currentMembers={members}
          onAdd={(emps) => setAddedMembers((prev) => [...prev, ...emps])}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: "Total Members",
            value: String(dept.employeeCount),
            sub: `${activeMembers} active · ${onLeave} on leave`,
          },
          {
            icon: BriefcaseBusiness,
            label: "Open Positions",
            value: String(dept.openPositions),
            sub: dept.openPositions > 0 ? "Actively hiring" : "Fully staffed",
          },
          {
            icon: CircleDollarSign,
            label: "Monthly Budget",
            value: formatBudget(budgetMonthly),
            sub: "Operating cost",
          },
          {
            icon: TrendingUp,
            label: "Annual Projection",
            value: formatBudget(annualBudget),
            sub: "Full-year estimate",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="px-4 py-4 flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0">
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {s.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <PageTabsList
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "members", label: "Members" },
            { value: "budget", label: "Budget" },
            { value: "activity", label: "Activity" },
          ]}
        />

        <TabsContent value="overview" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <Card>
              <CardHeader className="px-5 pt-4 pb-3 flex flex-row items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-sm font-medium">
                  Department Overview
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="px-5 py-5 grid grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { icon: Hash, label: "Department Code", value: dept.code },
                  {
                    icon: CalendarDays,
                    label: "Created",
                    value: dept.createdAt,
                  },
                  {
                    icon: UserRound,
                    label: "Department Head",
                    value: dept.head ?? "Unassigned",
                  },
                  {
                    icon: Users,
                    label: "Team Size",
                    value: `${dept.employeeCount} employees`,
                  },
                  {
                    icon: BriefcaseBusiness,
                    label: "Open Positions",
                    value:
                      dept.openPositions > 0
                        ? `${dept.openPositions} open`
                        : "None",
                  },
                  {
                    icon: CircleDollarSign,
                    label: "Monthly Budget",
                    value: formatBudget(budgetMonthly ?? 0),
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0 mt-0.5">
                      <row.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        {row.label}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {row.value}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                    <Laptop className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    Work Mode
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="px-4 py-4 flex flex-col gap-3">
                  {[
                    {
                      label: "At Office",
                      count: Math.round(
                        members.filter((m) => m.workMode === "At Office")
                          .length || Math.round(dept.employeeCount * 0.5),
                      ),
                    },
                    {
                      label: "Hybrid",
                      count: Math.round(
                        members.filter((m) => m.workMode === "Hybrid").length ||
                          Math.round(dept.employeeCount * 0.35),
                      ),
                    },
                    {
                      label: "Remotely",
                      count: Math.round(
                        members.filter((m) => m.workMode === "Remotely")
                          .length || Math.round(dept.employeeCount * 0.15),
                      ),
                    },
                  ].map((wm) => {
                    const pct =
                      dept.employeeCount > 0
                        ? Math.round((wm.count / dept.employeeCount) * 100)
                        : 0;
                    return (
                      <div key={wm.label} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-foreground">
                            {wm.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {wm.count} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    Headcount Snapshot
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="px-4 py-4 flex flex-col gap-2">
                  {[
                    {
                      label: "Active",
                      value: activeMembers,
                      color: "text-emerald-600",
                    },
                    {
                      label: "On Leave",
                      value: onLeave,
                      color: "text-amber-600",
                    },
                    {
                      label: "Probation",
                      value: members.filter((m) => m.status === "probation")
                        .length,
                      color: "text-blue-600",
                    },
                    {
                      label: "Open Roles",
                      value: dept.openPositions,
                      color: "text-primary",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground">
                        {row.label}
                      </span>
                      <span className={cn("text-sm font-bold", row.color)}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-5">
          <Card>
            <CardHeader className="px-5 pt-4 pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {members.length} members
                </span>
                <ExportMenu
                  name={`${dept.code.toLowerCase()}-team-members`}
                  title={`${dept.name} — Team Members`}
                  columns={MEMBER_EXPORT_COLUMNS}
                  rows={members}
                  variant="outline"
                  buttonClassName="h-8 text-xs"
                />
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">
                  No employee records linked to this department.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                        Employee ID
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                        Role
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                        Work Mode
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                        Since
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => (
                      <tr
                        key={m.id}
                        className={cn(
                          "hover:bg-muted/40 transition-colors",
                          idx !== members.length - 1 &&
                            "border-b border-border",
                        )}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <PersonAvatar
                              name={m.name}
                              initials={m.initials}
                              gender={m.gender}
                              className="size-7 shrink-0"
                              fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {m.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {m.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs text-foreground">
                            {m.referenceId ?? "—"}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {m.id}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs text-foreground">
                            {m.jobTitle}
                          </p>
                          {m.managerName && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Reports to {m.managerName}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 capitalize",
                              MEMBER_TYPE_STYLES[m.employmentType],
                            )}
                          >
                            {m.employmentType.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 capitalize",
                              MEMBER_STATUS_STYLES[m.status],
                            )}
                          >
                            {m.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-muted-foreground">
                            {m.workMode ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(m.startDate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <Card>
              <CardHeader className="px-5 pt-4 pb-3 flex flex-row items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                  <CircleDollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <CardTitle className="text-sm font-medium">
                  Budget Allocation
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="px-5 py-5 flex flex-col gap-4">
                {BUDGET_ALLOCATIONS.map((row) => {
                  const amount = Math.round(
                    ((budgetMonthly ?? 0) * row.percent) / 100,
                  );
                  return (
                    <div key={row.label} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground">
                          {row.label}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {row.percent}%
                          </span>
                          <span className="text-xs font-medium text-foreground w-28 text-right">
                            {formatBudget(amount)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    Budget Summary
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="px-4 py-4 flex flex-col gap-3">
                  {[
                    {
                      label: "Monthly Budget",
                      value: formatBudget(budgetMonthly ?? 0),
                    },
                    {
                      label: "Quarterly Budget",
                      value: formatBudget((budgetMonthly ?? 0) * 3),
                    },
                    {
                      label: "Annual Budget",
                      value: formatBudget(annualBudget),
                    },
                    {
                      label: "Per Employee/Month",
                      value: formatBudget(
                        dept.employeeCount > 0
                          ? Math.round(
                              (budgetMonthly ?? 0) / dept.employeeCount,
                            )
                          : 0,
                      ),
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    Budget Utilisation
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">YTD Used</span>
                    <span className="font-medium text-foreground">83%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary w-[83%]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Based on Jan – Apr 2026 spend
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <Card>
            <CardHeader className="px-5 pt-4 pb-3 flex flex-row items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="px-5 py-5">
              {activity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">
                  No activity recorded for this department.
                </p>
              ) : (
                <div className="flex flex-col gap-0">
                  {activity.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 pb-6 last:pb-0 relative"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                            ACTIVITY_TYPE_STYLES[item.type],
                          )}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                        </div>
                        {idx !== activity.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="pt-1.5">
                        <p className="text-sm text-foreground">{item.text}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
