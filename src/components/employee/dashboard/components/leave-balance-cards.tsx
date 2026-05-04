"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { EMPLOYEE_LEAVE_BALANCES } from "@/src/data/employee-dashboard-demo";

export function LeaveBalanceCards() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Leave Balances</CardTitle>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground gap-1"
        >
          <Link href="/time-off/balance">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-3">
          {EMPLOYEE_LEAVE_BALANCES.map((bal) => {
            const remaining = bal.total - bal.used - bal.pending;
            const usedPct = Math.round((bal.used / bal.total) * 100);
            return (
              <div key={bal.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        bal.bgColor,
                        bal.color,
                      )}
                    >
                      {bal.type}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {remaining}
                    </span>{" "}
                    / {bal.total} days left
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#7F77DD]"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
