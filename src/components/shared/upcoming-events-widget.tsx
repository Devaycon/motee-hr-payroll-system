"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { WorkspaceCard } from "@/src/components/shared/workspace-card";

export interface UpcomingEventItem {
  id: string | number;
  label: string;
  date: string;
  icon: LucideIcon;
}

interface Props {
  items: UpcomingEventItem[];
  title?: string;
  subtitle?: string;
  headerIcon?: LucideIcon;
  manageHref?: string;
  manageLabel?: string;
  scroll?: boolean;
}

/**
 * Shared "Upcoming Events" card used by the My Workspace and HR Action Center
 * dashboards. Renders a list of {icon, label, date} rows inside a WorkspaceCard.
 */
export function UpcomingEventsWidget({
  items,
  title = "Upcoming Events",
  subtitle = "Next 30 days",
  headerIcon = CalendarClock,
  manageHref,
  manageLabel = "Manage",
  scroll = false,
}: Props) {
  const list = (
    <div className="flex flex-col gap-1">
      {items.map((ev, idx) => (
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
  );

  return (
    <WorkspaceCard
      icon={headerIcon}
      title={title}
      subtitle={subtitle}
      action={
        manageHref ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-6 text-xs px-2"
          >
            <Link href={manageHref}>{manageLabel}</Link>
          </Button>
        ) : undefined
      }
    >
      {scroll ? (
        <ScrollArea className="max-h-70 pr-2 *:data-radix-scroll-area-viewport:max-h-70">
          {list}
        </ScrollArea>
      ) : (
        list
      )}
    </WorkspaceCard>
  );
}
