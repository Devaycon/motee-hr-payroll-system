import { Package2, UserCheck, CheckCircle2, Wrench } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { Asset } from "../types";

interface StatCardsProps {
  assets: Asset[];
}

export function StatCards({ assets }: StatCardsProps) {
  const total = assets.length;
  const assigned = assets.filter((a) => a.status === "assigned").length;
  const available = assets.filter((a) => a.status === "available").length;
  const underMaintenance = assets.filter(
    (a) => a.status === "under_maintenance",
  ).length;
  const decommissioned = assets.filter(
    (a) => a.status === "decommissioned",
  ).length;

  const cards = [
    {
      label: "Total Assets",
      value: total,
      sub: `${decommissioned} decommissioned`,
      icon: Package2,
      iconClass: "text-slate-500 dark:text-slate-400",
      iconBg: "bg-slate-500/10",
    },
    {
      label: "Assigned",
      value: assigned,
      sub: "Currently in use",
      icon: UserCheck,
      iconClass: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Available",
      value: available,
      sub: "Ready for assignment",
      icon: CheckCircle2,
      iconClass: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Under Maintenance",
      value: underMaintenance,
      sub: "Awaiting servicing",
      icon: Wrench,
      iconClass: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </div>
              <div className={`rounded-lg p-2.5 ${card.iconBg}`}>
                <card.icon className={`size-5 ${card.iconClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
