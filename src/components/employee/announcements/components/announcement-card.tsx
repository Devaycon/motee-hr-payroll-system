import { Pin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_STYLES,
  ANNOUNCEMENT_TYPE_BORDER,
  AUDIENCE_LABELS,
  timeAgo,
} from "./data";
import type { Announcement } from "./data";

interface AnnouncementCardProps {
  announcement: Announcement;
  isUnread: boolean;
  needsAck: boolean;
  onClick: (a: Announcement) => void;
}

export function AnnouncementCard({
  announcement: a,
  isUnread,
  needsAck,
  onClick,
}: AnnouncementCardProps) {
  return (
    <Card
      className={`border-l-4 transition-shadow hover:shadow-md cursor-pointer ${ANNOUNCEMENT_TYPE_BORDER[a.type]}`}
      onClick={() => onClick(a)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {a.isPinned && (
                <Pin className="w-3.5 h-3.5 text-[#4361ee] shrink-0" />
              )}
              {isUnread && (
                <span className="w-2 h-2 rounded-full bg-[#4361ee] shrink-0" />
              )}
              <Badge
                className={`text-xs border ${ANNOUNCEMENT_TYPE_STYLES[a.type]}`}
              >
                {ANNOUNCEMENT_TYPE_LABELS[a.type]}
              </Badge>
              {needsAck && (
                <Badge className="text-xs border bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Needs Acknowledgement
                </Badge>
              )}
              {a.isArchived && (
                <Badge className="text-xs border bg-zinc-500/10 text-zinc-600 border-zinc-500/20">
                  Archived
                </Badge>
              )}
            </div>
            <p
              className={`text-sm font-semibold text-foreground leading-snug ${isUnread ? "font-bold" : ""}`}
            >
              {a.title}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {a.body}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
              <span>{a.createdBy}</span>
              <span>•</span>
              <span>{timeAgo(a.publishedAt ?? a.createdAt)}</span>
              <span>•</span>
              <span>{AUDIENCE_LABELS[a.audience]}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
