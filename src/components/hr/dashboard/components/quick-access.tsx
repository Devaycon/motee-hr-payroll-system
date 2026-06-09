"use client";

import Link from "next/link";
import {
  Users,
  CalendarDays,
  UserRoundPlus,
  Package,
  TrendingUp,
  Clock,
  GraduationCap,
  History,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

const RECENT_MODULES = [
  { label: "Employees", link: "/organization/employees", icon: Users },
  { label: "Leave", link: "/time-payroll/leave", icon: CalendarDays },
  { label: "Recruitment", link: "/talent/recruitment", icon: UserRoundPlus },
  { label: "Assets", link: "/operations/assets", icon: Package },
  { label: "Performance", link: "/talent/performance", icon: TrendingUp },
  { label: "Attendance", link: "/time-payroll/attendance", icon: Clock },
  { label: "Training", link: "/talent/training", icon: GraduationCap },
];

export function QuickAccess() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <History className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">Quick Access</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {RECENT_MODULES.map((mod) => (
            <Link
              key={mod.label}
              href={mod.link}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <mod.icon className="w-3.5 h-3.5 shrink-0" />
              {mod.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
