import {
  Pin,
  CalendarDays,
  FileText,
  CheckCircle2,
  Archive,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_STYLES,
  AUDIENCE_LABELS,
  formatDate,
} from "./data";
import type { Announcement } from "./data";

interface AnnouncementDetailModalProps {
  open: boolean;
  announcement: Announcement | null;
  acknowledged: Set<string>;
  onClose: (open: boolean) => void;
  onAcknowledge: (id: string) => void;
}

export function AnnouncementDetailModal({
  open,
  announcement: selected,
  acknowledged,
  onClose,
  onAcknowledge,
}: AnnouncementDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base pr-6">
            {selected?.title}
          </DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                className={`text-xs border ${ANNOUNCEMENT_TYPE_STYLES[selected.type]}`}
              >
                {ANNOUNCEMENT_TYPE_LABELS[selected.type]}
              </Badge>
              {selected.isPinned && (
                <Badge className="text-xs border bg-[#4361ee]/10 text-[#4361ee] border-[#4361ee]/20">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(selected.publishedAt ?? selected.createdAt)}
              </span>
              <span>•</span>
              <span>{selected.createdBy}</span>
              <span>•</span>
              <span>{AUDIENCE_LABELS[selected.audience]}</span>
            </div>

            <Separator />

            <p className="text-sm text-foreground leading-relaxed">
              {selected.body}
            </p>

            {selected.attachmentName && (
              <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted border border-border text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground text-xs">
                  {selected.attachmentName}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-7 text-xs"
                >
                  Download
                </Button>
              </div>
            )}

            {selected.requiresAcknowledgement && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  This announcement requires your acknowledgement.
                </p>
                {acknowledged.has(selected.id) ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Acknowledged on{" "}
                    {formatDate(new Date().toISOString().split("T")[0])}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="text-white w-full"
                    style={{ backgroundColor: "#4361ee" }}
                    onClick={() => onAcknowledge(selected.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Acknowledge
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>{selected.viewCount + 1} views</span>
              {selected.isArchived && (
                <span className="flex items-center gap-1">
                  <Archive className="w-3.5 h-3.5" />
                  Archived
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
