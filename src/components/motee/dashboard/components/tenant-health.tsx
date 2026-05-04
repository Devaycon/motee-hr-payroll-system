"use client";

import Link from "next/link";
import { ShieldAlert, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import { TENANT_HEALTH } from "@/src/data/motee-demo";

export function TenantHealthCard() {
  const hasIssues = TENANT_HEALTH.some((h) => h.count > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Tenant Health</CardTitle>
        </div>
        {hasIssues && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-medium">
            Attention needed
          </span>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 flex flex-col gap-1.5">
        {TENANT_HEALTH.map((item) => (
          <Link key={item.label} href={item.link}>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-colors group">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-md shrink-0",
                    item.bg,
                  )}
                >
                  <ShieldAlert className={cn("w-3.5 h-3.5", item.color)} />
                </div>
                <span className="text-xs text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", item.color)}>
                  {item.count}
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
