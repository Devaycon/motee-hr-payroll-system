"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Separator } from "@/src/components/ui/separator";
import {
  Pin,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock,
  Users,
  Paperclip,
  CalendarDays,
  User,
} from "lucide-react";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_STYLES,
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_STATUS_STYLES,
  AUDIENCE_LABELS,
} from "../data";
import type { Announcement } from "../types";

interface AnnouncementDetailModalProps {
  open: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function AnnouncementDetailModal({
  open,
  onClose,
  announcement,
}: AnnouncementDetailModalProps) {
  if (!announcement) return null;

  const ackCount = announcement.acknowledgements.length;
  const ackPercent =
    announcement.totalTargeted > 0
      ? Math.round((ackCount / announcement.totalTargeted) * 100)
      : 0;

  const deptBreakdown = announcement.acknowledgements.reduce<
    Record<string, number>
  >((acc, a) => {
    acc[a.department] = (acc[a.department] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={`text-xs ${ANNOUNCEMENT_TYPE_STYLES[announcement.type]}`}
            >
              {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${ANNOUNCEMENT_STATUS_STYLES[announcement.status]}`}
            >
              {ANNOUNCEMENT_STATUS_LABELS[announcement.status]}
            </Badge>
            {announcement.priority === "urgent" && (
              <Badge
                variant="outline"
                className="text-xs bg-red-500/10 text-red-600 border-red-500/20 flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                Urgent
              </Badge>
            )}
            {announcement.isPinned && (
              <Badge
                variant="outline"
                className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1"
              >
                <Pin className="w-3 h-3 fill-amber-500" />
                Pinned
              </Badge>
            )}
          </div>
          <DialogTitle className="text-base font-semibold leading-snug">
            {announcement.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex flex-col flex-1 min-h-0">
          <div className="mx-6 shrink-0">
            <PageTabsList
              tabs={[
                { value: "content", label: "Content" },
                { value: "acknowledgements", label: "Acknowledgements" },
                { value: "analytics", label: "Analytics" },
              ]}
            />
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <TabsContent value="content" className="px-6 py-4 space-y-5 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow
                  label="Created By"
                  value={
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {announcement.createdBy}
                    </span>
                  }
                />
                <InfoRow
                  label="Audience"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      {AUDIENCE_LABELS[announcement.audience]}
                    </span>
                  }
                />
                {announcement.publishedAt && (
                  <InfoRow
                    label="Published"
                    value={
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(announcement.publishedAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    }
                  />
                )}
                {announcement.scheduledFor && !announcement.publishedAt && (
                  <InfoRow
                    label="Scheduled For"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(announcement.scheduledFor).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    }
                  />
                )}
                {announcement.expiresAt && (
                  <InfoRow
                    label="Expires"
                    value={new Date(announcement.expiresAt).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  />
                )}
                {announcement.targetDepartments &&
                  announcement.targetDepartments.length > 0 && (
                    <InfoRow
                      label="Target Departments"
                      value={announcement.targetDepartments.join(", ")}
                    />
                  )}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Message
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {announcement.body}
                </p>
              </div>

              {announcement.attachmentName && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                    <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground font-medium truncate">
                      {announcement.attachmentName}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      Attachment
                    </span>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent
              value="acknowledgements"
              className="px-6 py-4 space-y-4 mt-0"
            >
              {!announcement.requiresAcknowledgement ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    No acknowledgement required
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This announcement does not require employee sign-off.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Acknowledgement rate
                      </span>
                      <span className="font-semibold text-foreground">
                        {ackCount} / {announcement.totalTargeted} ({ackPercent}
                        %)
                      </span>
                    </div>
                    <Progress value={ackPercent} className="h-2" />
                  </div>

                  <Separator />

                  {announcement.acknowledgements.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No acknowledgements yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {announcement.acknowledgements.map((ack, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/40"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-semibold shrink-0">
                            {ack.employeeInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {ack.employeeName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ack.department}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Acknowledged
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(ack.acknowledgedAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="px-6 py-4 space-y-5 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/40 rounded-lg p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Total Views
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {announcement.viewCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {announcement.totalTargeted} targeted
                  </p>
                </div>
                {announcement.requiresAcknowledgement && (
                  <div className="bg-muted/40 rounded-lg p-4 space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Ack Rate
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {ackPercent}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ackCount} of {announcement.totalTargeted}
                    </p>
                  </div>
                )}
              </div>

              {Object.keys(deptBreakdown).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Acknowledgements by Department
                    </p>
                    <div className="space-y-2">
                      {Object.entries(deptBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([dept, count]) => (
                          <div
                            key={dept}
                            className="flex items-center gap-3 text-sm"
                          >
                            <span className="w-36 shrink-0 text-foreground font-medium truncate">
                              {dept}
                            </span>
                            <div className="flex-1">
                              <Progress
                                value={
                                  ackCount > 0
                                    ? Math.round((count / ackCount) * 100)
                                    : 0
                                }
                                className="h-1.5"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
