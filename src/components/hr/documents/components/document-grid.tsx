"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  File,
  Search,
  LayoutGrid,
  List,
  Share2,
  Eye,
  MoreHorizontal,
  Archive,
  Download,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  FILE_TYPE_STYLES,
  FILE_TYPE_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_STYLES,
  DOCUMENT_CATEGORY_OPTIONS,
} from "../data";
import type { HRDocument, Folder, DocumentCategory } from "../types";

function getFileIcon(fileType: string) {
  if (fileType === "png" || fileType === "jpg" || fileType === "jpeg")
    return Image;
  if (fileType === "pdf" || fileType === "doc" || fileType === "docx")
    return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function ExpiryBadge({ expiryDate }: { expiryDate?: string }) {
  const info = getExpiryInfo(expiryDate);
  if (!info || info.status === "valid") return null;
  if (info.status === "expired")
    return (
      <Badge
        variant="secondary"
        className="bg-red-500/10 text-[10px] font-semibold text-red-600 dark:text-red-400"
      >
        <AlertCircle className="mr-1 size-3" />
        Expired
      </Badge>
    );
  return (
    <Badge
      variant="secondary"
      className="bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
    >
      <Clock className="mr-1 size-3" />
      {info.daysLeft}d left
    </Badge>
  );
}

function getFolderPath(folderId: string | null, folders: Folder[]): Folder[] {
  if (!folderId) return [];
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return [];
  if (!folder.parentId) return [folder];
  return [...getFolderPath(folder.parentId, folders), folder];
}

function getFolderName(folderId: string, folders: Folder[]): string {
  return folders.find((f) => f.id === folderId)?.name ?? folderId;
}

interface DocumentGridProps {
  documents: HRDocument[];
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onView: (doc: HRDocument) => void;
  onShare: (doc: HRDocument) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  isTrashView?: boolean;
  isSharedView?: boolean;
}

export function DocumentGrid({
  documents,
  folders,
  selectedFolderId,
  onSelectFolder,
  onView,
  onShare,
  onArchive,
  onDelete,
  onRestore,
  onPermanentDelete,
  isTrashView = false,
  isSharedView = false,
}: DocumentGridProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    DocumentCategory | "all"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = documents.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      d.name.toLowerCase().includes(q) ||
      d.uploadedBy.toLowerCase().includes(q) ||
      (d.description ?? "").toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const folderPath = getFolderPath(selectedFolderId, folders);

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => onSelectFolder(null)}
                className="cursor-pointer text-xs hover:text-foreground"
              >
                All Documents
              </BreadcrumbLink>
            </BreadcrumbItem>
            {folderPath.map((folder, i) => (
              <>
                <BreadcrumbSeparator key={`sep-${folder.id}`} />
                <BreadcrumbItem key={folder.id}>
                  {i < folderPath.length - 1 ? (
                    <BreadcrumbLink
                      onClick={() => onSelectFolder(folder.id)}
                      className="cursor-pointer text-xs hover:text-foreground"
                    >
                      {folder.name}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-xs font-medium">
                      {folder.name}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "grid"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "list"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="h-8 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) =>
            setCategoryFilter(v as DocumentCategory | "all")
          }
        >
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {DOCUMENT_CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {DOCUMENT_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="ml-auto text-xs text-muted-foreground">
          {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FileText className="size-6 text-muted-foreground opacity-40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                No documents found
              </p>
              <p className="text-xs text-muted-foreground">
                {search
                  ? "Try adjusting your search or filter."
                  : "Upload a document to get started."}
              </p>
            </div>
          </div>
        )}

        {filtered.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((doc) => {
              const typeStyle = FILE_TYPE_STYLES[doc.fileType];
              const TypeIcon = getFileIcon(doc.fileType);
              const expiry = getExpiryInfo(doc.expiryDate);
              return (
                <div
                  key={doc.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-border hover:shadow-md"
                >
                  <div
                    className={`relative flex h-24 items-center justify-center ${typeStyle.bg} border-b ${typeStyle.border}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <TypeIcon
                        className={`size-8 ${typeStyle.text} opacity-80`}
                      />
                      <span
                        className={`text-[10px] font-bold tracking-wider ${typeStyle.text}`}
                      >
                        {FILE_TYPE_LABELS[doc.fileType]}
                      </span>
                    </div>
                    {expiry && expiry.status !== "valid" && (
                      <div className="absolute right-2 top-2">
                        <ExpiryBadge expiryDate={doc.expiryDate} />
                      </div>
                    )}
                    {doc.shares.length > 0 && (
                      <div className="absolute left-2 top-2">
                        <div
                          className="flex items-center gap-1 rounded-full bg-black/20 px-1.5 py-0.5 backdrop-blur-sm"
                          title="Shared"
                        >
                          <Share2 className="size-2.5 text-white" />
                          <span className="text-[10px] font-medium text-white">
                            {doc.shares.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <p
                      className="line-clamp-2 text-xs font-medium leading-tight"
                      title={doc.name}
                    >
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${DOCUMENT_CATEGORY_STYLES[doc.category]}`}
                      >
                        {DOCUMENT_CATEGORY_LABELS[doc.category]}
                      </Badge>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(doc.uploadedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 flex translate-y-full items-center justify-between rounded-b-xl border-t border-border/60 bg-card/95 px-2 py-1.5 backdrop-blur-sm transition-transform duration-200 group-hover:translate-y-0">
                    <button
                      onClick={() => onView(doc)}
                      className="text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Eye className="mr-1 inline size-3" />
                      Preview
                    </button>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => onShare(doc)}
                        title="Share"
                      >
                        <Share2 className="size-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                          >
                            <MoreHorizontal className="size-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onView(doc)}>
                            <Eye className="mr-2 size-3.5" />
                            View Details
                          </DropdownMenuItem>
                          {!isTrashView && (
                            <DropdownMenuItem>
                              <Download className="mr-2 size-3.5" />
                              Download
                            </DropdownMenuItem>
                          )}
                          {!isTrashView && !isSharedView && (
                            <DropdownMenuItem onClick={() => onShare(doc)}>
                              <Share2 className="mr-2 size-3.5" />
                              Share
                            </DropdownMenuItem>
                          )}
                          {!isTrashView && !isSharedView && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onArchive(doc.id)}
                              >
                                <Archive className="mr-2 size-3.5" />
                                {doc.isArchived ? "Unarchive" : "Archive"}
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          {isTrashView ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => onRestore?.(doc.id)}
                              >
                                <RotateCcw className="mr-2 size-3.5" />
                                Restore
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onPermanentDelete?.(doc.id)}
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDelete(doc.id)}
                            >
                              <Trash2 className="mr-2 size-3.5" />
                              Move to Trash
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && viewMode === "list" && (
          <div className="rounded-lg border border-border/60 bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-75">Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="w-13" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => {
                  const typeStyle = FILE_TYPE_STYLES[doc.fileType];
                  const TypeIcon = getFileIcon(doc.fileType);
                  return (
                    <TableRow key={doc.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${typeStyle.bg}`}
                          >
                            <TypeIcon className={`size-4 ${typeStyle.text}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {FILE_TYPE_LABELS[doc.fileType]} ·{" "}
                              {doc.versions.length} version
                              {doc.versions.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${DOCUMENT_CATEGORY_STYLES[doc.category]}`}
                        >
                          {DOCUMENT_CATEGORY_LABELS[doc.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getFolderName(doc.folderId, folders)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm">
                            {formatDate(doc.uploadedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.uploadedBy}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.expiryDate ? (
                          <div className="flex items-center gap-1.5">
                            <ExpiryBadge expiryDate={doc.expiryDate} />
                            {getExpiryInfo(doc.expiryDate)?.status ===
                              "valid" && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(doc.expiryDate)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 text-muted-foreground/40" />
                            <span className="text-xs text-muted-foreground">
                              No expiry
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => onView(doc)}>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            {!isTrashView && (
                              <DropdownMenuItem>
                                <Download className="mr-2 size-4" />
                                Download
                              </DropdownMenuItem>
                            )}
                            {!isTrashView && !isSharedView && (
                              <DropdownMenuItem onClick={() => onShare(doc)}>
                                <Share2 className="mr-2 size-4" />
                                Share
                              </DropdownMenuItem>
                            )}
                            {!isTrashView && !isSharedView && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onArchive(doc.id)}
                                >
                                  <Archive className="mr-2 size-4" />
                                  {doc.isArchived ? "Unarchive" : "Archive"}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            {isTrashView ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => onRestore?.(doc.id)}
                                >
                                  <RotateCcw className="mr-2 size-4" />
                                  Restore
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => onPermanentDelete?.(doc.id)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(doc.id)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Move to Trash
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
