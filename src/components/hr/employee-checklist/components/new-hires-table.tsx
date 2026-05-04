"use client";

import { Users } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { cn } from "@/src/lib/utils";
import {
  NEW_HIRE_STATUS_LABELS,
  NEW_HIRE_STATUS_STYLES,
  formatDate,
} from "../data";
import type { NewHire } from "../types";

interface NewHiresTableProps {
  hires: NewHire[];
}

export function NewHiresTable({ hires }: NewHiresTableProps) {
  if (hires.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No new hires at the moment
          </p>
          <p className="text-xs text-muted-foreground">
            New hires will appear here once they are added to the system.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  New Hire
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Job Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Start Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Progress
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {hires.map((hire, idx) => {
                const pct = Math.round(
                  (hire.completedItems / hire.totalItems) * 100,
                );
                return (
                  <tr
                    key={hire.id}
                    className={cn(
                      "hover:bg-muted/40 transition-colors",
                      idx !== hires.length - 1 && "border-b border-border",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {hire.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {hire.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {hire.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{hire.jobTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">
                        {formatDate(hire.startDate)}
                      </p>
                    </td>
                    <td className="px-4 py-3 min-w-40">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {hire.completedItems}/{hire.totalItems}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          NEW_HIRE_STATUS_STYLES[hire.status],
                        )}
                      >
                        {NEW_HIRE_STATUS_LABELS[hire.status]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
