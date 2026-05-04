"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import { EMPLOYEE_QUICK_LINKS } from "@/src/data/employee-dashboard-demo";

export function QuickLinks() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#7F77DD]/10">
            <Zap className="w-3.5 h-3.5 text-[#7F77DD]" />
          </div>
          <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {EMPLOYEE_QUICK_LINKS.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-[#7F77DD]/40 hover:bg-[#7F77DD]/5 transition-colors group"
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md",
                  item.bg,
                )}
              >
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <span className="text-[11px] text-muted-foreground text-center leading-tight group-hover:text-foreground transition-colors">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
