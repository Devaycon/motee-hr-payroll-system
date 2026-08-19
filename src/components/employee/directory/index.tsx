"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import type { EmployeeRow } from "./components/data";
import { useDirectoryEmployees } from "./hooks";
import {
  DirectoryStatCards,
  matchesDirectoryCardFilter,
  DIRECTORY_CARD_FILTER_LABELS,
  type DirectoryCardFilter,
} from "./components/stat-cards";
import { Button } from "@/src/components/ui/button";
// import { CelebrationsBanner } from "./components/celebrations-banner";
import { DirectoryTab } from "./components/directory-tab";
import { OrgChartTab } from "./components/org-chart-tab";
import { EmployeeDetailModal } from "./components/employee-detail-modal";

export function EmployeeOrgChart() {
  const { data: employees } = useDirectoryEmployees();
  const allEmployees = useMemo(() => employees ?? [], [employees]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("directory");
  /** Drill-down set by the KPI cards; "all" shows everyone. */
  const [cardFilter, setCardFilter] = useState<DirectoryCardFilter>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    return allEmployees.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch =
        search === "" ||
        e.name.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.referenceId?.toLowerCase().includes(q) ?? false);
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      // The card drill-down composes with search and the department filter.
      const matchCard = matchesDirectoryCardFilter(e, cardFilter);
      return matchSearch && matchDept && matchCard;
    });
  }, [allEmployees, search, deptFilter, cardFilter]);

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

      <DirectoryStatCards
        activeTab={activeTab}
        deptFilter={deptFilter}
        cardFilter={cardFilter}
        onDrillDown={(tab, dept, filter) => {
          setActiveTab(tab);
          setDeptFilter(dept);
          setCardFilter(filter);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {DIRECTORY_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">({filtered.length})</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← Everyone
          </Button>
        </div>
      )}

      {/* <CelebrationsBanner
        birthdays={birthdays}
        anniversaries={anniversaries}
        onSelectEmployee={openDetail}
      /> */}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "directory", label: `Directory (${filtered.length})` },
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
