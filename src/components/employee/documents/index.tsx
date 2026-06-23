"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { cn } from "@/src/lib/utils";
import {
  DEMO_DOCUMENTS,
  DEMO_FOLDERS,
  DOC_TYPES,
  FOLDER_COLORS,
  SHARED_WITH_ME,
  daysUntilExpiry,
  formatDate,
} from "./data";
import type { DocFolder, EmployeeDocument, FileExt } from "./types";
import { DocSidebar } from "./components/doc-sidebar";
import { FileCard } from "./components/file-card";
import { FileIcon } from "./components/file-icon";
import {
  MoveModal,
  NewFolderModal,
  PreviewModal,
  RequestModal,
  UploadModal,
} from "./components/doc-modals";
import { useRouter } from "next/navigation";

export function MyDocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<EmployeeDocument[]>(DEMO_DOCUMENTS);
  const [folders, setFolders] = useState<DocFolder[]>(DEMO_FOLDERS);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("");
  const [uploadExt, setUploadExt] = useState<FileExt>("pdf");
  const [uploadFolder, setUploadFolder] = useState<string>("none");
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadDone, setUploadDone] = useState(false);

  const [requestOpen, setRequestOpen] = useState(false);
  const [reqType, setReqType] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [reqDone, setReqDone] = useState(false);

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0].value);

  const [moveDoc, setMoveDoc] = useState<EmployeeDocument | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string>("none");

  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);
  const [sharedAckedIds, setSharedAckedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  function handleSignDoc(doc: EmployeeDocument) {
    const params = new URLSearchParams({
      name: doc.name,
      fileType: doc.ext,
      back: "/employee/documents",
    });
    router.push(`/sign?${params.toString()}`);
  }

  const currentFolder = folders.find((f) => f.id === currentFolderId) ?? null;
  const isTrashView = currentFolderId === "trash";
  const isSharedView = currentFolderId === "shared";

  const visibleDocs = isTrashView
    ? docs.filter((d) => d.isTrashed)
    : isSharedView
      ? SHARED_WITH_ME.filter(
          (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) &&
            (typeFilter === "All Types" || d.type === typeFilter),
        )
      : docs.filter((d) => {
          const inFolder = d.folderId === currentFolderId;
          const matchSearch = d.name
            .toLowerCase()
            .includes(search.toLowerCase());
          const matchType = typeFilter === "All Types" || d.type === typeFilter;
          return !d.isTrashed && inFolder && matchSearch && matchType;
        });

  const rootFolders = folders.filter((f) => !f.isTrashed);
  const activeDocs = docs.filter((d) => !d.isTrashed);
  const pendingAck = activeDocs.filter(
    (d) => d.requiresAck && !d.acknowledged,
  ).length;
  const expiringSoon = activeDocs.filter((d) => {
    if (!d.expiryDate) return false;
    const days = daysUntilExpiry(d.expiryDate);
    return days >= 0 && days <= 90;
  }).length;
  const trashCount = docs.filter((d) => d.isTrashed).length;

  function handleAcknowledgeShared(id: string) {
    setSharedAckedIds((prev) => [...prev, id]);
  }

  function handleDeleteDoc(id: string) {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isTrashed: true } : d)),
    );
  }

  function handleRestoreDoc(id: string) {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isTrashed: false } : d)),
    );
  }

  function handlePermanentDeleteDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function handleDeleteFolder(id: string) {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isTrashed: true } : f)),
    );
    setDocs((prev) =>
      prev.map((d) => (d.folderId === id ? { ...d, isTrashed: true } : d)),
    );
    if (currentFolderId === id) setCurrentFolderId(null);
  }

  function handleUploadSubmit() {
    if (!uploadName || !uploadType) return;
    const newDoc: EmployeeDocument = {
      id: `d-${Date.now()}`,
      name: uploadName,
      type: uploadType,
      ext: uploadExt,
      folderId: uploadFolder === "none" ? null : uploadFolder,
      uploadedBy: "employee",
      uploadedAt: new Date().toISOString().split("T")[0],
      fileSize: "-",
      expiryDate: uploadExpiry || undefined,
      requiresAck: false,
      acknowledged: false,
    };
    setDocs((prev) => [newDoc, ...prev]);
    setUploadDone(true);
    setTimeout(() => {
      setUploadDone(false);
      setUploadName("");
      setUploadType("");
      setUploadExt("pdf");
      setUploadFolder("none");
      setUploadExpiry("");
      setUploadDesc("");
      setUploadOpen(false);
    }, 1400);
  }

  function handleRequestSubmit() {
    if (!reqType) return;
    setReqDone(true);
    setTimeout(() => {
      setReqDone(false);
      setReqType("");
      setReqNote("");
      setRequestOpen(false);
    }, 1400);
  }

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const newFolder: DocFolder = {
      id: `f-${Date.now()}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setFolders((prev) => [...prev, newFolder]);
    setNewFolderOpen(false);
    setNewFolderName("");
    setNewFolderColor(FOLDER_COLORS[0].value);
  }

  function handleMoveDoc() {
    if (!moveDoc) return;
    setDocs((prev) =>
      prev.map((d) =>
        d.id === moveDoc.id
          ? { ...d, folderId: moveFolderId === "none" ? null : moveFolderId }
          : d,
      ),
    );
    setMoveDoc(null);
    setMoveFolderId("none");
  }

  function openMove(doc: EmployeeDocument) {
    setMoveDoc(doc);
    setMoveFolderId(doc.folderId ?? "none");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-semibold">My Documents</h1>
            <p className="text-sm text-muted-foreground">
              Organise, upload, and manage all your documents.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewFolderOpen(true)}
          >
            <FolderPlus className="mr-2 size-4" />
            New Folder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRequestOpen(true)}
          >
            <Send className="mr-2 size-4" />
            Request
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 size-4" />
            Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Documents",
            value: activeDocs.length,
            sub: `${docs.length} including trashed`,
            icon: FileText,
            iconClass: "text-slate-500 dark:text-slate-400",
            iconBg: "bg-slate-500/10",
          },
          {
            label: "Pending Acknowledgement",
            value: pendingAck,
            sub: "Requires your action",
            icon: Clock,
            iconClass: "text-amber-500",
            iconBg: "bg-amber-500/10",
          },
          {
            label: "Expiring Soon",
            value: expiringSoon,
            sub: "Within 90 days",
            icon: AlertTriangle,
            iconClass: "text-red-500",
            iconBg: "bg-red-500/10",
          },
          {
            label: "My Folders",
            value: rootFolders.length,
            sub: "Active folders",
            icon: Folder,
            iconClass: "text-primary",
            iconBg: "bg-primary/10",
          },
        ].map((card) => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${card.iconBg}`}
                >
                  <card.icon className={`size-4 ${card.iconClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingAck > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-background px-4 py-3">
          <Clock className="size-4 shrink-0 text-amber-600" />
          <p className="flex-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            You have <span className="font-bold">{pendingAck}</span> document
            {pendingAck > 1 ? "s" : ""} requiring your acknowledgement.
          </p>
        </div>
      )}

      <div
        className="flex overflow-hidden rounded-xl border border-border/60 bg-background"
        style={{ height: "calc(100vh - 330px)", minHeight: "480px" }}
      >
        <DocSidebar
          folders={folders}
          currentFolderId={currentFolderId}
          activeDocs={activeDocs}
          trashCount={trashCount}
          onSelectFolder={setCurrentFolderId}
          onNewFolder={() => setNewFolderOpen(true)}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs">
              <button
                className={cn(
                  "transition-colors hover:text-foreground",
                  currentFolderId === null
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
                onClick={() => setCurrentFolderId(null)}
              >
                All Documents
              </button>
              {isSharedView && (
                <>
                  <ChevronRight className="size-3 text-muted-foreground/50" />
                  <span className="font-medium text-foreground">
                    Shared with Me
                  </span>
                </>
              )}
              {isTrashView && (
                <>
                  <ChevronRight className="size-3 text-muted-foreground/50" />
                  <span className="font-medium text-foreground">Trash</span>
                </>
              )}
              {currentFolder && !isSharedView && !isTrashView && (
                <>
                  <ChevronRight className="size-3 text-muted-foreground/50" />
                  <span className="font-medium text-foreground">
                    {currentFolder.name}
                  </span>
                </>
              )}
            </div>
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

          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="h-8 pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="ml-auto text-xs text-muted-foreground">
              {visibleDocs.length} document{visibleDocs.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isTrashView && (
              <p className="mb-3 text-xs text-muted-foreground">
                Items in the trash will be permanently deleted after 30 days.
              </p>
            )}

            {!currentFolderId && !search && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Folders
                </p>
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {rootFolders.map((folder) => {
                    const count = activeDocs.filter(
                      (d) => d.folderId === folder.id,
                    ).length;
                    return (
                      <div
                        key={folder.id}
                        className="group relative cursor-pointer rounded-xl border border-border/60 bg-card transition-all hover:border-border hover:shadow-md"
                        onClick={() => setCurrentFolderId(folder.id)}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between">
                            <div
                              className="flex size-9 items-center justify-center rounded-lg"
                              style={{ background: `${folder.color}18` }}
                            >
                              <Folder
                                className="size-4"
                                style={{ color: folder.color }}
                              />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                  <MoreHorizontal className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-40"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteFolder(folder.id)}
                                >
                                  <Trash2 className="mr-2 size-3.5" />
                                  Move to Trash
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="mt-2">
                            <p className="line-clamp-1 text-xs font-medium">
                              {folder.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {count} file{count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    className="flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    onClick={() => setNewFolderOpen(true)}
                  >
                    <Plus className="size-5" />
                    <span className="text-[10px] font-medium">New Folder</span>
                  </button>
                </div>

                {activeDocs.filter((d) => d.folderId === null).length > 0 && (
                  <>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Unfiled Documents
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                      {activeDocs
                        .filter(
                          (d) =>
                            d.folderId === null &&
                            d.name
                              .toLowerCase()
                              .includes(search.toLowerCase()) &&
                            (typeFilter === "All Types" ||
                              d.type === typeFilter),
                        )
                        .map((doc) => (
                          <FileCard
                            key={doc.id}
                            doc={doc}
                            onAckShared={handleAcknowledgeShared}
                            onPreview={setPreviewDoc}
                            onMove={openMove}
                            onSign={handleSignDoc}
                            onDelete={handleDeleteDoc}
                          />
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {(currentFolderId !== null || search) && (
              <>
                {visibleDocs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <FolderOpen className="size-6 text-muted-foreground opacity-40" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {isTrashView
                          ? "Trash is empty."
                          : isSharedView
                            ? "No shared documents."
                            : "No documents found."}
                      </p>
                      {!isTrashView && !isSharedView && (
                        <p className="text-xs text-muted-foreground">
                          Upload a document to get started.
                        </p>
                      )}
                    </div>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {visibleDocs.map((doc) => (
                      <FileCard
                        key={doc.id}
                        doc={doc}
                        onAckShared={handleAcknowledgeShared}
                        sharedAcked={sharedAckedIds.includes(doc.id)}
                        onPreview={setPreviewDoc}
                        onMove={
                          isTrashView || isSharedView ? () => {} : openMove
                        }
                        onSign={handleSignDoc}
                        onDelete={
                          isTrashView
                            ? handlePermanentDeleteDoc
                            : handleDeleteDoc
                        }
                        onRestore={isTrashView ? handleRestoreDoc : undefined}
                        isTrashView={isTrashView}
                        isSharedView={isSharedView}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/60 bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-72">Document</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead className="w-13" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleDocs.map((doc) => (
                          <TableRow key={doc.id} className="group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <FileIcon ext={doc.ext} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {doc.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.uploadedBy === "hr"
                                      ? "Uploaded by HR"
                                      : "Uploaded by you"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {doc.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {doc.fileSize}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(doc.uploadedAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {doc.expiryDate ? (
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(doc.expiryDate)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
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
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44"
                                >
                                  <DropdownMenuItem
                                    onClick={() => setPreviewDoc(doc)}
                                  >
                                    <Eye className="mr-2 size-4" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="mr-2 size-4" />
                                    Download
                                  </DropdownMenuItem>
                                  {!isTrashView && !isSharedView && (
                                    <DropdownMenuItem
                                      onClick={() => openMove(doc)}
                                    >
                                      <FolderInput className="mr-2 size-4" />
                                      Move to Folder
                                    </DropdownMenuItem>
                                  )}
                                  {isSharedView &&
                                    !sharedAckedIds.includes(doc.id) && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-amber-600 focus:text-amber-600"
                                          onClick={() =>
                                            handleAcknowledgeShared(doc.id)
                                          }
                                        >
                                          Acknowledge
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  <DropdownMenuSeparator />
                                  {isTrashView ? (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleRestoreDoc(doc.id)}
                                      >
                                        <RotateCcw className="mr-2 size-4" />
                                        Restore
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                          handlePermanentDeleteDoc(doc.id)
                                        }
                                      >
                                        <Trash2 className="mr-2 size-4" />
                                        Delete Permanently
                                      </DropdownMenuItem>
                                    </>
                                  ) : !isSharedView ? (
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDeleteDoc(doc.id)}
                                    >
                                      <Trash2 className="mr-2 size-4" />
                                      Move to Trash
                                    </DropdownMenuItem>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <NewFolderModal
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        name={newFolderName}
        onNameChange={setNewFolderName}
        color={newFolderColor}
        onColorChange={setNewFolderColor}
        onSubmit={handleCreateFolder}
      />

      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        name={uploadName}
        onNameChange={setUploadName}
        type={uploadType}
        onTypeChange={setUploadType}
        ext={uploadExt}
        onExtChange={setUploadExt}
        folder={uploadFolder}
        onFolderChange={setUploadFolder}
        expiry={uploadExpiry}
        onExpiryChange={setUploadExpiry}
        desc={uploadDesc}
        onDescChange={setUploadDesc}
        done={uploadDone}
        folders={folders}
        onSubmit={handleUploadSubmit}
      />

      <RequestModal
        open={requestOpen}
        onOpenChange={setRequestOpen}
        type={reqType}
        onTypeChange={setReqType}
        note={reqNote}
        onNoteChange={setReqNote}
        done={reqDone}
        onSubmit={handleRequestSubmit}
      />

      <MoveModal
        moveDoc={moveDoc}
        onClose={() => setMoveDoc(null)}
        folders={folders}
        moveFolderId={moveFolderId}
        onMoveFolderIdChange={setMoveFolderId}
        onSubmit={handleMoveDoc}
      />

      <PreviewModal
        previewDoc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
