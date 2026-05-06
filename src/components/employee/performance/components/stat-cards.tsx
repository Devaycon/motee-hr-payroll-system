import { Target, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";

interface PerformanceStatCardsProps {
  activeGoals: number;
  completedGoals: number;
  avgProgress: number;
  atRiskGoals: number;
}

export function PerformanceStatCards({
  activeGoals,
  completedGoals,
  avgProgress,
  atRiskGoals,
}: PerformanceStatCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        {
          label: "Active Goals",
          value: activeGoals,
          icon: Target,
          color: "#4361ee",
        },
        {
          label: "Goals Completed",
          value: completedGoals,
          icon: CheckCircle2,
          color: "#1D9E75",
        },
        {
          label: "Avg. Goal Progress",
          value: `${avgProgress}%`,
          icon: TrendingUp,
          color: "#2563EB",
        },
        {
          label: "At Risk / Overdue",
          value: atRiskGoals,
          icon: AlertCircle,
          color: "#EF4444",
        },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${s.color}18` }}
            >
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">
                {s.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {s.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

