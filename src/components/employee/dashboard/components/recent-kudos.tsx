"use client";

import Link from "next/link";
import { Award, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Separator } from "@/src/components/ui/separator";
import { EMPLOYEE_RECENT_KUDOS } from "@/src/data/employee-dashboard-demo";

export function RecentKudos() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#7F77DD]/10">
            <Award className="w-3.5 h-3.5 text-[#7F77DD]" />
          </div>
          <CardTitle className="text-sm font-medium">
            Recent Kudos Received
          </CardTitle>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground gap-1"
        >
          <Link href="/company/community">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-1">
          {EMPLOYEE_RECENT_KUDOS.map((k, idx) => (
            <div key={k.id}>
              {idx > 0 && <Separator className="my-2" />}
              <div className="flex items-start gap-3">
                <PersonAvatar
                  name={k.senderName}
                  initials={k.senderInitials}
                  className="w-8 h-8 shrink-0"
                  fallbackClassName="text-[11px] bg-[#7F77DD]/10 text-[#7F77DD]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-foreground">
                      {k.senderName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">
                      {k.emoji} {k.kudosType}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {k.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {k.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
