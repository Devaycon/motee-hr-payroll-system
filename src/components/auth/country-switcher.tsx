"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { setCountry } from "@/src/lib/stores/locale-slice";
import type { CountryKey } from "@/src/lib/types/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

const COUNTRY_OPTIONS: { key: CountryKey; label: string; flag: string }[] = [
  {
    key: "uk",
    label: "United Kingdom",
    flag: "/united-kingdom-flag-icon.png",
  },
  {
    key: "ng",
    label: "Nigeria",
    flag: "/nigeria-flag-icon.png",
  },
];

/**
 * The flag dropdown shown on every auth screen. Shared rather than
 * copy-pasted per page — the register screen used to have its own,
 * disconnected implementation (an emoji pill wired to nothing) that quietly
 * drifted from this one.
 */
export function CountrySwitcher() {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const current = COUNTRY_OPTIONS.find((c) => c.key === country) ?? COUNTRY_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-1 cursor-pointer hover:bg-muted/70 transition-colors"
        >
          <Image
            src={current.flag}
            alt=""
            width={20}
            height={14}
            className="rounded-[3px] object-cover"
          />
          <span className="text-xs font-medium text-foreground">{current.label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {COUNTRY_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.key}
            onClick={() => dispatch(setCountry(option.key))}
            className={cn("gap-2", country === option.key && "bg-accent")}
          >
            <Image
              src={option.flag}
              alt=""
              width={20}
              height={14}
              className="rounded-[3px] object-cover"
            />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
