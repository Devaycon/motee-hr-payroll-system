"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { DEMO_MY_PROFILE } from "@/src/data/employee-demo";
import { formatDate } from "@/src/lib/utils/format-date";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-36 shrink-0">
        {label}:
      </span>
      <span className="text-xs text-foreground font-medium flex-1">
        {value ?? <span className="italic text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

const EMP_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

export function JobInfoCard() {
  const p = DEMO_MY_PROFILE;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-foreground">
          Employment Details
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 pb-4 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <InfoRow label="System ID" value={p.id} />
          <InfoRow label="Job title" value={p.jobTitle} />
          <InfoRow label="Department" value={p.department} />
          <InfoRow
            label="Employment type"
            value={EMP_TYPE_LABELS[p.employmentType] ?? p.employmentType}
          />
          <InfoRow label="Start date" value={formatDate(p.startDate)} />
          <InfoRow label="Work location" value="Victoria Island Office" />
          <InfoRow label="Work mode" value="Hybrid" />
          <InfoRow label="Grade" value="L4 — Senior Engineer" />
          <InfoRow label="Line manager" value="Chidinma Okeke" />
          <InfoRow label="Direct reports" value="None" />
        </div>
      </CardContent>
    </Card>
  );
}
