"use client";

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Files,
  Archive,
  Lock,
  User,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import type { Folder as FolderType, HRDocument } from "../types";

interface FolderSidebarProps {
  folders: FolderType[];
  documents: HRDocument[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: () => void;
  sharedCount: number;
  trashCount: number;
}

const FOLDER_TYPE_ICONS: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  sys: { icon: Lock, color: "text-slate-400" },
  "sys-pol": { icon: Folder, color: "text-amber-500" },
  "sys-con": { icon: Folder, color: "text-blue-500" },
  "sys-cer": { icon: Folder, color: "text-emerald-500" },
  per: { icon: User, color: "text-violet-500" },
  arch: { icon: Archive, color: "text-muted-foreground" },
};

function getDocCount(
  folderId: string,
  folders: FolderType[],
  documents: HRDocument[],
): number {
  const childIds = folders
    .filter((f) => f.parentId === folderId)
    .map((f) => f.id);
  return documents.filter(
    (d) =>
      !d.isArchived &&
      (d.folderId === folderId || childIds.includes(d.folderId)),
  ).length;
}

function FolderNode({
  folder,
  folders,
  documents,
  selectedFolderId,
  onSelectFolder,
  expanded,
  onToggle,
  depth,
}: {
  folder: FolderType;
  folders: FolderType[];
  documents: HRDocument[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  depth: number;
}) {
  const children = folders.filter((f) => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const count = getDocCount(folder.id, folders, documents);
  const iconConfig = FOLDER_TYPE_ICONS[folder.id];
  const IconComp = iconConfig?.icon ?? Folder;
  const iconColor = iconConfig?.color ?? "text-amber-500";

  return (
    <div>
      <button
        onClick={() => {
          onSelectFolder(folder.id);
          if (hasChildren) onToggle(folder.id);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-sm transition-colors",
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted/70 text-foreground",
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        {isSelected || isExpanded ? (
          <FolderOpen className={`size-4 shrink-0 ${iconColor}`} />
        ) : (
          <IconComp className={`size-4 shrink-0 ${iconColor}`} />
        )}
        <span className="flex-1 truncate text-left">{folder.name}</span>
        {count > 0 && (
          <Badge
            variant="secondary"
            className={cn(
              "h-4 min-w-4 px-1 text-[10px] font-medium",
              isSelected && "bg-primary/20 text-primary",
            )}
          >
            {count}
          </Badge>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              folders={folders}
              documents={documents}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              expanded={expanded}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderSidebar({
  folders,
  documents,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  sharedCount,
  trashCount,
}: FolderSidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["sys", "per"]),
  );

  function onToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const rootFolders = folders.filter(
    (f) => !f.parentId && f.type !== "shared" && f.type !== "trash",
  );
  const totalNonArchived = documents.filter(
    (d) => !d.isArchived && !d.isTrashed,
  ).length;

  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-border/60 bg-card/50">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Folders
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onCreateFolder}
          title="New folder"
        >
          <FolderPlus className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
            selectedFolderId === null
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted/70 text-foreground",
          )}
        >
          <span className="size-3.5 shrink-0" />
          <Files className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-left">All Documents</span>
          <Badge
            variant="secondary"
            className={cn(
              "h-4 min-w-4 px-1 text-[10px] font-medium",
              selectedFolderId === null && "bg-primary/20 text-primary",
            )}
          >
            {totalNonArchived}
          </Badge>
        </button>

        <div className="my-1.5 mx-2 h-px bg-border/60" />

        {rootFolders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            folders={folders}
            documents={documents}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            expanded={expanded}
            onToggle={onToggle}
            depth={0}
          />
        ))}

        <div className="my-1.5 mx-2 h-px bg-border/60" />

        <button
          onClick={() => onSelectFolder("shared")}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
            selectedFolderId === "shared"
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted/70 text-foreground",
          )}
        >
          <span className="size-3.5 shrink-0" />
          <Share2 className="size-4 shrink-0 text-blue-500" />
          <span className="flex-1 truncate text-left">Shared</span>
          {sharedCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "h-4 min-w-4 px-1 text-[10px] font-medium",
                selectedFolderId === "shared" && "bg-primary/20 text-primary",
              )}
            >
              {sharedCount}
            </Badge>
          )}
        </button>

        <button
          onClick={() => onSelectFolder("trash")}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
            selectedFolderId === "trash"
              ? "bg-destructive/10 text-destructive font-medium"
              : "hover:bg-muted/70 text-foreground",
          )}
        >
          <span className="size-3.5 shrink-0" />
          <Trash2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-left">Trash</span>
          {trashCount > 0 && (
            <Badge
              variant="secondary"
              className="h-4 min-w-4 px-1 text-[10px] font-medium bg-destructive/10 text-destructive"
            >
              {trashCount}
            </Badge>
          )}
        </button>
      </div>

      <div className="border-t border-border/60 p-2">
        <button
          onClick={onCreateFolder}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          <FolderPlus className="size-3.5" />
          New Folder
        </button>
      </div>
    </div>
  );
}
