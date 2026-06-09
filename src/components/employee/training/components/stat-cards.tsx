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

  const stats = [
    { label: "Assigned", value: activeCourses.length },
    {
      label: "In Progress",
      value: activeCourses.filter((e) => e.status === "in_progress").length,
    },
    { label: "Completed", value: completedCourses.length },
    { label: "Overdue", value: overdueCourses.length },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="py-4">
          <CardContent className="px-4">
            <p className="text-xl font-bold text-foreground leading-none">
              {s.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {s.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
