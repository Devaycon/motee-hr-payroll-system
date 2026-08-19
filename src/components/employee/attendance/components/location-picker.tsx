"use client";

import { useState } from "react";
import { CalendarCheck, MapPin, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import type { LocaleLocationBooking } from "@/src/lib/types/locale";
import type { WorkLocation } from "@/src/lib/types/attendance";
import { LOCATION_CONFIG } from "./constants";

export interface LocationChoice {
  location: WorkLocation;
  locationName?: string;
  bookingId?: string;
}

interface LocationPickerProps {
  choice: LocationChoice;
  bookings: LocaleLocationBooking[];
  onChange: (choice: LocationChoice) => void;
  /** Books a desk for today and returns the new booking's id. */
  onBookDesk: (name: string) => string;
  disabled?: boolean;
}

/**
 * Where the employee is working from.
 *
 * If they have a confirmed desk or room booked for today, those are offered
 * first — clocking in against the thing you actually reserved is the point of
 * having reserved it. With no booking (the common case, since bookings are made
 * ahead of time) it falls back to the plain office/remote/client-site toggle,
 * with an inline way to book a desk on the spot.
 */
export function LocationPicker({
  choice,
  bookings,
  onChange,
  onBookDesk,
  disabled,
}: LocationPickerProps) {
  const [booking, setBooking] = useState(false);
  const [deskName, setDeskName] = useState("");

  function confirmBooking() {
    const name = deskName.trim();
    if (!name) return;
    const id = onBookDesk(name);
    onChange({ location: "office", locationName: name, bookingId: id });
    setDeskName("");
    setBooking(false);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">Work location</p>
        {!booking && !disabled && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
            onClick={() => setBooking(true)}
          >
            <Plus className="w-3 h-3" /> Book a desk
          </Button>
        )}
      </div>

      {booking && (
        <div className="flex items-center gap-2 rounded-lg border border-[#7F77DD]/30 bg-[#7F77DD]/5 p-2">
          <Input
            autoFocus
            value={deskName}
            onChange={(e) => setDeskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmBooking();
              if (e.key === "Escape") setBooking(false);
            }}
            placeholder="Desk or room, e.g. Desk 14"
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            className="h-8 text-[11px] bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
            onClick={confirmBooking}
            disabled={!deskName.trim()}
          >
            Book
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => setBooking(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <CalendarCheck className="w-3 h-3" /> Booked for today
          </p>
          {bookings.map((b) => {
            const active = choice.bookingId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    location: "office",
                    locationName: b.locationName,
                    bookingId: b.id,
                  })
                }
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all disabled:opacity-60",
                  active
                    ? "border-[#7F77DD] bg-[#7F77DD]/10"
                    : "border-border hover:border-[#7F77DD]/40",
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <MapPin
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      active ? "text-[#7F77DD]" : "text-muted-foreground",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-foreground truncate">
                      {b.locationName}
                    </span>
                    <span className="block text-[10px] text-muted-foreground capitalize">
                      {b.locationType.replace("_", " ")}
                    </span>
                  </span>
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                  {b.startTime}–{b.endTime}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        {(Object.keys(LOCATION_CONFIG) as WorkLocation[]).map((loc) => {
          const cfg = LOCATION_CONFIG[loc];
          const Icon = cfg.icon;
          const active = choice.location === loc && !choice.bookingId;
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
