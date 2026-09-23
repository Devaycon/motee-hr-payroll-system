"use client";

import { Fragment } from "react";
import { TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { cn } from "@/src/lib/utils";

export interface PageTabItem {
  value: string;
  label: string;
  /** Draws a thin divider before this tab, to set it apart from the group before it. */
  dividerBefore?: boolean;
}

interface PageTabsListProps {
  tabs: PageTabItem[];
  className?: string;
}

export function PageTabsList({ tabs, className }: PageTabsListProps) {
  return (
    <TabsList className={cn("h-9", className)}>
      {tabs.map((tab) => (
        <Fragment key={tab.value}>
          {tab.dividerBefore && (
            <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
          )}
          <TabsTrigger
            value={tab.value}
            className="text-sm px-3 data-[state=active]:bg-[#FE8F44]! data-[state=active]:text-white! data-[state=active]:shadow-none!"
          >
            {tab.label}
          </TabsTrigger>
        </Fragment>
      ))}
    </TabsList>
  );
}
