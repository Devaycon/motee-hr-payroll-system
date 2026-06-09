"use client";

import { formatDate } from "@/src/lib/utils/format-date";
import {
  FileText,
  Image,
  File,
  Clock,
  AlertCircle,
  Download,
  Share2,
  Archive,
  History,
  Users,
  Info,
  CheckCircle2,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  FILE_TYPE_STYLES,
  FILE_TYPE_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_STYLES,
} from "../data";
import type { HRDocument, Folder } from "../types";

const FILE_ICON_MAP: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
};

function DocTypeIcon({
  fileType,
  className,
}: {
  fileType: string;
  className?: string;
}) {
  const Icon = FILE_ICON_MAP[fileType] ?? File;
  return <Icon className={className} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function getExpiryInfo(expiryDate?: string) {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft < 0) return { status: "expired" as const, daysLeft };
  if (daysLeft <= 30) return { status: "expiring" as const, daysLeft };
  return { status: "valid" as const, daysLeft };
}

function getFolderName(folderId: string, folders: Folder[]): string {
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return folderId;
  if (folder.parentId) {
    const parent = folders.find((f) => f.id === folder.parentId);
    return parent ? `${parent.name} / ${folder.name}` : folder.name;
  }
  return folder.name;
}

interface DocumentDetailModalProps {
  open: boolean;
  onClose: () => void;
  document: HRDocument | null;
  folders: Folder[];
  onShare: (doc: HRDocument) => void;
  onArchive: (id: string) => void;
}

export function DocumentDetailModal({
  open,
  onClose,
  document: doc,
  folders,
  onShare,
  onArchive,
}: DocumentDetailModalProps) {
  if (!doc) return null;

  const typeStyle = FILE_TYPE_STYLES[doc.fileType];
  const expiry = getExpiryInfo(doc.expiryDate);
  const sortedVersions = [...doc.versions].sort(
    (a, b) => b.version - a.version,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-6 pb-4 pt-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl border ${typeStyle.bg} ${typeStyle.border}`}
            >
              <DocTypeIcon
                fileType={doc.fileType}
                className={`size-6 ${typeStyle.text}`}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <DialogTitle
                className="text-base font-semibold leading-tight"
                title={doc.name}
              >
                {doc.name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${DOCUMENT_CATEGORY_STYLES[doc.category]}`}
                >
                  {DOCUMENT_CATEGORY_LABELS[doc.category]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {FILE_TYPE_LABELS[doc.fileType]} ·{" "}
                  {formatFileSize(doc.fileSize)}
                </span>
                {expiry && expiry.status !== "valid" && (
                  <Badge
                    variant="secondary"
                    className={
                      expiry.status === "expired"
                        ? "bg-red-500/10 text-xs text-red-600 dark:text-red-400"
                        : "bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400"
                    }
                  >
                    {expiry.status === "expired" ? (
                      <>
                        <AlertCircle className="mr-1 size-3" />
                        Expired
                      </>
                    ) : (
                      <>
                        <Clock className="mr-1 size-3" />
                        {expiry.daysLeft}d left
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex flex-col">
          <TabsList className="mx-6 mt-4 w-auto self-start">
            <TabsTrigger value="info" className="gap-1.5 text-xs">
              <Info className="size-3.5" />
              Details
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-1.5 text-xs">
              <History className="size-3.5" />
              Versions
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {doc.versions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-1.5 text-xs">
              <Users className="size-3.5" />
              Access
              {doc.shares.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {doc.shares.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-0 px-6 py-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium">
                  {DOCUMENT_CATEGORY_LABELS[doc.category]}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">File Type</p>
                <p className="text-sm font-medium">
                  {FILE_TYPE_LABELS[doc.fileType]}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Folder</p>
                <p className="text-sm font-medium">
                  {getFolderName(doc.folderId, folders)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">File Size</p>
                <p className="text-sm font-medium">
                  {formatFileSize(doc.fileSize)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uploaded</p>
                <p className="text-sm font-medium">
                  {formatDate(doc.uploadedAt)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uploaded By</p>
                <p className="text-sm font-medium">{doc.uploadedBy}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                {doc.expiryDate ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {formatDate(doc.expiryDate)}
                    </p>
                    {expiry && expiry.status !== "valid" && (
                      <Badge
                        variant="secondary"
                        className={
                          expiry.status === "expired"
                            ? "bg-red-500/10 text-xs text-red-600 dark:text-red-400"
                            : "bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400"
                        }
                      >
                        {expiry.status === "expired"
                          ? "Expired"
                          : `${expiry.daysLeft} days remaining`}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No expiry</p>
                  </div>
                )}
              </div>
              {doc.description && (
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {doc.description}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="versions" className="mt-0 px-6 py-4">
            <ScrollArea className="h-56">
              <div className="relative space-y-0">
                {sortedVersions.map((version, i) => (
                  <div key={version.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`mt-1 size-2.5 shrink-0 rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`}
                      />
                      {i < sortedVersions.length - 1 && (
                        <div className="my-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="min-w-0 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold">
                          v{version.version}
                        </span>
                        {i === 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 bg-primary/10 px-1.5 text-[10px] text-primary"
                          >
                            Current
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          · {formatDate(version.uploadedAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {formatFileSize(version.fileSize)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Uploaded by {version.uploadedBy}
                      </p>
                      {version.notes && (
                        <p className="mt-1 rounded-md bg-muted/50 px-2 py-1 text-xs">
                          {version.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="access" className="mt-0 px-6 py-4">
            {doc.shares.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground opacity-40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  This document has not been shared yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShare(doc)}
                  className="mt-1"
                >
                  <Share2 className="mr-2 size-4" />
                  Share Document
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-56">
                <div className="space-y-2">
                  {doc.shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {share.employeeInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {share.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Shared {formatDate(share.sharedAt)}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          share.permission === "download"
                            ? "bg-blue-500/10 text-xs text-blue-600 dark:text-blue-400"
                            : "text-xs"
                        }
                      >
                        {share.permission === "download" ? (
                          <>
                            <Download className="mr-1 size-3" />
                            Download
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 size-3" />
                            View Only
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onShare(doc)}>
              <Share2 className="mr-2 size-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Download
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(doc.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Archive className="mr-2 size-4" />
              {doc.isArchived ? "Unarchive" : "Archive"}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
