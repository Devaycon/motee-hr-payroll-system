"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDocuments } from "./hooks";
import { FolderOpen, Upload, FolderPlus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  StatCards,
  matchesDocumentCardFilter,
  DOCUMENT_CARD_FILTER_LABELS,
  type DocumentCardFilter,
} from "./components/stat-cards";
import { FolderSidebar } from "./components/folder-sidebar";
import { DocumentGrid } from "./components/document-grid";
import { UploadModal } from "./components/upload-modal";
import { DocumentDetailModal } from "./components/document-detail-modal";
import { ShareModal } from "./components/share-modal";
import { CreateFolderModal } from "./components/create-folder-modal";
import { EmployeeDocumentsTab } from "./components/employee-documents-tab";
import { MyDocumentsTab } from "./components/my-documents-tab";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { FOLDERS as SEED_FOLDERS } from "./data";
import { useAppSelector, useAppDispatch } from "@/src/lib/stores/hooks";
import { dequeueSignedDocument } from "@/src/lib/stores/docu-sign-slice";
import type { SelfServiceDocumentSubmission } from "@/src/lib/stores/my-documents-slice";
import type { HRDocument, Folder, NewDocument, NewShare, DocumentCategory } from "./types";

const DOCU_SIGN_FOLDER_ID = "docu-sign-file";

/** §8 redesign — root folders that now have their own top-level area
 *  instead of sitting in the Company Documents tree. */
const COMPANY_DOCS_HIDDEN_ROOTS = ["per", "arch"];

/** §8.3 — maps a self-service submission's document kind to a document category. */
function categoryForDocType(docType: string): DocumentCategory {
  if (docType === "Right to Work") return "right_to_work";
  if (docType === "Certificate") return "certificate";
  return "id_card";
}

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
  const dispatch = useAppDispatch();
  const { data, loading } = useDocuments();
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const signedQueue = useAppSelector((s) => s.docuSign.queue);
  const selfServiceSubmissions = useAppSelector((s) => s.myDocuments.submissions);
  const pendingSelfServiceCount = selfServiceSubmissions.filter(
    (s) => s.status === "awaiting_review",
  ).length;
  const [activeArea, setActiveArea] = useState("company");

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

  // Docu-Sign tool saves land here as a queue (it's a separate route/page) —
  // file each one into the "docu-sign file" folder, then drain the queue so
  // it isn't re-added on the next mount.
  useEffect(() => {
    if (signedQueue.length === 0) return;
    setFolders((prev) =>
      prev.some((f) => f.id === DOCU_SIGN_FOLDER_ID)
        ? prev
        : [
            ...prev,
            {
              id: DOCU_SIGN_FOLDER_ID,
              name: "docu-sign file",
              type: "custom",
              createdAt: new Date().toISOString().split("T")[0],
              createdBy: "HR Admin",
            },
          ],
    );
    setDocuments((prev) => [
      ...signedQueue.map((q): HRDocument => {
        const uploadedAt = q.createdAt.split("T")[0];
        return {
          id: `DOC-SIGN-${q.id}`,
          name: q.name,
          fileType: q.fileType,
          category: "other",
          folderId: DOCU_SIGN_FOLDER_ID,
          fileSize: q.fileSize,
          uploadedAt,
          uploadedBy: q.createdBy,
          isArchived: false,
          versions: [
            {
              id: `V-DOC-SIGN-${q.id}-1`,
              version: 1,
              uploadedAt,
              uploadedBy: q.createdBy,
              fileSize: q.fileSize,
              notes: "Signed via Docu-Sign.",
            },
          ],
          shares: [],
          acknowledgements: [],
          fileUrl: q.fileUrl,
        };
      }),
      ...prev,
    ]);
    signedQueue.forEach((q) => dispatch(dequeueSignedDocument(q.id)));
  }, [signedQueue, dispatch]);

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

  /** Drill-down set by the KPI cards; "all" shows the folder as-is. */
  const [cardFilter, setCardFilter] = useState<DocumentCardFilter>("all");

  // The KPI cards count across every folder, so drilling in shows the whole
  // library narrowed to that slice rather than the folder currently open.
  const filteredDocuments =
    cardFilter === "all"
      ? getDocumentsForFolder(selectedFolderId, documents, folders)
      : documents.filter((d) => matchesDocumentCardFilter(d, cardFilter));

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

  /** §8.3 — HR approving a self-service submission files it onto the
   *  employee's own folder, the same place their other documents live. */
  function handleApproveSelfServiceDoc(submission: SelfServiceDocumentSubmission) {
    if (!submission.employeeId) return;
    const id = `DOC-SSD-${submission.id}`;
    const now = new Date().toISOString().split("T")[0];
    const fileType = /^(pdf|doc|docx|png|jpg|jpeg)$/.test(submission.ext)
      ? (submission.ext as HRDocument["fileType"])
      : "pdf";
    const newDoc: HRDocument = {
      id,
      name: submission.name,
      fileType,
      category: categoryForDocType(submission.docType),
      folderId: `emp-${submission.employeeId}`,
      fileSize: 0,
      expiryDate: submission.expiryDate,
      uploadedAt: now,
      uploadedBy: submission.employeeName,
      isArchived: false,
      versions: [
        {
          id: `V-${id}-1`,
          version: 1,
          uploadedAt: now,
          uploadedBy: submission.employeeName,
          fileSize: 0,
          notes: "Submitted via employee self-service, approved by HR.",
        },
      ],
      shares: [],
      acknowledgements: [],
    };
    setDocuments((prev) => [newDoc, ...prev]);
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
                  employeeId: data.employeeId,
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
        {activeArea === "company" && (
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
        )}
      </div>

      <StatCards
        documents={documents}
        cardFilter={cardFilter}
        onDrillDown={(filter) => {
          setCardFilter(filter);
          // These slices span folders, so clear the folder selection too.
          if (filter !== "all") setSelectedFolderId(null);
        }}
      />

      {cardFilter !== "all" && activeArea === "company" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {DOCUMENT_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              ({filteredDocuments.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All documents
          </Button>
        </div>
      )}

      {/* §8 redesign — "feels quite busy... duplication between Company
          Documents, Personnel/Employee Files, Contracts, Policies, and
          Certificates" reorganised by ownership/purpose: Company Documents,
          Employee Documents (search-first), My Documents (self-service
          review queue) and Archive each get one clear home. */}
      <Tabs value={activeArea} onValueChange={setActiveArea}>
        <PageTabsList
          tabs={[
            { value: "company", label: "Company Documents" },
            { value: "employee", label: "Employee Documents" },
            {
              value: "my-documents",
              label:
                pendingSelfServiceCount > 0
                  ? `My Documents (${pendingSelfServiceCount})`
                  : "My Documents",
            },
            { value: "archive", label: "Archive" },
          ]}
        />

        <TabsContent value="company" className="mt-4">
          <div
            className="flex overflow-hidden rounded-xl border border-border/60 bg-background"
            style={{ height: "calc(100vh - 380px)", minHeight: "440px" }}
          >
            <FolderSidebar
              folders={folders}
              documents={documents}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={() => setCreateFolderModalOpen(true)}
              hideRootIds={COMPANY_DOCS_HIDDEN_ROOTS}
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
        </TabsContent>

        <TabsContent value="employee" className="mt-4">
          <EmployeeDocumentsTab
            documents={documents}
            onView={handleViewDocument}
            onShare={handleShareDocument}
            onSign={handleSign}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="my-documents" className="mt-4">
          <MyDocumentsTab onApprove={handleApproveSelfServiceDoc} />
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          <div
            className="flex overflow-hidden rounded-xl border border-border/60 bg-background"
            style={{ height: "calc(100vh - 380px)", minHeight: "440px" }}
          >
            <DocumentGrid
              documents={documents.filter((d) => d.isArchived && !d.isTrashed)}
              folders={folders}
              selectedFolderId={null}
              onSelectFolder={() => {}}
              onView={handleViewDocument}
              onShare={handleShareDocument}
              onSign={handleSign}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              isTrashView={false}
              isSharedView={false}
            />
          </div>
        </TabsContent>
      </Tabs>

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
