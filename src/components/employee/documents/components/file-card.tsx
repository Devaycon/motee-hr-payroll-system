import {
  Check,
  CheckCircle2,
  Download,
  Eye,
  FolderInput,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import { daysUntilExpiry } from "../data";
import { FileIcon } from "./file-icon";
import type { EmployeeDocument } from "../types";

export function FileCard({
  doc,
  onAckShared,
  sharedAcked = false,
  onPreview,
  onMove,
  onDelete,
  onRestore,
  isTrashView = false,
  isSharedView = false,
}: {
  doc: EmployeeDocument;
  onAckShared: (id: string) => void;
  sharedAcked?: boolean;
  onPreview: (doc: EmployeeDocument) => void;
  onMove: (doc: EmployeeDocument) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  isTrashView?: boolean;
  isSharedView?: boolean;
}) {
  const daysLeft = doc.expiryDate ? daysUntilExpiry(doc.expiryDate) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 90;

  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-[#7F77DD]/40 hover:shadow-sm transition-all flex flex-col">
      <div className="p-3 flex flex-col items-center gap-2 flex-1">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-40">
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={() => onPreview(doc)}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2">
                <Download className="w-3.5 h-3.5" /> Download
              </DropdownMenuItem>
              {!isTrashView && !isSharedView && (
                <DropdownMenuItem
                  className="text-xs gap-2"
                  onClick={() => onMove(doc)}
                >
                  <FolderInput className="w-3.5 h-3.5" /> Move to Folder
                </DropdownMenuItem>
              )}
              {isSharedView && !sharedAcked && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs gap-2 text-amber-600 focus:text-amber-600"
                    onClick={() => onAckShared(doc.id)}
                  >
                    <Check className="w-3.5 h-3.5" /> Acknowledge
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              {isTrashView ? (
                <>
                  <DropdownMenuItem
                    className="text-xs gap-2 text-[#1D9E75] focus:text-[#1D9E75]"
                    onClick={() => onRestore?.(doc.id)}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs gap-2 text-red-500 focus:text-red-500"
                    onClick={() => onDelete(doc.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                  </DropdownMenuItem>
                </>
              ) : !isSharedView ? (
                <DropdownMenuItem
                  className="text-xs gap-2 text-red-500 focus:text-red-500"
                  onClick={() => onDelete(doc.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 mb-1">
          <FileIcon ext={doc.ext} size="md" />
        </div>

        <p className="text-[11px] font-medium text-foreground text-center line-clamp-2 leading-tight w-full">
          {doc.name}
        </p>

        <p className="text-[10px] text-muted-foreground">{doc.fileSize}</p>
      </div>

      {(isExpired || expiringSoon) && (
        <div
          className={cn(
            "px-2 py-1 text-center text-[9px] font-semibold",
            isExpired
              ? "bg-red-500/10 text-red-600"
              : "bg-amber-500/10 text-amber-600",
            !isSharedView && "rounded-b-xl",
          )}
        >
          {isExpired ? "EXPIRED" : `EXPIRES IN ${daysLeft}D`}
        </div>
      )}

      {isSharedView && !isTrashView && (
        <div className={cn("px-3 pb-3", !isExpired && !expiringSoon && "pt-1")}>
          {sharedAcked ? (
            <div className="flex items-center justify-center gap-1 rounded-lg bg-[#1D9E75]/10 py-1.5 text-[10px] font-semibold text-[#1D9E75]">
              <CheckCircle2 className="w-3 h-3" /> Acknowledged
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full h-7 text-[10px] bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => onAckShared(doc.id)}
            >
              <Check className="w-3 h-3 mr-1" /> Acknowledge
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
