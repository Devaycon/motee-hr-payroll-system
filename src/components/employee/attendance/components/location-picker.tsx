"use client";

import { cn } from "@/src/lib/utils";
import type { WorkLocation } from "@/src/lib/types/attendance";
import { LOCATION_CONFIG } from "./constants";

export interface LocationChoice {
  location: WorkLocation;
  locationName?: string;
}

interface LocationPickerProps {
  choice: LocationChoice;
  onChange: (choice: LocationChoice) => void;
  disabled?: boolean;
}

/** Where the employee is working from: office, remote, or a client site. */
export function LocationPicker({
  choice,
  onChange,
  disabled,
}: LocationPickerProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-medium text-foreground">Work location</p>

      <div className="flex gap-2">
        {(Object.keys(LOCATION_CONFIG) as WorkLocation[]).map((loc) => {
          const cfg = LOCATION_CONFIG[loc];
          const Icon = cfg.icon;
          const active = choice.location === loc;
          return (
            <button
              key={loc}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ location: loc, locationName: cfg.label })}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-semibold transition-all disabled:opacity-60",
                active
                  ? "border-[#7F77DD] bg-[#7F77DD]/10 text-[#7F77DD]"
                  : "border-border text-muted-foreground hover:border-[#7F77DD]/40",
              )}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
