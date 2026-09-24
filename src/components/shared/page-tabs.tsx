"use client";

import { Fragment } from "react";
import { Check, ChevronDown } from "lucide-react";
import { TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";

export interface PageTabItem {
  value: string;
  label: string;
  /** Draws a thin divider before this tab, to set it apart from the group before it. */
  dividerBefore?: boolean;
  /** Small pill after the label, e.g. "Soon" for a later-phase feature. */
  badge?: string;
  /**
   * Tucks the tab into the trailing "More" dropdown instead of the tab row, so
   * pages with many tabs don't run off the screen. Needs `value` and
   * `onValueChange` on the list, since the dropdown drives the Tabs itself.
   */
  inMore?: boolean;
}

interface PageTabsListProps {
  tabs: PageTabItem[];
  className?: string;
  /** The Tabs' current value — required when any tab is `inMore`. */
  value?: string;
  /** The Tabs' change handler — required when any tab is `inMore`. */
  onValueChange?: (value: string) => void;
}

const ACTIVE_TAB =
  "data-[state=active]:bg-[#FE8F44]! data-[state=active]:text-white! data-[state=active]:shadow-none!";

function TabBadge({ badge }: { badge?: string }) {
  if (!badge) return null;
  return (
    <span className="ml-1.5 rounded-full bg-[#FE8F44]/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[#E0701F] in-data-[state=active]:bg-white/25 in-data-[state=active]:text-white">
      {badge}
    </span>
  );
}

export function PageTabsList({
  tabs,
  className,
  value,
  onValueChange,
}: PageTabsListProps) {
  const canCollapse = Boolean(onValueChange);
  const inline = canCollapse ? tabs.filter((t) => !t.inMore) : tabs;
  const more = canCollapse ? tabs.filter((t) => t.inMore) : [];
  const activeMore = more.find((t) => t.value === value);

  return (
    <TabsList className={cn("h-9", className)}>
      {inline.map((tab) => (
        <Fragment key={tab.value}>
          {tab.dividerBefore && (
            <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
          )}
          <TabsTrigger value={tab.value} className={cn("text-sm px-3", ACTIVE_TAB)}>
            {tab.label}
            <TabBadge badge={tab.badge} />
          </TabsTrigger>
        </Fragment>
      ))}

      {more.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              // Radix owns `data-state` here (open/closed), so the "a tab in
              // the dropdown is selected" look keys off its own attribute.
              data-selected={activeMore ? "true" : undefined}
              className={cn(
                "inline-flex h-[calc(100%-1px)] items-center gap-1 rounded-md px-3 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors hover:text-foreground dark:text-muted-foreground",
                "data-selected:bg-[#FE8F44] data-selected:text-white",
              )}
            >
              {activeMore ? activeMore.label : "More"}
              {activeMore?.badge && (
                <span className="ml-1 rounded-full bg-white/25 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-white">
                  {activeMore.badge}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {more.map((tab) => (
              <DropdownMenuItem
                key={tab.value}
                className="text-sm gap-2"
                onClick={() => onValueChange?.(tab.value)}
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5",
                    tab.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
                {tab.label}
                <TabBadge badge={tab.badge} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </TabsList>
  );
}
