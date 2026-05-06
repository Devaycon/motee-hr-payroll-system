"use client";

import Link from "next/link";
import { Activity, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { EMPLOYEE_RECENT_ACTIVITY } from "@/src/data/employee-dashboard-demo";

export function RecentActivity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground gap-1"
        >
          <Link href="/profile/my-profile">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-52 pr-2">
          <div className="flex flex-col gap-1">
            {EMPLOYEE_RECENT_ACTIVITY.map((item, idx) => (
              <div key={item.id}>
                {idx > 0 && <Separator className="my-2" />}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0 mt-0.5">
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">
                      {item.action}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
