"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  X,
  Check,
  Folder,
  FolderPlus,
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
  FolderInput,
  Trash2,
  Home,
  Plus,
  Share2,
  RotateCcw,
  Files,
  LayoutGrid,
  List,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Textarea } from "@/src/components/ui/textarea";
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
  DOCUMENTS as HR_DOCUMENTS,
  DOCUMENT_CATEGORY_LABELS,
} from "@/src/data/documents-demo";
import type { HRDocument } from "@/src/lib/types/documents";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface DocFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  isTrashed?: boolean;
}

type FileExt = "pdf" | "docx" | "xlsx" | "png" | "jpg" | "txt" | "other";

interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  ext: FileExt;
  folderId: string | null;
  uploadedBy: "hr" | "employee";
  uploadedAt: string;
  fileSize: string;
  expiryDate?: string;
  requiresAck: boolean;
  acknowledged: boolean;
  isTrashed?: boolean;
  isShared?: boolean;
}

// â”€â”€â”€ File type icons (SVG-based coloured badges) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EXT_CONFIG: Record<FileExt, { bg: string; text: string; label: string }> =
  {
    pdf: { bg: "#EF4444", text: "#fff", label: "PDF" },
    docx: { bg: "#2563EB", text: "#fff", label: "DOC" },
    xlsx: { bg: "#16A34A", text: "#fff", label: "XLS" },
    png: { bg: "#7C3AED", text: "#fff", label: "PNG" },
    jpg: { bg: "#DB2777", text: "#fff", label: "JPG" },
    txt: { bg: "#6B7280", text: "#fff", label: "TXT" },
    other: { bg: "#7F77DD", text: "#fff", label: "FILE" },
  };

function FileIcon({
  ext,
  size = "md",
}: {
  ext: FileExt;
  size?: "sm" | "md" | "lg";
}) {
  const cfg = EXT_CONFIG[ext];
  const dims =
    size === "sm" ? "w-8 h-10" : size === "lg" ? "w-14 h-18" : "w-10 h-12";
  const labelSize =
    size === "sm" ? "text-[7px]" : size === "lg" ? "text-[11px]" : "text-[8px]";
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-sm overflow-hidden shrink-0",
        dims,
      )}
      style={{ background: `${cfg.bg}18`, border: `1.5px solid ${cfg.bg}40` }}
    >
      <div
        className="absolute top-0 right-0 w-0 h-0"
        style={{
          borderTop: `8px solid ${cfg.bg}30`,
          borderLeft: "8px solid transparent",
        }}
      />
      <div className="flex-1" />
      <div
        className="w-full py-0.5 flex items-center justify-center"
        style={{ background: cfg.bg }}
      >
        <span
          className={cn("font-bold tracking-wide", labelSize)}
          style={{ color: cfg.text }}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

// â”€â”€â”€ Folder colour presets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FOLDER_COLORS = [
  { label: "Purple", value: "#7F77DD" },
  { label: "Blue", value: "#2563EB" },
  { label: "Green", value: "#16A34A" },
  { label: "Amber", value: "#D97706" },
  { label: "Red", value: "#DC2626" },
  { label: "Pink", value: "#DB2777" },
];

// â”€â”€â”€ Demo data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DEMO_FOLDERS: DocFolder[] = [
  {
    id: "f-001",
    name: "Contracts & Agreements",
    color: "#7F77DD",
    createdAt: "2022-03-15",
  },
  { id: "f-002", name: "Policies", color: "#D97706", createdAt: "2022-03-15" },
  {
    id: "f-003",
    name: "Identity Documents",
    color: "#2563EB",
    createdAt: "2022-03-15",
  },
  {
    id: "f-004",
    name: "Certificates",
    color: "#16A34A",
    createdAt: "2022-03-15",
  },
  { id: "f-005", name: "Payslips", color: "#DB2777", createdAt: "2022-03-15" },
];

const DEMO_DOCUMENTS: EmployeeDocument[] = [
  {
    id: "d-001",
    name: "Employment Contract â€” March 2022",
    type: "Contract",
    ext: "pdf",
    folderId: "f-001",
    uploadedBy: "hr",
    uploadedAt: "2022-03-15",
    fileSize: "245 KB",
    requiresAck: true,
    acknowledged: true,
  },
  {
    id: "d-002",
    name: "Offer Letter â€” Software Engineer",
    type: "Offer Letter",
    ext: "docx",
    folderId: "f-001",
    uploadedBy: "hr",
    uploadedAt: "2022-03-01",
    fileSize: "120 KB",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-003",
    name: "Signed Remote Work Agreement",
    type: "Policy",
    ext: "pdf",
    folderId: "f-001",
    uploadedBy: "hr",
    uploadedAt: "2023-09-01",
    fileSize: "88 KB",
    requiresAck: true,
    acknowledged: true,
  },
  {
    id: "d-004",
    name: "Updated Leave & Absence Policy",
    type: "Policy",
    ext: "pdf",
    folderId: "f-002",
    uploadedBy: "hr",
    uploadedAt: "2026-03-08",
    fileSize: "98 KB",
    requiresAck: true,
    acknowledged: false,
  },
  {
    id: "d-005",
    name: "Code of Conduct Policy",
    type: "Policy",
    ext: "docx",
    folderId: "f-002",
    uploadedBy: "hr",
    uploadedAt: "2024-01-10",
    fileSize: "210 KB",
    requiresAck: true,
    acknowledged: true,
  },
  {
    id: "d-006",
    name: "National ID â€” NIN",
    type: "Identity",
    ext: "jpg",
    folderId: "f-003",
    uploadedBy: "employee",
    uploadedAt: "2022-03-15",
    fileSize: "55 KB",
    expiryDate: "2030-03-15",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-007",
    name: "Driver's License",
    type: "Identity",
    ext: "png",
    folderId: "f-003",
    uploadedBy: "employee",
    uploadedAt: "2024-07-05",
    fileSize: "62 KB",
    expiryDate: "2026-07-05",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-008",
    name: "International Passport",
    type: "Identity",
    ext: "jpg",
    folderId: "f-003",
    uploadedBy: "employee",
    uploadedAt: "2023-04-12",
    fileSize: "80 KB",
    expiryDate: "2028-04-12",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-009",
    name: "AWS Solutions Architect Certificate",
    type: "Certificate",
    ext: "pdf",
    folderId: "f-004",
    uploadedBy: "employee",
    uploadedAt: "2025-06-20",
    fileSize: "180 KB",
    expiryDate: "2027-06-20",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-010",
    name: "Performance Review â€” Q4 2025",
    type: "HR File",
    ext: "docx",
    folderId: null,
    uploadedBy: "hr",
    uploadedAt: "2026-01-15",
    fileSize: "145 KB",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-011",
    name: "Employee Handbook 2026",
    type: "Policy",
    ext: "pdf",
    folderId: null,
    uploadedBy: "hr",
    uploadedAt: "2026-01-02",
    fileSize: "320 KB",
    requiresAck: true,
    acknowledged: false,
  },
];

const MY_EMPLOYEE = "Adaeze Okonkwo";

function hrFileTypeToExt(ft: string): FileExt {
  if (ft === "doc") return "docx";
  if (ft === "jpeg") return "jpg";
  const valid: FileExt[] = ["pdf", "docx", "xlsx", "png", "jpg", "txt"];
  return valid.includes(ft as FileExt) ? (ft as FileExt) : "other";
}

function formatFileBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SHARED_WITH_ME: EmployeeDocument[] = HR_DOCUMENTS.filter(
  (d: HRDocument) => d.shares.some((s) => s.employeeName === MY_EMPLOYEE),
).map((d: HRDocument) => ({
  id: `shared-${d.id}`,
  name: d.name,
  type: DOCUMENT_CATEGORY_LABELS[d.category],
  ext: hrFileTypeToExt(d.fileType),
  folderId: "shared",
  uploadedBy: "hr" as const,
  uploadedAt: d.uploadedAt,
  fileSize: formatFileBytes(d.fileSize),
  expiryDate: d.expiryDate,
  requiresAck: false,
  acknowledged: false,
  isShared: true,
}));

function daysUntilExpiry(date: string) {
  return Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DOC_TYPES = [
  "All Types",
  "Contract",
  "Offer Letter",
  "Policy",
  "Certificate",
  "Identity",
  "HR File",
];

const EXT_OPTIONS: { label: string; value: FileExt }[] = [
  { label: "PDF (.pdf)", value: "pdf" },
  { label: "Word (.docx)", value: "docx" },
  { label: "Excel (.xlsx)", value: "xlsx" },
  { label: "Image PNG (.png)", value: "png" },
  { label: "Image JPG (.jpg)", value: "jpg" },
  { label: "Text (.txt)", value: "txt" },
  { label: "Other", value: "other" },
];

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function MyDocumentsPage() {
  const [docs, setDocs] = useState<EmployeeDocument[]>(DEMO_DOCUMENTS);
  const [folders, setFolders] = useState<DocFolder[]>(DEMO_FOLDERS);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("");
  const [uploadExt, setUploadExt] = useState<FileExt>("pdf");
  const [uploadFolder, setUploadFolder] = useState<string>("none");
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadDone, setUploadDone] = useState(false);

  // Request state
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqType, setReqType] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [reqDone, setReqDone] = useState(false);

  // New folder state
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0].value);

  // Move state
  const [moveDoc, setMoveDoc] = useState<EmployeeDocument | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string>("none");

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // â”€â”€ Derived â”€â”€

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
  const trashedFolderCount = folders.filter((f) => f.isTrashed).length;

  // â”€â”€ Handlers â”€â”€

  function handleAcknowledge(id: string) {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, acknowledged: true } : d)),
    );
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

  function handleRestoreFolder(id: string) {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isTrashed: false } : f)),
    );
    setDocs((prev) =>
      prev.map((d) =>
        d.folderId === id && d.isTrashed ? { ...d, isTrashed: false } : d,
      ),
    );
  }

  function handlePermanentDeleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setDocs((prev) => prev.filter((d) => d.folderId !== id));
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
      fileSize: "â€”",
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

  // â”€â”€ Render â”€â”€

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">My Documents</h1>
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

      {/* Stat cards */}
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

      {/* Pending acknowledgement banner */}
      {pendingAck > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Clock className="size-4 shrink-0 text-amber-600" />
          <p className="flex-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            You have <span className="font-bold">{pendingAck}</span> document
            {pendingAck > 1 ? "s" : ""} requiring your acknowledgement.
          </p>
        </div>
      )}

      {/* Split panel */}
      <div
        className="flex overflow-hidden rounded-xl border border-border/60 bg-background"
        style={{ height: "calc(100vh - 330px)", minHeight: "480px" }}
      >
        {/* Sidebar */}
        <div className="flex w-56 shrink-0 flex-col border-r border-border/60 bg-card/50">
          <div className="flex items-center justify-between px-3 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Folders
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setNewFolderOpen(true)}
            >
              <FolderPlus className="size-3.5" />
            </Button>
          </div>

          <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
            <button
              onClick={() => setCurrentFolderId(null)}
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
                  onClick={() => setCurrentFolderId(folder.id)}
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
              onClick={() => setCurrentFolderId("shared")}
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
                    currentFolderId === "shared" &&
                      "bg-primary/20 text-primary",
                  )}
                >
                  {SHARED_WITH_ME.length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setCurrentFolderId("trash")}
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
              onClick={() => setNewFolderOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <FolderPlus className="size-3.5" />
              New Folder
            </button>
          </div>
        </div>

        {/* Document panel */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Breadcrumb + view toggle */}
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

          {/* Search + filter */}
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
              {visibleDocs.length} document
              {visibleDocs.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-4">
            {isTrashView && (
              <p className="mb-3 text-xs text-muted-foreground">
                Items in the trash will be permanently deleted after 30 days.
              </p>
            )}

            {/* Root: folders grid + unfiled */}
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
                            onAck={handleAcknowledge}
                            onPreview={setPreviewDoc}
                            onMove={openMove}
                            onDelete={handleDeleteDoc}
                          />
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Folder / search / trash / shared view */}
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
                        onAck={handleAcknowledge}
                        onPreview={setPreviewDoc}
                        onMove={
                          isTrashView || isSharedView ? () => {} : openMove
                        }
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
                                  â€”
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
                                  {!isTrashView &&
                                    doc.requiresAck &&
                                    !doc.acknowledged && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-amber-600 focus:text-amber-600"
                                          onClick={() =>
                                            handleAcknowledge(doc.id)
                                          }
                                        >
                                          <Check className="mr-2 size-4" />
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

      {/* â”€â”€ Create Folder Modal â”€â”€ */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
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
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
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
                      newFolderColor === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent",
                    )}
                    style={{ background: c.value }}
                    onClick={() => setNewFolderColor(c.value)}
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
              onClick={() => setNewFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Upload Modal â”€â”€ */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
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
          {uploadDone ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-[#1D9E75]">
                âœ“ Document uploaded successfully
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Document name</p>
                <Input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. National ID â€” NIN"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium">Document type</p>
                  <Select value={uploadType} onValueChange={setUploadType}>
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
                    value={uploadExt}
                    onValueChange={(v) => setUploadExt(v as FileExt)}
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
                <Select value={uploadFolder} onValueChange={setUploadFolder}>
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
                  value={uploadExpiry}
                  onChange={(e) => setUploadExpiry(e.target.value)}
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
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Brief descriptionâ€¦"
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
          {!uploadDone && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setUploadOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
                onClick={handleUploadSubmit}
                disabled={!uploadName || !uploadType}
              >
                Upload
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Request Document Modal â”€â”€ */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
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
          {reqDone ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-[#1D9E75]">
                âœ“ Request sent to HR
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You&apos;ll receive a notification when it&apos;s ready.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Document type</p>
                <Select value={reqType} onValueChange={setReqType}>
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
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  placeholder="Any specific requirements or context for HRâ€¦"
                  className="text-xs min-h-20 resize-none"
                />
              </div>
            </div>
          )}
          {!reqDone && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setRequestOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
                onClick={handleRequestSubmit}
                disabled={!reqType}
              >
                Send Request
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Move to Folder Modal â”€â”€ */}
      <Dialog open={!!moveDoc} onOpenChange={() => setMoveDoc(null)}>
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
              onClick={() => setMoveFolderId("none")}
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
                onClick={() => setMoveFolderId(f.id)}
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
              onClick={() => setMoveDoc(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              onClick={handleMoveDoc}
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Preview Modal â”€â”€ */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {previewDoc && <FileIcon ext={previewDoc.ext} size="md" />}
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold truncate">
                  {previewDoc?.name}
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {previewDoc?.type} Â· {previewDoc?.fileSize} Â·{" "}
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
              onClick={() => setPreviewDoc(null)}
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
    </div>
  );
}

// â”€â”€â”€ File card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FileCard({
  doc,
  onAck,
  onPreview,
  onMove,
  onDelete,
  onRestore,
  isTrashView = false,
  isSharedView = false,
}: {
  doc: EmployeeDocument;
  onAck: (id: string) => void;
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
        {/* Actions dropdown */}
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
              {!isTrashView && doc.requiresAck && !doc.acknowledged && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs gap-2 text-amber-600 focus:text-amber-600"
                    onClick={() => onAck(doc.id)}
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

        {/* File icon */}
        <div className="mt-2 mb-1">
          <FileIcon ext={doc.ext} size="md" />
        </div>

        {/* Name */}
        <p className="text-[11px] font-medium text-foreground text-center line-clamp-2 leading-tight w-full">
          {doc.name}
        </p>

        {/* Meta */}
        <p className="text-[10px] text-muted-foreground">{doc.fileSize}</p>
      </div>

      {/* Status strip */}
      {(isExpired ||
        expiringSoon ||
        (doc.requiresAck && !doc.acknowledged) ||
        (doc.requiresAck && doc.acknowledged)) && (
        <div
          className={cn(
            "rounded-b-xl px-2 py-1 text-center text-[9px] font-semibold",
            isExpired
              ? "bg-red-500/10 text-red-600"
              : expiringSoon
                ? "bg-amber-500/10 text-amber-600"
                : doc.requiresAck && !doc.acknowledged
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-[#1D9E75]/10 text-[#1D9E75]",
          )}
        >
          {isExpired ? (
            "EXPIRED"
          ) : expiringSoon ? (
            `EXPIRES IN ${daysLeft}D`
          ) : doc.requiresAck && !doc.acknowledged ? (
            "NEEDS ACK"
          ) : (
            <span className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> ACKNOWLEDGED
            </span>
          )}
        </div>
      )}
    </div>
  );
}
