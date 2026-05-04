"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import {
  UploadCloud,
  X,
  FileText,
  Image,
  File,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_OPTIONS,
  FILE_TYPE_STYLES,
  FILE_TYPE_LABELS,
} from "../data";
import type {
  Folder,
  DocumentFileType,
  DocumentCategory,
  NewDocument,
} from "../types";

const ACCEPTED_TYPES: Record<string, DocumentFileType> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const uploadSchema = z.object({
  name: z.string().min(2, { message: "Document name is required." }),
  category: z.enum(
    ["id_card", "contract", "policy", "certificate", "report", "other"],
    { message: "Category is required." },
  ),
  folderId: z.string().min(1, { message: "Folder is required." }),
  description: z.string().optional(),
  expiryDate: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;
type UploadErrors = Partial<Record<keyof UploadForm, string>>;

interface SelectedFile {
  name: string;
  size: number;
  fileType: DocumentFileType;
}

function getInitial(defaultFolderId?: string): UploadForm {
  return {
    name: "",
    category: "policy",
    folderId: defaultFolderId ?? "",
    description: "",
    expiryDate: "",
  };
}

function getFileIcon(fileType: DocumentFileType) {
  if (fileType === "png" || fileType === "jpg" || fileType === "jpeg")
    return Image;
  if (fileType === "pdf" || fileType === "doc" || fileType === "docx")
    return FileText;
  return File;
}

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  defaultFolderId?: string;
  onSave: (data: NewDocument) => void;
}

export function UploadModal({
  open,
  onClose,
  folders,
  defaultFolderId,
  onSave,
}: UploadModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevFolder, setPrevFolder] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<UploadForm>(getInitial(defaultFolderId));
  const [errors, setErrors] = useState<UploadErrors>({});
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (open !== prevOpen || defaultFolderId !== prevFolder) {
    setPrevOpen(open);
    setPrevFolder(defaultFolderId);
    if (open) {
      setForm(getInitial(defaultFolderId));
      setErrors({});
      setSelectedFile(null);
      setFileError(null);
    }
  }

  function set<K extends keyof UploadForm>(key: K, value: UploadForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function processFile(file: File) {
    setFileError(null);
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File exceeds the 5 MB limit.");
      return;
    }
    const fileType = ACCEPTED_TYPES[file.type];
    if (!fileType) {
      setFileError("Unsupported file type. Use PDF, DOC, DOCX, PNG, or JPG.");
      return;
    }
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setSelectedFile({ name: file.name, size: file.size, fileType });
    if (!form.name) {
      set("name", baseName);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleSubmit() {
    const result = uploadSchema.safeParse(form);
    if (!result.success) {
      const errs: UploadErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof UploadForm;
        if (!errs[field]) errs[field] = issue.message;
      }
      setErrors(errs);
      return;
    }
    if (!selectedFile) {
      setFileError("Please select a file to upload.");
      return;
    }
    const d = result.data;
    onSave({
      name: d.name,
      fileType: selectedFile.fileType,
      category: d.category as DocumentCategory,
      folderId: d.folderId,
      description: d.description || undefined,
      fileSize: selectedFile.size,
      expiryDate: d.expiryDate || undefined,
    });
  }

  const nonArchiveFolders = folders.filter((f) => f.id !== "arch");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle>Upload Document</DialogTitle>
          <p className="text-sm text-muted-foreground">
            PDF, DOC, DOCX, PNG, JPG · Max 5 MB per file
          </p>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto px-6 pb-2 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border/60 hover:border-border hover:bg-muted/30",
              selectedFile && "border-solid border-border/60 bg-muted/20 py-4",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileInput}
            />
            {selectedFile ? (
              <div className="flex w-full items-center gap-3">
                {(() => {
                  const typeStyle = FILE_TYPE_STYLES[selectedFile.fileType];
                  const TypeIcon = getFileIcon(selectedFile.fileType);
                  return (
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${typeStyle.bg}`}
                    >
                      <TypeIcon className={`size-5 ${typeStyle.text}`} />
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {FILE_TYPE_LABELS[selectedFile.fileType]} ·{" "}
                    {selectedFile.size < 1024 * 1024
                      ? `${Math.round(selectedFile.size / 1024)} KB`
                      : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setFileError(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <UploadCloud className="size-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drop your file here, or{" "}
                    <span className="text-primary">browse</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    PDF, DOC, DOCX, PNG, JPG, JPEG up to 5 MB
                  </p>
                </div>
              </>
            )}
          </div>
          {fileError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">{fileError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="doc-name">Document Name</Label>
              <Input
                id="doc-name"
                placeholder="e.g. Employee Handbook 2026"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as DocumentCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {DOCUMENT_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Folder</Label>
              <Select
                value={form.folderId}
                onValueChange={(v) => set("folderId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  {nonArchiveFolders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.parentId ? `  ${f.name}` : f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.folderId && (
                <p className="text-xs text-destructive">{errors.folderId}</p>
              )}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="doc-desc">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="doc-desc"
                placeholder="Brief description of this document..."
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="expiry-date">
                Expiry Date{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={form.expiryDate}
                onChange={(e) => set("expiryDate", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                An automated reminder will be sent before the expiry date.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            <UploadCloud className="mr-2 size-4" />
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
