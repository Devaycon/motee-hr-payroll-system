"use client";

import { Users, Building2, GitBranch, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useDirectoryEmployees } from "../hooks";

export function DirectoryStatCards() {
  const { data: employees } = useDirectoryEmployees();
  const list = employees ?? [];
  const myDept = useAppSelector((s) => s.auth.user?.departmentName) ?? "";

  const onLeave = list.filter((e) => e.status === "on_leave").length;
  const myTeam = myDept
    ? list.filter((e) => e.department === myDept).length
    : 0;

  const cards = [
    {
      label: "Total Employees",
      value: list.length,
      icon: Users,
      color: "#4361ee",
    },
    {
      label: "Departments",
      value: new Set(list.map((e) => e.department)).size,
      icon: Building2,
      color: "#1D9E75",
    },
    {
      label: "My Team",
      value: myTeam,
      icon: GitBranch,
      color: "#F59E0B",
    },
    {
      label: "On Leave Today",
      value: onLeave,
      icon: Briefcase,
      color: "#94A3B8",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
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
  );
}
