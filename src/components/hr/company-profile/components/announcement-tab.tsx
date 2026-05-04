"use client";

import { Megaphone, Pencil, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";

type AnnouncementTabProps = {
  announcement: string;
  setAnnouncement: (v: string) => void;
  editing: boolean;
  setEditing: (v: boolean) => void;
  draft: string;
  setDraft: (v: string) => void;
};

export function AnnouncementTab({
  announcement,
  setAnnouncement,
  editing,
  setEditing,
  draft,
  setDraft,
}: AnnouncementTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">
              Pinned Company Announcement
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              This message will appear at the top of every employee&apos;s
              dashboard.
            </p>
          </div>
        </div>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => {
              setDraft(announcement);
              setEditing(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {editing ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={500}
              className="text-sm resize-none"
              placeholder="Enter a company-wide announcement…"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {draft.length}/500 characters
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    setAnnouncement(draft);
                    setEditing(false);
                  }}
                >
                  <Save className="w-3.5 h-3.5" /> Save & Publish
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border bg-muted/30">
              <Megaphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">
                {announcement}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated by{" "}
              <span className="font-medium text-foreground">
                Mikovla Stefani
              </span>{" "}
              · April 1, 2026
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
