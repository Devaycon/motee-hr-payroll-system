"use client";

import { TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { cn } from "@/src/lib/utils";

export interface PageTabItem {
  value: string;
  label: string;
}

interface PageTabsListProps {
  tabs: PageTabItem[];
  className?: string;
}

export function PageTabsList({ tabs, className }: PageTabsListProps) {
  return (
    <TabsList className={cn("h-9", className)}>
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="text-sm px-3 data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
