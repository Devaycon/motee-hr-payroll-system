"use client";

import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { TEAM_ON_LEAVE } from "@/src/data/employee-dashboard-demo";

const LEAVE_TYPE_COLORS: Record<string, string> = {
  Annual: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  Sick: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  Maternity: "border-pink-500/30 bg-pink-500/10 text-pink-600",
  Paternity: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  Compassionate: "border-amber-500/30 bg-amber-500/10 text-amber-600",
};

export function TeamOnLeave() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">
            Team on Leave Today
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {TEAM_ON_LEAVE.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            All team members are in today.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {TEAM_ON_LEAVE.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-[11px] bg-muted text-muted-foreground">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Returns {member.returnDate}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5",
                    LEAVE_TYPE_COLORS[member.leaveType] ??
                      "border-slate-500/30 bg-slate-500/10 text-slate-600",
                  )}
                >
                  {member.leaveType}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
