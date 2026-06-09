"use client";

import { useMemo } from "react";
import { cn } from "@/src/lib/utils";
import {
  MODULE_GROUP_ORDER,
  type ModuleEntry,
} from "./registry";

interface Props {
  modules: ModuleEntry[];
  active: string;
  onSelect: (key: string) => void;
}

export function ModuleNav({ modules, active, onSelect }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, ModuleEntry[]>();
    for (const m of modules) {
      const arr = map.get(m.group) ?? [];
      arr.push(m);
      map.set(m.group, arr);
    }
    return MODULE_GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      items: map.get(g)!,
    }));
  }, [modules]);

  return (
    <nav className="rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10 overflow-hidden lg:h-full">
      <div className="flex flex-col gap-4 px-4 py-5 lg:h-full lg:overflow-y-auto">
        {grouped.map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-0.5">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {group}
            </p>
            {items.map((m) => {
              const Icon = m.icon;
              const isActive = m.key === active;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onSelect(m.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
