"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { WorkspaceCard } from "@/src/components/shared/workspace-card";
import { UPCOMING_EVENTS } from "../data";

export function UpcomingEvents() {
  return (
    <WorkspaceCard
      icon={CalendarDays}
      title="Upcoming Events"
      subtitle="Next 30 days"
      action={
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-6 text-xs px-2"
        >
          <Link href="/my-workspace/events">Manage</Link>
        </Button>
      }
    >
      <ScrollArea className="max-h-70 pr-2 *:data-radix-scroll-area-viewport:max-h-70">
        <div className="flex flex-col gap-1">
          {UPCOMING_EVENTS.map((ev, idx) => (
            <div key={ev.id}>
              {idx > 0 && <Separator className="my-2" />}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
                  <ev.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{ev.label}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {ev.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </WorkspaceCard>
  );
}
