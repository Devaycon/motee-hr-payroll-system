"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useState } from "react";
import { PartyPopper, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { CELEBRATION_KIND_CONFIG } from "../data";
import type { CelebrationEntry, CelebrationKind } from "../types";

interface CelebrationsProps {
  celebrations: CelebrationEntry[];
}

const KIND_OPTIONS: { value: CelebrationKind | "all"; label: string }[] = [
  { value: "all", label: "All Celebrations" },
  { value: "birthday", label: "Birthdays" },
  { value: "anniversary", label: "Work Anniversaries" },
  { value: "new_hire", label: "New Hires" },
  { value: "promotion", label: "Promotions" },
];

export function Celebrations({ celebrations }: CelebrationsProps) {
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [congratulated, setCongratulated] = useState<Set<string>>(new Set());

  const filtered = celebrations.filter(
    (c) => kindFilter === "all" || c.kind === kindFilter,
  );

  function handleCongratulate(id: string, name: string) {
    const updated = new Set(congratulated);
    updated.add(id);
    setCongratulated(updated);
    toast.success(`Congratulations sent to ${name}!`);
  }

  const thisMonth = filtered.filter((c) => c.date.startsWith("2026-04"));
  const upcoming = filtered.filter((c) => !c.date.startsWith("2026-04"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Celebrating your team this month and beyond.
        </p>
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-52">
            <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Celebrations" />
          </SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {thisMonth.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <PartyPopper className="h-4 w-4 text-amber-500" />
            This Month (April 2026)
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {thisMonth.map((entry) => (
              <CelebrationCard
                key={entry.id}
                entry={entry}
                congratulated={congratulated.has(entry.id)}
                onCongratulate={() =>
                  handleCongratulate(entry.id, entry.personName)
                }
              />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Upcoming</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((entry) => (
              <CelebrationCard
                key={entry.id}
                entry={entry}
                congratulated={congratulated.has(entry.id)}
                onCongratulate={() =>
                  handleCongratulate(entry.id, entry.personName)
                }
              />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted py-16 text-center">
          <PartyPopper className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            No celebrations found
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Try changing the filter
          </p>
        </div>
      )}
    </div>
  );
}

interface CelebrationCardProps {
  entry: CelebrationEntry;
  congratulated: boolean;
  onCongratulate: () => void;
}

function CelebrationCard({
  entry,
  congratulated,
  onCongratulate,
}: CelebrationCardProps) {
  const cfg = CELEBRATION_KIND_CONFIG[entry.kind];

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-5 ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-sm font-bold text-foreground shadow-sm">
          {entry.personInitials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {entry.personName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {entry.jobTitle}
          </p>
        </div>
        <span className="ml-auto text-2xl">{cfg.emoji}</span>
      </div>

      <div>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}
        >
          {cfg.label}
        </span>
        <p className="mt-1.5 text-xs text-foreground leading-relaxed">
          {entry.detail}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {entry.department} · {formatDate(entry.date)}
        </p>
      </div>

      <Button
        size="sm"
        variant="outline"
        disabled={congratulated}
        onClick={onCongratulate}
        className="mt-auto w-full"
      >
        {congratulated ? "Congratulated! 🎉" : "Send Congratulations"}
      </Button>
    </div>
  );
}
