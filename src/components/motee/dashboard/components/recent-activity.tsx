"use client";

import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import { RECENT_ACTIVITY } from "@/src/data/motee-demo";

export function RecentActivityCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground">Last 10 events</span>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-72 pr-1">
          <div className="flex flex-col gap-1">
            {RECENT_ACTIVITY.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0 mt-0.5">
                  <item.icon className={cn("w-3.5 h-3.5", item.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">
                    {item.message}
                  </p>
                  {item.tenant && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {item.tenant}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
