"use client";

import { useState, useMemo } from "react";
import { SendHorizonal, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { POSITIONS, STATUS_LABELS, STATUS_STYLES } from "./data";
import type { Position, NewPosition } from "./types";
import { StatCards } from "./components/stat-cards";
import { PositionsToolbar } from "./components/positions-toolbar";
import { PositionsTable } from "./components/positions-table";
import { PositionModal } from "./components/position-modal";
import { PageTabsList } from "@/src/components/shared/page-tabs";

export function RolesPage() {
  const [positions, setPositions] = useState<Position[]>(POSITIONS);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return positions.filter((p) => {
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.grade.toLowerCase().includes(q);
      const matchDept = deptFilter === "all" || p.department === deptFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [positions, search, deptFilter, statusFilter]);

  const vacantPositions = useMemo(
    () => positions.filter((p) => p.status === "vacant"),
    [positions],
  );

  function handleDelete(id: string) {
    setPositions((prev) => prev.filter((p) => p.id !== id));
    toast.success("Position deleted");
  }

  function handleEdit(position: Position) {
    setEditingPosition(position);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingPosition(null);
    setModalOpen(true);
  }

  function handleSave(data: NewPosition | Position) {
    if ("id" in data) {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === (data as Position).id ? (data as Position) : p,
        ),
      );
      toast.success("Position updated");
    } else {
      const newPosition: Position = {
        ...(data as NewPosition),
        id: `p-${Date.now()}`,
        status: (data as NewPosition).status ?? "vacant",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setPositions((prev) => [newPosition, ...prev]);
      toast.success("Position added");
    }
  }

  function handleRaiseRequisition(position: Position) {
    toast.info(`Requisition raised for "${position.title}"`, {
      description: "This feature will open the recruitment flow.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">
          Roles & Positions
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage job positions across departments and track vacancies.
        </p>
      </div>

      <StatCards positions={positions} />

      <Tabs defaultValue="positions">
        <PageTabsList
          tabs={[
            { value: "positions", label: "All Positions" },
            { value: "vacancies", label: "Vacancy Report" },
          ]}
        />

        <TabsContent value="positions" className="mt-6 flex flex-col gap-6">
          <PositionsToolbar
            search={search}
            onSearchChange={setSearch}
            deptFilter={deptFilter}
            onDeptFilterChange={setDeptFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAdd={handleAdd}
          />
          <PositionsTable
            positions={filtered}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRaiseRequisition={handleRaiseRequisition}
          />
        </TabsContent>

        <TabsContent value="vacancies" className="mt-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-foreground">
              Vacancy Report
            </p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {vacantPositions.length} open position
            {vacantPositions.length !== 1 ? "s" : ""} currently requiring
            attention
          </p>

          {vacantPositions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 gap-2">
                <p className="text-sm font-medium text-foreground">
                  No vacancies
                </p>
                <p className="text-xs text-muted-foreground">
                  All positions are currently filled.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                          Position Title
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                          Department
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                          Grade / Level
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacantPositions.map((position) => (
                        <tr
                          key={position.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground text-sm">
                              {position.title}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                              {position.department}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                              {position.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                STATUS_STYLES[position.status],
                              )}
                            >
                              {STATUS_LABELS[position.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
                              onClick={() => handleRaiseRequisition(position)}
                            >
                              <SendHorizonal className="w-3 h-3" />
                              Raise Requisition
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <PositionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPosition(null);
        }}
        editingPosition={editingPosition}
        onSave={handleSave}
      />
    </div>
  );
}
