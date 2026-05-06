import {
  AlertTriangle,
  Download,
  FolderInput,
  FolderPlus,
  Home,
  Send,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import { FOLDER_COLORS, EXT_OPTIONS, formatDate } from "../data";
import { FileIcon } from "./file-icon";
import type { DocFolder, EmployeeDocument, FileExt } from "../types";

// ── New Folder Modal ──────────────────────────────────────────────────────────

interface NewFolderModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  color: string;
  onColorChange: (v: string) => void;
  onSubmit: () => void;
}

export function NewFolderModal({
  open,
  onOpenChange,
  name,
  onNameChange,
  color,
  onColorChange,
  onSubmit,
}: NewFolderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
              <FolderPlus className="w-4 h-4 text-[#7F77DD]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              New Folder
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium">Folder name</p>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Tax Documents"
              className="h-8 text-xs"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium">Colour</p>
            <div className="flex items-center gap-2 flex-wrap">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all border-2",
                    color === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ background: c.value }}
                  onClick={() => onColorChange(c.value)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
            onClick={onSubmit}
            disabled={!name.trim()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  ext: FileExt;
  onExtChange: (v: FileExt) => void;
  folder: string;
  onFolderChange: (v: string) => void;
  expiry: string;
  onExpiryChange: (v: string) => void;
  desc: string;
  onDescChange: (v: string) => void;
  done: boolean;
  folders: DocFolder[];
  onSubmit: () => void;
}

export function UploadModal({
  open,
  onOpenChange,
  name,
  onNameChange,
  type,
  onTypeChange,
  ext,
  onExtChange,
  folder,
  onFolderChange,
  expiry,
  onExpiryChange,
  desc,
  onDescChange,
  done,
  folders,
  onSubmit,
}: UploadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
              <Upload className="w-4 h-4 text-[#7F77DD]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Upload Document
            </DialogTitle>
          </div>
        </DialogHeader>
        {done ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-[#1D9E75]">
              ✔ Document uploaded successfully
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Document name</p>
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. National ID – NIN"
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Document type</p>
                <Select value={type} onValueChange={onTypeChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Contract",
                      "Offer Letter",
                      "Policy",
                      "Certificate",
                      "Identity",
                      "HR File",
                      "Other",
                    ].map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">File format</p>
                <Select
                  value={ext}
                  onValueChange={(v) => onExtChange(v as FileExt)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXT_OPTIONS.map((e) => (
                      <SelectItem
                        key={e.value}
                        value={e.value}
                        className="text-xs"
                      >
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">
                Save to folder{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </p>
              <Select value={folder} onValueChange={onFolderChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="No folder (unfiled)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    No folder (unfiled)
                  </SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">
                Expiry date{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </p>
              <Input
                type="date"
                value={expiry}
                onChange={(e) => onExpiryChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </p>
              <Textarea
                value={desc}
                onChange={(e) => onDescChange(e.target.value)}
                placeholder="Brief description…"
                className="text-xs min-h-14 resize-none"
              />
            </div>
            <div className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center py-5 gap-2 cursor-pointer hover:border-[#7F77DD]/50 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Click to select a file or drag and drop
              </p>
              <p className="text-[11px] text-muted-foreground/60">
                PDF, DOCX, PNG, JPG up to 10 MB
              </p>
            </div>
          </div>
        )}
        {!done && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              onClick={onSubmit}
              disabled={!name || !type}
            >
              Upload
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Request Document Modal ────────────────────────────────────────────────────

interface RequestModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: string;
  onTypeChange: (v: string) => void;
  note: string;
  onNoteChange: (v: string) => void;
  done: boolean;
  onSubmit: () => void;
}

export function RequestModal({
  open,
  onOpenChange,
  type,
  onTypeChange,
  note,
  onNoteChange,
  done,
  onSubmit,
}: RequestModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
              <Send className="w-4 h-4 text-[#7F77DD]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Request a Document from HR
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            HR will be notified and will upload the document to your profile.
          </p>
        </DialogHeader>
        {done ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-[#1D9E75]">
              ✔ Request sent to HR
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You&apos;ll receive a notification when it&apos;s ready.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Document type</p>
              <Select value={type} onValueChange={onTypeChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Employment Verification Letter",
                    "Salary Confirmation Letter",
                    "Reference Letter",
                    "Tax Certificate",
                    "Pension Statement",
                    "Other",
                  ].map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">
                Additional notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </p>
              <Textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Any specific requirements or context for HR…"
                className="text-xs min-h-20 resize-none"
              />
            </div>
          </div>
        )}
        {!done && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              onClick={onSubmit}
              disabled={!type}
            >
              Send Request
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Move to Folder Modal ──────────────────────────────────────────────────────

interface MoveModalProps {
  moveDoc: EmployeeDocument | null;
  onClose: () => void;
  folders: DocFolder[];
  moveFolderId: string;
  onMoveFolderIdChange: (v: string) => void;
  onSubmit: () => void;
}

export function MoveModal({
  moveDoc,
  onClose,
  folders,
  moveFolderId,
  onMoveFolderIdChange,
  onSubmit,
}: MoveModalProps) {
  return (
    <Dialog open={!!moveDoc} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
              <FolderInput className="w-4 h-4 text-[#7F77DD]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Move to Folder
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {moveDoc?.name}
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <button
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs transition-colors",
              moveFolderId === "none"
                ? "border-[#7F77DD] bg-[#7F77DD]/5 text-foreground font-medium"
                : "border-border text-muted-foreground hover:border-border/80",
            )}
            onClick={() => onMoveFolderIdChange("none")}
          >
            <Home className="w-4 h-4 shrink-0" /> Unfiled (no folder)
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs transition-colors",
                moveFolderId === f.id
                  ? "border-[#7F77DD] bg-[#7F77DD]/5 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-border/80",
              )}
              onClick={() => onMoveFolderIdChange(f.id)}
            >
              <svg
                width="20"
                height="16"
                viewBox="0 0 44 36"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M0 6C0 4.343 1.343 3 3 3H16L20 8H41C42.657 8 44 9.343 44 11V33C44 34.657 42.657 36 41 36H3C1.343 36 0 34.657 0 33V6Z"
                  fill={`${f.color}30`}
                />
                <path
                  d="M0 6C0 4.343 1.343 3 3 3H16L20 8H41C42.657 8 44 9.343 44 11V12H0V6Z"
                  fill={`${f.color}50`}
                />
              </svg>
              {f.name}
            </button>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
            onClick={onSubmit}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────

interface PreviewModalProps {
  previewDoc: EmployeeDocument | null;
  onClose: () => void;
}

export function PreviewModal({ previewDoc, onClose }: PreviewModalProps) {
  return (
    <Dialog open={!!previewDoc} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {previewDoc && <FileIcon ext={previewDoc.ext} size="md" />}
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold truncate">
                {previewDoc?.name}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {previewDoc?.type} · {previewDoc?.fileSize} ·{" "}
                {previewDoc ? formatDate(previewDoc.uploadedAt) : ""}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="py-2 flex flex-col gap-3">
          {previewDoc?.expiryDate && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Expires {formatDate(previewDoc.expiryDate)}</span>
            </div>
          )}
          <div className="h-52 rounded-lg bg-muted flex flex-col items-center justify-center gap-3">
            {previewDoc && <FileIcon ext={previewDoc.ext} size="lg" />}
            <p className="text-xs text-muted-foreground">
              Preview not available in demo
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={onClose}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Close
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
