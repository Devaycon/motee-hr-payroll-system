import { FileText, AlertTriangle, XCircle, FilePen } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { Contract } from "../types";

interface StatCardsProps {
  contracts: Contract[];
}

export function StatCards({ contracts }: StatCardsProps) {
  const active = contracts.filter(
    (c) => c.status === "active" && !c.isArchived,
  ).length;
  const expiringSoon = contracts.filter(
    (c) => c.status === "expiring_soon" && !c.isArchived,
  ).length;
  const expired = contracts.filter(
    (c) => c.status === "expired" && !c.isArchived,
  ).length;
  const drafts = contracts.filter(
    (c) => c.status === "draft" && !c.isArchived,
  ).length;

  const cards = [
    {
      label: "Active Contracts",
      value: active,
      sub: "Currently in force",
      icon: FileText,
      iconClass: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Expiring Soon",
      value: expiringSoon,
      sub: "Within 30 days",
      icon: AlertTriangle,
      iconClass: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
    },
    {
      label: "Expired",
      value: expired,
      sub: "Past end date",
      icon: XCircle,
      iconClass: "text-red-500 dark:text-red-400",
      iconBg: "bg-red-500/10",
    },
    {
      label: "Drafts",
      value: drafts,
      sub: "Awaiting review",
      icon: FilePen,
      iconClass: "text-slate-500 dark:text-slate-400",
      iconBg: "bg-slate-500/10",
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
