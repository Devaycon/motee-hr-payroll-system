"use client";

import Link from "next/link";
import { Bell, ChevronRight, Pin } from "lucide-react";
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
import {
  ANNOUNCEMENTS,
  ANNOUNCEMENT_TYPE_STYLES,
  ANNOUNCEMENT_TYPE_LABELS,
} from "@/src/data/announcements-demo";

export function AnnouncementsFeed() {
  const published = ANNOUNCEMENTS.filter((a) => a.status === "published").slice(
    0,
    3,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Announcements</CardTitle>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground gap-1"
        >
          <Link href="/company/announcements">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-1">
          {published.map((ann, idx) => (
            <div key={ann.id}>
              {idx > 0 && <Separator className="my-2" />}
              <div
                className={cn(
                  "border-l-2 pl-3",
                  ann.isPinned ? "border-l-[#7F77DD]" : "border-l-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {ann.isPinned && (
                        <Pin className="w-3 h-3 text-[#7F77DD] shrink-0" />
                      )}
                      <p className="text-xs text-foreground font-medium leading-relaxed truncate">
                        {ann.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {ann.body}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 shrink-0 mt-0.5",
                      ANNOUNCEMENT_TYPE_STYLES[ann.type],
                    )}
                  >
                    {ANNOUNCEMENT_TYPE_LABELS[ann.type]}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {ann.createdAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
