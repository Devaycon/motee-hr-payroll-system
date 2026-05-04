"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";

const PROFILE_FIELDS = [
  { label: "Profile photo", done: true },
  { label: "Phone number", done: true },
  { label: "Home address", done: true },
  { label: "Emergency contact", done: true },
  { label: "Bank account", done: true },
  { label: "Date of birth", done: true },
  { label: "Nationality", done: true },
  { label: "Marital status", done: false },
  { label: "National ID (NIN)", done: false },
];

export function ProfileCompleteness() {
  const completed = PROFILE_FIELDS.filter((f) => f.done).length;
  const total = PROFILE_FIELDS.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
          Profile Completeness
          <span className="text-xs font-bold text-[#7F77DD]">{pct}%</span>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 pb-4 pt-3">
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-[#7F77DD] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {PROFILE_FIELDS.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  f.done ? "bg-[#1D9E75]" : "bg-muted-foreground/30",
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  f.done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {f.label}
              </span>
            </div>
          ))}
        </div>
        {pct < 100 && (
          <p className="text-[11px] text-muted-foreground mt-3">
            Complete your profile to unlock all features.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
