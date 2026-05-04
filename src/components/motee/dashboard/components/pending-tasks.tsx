"use client";

import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { PENDING_TASKS } from "@/src/data/motee-demo";

export function PendingTasksCard() {
  const totalUrgent = PENDING_TASKS.filter((t) => t.urgent).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          {totalUrgent > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              {totalUrgent} urgent
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex flex-col gap-1.5">
        {PENDING_TASKS.map((task) => (
          <Link key={task.id} href={task.link}>
            <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors group">
              <div className="flex items-start gap-2.5 min-w-0">
                {task.urgent && (
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                )}
                {!task.urgent && (
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs text-foreground truncate">
                    {task.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {task.sub}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-foreground">
                  {task.count}
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
