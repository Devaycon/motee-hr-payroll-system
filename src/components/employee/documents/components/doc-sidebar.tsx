import {
  Files,
  Folder,
  FolderOpen,
  FolderPlus,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { SHARED_WITH_ME } from "../data";
import type { DocFolder, EmployeeDocument } from "../types";

interface DocSidebarProps {
  folders: DocFolder[];
  currentFolderId: string | null;
  activeDocs: EmployeeDocument[];
  trashCount: number;
  onSelectFolder: (id: string | null) => void;
  onNewFolder: () => void;
}

export function DocSidebar({
  folders,
  currentFolderId,
  activeDocs,
  trashCount,
  onSelectFolder,
  onNewFolder,
}: DocSidebarProps) {
  const rootFolders = folders.filter((f) => !f.isTrashed);

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
          onClick={onNewFolder}
        >
          <FolderPlus className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
            currentFolderId === null
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
              currentFolderId === null && "bg-primary/20 text-primary",
            )}
          >
            {activeDocs.length}
          </Badge>
        </button>

        <div className="mx-2 my-1.5 h-px bg-border/60" />

        {rootFolders.map((folder) => {
          const count = activeDocs.filter(
            (d) => d.folderId === folder.id,
          ).length;
          const isSelected = currentFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                isSelected
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted/70 text-foreground",
              )}
            >
              <span className="size-3.5 shrink-0" />
              {isSelected ? (
                <FolderOpen
                  className="size-4 shrink-0"
                  style={{ color: folder.color }}
                />
              ) : (
                <Folder
                  className="size-4 shrink-0"
                  style={{ color: folder.color }}
                />
              )}
              <span className="flex-1 truncate text-left text-xs">
                {folder.name}
              </span>
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
          );
        })}

        <div className="mx-2 my-1.5 h-px bg-border/60" />

        <button
          onClick={() => onSelectFolder("shared")}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
            currentFolderId === "shared"
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted/70 text-foreground",
          )}
        >
          <span className="size-3.5 shrink-0" />
          <Share2 className="size-4 shrink-0 text-blue-500" />
          <span className="flex-1 truncate text-left">Shared with Me</span>
          {SHARED_WITH_ME.length > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "h-4 min-w-4 px-1 text-[10px] font-medium",
                currentFolderId === "shared" && "bg-primary/20 text-primary",
              )}
            >
              {SHARED_WITH_ME.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => onSelectFolder("trash")}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
            currentFolderId === "trash"
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
          onClick={onNewFolder}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          <FolderPlus className="size-3.5" />
          New Folder
        </button>
      </div>
    </div>
  );
}
