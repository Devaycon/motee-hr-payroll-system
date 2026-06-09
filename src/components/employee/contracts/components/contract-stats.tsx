"use client";

import { Card, CardContent } from "@/src/components/ui/card";

interface ContractStatsProps {
  total: number;
  active: number;
  expiring: number;
  pending: number;
}

export function ContractStats({
  total,
  active,
  expiring,
  pending,
}: ContractStatsProps) {
  const cards = [
    { label: "Total Contracts", value: total },
    { label: "Active", value: active },
    { label: "Expiring Soon", value: expiring },
    { label: "Pending Signature", value: pending },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="py-4">
          <CardContent className="px-4">
            <p className="text-xl font-bold text-foreground leading-none">
              {card.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {card.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
