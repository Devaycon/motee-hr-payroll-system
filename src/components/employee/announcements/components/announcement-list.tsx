import { Card, CardContent } from "@/src/components/ui/card";
import { AnnouncementCard } from "./announcement-card";
import type { Announcement } from "./data";

interface AnnouncementListProps {
  items: Announcement[];
  readIds: Set<string>;
  acknowledged: Set<string>;
  onOpen: (a: Announcement) => void;
}

export function AnnouncementList({
  items,
  readIds,
  acknowledged,
  onOpen,
}: AnnouncementListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No announcements found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <AnnouncementCard
          key={a.id}
          announcement={a}
          isUnread={!readIds.has(a.id)}
          needsAck={a.requiresAcknowledgement && !acknowledged.has(a.id)}
          onClick={onOpen}
        />
      ))}
    </div>
  );
}
