"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  addProjectDocument,
  deleteProjectDocument,
} from "@/src/lib/stores/projects-slice";
import type { Project } from "@/src/lib/types/projects";
import {
  PROJECT_DOCUMENT_CATEGORY_LABELS,
  type NewProjectDocument,
  type ProjectDocumentCategory,
} from "@/src/lib/types/project-documents";
import type { DocumentFileType } from "@/src/lib/types/documents";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";

const CATEGORIES = Object.keys(
  PROJECT_DOCUMENT_CATEGORY_LABELS,
) as ProjectDocumentCategory[];

const DOC_EXPORT_COLUMNS: ReportColumn<{
  name: string;
  category: ProjectDocumentCategory;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
}>[] = [
  { key: "name", header: "Document", value: (d) => d.name },
  {
    key: "category",
    header: "Category",
    value: (d) => PROJECT_DOCUMENT_CATEGORY_LABELS[d.category],
  },
  { key: "uploadedAt", header: "Uploaded", value: (d) => d.uploadedAt },
  { key: "uploadedBy", header: "Uploaded by", value: (d) => d.uploadedBy },
  {
    key: "fileSize",
    header: "Size (KB)",
    value: (d) => Math.round(d.fileSize / 1024),
  },
];

/** §11 — categorised documents for an HRIS rollout. */
export function DocumentsPanel({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const documents = useAppSelector((s) =>
    s.projects.documents.filter((d) => d.projectId === project.id),
  );
  const [categoryFilter, setCategoryFilter] = useState<
    ProjectDocumentCategory | "all"
  >("all");
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(
    () =>
      categoryFilter === "all"
        ? documents
        : documents.filter((d) => d.category === categoryFilter),
    [documents, categoryFilter],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as ProjectDocumentCategory | "all")}
        >
          <SelectTrigger className="h-9 w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {PROJECT_DOCUMENT_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5" onClick={() => setUploading(true)}>
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No documents yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Charter, requirements, migration plan, vendor contract and more.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="flex justify-end border-b border-border/40 bg-muted/30 px-3 py-2">
            <ExportMenu
              name={`${project.code}-documents`}
              title={`${project.name} — Documents`}
              columns={DOC_EXPORT_COLUMNS}
              rows={filtered}
              variant="outline"
              buttonClassName="h-7 text-xs"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Document</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Uploaded</th>
                  <th className="px-3 py-2 font-medium">By</th>
                  <th className="px-3 py-2 text-right font-medium">Size</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {d.name}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {PROJECT_DOCUMENT_CATEGORY_LABELS[d.category]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground">
                      {d.uploadedAt}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {d.uploadedBy}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {Math.round(d.fileSize / 1024)} KB
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          dispatch(deleteProjectDocument(d.id));
                          toast.success(`"${d.name}" deleted`);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        onUpload={(doc) => {
          dispatch(addProjectDocument({ projectId: project.id, document: doc }));
          toast.success(`"${doc.name}" uploaded`);
          setUploading(false);
        }}
      />
    </div>
  );
}

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (doc: NewProjectDocument) => void;
}

// Demo data only — there's no real file storage backing this module, so
// "upload" fabricates a filename/size the same way
// `src/components/hr/documents/index.tsx` does for the company-wide library.
function UploadDialog({ open, onClose, onUpload }: UploadDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProjectDocumentCategory>("other");
  const [fileType, setFileType] = useState<DocumentFileType>("pdf");
  const [description, setDescription] = useState("");
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setCategory("other");
      setFileType("pdf");
      setDescription("");
    }
  }

  function handleUpload() {
    if (name.trim().length < 2) {
      toast.error("Give the document a name.");
      return;
    }
    onUpload({
      name: name.trim(),
      fileType,
      category,
      description: description.trim() || undefined,
      fileSize: Math.round(100_000 + Math.random() * 900_000),
      uploadedBy: "You",
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ProjectDocumentCategory)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {PROJECT_DOCUMENT_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">File type</Label>
              <Select
                value={fileType}
                onValueChange={(v) => setFileType(v as DocumentFileType)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="doc">DOC</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="gap-1.5" onClick={handleUpload}>
            <Plus className="h-3.5 w-3.5" />
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
