"use client";

import { TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { cn } from "@/src/lib/utils";

export interface EmployeeTabItem {
  value: string;
  label: string;
  count?: number;
}

interface EmployeeTabsListProps {
  tabs: EmployeeTabItem[];
  className?: string;
}

export function EmployeeTabsList({ tabs, className }: EmployeeTabsListProps) {
  return (
    <TabsList className={cn("h-9", className)}>
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="text-sm px-3 data-[state=active]:bg-[#4361ee]! data-[state=active]:text-white! data-[state=active]:shadow-none!"
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 flex items-center justify-center min-w-4 h-4 rounded-full bg-white/20 text-[10px] font-semibold px-1">
              {tab.count}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
