"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import { EMPLOYEE_PENDING_ITEMS } from "@/src/data/employee-dashboard-demo";

export function PendingItems() {
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
          <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-[#7F77DD] text-white text-[10px] font-semibold px-1">
            {EMPLOYEE_PENDING_ITEMS.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-1">
          {EMPLOYEE_PENDING_ITEMS.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <Separator className="my-2" />}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-md shrink-0",
                      item.urgent ? "bg-rose-500/10" : "bg-muted",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-3.5 h-3.5",
                        item.urgent ? "text-rose-600" : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground font-medium truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.sub}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.urgent && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 border-rose-500/30 bg-rose-500/10 text-rose-600"
                    >
                      Urgent
                    </Badge>
                  )}
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                  >
                    <Link href={item.link}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
