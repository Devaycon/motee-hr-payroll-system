"use client";

import { ShieldCheck, Monitor, LogOut } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";

const SESSIONS = [
  {
    id: "s-001",
    device: "Chrome · macOS",
    location: "Lagos, Nigeria",
    lastActive: "Now",
    current: true,
  },
  {
    id: "s-002",
    device: "Safari · iPhone",
    location: "Lagos, Nigeria",
    lastActive: "2 hours ago",
    current: false,
  },
];

export function SecurityOverview() {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#7F77DD]" />
          Security &amp; Sessions
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 pb-4 pt-3">
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-start gap-2 py-1 border-b border-border/50">
            <span className="text-xs text-muted-foreground w-28 shrink-0">
              Last login:
            </span>
            <span className="text-xs text-foreground font-medium">
              Apr 23, 2026 · 8:48 AM
            </span>
          </div>
          <div className="flex items-start gap-2 py-1">
            <span className="text-xs text-muted-foreground w-28 shrink-0">
              Two-factor auth:
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600"
            >
              Not enabled
            </Badge>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground font-medium mb-2">
          Active sessions
        </p>
        <div className="flex flex-col gap-2">
          {SESSIONS.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0">
                  <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-foreground font-medium">
                    {s.device}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.location} · {s.lastActive}
                  </p>
                </div>
              </div>
              {s.current ? (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#1D9E75]"
                >
                  Current
                </Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
