import { FileText, Clock, AlertCircle, Archive } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { HRDocument } from "../types";

interface StatCardsProps {
  documents: HRDocument[];
}

function getExpiryStatus(expiryDate?: string) {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring";
  return "valid";
}

export function StatCards({ documents }: StatCardsProps) {
  const nonArchived = documents.filter((d) => !d.isArchived);
  const total = nonArchived.length;
  const expiringSoon = nonArchived.filter(
    (d) => getExpiryStatus(d.expiryDate) === "expiring",
  ).length;
  const expired = nonArchived.filter(
    (d) => getExpiryStatus(d.expiryDate) === "expired",
  ).length;
  const archived = documents.filter((d) => d.isArchived).length;

  const cards = [
    {
      label: "Total Documents",
      value: total,
      sub: `${documents.length} including archived`,
      icon: FileText,
      iconClass: "text-slate-500 dark:text-slate-400",
      iconBg: "bg-slate-500/10",
    },
    {
      label: "Expiring Soon",
      value: expiringSoon,
      sub: "Within 30 days",
      icon: Clock,
      iconClass: "text-amber-500",
      iconBg: "bg-amber-500/10",
    },
    {
      label: "Expired",
      value: expired,
      sub: "Renewal required",
      icon: AlertCircle,
      iconClass: "text-red-500",
      iconBg: "bg-red-500/10",
    },
    {
      label: "Archived",
      value: archived,
      sub: "Stored securely",
      icon: Archive,
      iconClass: "text-muted-foreground",
      iconBg: "bg-muted",
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
