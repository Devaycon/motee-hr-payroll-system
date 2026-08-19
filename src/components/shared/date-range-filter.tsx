"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";

/**
 * A date-range filter that sits alongside the Select-based filters on a toolbar
 * rather than beside them looking like something else. Two native
 * `<input type="date">` boxes were doing the job but rendered as OS chrome —
 * different height, different type, an unstyled "dd/mm/yyyy" placeholder and a
 * platform calendar glyph — so a filter row read as three designs at once.
 *
 * Values are ISO ("YYYY-MM-DD") strings, matching how dates are stored and
 * compared everywhere else in the app; the display formatting is local.
 */

function toIso(date: Date): string {
  // Local parts, not toISOString() — that shifts to UTC and can roll a date
  // back a day for anyone behind Greenwich.
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function short(iso: string): string {
  const date = fromIso(iso);
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  /** Shown when nothing is picked. */
  placeholder?: string;
  className?: string;
}

export function DateRangeFilter({
  from,
  to,
  onChange,
  placeholder = "Any date",
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined = from
    ? { from: fromIso(from), to: fromIso(to) }
    : undefined;

  const label = from
    ? to && to !== from
      ? `${short(from)} – ${short(to)}`
      : short(from)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 justify-start gap-2 px-3 text-xs font-normal",
            !from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
          {from && (
            // A nested <button> would be invalid markup inside the trigger, so
            // the clear affordance is a span that stops the popover opening.
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date range"
              className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange({ from: "", to: "" });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange({ from: "", to: "" });
                }
              }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          defaultMonth={fromIso(from)}
          onSelect={(range) => {
            onChange({
              from: range?.from ? toIso(range.from) : "",
              to: range?.to ? toIso(range.to) : "",
            });
          }}
          autoFocus
        />
        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => onChange({ from: "", to: "" })}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
