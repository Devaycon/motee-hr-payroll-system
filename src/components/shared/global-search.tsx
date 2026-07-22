"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/src/components/ui/command";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { routes } from "@/src/layout/hr/sidebar/routes";

/**
 * Platform-wide search (§8.1). Replaces the old placeholder search bar with a
 * working command palette spanning employees and every module page. Opens on
 * click or ⌘/Ctrl-K.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: employees } = useLocaleSection<LocaleEmployee[]>(
    (b) => b.employees,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const pages = useMemo(() => routes.filter((r) => !r.children), []);

  return (
    <>
      <button
        type="button"
        data-tutorial="search"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5 w-full text-left transition-colors hover:border-primary/40"
      >
        <Search size={14} className="text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground truncate">
          Search employees, leave, payroll, assets, documents and more.
        </span>
        <kbd className="ml-auto hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Global search"
        description="Search employees, leave, payroll, assets and documents"
      >
        <Command>
          <CommandInput placeholder="Search employees, leave, payroll, assets, documents..." />
          <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Employees">
            {(employees ?? []).map((e) => (
              <CommandItem
                key={e.id}
                value={`emp ${e.fullName} ${e.jobTitle} ${e.departmentName} ${e.employeeNumber}`}
                onSelect={() => go(`/organization/employees/${e.id}`)}
              >
                <User className="text-muted-foreground" />
                <span className="truncate">{e.fullName}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {e.jobTitle}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Pages & Modules">
            {pages.map((r) => (
              <CommandItem
                key={r.link}
                value={`page ${r.label} ${r.group}`}
                onSelect={() => go(r.link)}
              >
                {r.icon ? <r.icon className="text-muted-foreground" /> : null}
                <span className="truncate">{r.label}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {r.group}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
