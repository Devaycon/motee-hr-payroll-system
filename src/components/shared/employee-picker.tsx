"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
// Unscoped: you can name anyone in the company as a manager, approver or
// recipient, whichever branch the view is currently narrowed to.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { cn } from "@/src/lib/utils";
import type { LocaleBundle } from "@/src/lib/types/locale";

export interface PickedEmployee {
  id: string;
  /** HR-facing staff number ("Employee ID"); `id` is the System ID. */
  employeeNumber?: string;
  name: string;
  initials: string;
  department: string;
  jobTitle: string;
}

interface EmployeePickerProps {
  /** Currently selected employee id, or undefined when nothing is picked. */
  value?: string;
  onChange: (employee: PickedEmployee | null) => void;
  /** Ids to leave out — e.g. the requester themselves. */
  excludeIds?: string[];
  /**
   * Department to surface first. Colleagues elsewhere remain searchable, since
   * the client has not yet confirmed whether cover must be same-team (§3.1).
   */
  preferDepartment?: string;
  placeholder?: string;
  /** Set when the picker is rendered inside a modal that already traps focus. */
  className?: string;
  disabled?: boolean;
}

/**
 * Searchable single-employee picker, backed by the locale bundle.
 *
 * Built on the Popover + cmdk Command primitives already in the project rather
 * than repeating the hand-rolled search lists in the learning, departments and
 * offboarding modals.
 */
export function EmployeePicker({
  value,
  onChange,
  excludeIds = [],
  preferDepartment,
  placeholder = "Search for a colleague…",
  className,
  disabled,
}: EmployeePickerProps) {
  const [open, setOpen] = useState(false);
  const { data: bundle } = useLocaleSection<LocaleBundle>((b) => b);

  const employees = useMemo<PickedEmployee[]>(() => {
    const excluded = new Set(excludeIds);
    const rows = (bundle?.employees ?? [])
      .filter((e) => !excluded.has(e.id))
      .map((e) => ({
        id: e.id,
        employeeNumber: e.employeeNumber,
        name: e.fullName,
        initials: e.initials,
        department: e.departmentName,
        jobTitle: e.jobTitle,
      }));
    if (!preferDepartment) return rows;
    // Same-department colleagues first — they are the likely cover.
    return [
      ...rows.filter((e) => e.department === preferDepartment),
      ...rows.filter((e) => e.department !== preferDepartment),
    ];
  }, [bundle, excludeIds, preferDepartment]);

  const selected = employees.find((e) => e.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("flex items-center gap-1.5", className)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="flex-1 justify-between font-normal h-9"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <PersonAvatar
                  name={selected.name}
                  initials={selected.initials}
                  className="size-5 shrink-0"
                  fallbackClassName="bg-primary/10 text-primary text-[9px] font-semibold"
                />
                <span className="truncate">{selected.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {selected && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground"
            onClick={() => onChange(null)}
            aria-label="Clear selection"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name, ID or department…" />
          <CommandList className="max-h-64">
            <CommandEmpty>No colleague found.</CommandEmpty>
            <CommandGroup>
              {employees.map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.name} ${e.department} ${e.jobTitle} ${e.employeeNumber ?? ""} ${e.id}`}
                  onSelect={() => {
                    onChange(e.id === value ? null : e);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <PersonAvatar
                    name={e.name}
                    initials={e.initials}
                    className="size-6 shrink-0"
                    fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">{e.name}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {e.employeeNumber ? `${e.employeeNumber} · ` : ""}
                      {e.jobTitle} · {e.department}
                    </span>
                  </span>
                  <Check
                    className={cn(
                      "ml-auto size-3.5",
                      e.id === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
