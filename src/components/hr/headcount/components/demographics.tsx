"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { DemographicsItem } from "../types";

interface DemographicsCardProps {
  title: string;
  items: DemographicsItem[];
}

function DemographicsCard({ title, items }: DemographicsCardProps) {
  const maxCount = Math.max(...items.map((i) => i.count ?? 0), 1);

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground font-medium">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {item.count ?? 0} · {item.percentage ?? 0}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${((item.count ?? 0) / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface DemographicsProps {
  employmentType: DemographicsItem[];
  tenure: DemographicsItem[];
  department: DemographicsItem[];
}

export function Demographics({
  employmentType,
  tenure,
  department,
}: DemographicsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DemographicsCard title="By Employment Type" items={employmentType} />
      <DemographicsCard title="By Tenure Range" items={tenure} />
      <DemographicsCard title="By Department" items={department} />
    </div>
  );
}
