"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { EMPLOYEES} from "./components/data";
import type { EmployeeRow } from "./components/data";
import { DirectoryStatCards } from "./components/stat-cards";
// import { CelebrationsBanner } from "./components/celebrations-banner";
import { DirectoryTab } from "./components/directory-tab";
import { OrgChartTab } from "./components/org-chart-tab";
import { EmployeeDetailModal } from "./components/employee-detail-modal";

export function EmployeeOrgChart() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

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

  // const { birthdays, anniversaries } = getThisMonthCelebrations(EMPLOYEES);

  function openDetail(emp: EmployeeRow) {
    setSelectedEmployee(emp);
    setDetailOpen(true);
  }

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

      <DirectoryStatCards />

      {/* <CelebrationsBanner
        birthdays={birthdays}
        anniversaries={anniversaries}
        onSelectEmployee={openDetail}
      /> */}

      <Tabs defaultValue="directory">
        <PageTabsList
          tabs={[
            { value: "directory", label: "Directory" },
            { value: "org-chart", label: "Org Chart" },
          ]}
        />

        <TabsContent value="directory" className="mt-5">
          <DirectoryTab
            filtered={filtered}
            search={search}
            deptFilter={deptFilter}
            setSearch={setSearch}
            setDeptFilter={setDeptFilter}
            onSelect={openDetail}
          />
        </TabsContent>

        <TabsContent value="org-chart" className="mt-5">
          <OrgChartTab />
        </TabsContent>
      </Tabs>

      <EmployeeDetailModal
        open={detailOpen}
        employee={selectedEmployee}
        onClose={setDetailOpen}
      />
    </div>
  );
}
