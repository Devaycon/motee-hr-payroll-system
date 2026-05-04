"use client";

import Link from "next/link";
import { UserRoundCheck, ChevronRight, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { cn } from "@/src/lib/utils";
import { PENDING_LEAVES, LEAVE_TYPE_STYLES } from "../data";

interface PendingApprovalsProps {
  approvedLeaves: string[];
  rejectedLeaves: string[];
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
  pendingLeaveCount: number;
}

export function PendingApprovals({
  approvedLeaves,
  rejectedLeaves,
  onApproveLeave,
  onRejectLeave,
  pendingLeaveCount,
}: PendingApprovalsProps) {
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <UserRoundCheck className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">
            Pending Approvals
          </CardTitle>
          {pendingLeaveCount > 0 && (
            <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-white text-[10px] font-semibold px-1">
              {pendingLeaveCount}
            </span>
          )}
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground gap-1"
        >
          <Link href="/time-payroll/leave">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          {PENDING_LEAVES.map((leave) => {
            const approved = approvedLeaves.includes(leave.id);
            const rejected = rejectedLeaves.includes(leave.id);
            return (
              <div
                key={leave.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border transition-opacity",
                  (approved || rejected) && "opacity-50",
                )}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {leave.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">
                      {leave.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 shrink-0",
                        LEAVE_TYPE_STYLES[leave.type] ??
                          "border-border text-muted-foreground",
                      )}
                    >
                      {leave.type}
                    </Badge>
                    {approved && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]"
                      >
                        Approved
                      </Badge>
                    )}
                    {rejected && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-red-400/40 bg-red-400/10 text-red-500"
                      >
                        Rejected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {leave.dept} · {leave.from} – {leave.to} · {leave.days}{" "}
                    {leave.days === 1 ? "day" : "days"}
                  </p>
                </div>
                {!approved && !rejected && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7 border-[#4ED251]/40 text-[#4ED251] hover:bg-[#4ED251]/10"
                      onClick={() => onApproveLeave(leave.id)}
                    >
                      <Check className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7 border-red-400/40 text-red-500 hover:bg-red-400/10"
                      onClick={() => onRejectLeave(leave.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
