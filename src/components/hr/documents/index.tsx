"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDocuments } from "./hooks";
import { FolderOpen, Upload, FolderPlus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { StatCards } from "./components/stat-cards";
import { FolderSidebar } from "./components/folder-sidebar";
import { DocumentGrid } from "./components/document-grid";
import { UploadModal } from "./components/upload-modal";
import { DocumentDetailModal } from "./components/document-detail-modal";
import { ShareModal } from "./components/share-modal";
import { CreateFolderModal } from "./components/create-folder-modal";
import { FOLDERS as SEED_FOLDERS } from "./data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { HRDocument, Folder, NewDocument, NewShare } from "./types";

function getDocumentsForFolder(
  folderId: string | null,
  documents: HRDocument[],
  folders: Folder[],
): HRDocument[] {
  if (folderId === "trash")
    return documents.filter((d) => d.isTrashed === true);
  if (folderId === "shared")
    return documents.filter((d) => !d.isTrashed && d.shares.length > 0);
  if (folderId === "arch")
    return documents.filter((d) => d.isArchived && !d.isTrashed);
  if (!folderId) return documents.filter((d) => !d.isArchived && !d.isTrashed);
  const childIds = folders
    .filter((f) => f.parentId === folderId)
    .map((f) => f.id);
  return documents.filter(
    (d) =>
      !d.isArchived &&
      !d.isTrashed &&
      (d.folderId === folderId || childIds.includes(d.folderId)),
  );
}

export function DocumentsPage() {
  const router = useRouter();
  const { data, loading } = useDocuments();
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);

  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>(SEED_FOLDERS);

  useEffect(() => {
    const employeeFolders: Folder[] = employees.map((emp) => ({
      id: `emp-${emp.id}`,
      name: emp.fullName,
      type: "custom" as const,
      parentId: "emp-files",
      createdAt: emp.startDate ?? new Date().toISOString().slice(0, 10),
      createdBy: "HR Admin",
    }));
    setFolders((prev) => {
      const seedIds = new Set(SEED_FOLDERS.map((f) => f.id));
      const empIds = new Set(employeeFolders.map((f) => f.id));
      const custom = prev.filter(
        (f) => !seedIds.has(f.id) && !empIds.has(f.id),
      );
      return [...SEED_FOLDERS, ...employeeFolders, ...custom];
    });
  }, [employees]);

  useEffect(() => {
    if (data) {
      setDocuments(data.documents);
      setFolders((prev) => {
        const ids = new Set(prev.map((f) => f.id));
        return [...prev, ...data.folders.filter((f) => !ids.has(f.id))];
      });
    }
  }, [data]);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<HRDocument | null>(
    null,
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingDocument, setSharingDocument] = useState<HRDocument | null>(
    null,
  );
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);

  function handleSign(doc: HRDocument) {
    const params = new URLSearchParams({
      name: doc.name,
      fileType: doc.fileType,
      back: "/operations/documents",
    });
    router.push(`/sign?${params.toString()}`);
  }

  const filteredDocuments = getDocumentsForFolder(
    selectedFolderId,
    documents,
    folders,
  );

  function handleUploadSave(data: NewDocument) {
    const id = `DOC-${String(documents.length + 1).padStart(3, "0")}`;
    const now = new Date().toISOString().split("T")[0];
    const newDoc: HRDocument = {
      ...data,
      id,
      uploadedAt: now,
      uploadedBy: "HR Admin",
      isArchived: false,
      versions: [
        {
          id: `V-${id}-1`,
          version: 1,
          uploadedAt: now,
          uploadedBy: "HR Admin",
          fileSize: data.fileSize,
          notes: "Initial upload.",
        },
      ],
      shares: [],
      assignment: data.assignment,
      requiresAcknowledgement: data.requiresAcknowledgement,
      acknowledgements: [],
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setUploadModalOpen(false);
  }

  function handleViewDocument(doc: HRDocument) {
    setViewingDocument(doc);
    setDetailModalOpen(true);
  }

  function handleShareDocument(doc: HRDocument) {
    setDetailModalOpen(false);
    setSharingDocument(doc);
    setShareModalOpen(true);
  }

  function handleShareSave(docId: string, data: NewShare) {
    const now = new Date().toISOString().split("T")[0];
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              shares: [
                ...d.shares,
                {
                  id: `SH-${docId}-${Date.now()}`,
                  employeeName: data.employeeName,
                  employeeInitials: data.employeeInitials,
                  permission: data.permission,
                  sharedAt: now,
                  sharedBy: "HR Admin",
                },
              ],
            }
          : d,
      ),
    );
    if (sharingDocument?.id === docId) {
      setSharingDocument(
        (prev) =>
          prev && {
            ...prev,
            shares: [
              ...prev.shares,
              {
                id: `SH-${docId}-${Date.now()}`,
                employeeName: data.employeeName,
                employeeInitials: data.employeeInitials,
                permission: data.permission,
                sharedAt: now,
                sharedBy: "HR Admin",
              },
            ],
          },
      );
    }
  }

  function handleRevokeShare(docId: string, shareId: string) {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, shares: d.shares.filter((s) => s.id !== shareId) }
          : d,
      ),
    );
    if (sharingDocument?.id === docId) {
      setSharingDocument(
        (prev) =>
          prev && {
            ...prev,
            shares: prev.shares.filter((s) => s.id !== shareId),
          },
      );
    }
  }

  function handleArchive(id: string) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isArchived: !d.isArchived } : d)),
    );
    setDetailModalOpen(false);
  }

  function handleDelete(id: string) {
    const today = new Date().toISOString().split("T")[0];
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isTrashed: true, trashedAt: today } : d,
      ),
    );
    setDetailModalOpen(false);
  }

  function handleRestore(id: string) {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isTrashed: false, trashedAt: undefined } : d,
      ),
    );
  }

  function handlePermanentDelete(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  function handleCreateFolder(name: string, parentId?: string) {
    const id = `custom-${Date.now()}`;
    const newFolder: Folder = {
      id,
      name,
      type: "custom",
      parentId,
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: "HR Admin",
    };
    setFolders((prev) => [...prev, newFolder]);
    setCreateFolderModalOpen(false);
  }

  if (loading && !documents.length) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-semibold">Documents & Compliance</h1>
            <p className="text-sm text-muted-foreground">
              Manage, organise, and share company documents securely.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCreateFolderModalOpen(true)}
          >
            <FolderPlus className="mr-2 size-4" />
            New Folder
          </Button>
          <Button size="lg" onClick={() => setUploadModalOpen(true)}>
            <Upload className="mr-2 size-4" />
            Upload
          </Button>
        </div>
      </div>

      <StatCards documents={documents} />

      <div
        className="flex overflow-hidden rounded-xl border border-border/60 bg-background"
        style={{ height: "calc(100vh - 310px)", minHeight: "480px" }}
      >
        <FolderSidebar
          folders={folders}
          documents={documents}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={() => setCreateFolderModalOpen(true)}
          sharedCount={
            documents.filter((d) => !d.isTrashed && d.shares.length > 0).length
          }
          trashCount={documents.filter((d) => d.isTrashed === true).length}
        />
        <DocumentGrid
          documents={filteredDocuments}
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onView={handleViewDocument}
          onShare={handleShareDocument}
          onSign={handleSign}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          isTrashView={selectedFolderId === "trash"}
          isSharedView={selectedFolderId === "shared"}
        />
      </div>

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folders={folders}
        defaultFolderId={selectedFolderId ?? undefined}
        onSave={handleUploadSave}
      />

      <DocumentDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setViewingDocument(null);
        }}
        document={viewingDocument}
        folders={folders}
        onShare={handleShareDocument}
        onArchive={handleArchive}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSharingDocument(null);
        }}
        document={sharingDocument}
        onShare={handleShareSave}
        onRevokeShare={handleRevokeShare}
      />

      <CreateFolderModal
        open={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        folders={folders}
        onSave={handleCreateFolder}
      />
    </div>
  );
}
