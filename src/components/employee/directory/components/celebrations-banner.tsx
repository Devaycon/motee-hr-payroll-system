import { Cake, PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { EmployeeRow } from "./data";

interface CelebrationsBannerProps {
  birthdays: { emp: EmployeeRow; date: Date }[];
  anniversaries: { emp: EmployeeRow; date: Date; years: number }[];
  onSelectEmployee: (emp: EmployeeRow) => void;
}

export function CelebrationsBanner({
  birthdays,
  anniversaries,
  onSelectEmployee,
}: CelebrationsBannerProps) {
  if (birthdays.length === 0 && anniversaries.length === 0) return null;

  return (
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
              onClick={() => onSelectEmployee(emp)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs hover:shadow-sm transition"
            >
              <Cake className="w-3 h-3 text-amber-500" />
              <span className="font-medium text-foreground">{emp.name}</span>
              <span className="text-muted-foreground">Birthday</span>
            </button>
          ))}
          {anniversaries.map(({ emp, years }) => (
            <button
              key={`a-${emp.id}`}
              onClick={() => onSelectEmployee(emp)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-xs hover:shadow-sm transition"
            >
              <PartyPopper className="w-3 h-3 text-[#4361ee]" />
              <span className="font-medium text-foreground">{emp.name}</span>
              <span className="text-muted-foreground">
                {years}yr Anniversary
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
