import { Users, Building2, GitBranch, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { EMPLOYEES, MY_TEAM_COUNT } from "./data";

export function DirectoryStatCards() {
  const onLeave = EMPLOYEES.filter((e) => e.status === "on_leave").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        {
          label: "Total Employees",
          value: EMPLOYEES.length,
          icon: Users,
          color: "#4361ee",
        },
        {
          label: "Departments",
          value: new Set(EMPLOYEES.map((e) => e.department)).size,
          icon: Building2,
          color: "#1D9E75",
        },
        {
          label: "My Team",
          value: MY_TEAM_COUNT,
          icon: GitBranch,
          color: "#F59E0B",
        },
        {
          label: "On Leave Today",
          value: onLeave,
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
  );
}
