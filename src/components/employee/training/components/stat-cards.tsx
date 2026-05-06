import {
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { MyEnrollment } from "./data";

interface TrainingStatCardsProps {
  enrollments: MyEnrollment[];
}

export function TrainingStatCards({ enrollments }: TrainingStatCardsProps) {
  const now = new Date();
  const activeCourses = enrollments.filter(
    (e) => e.status === "enrolled" || e.status === "in_progress",
  );
  const completedCourses = enrollments.filter((e) => e.status === "completed");
  const overdueCourses = activeCourses.filter(
    (e) =>
      e.dueDate &&
      Math.ceil((new Date(e.dueDate).getTime() - now.getTime()) / 86400000) < 0,
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        {
          label: "Assigned",
          value: activeCourses.length,
          icon: BookOpen,
          color: "#4361ee",
        },
        {
          label: "In Progress",
          value: activeCourses.filter((e) => e.status === "in_progress").length,
          icon: TrendingUp,
          color: "#F59E0B",
        },
        {
          label: "Completed",
          value: completedCourses.length,
          icon: CheckCircle2,
          color: "#1D9E75",
        },
        {
          label: "Overdue",
          value: overdueCourses.length,
          icon: AlertTriangle,
          color: "#EF4444",
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
