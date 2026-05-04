"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Users,
  Building2,
  GitBranch,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Cake,
  PartyPopper,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { HierarchyTree } from "@/src/components/hr/structure/components/hierarchy-tree";
import {
  HIERARCHY_NODES,
  recomputeNodes,
  DEPT_OPTIONS as STRUCT_DEPT_OPTIONS,
} from "@/src/data/structure-demo";
import {
  EMPLOYEES,
  DEPT_OPTIONS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
} from "@/src/data/employees-demo";
import type { EmployeeRow } from "@/src/lib/types/employees";

const TODAY = new Date();
const MY_DEPT = "Engineering";

function getThisMonthCelebrations(employees: EmployeeRow[]) {
  const birthdays: { emp: EmployeeRow; date: Date }[] = [];
  const anniversaries: { emp: EmployeeRow; date: Date; years: number }[] = [];

  for (const emp of employees) {
    if (emp.dateOfBirth) {
      const dob = new Date(emp.dateOfBirth);
      if (dob.getMonth() === TODAY.getMonth()) {
        birthdays.push({ emp, date: dob });
      }
    }
    if (emp.startDate) {
      const start = new Date(emp.startDate);
      if (
        start.getMonth() === TODAY.getMonth() &&
        start.getFullYear() !== TODAY.getFullYear()
      ) {
        anniversaries.push({
          emp,
          date: start,
          years: TODAY.getFullYear() - start.getFullYear(),
        });
      }
    }
  }

  return { birthdays, anniversaries };
}

const treeNodes = recomputeNodes(HIERARCHY_NODES);

export function EmployeeOrgChart() {
  const [activeTab, setActiveTab] = useState<"directory" | "org-chart">(
    "directory",
  );
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [treeDeptFilter, setTreeDeptFilter] = useState("all");

  const filtered = useMemo(() => {
    return EMPLOYEES.filter((e) => {
      const matchSearch =
        search === "" ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [search, deptFilter]);

  const myTeam = EMPLOYEES.filter((e) => e.department === MY_DEPT);
  const { birthdays, anniversaries } = getThisMonthCelebrations(EMPLOYEES);
  const onLeave = EMPLOYEES.filter((e) => e.status === "on_leave");

  function openDetail(emp: EmployeeRow) {
    setSelectedEmployee(emp);
    setDetailOpen(true);
  }

  const depts = DEPT_OPTIONS.filter((d) => d !== "all");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Company Directory & Org Chart
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Find colleagues, explore teams, and navigate the organisation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Employees",
            value: EMPLOYEES.length,
            icon: Users,
            color: "#7F77DD",
          },
          {
            label: "Departments",
            value: new Set(EMPLOYEES.map((e) => e.department)).size,
            icon: Building2,
            color: "#1D9E75",
          },
          {
            label: "My Team",
            value: myTeam.length,
            icon: GitBranch,
            color: "#F59E0B",
          },
          {
            label: "On Leave Today",
            value: onLeave.length,
            icon: Briefcase,
            color: "#94A3B8",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(birthdays.length > 0 || anniversaries.length > 0) && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-foreground">
                Celebrations This Month
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {birthdays.map(({ emp }) => (
                <button
                  key={`b-${emp.id}`}
                  onClick={() => openDetail(emp)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs hover:shadow-sm transition"
                >
                  <Cake className="w-3 h-3 text-amber-500" />
                  <span className="font-medium text-foreground">
                    {emp.name}
                  </span>
                  <span className="text-muted-foreground">Birthday</span>
                </button>
              ))}
              {anniversaries.map(({ emp, years }) => (
                <button
                  key={`a-${emp.id}`}
                  onClick={() => openDetail(emp)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-xs hover:shadow-sm transition"
                >
                  <PartyPopper className="w-3 h-3 text-[#7F77DD]" />
                  <span className="font-medium text-foreground">
                    {emp.name}
                  </span>
                  <span className="text-muted-foreground">
                    {years}yr Anniversary
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border-b border-border">
        <div className="flex gap-6">
          {(
            [
              { key: "directory", label: "Directory" },
              { key: "org-chart", label: "Org Chart" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-[#7F77DD] text-[#7F77DD]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, title, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-3.5 h-3.5 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {depts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No employees match your search.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((emp) => (
                <Card
                  key={emp.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openDetail(emp)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-11 h-11 shrink-0">
                        <AvatarFallback
                          className="text-sm font-semibold text-white"
                          style={{ backgroundColor: "#7F77DD" }}
                        >
                          {emp.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-semibold text-foreground leading-snug truncate">
                            {emp.name}
                          </p>
                          {emp.status === "on_leave" && (
                            <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                              On Leave
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {emp.jobTitle}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {emp.department}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <Badge
                            className={`text-[10px] border ${EMPLOYMENT_TYPE_STYLES[emp.employmentType]}`}
                          >
                            {EMPLOYMENT_TYPE_LABELS[emp.employmentType]}
                          </Badge>
                          {emp.workLocation && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {emp.workLocation}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "org-chart" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={treeDeptFilter} onValueChange={setTreeDeptFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="w-3.5 h-3.5 mr-2" />
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                {STRUCT_DEPT_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d === "all" ? "All Departments" : d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Use zoom controls to navigate. Click Export to print.
            </p>
          </div>
          <HierarchyTree nodes={treeNodes} deptFilter={treeDeptFilter} />
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Employee Profile</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback
                    className="text-xl font-bold text-white"
                    style={{ backgroundColor: "#7F77DD" }}
                  >
                    {selectedEmployee.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-foreground text-lg leading-snug">
                    {selectedEmployee.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.jobTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={`text-xs border ${STATUS_STYLES[selectedEmployee.status]}`}
                    >
                      {STATUS_LABELS[selectedEmployee.status]}
                    </Badge>
                    <Badge
                      className={`text-xs border ${EMPLOYMENT_TYPE_STYLES[selectedEmployee.employmentType]}`}
                    >
                      {EMPLOYMENT_TYPE_LABELS[selectedEmployee.employmentType]}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">
                    {selectedEmployee.department}
                  </p>
                </div>
                {selectedEmployee.grade && (
                  <div>
                    <p className="text-xs text-muted-foreground">Grade</p>
                    <p className="font-medium text-foreground">
                      {selectedEmployee.grade}
                    </p>
                  </div>
                )}
                {selectedEmployee.managerName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Reports To</p>
                    <p className="font-medium text-foreground">
                      {selectedEmployee.managerName}
                    </p>
                  </div>
                )}
                {selectedEmployee.workLocation && (
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium text-foreground">
                      {selectedEmployee.workLocation}
                    </p>
                  </div>
                )}
                {selectedEmployee.workMode && (
                  <div>
                    <p className="text-xs text-muted-foreground">Work Mode</p>
                    <p className="font-medium text-foreground">
                      {selectedEmployee.workMode}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedEmployee.startDate)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${selectedEmployee.email}`}
                    className="text-[#7F77DD] hover:underline truncate"
                  >
                    {selectedEmployee.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground">
                    {selectedEmployee.phone}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
