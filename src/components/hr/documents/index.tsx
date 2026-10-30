"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDocumentActions, useDocuments } from "./hooks";
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
import {
  NotIntegrated,
  notifyNotIntegrated,
} from "@/src/components/shared/not-integrated";
import { useAppSelector, useAppDispatch } from "@/src/lib/stores/hooks";
import { dequeueSignedDocument } from "@/src/lib/stores/docu-sign-slice";
import type { HRDocument, Folder, NewDocument, NewShare } from "./types";

const DOCU_SIGN_FOLDER_NAME = "docu-sign file";

/** §8 redesign — root folders that now have their own top-level area
 *  instead of sitting in the Company Documents tree. */
const COMPANY_DOCS_HIDDEN_ROOTS = ["per", "arch"];

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
  const { data, folderIds, loading } = useDocuments();
  const actions = useDocumentActions(folderIds);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const signedQueue = useAppSelector((s) => s.docuSign.queue);
  const selfServiceSubmissions = useAppSelector((s) => s.myDocuments.submissions);
  const pendingSelfServiceCount = selfServiceSubmissions.filter(
    (s) => s.status === "awaiting_review",
  ).length;
  const [activeArea, setActiveArea] = useState("company");

  const documents = useMemo(() => data?.documents ?? [], [data]);
  // Server folders, plus one per employee so their personal files have a
  // name to show wherever a folder is named.
  const folders = useMemo<Folder[]>(
    () => [
      ...(data?.folders ?? []),
      ...employees.map((emp) => ({
        id: `emp-${emp.id}`,
        name: emp.fullName,
        type: "custom" as const,
        parentId: "emp-files",
        createdAt: emp.startDate ?? "",
        createdBy: "HR Admin",
      })),
    ],
    [data, employees],
  );

  // Docu-Sign tool saves land here as a queue (it's a separate route/page) —
  // upload each one into the "docu-sign file" folder, then drain the queue so
  // it isn't filed twice.
  const filing = useRef(false);
  useEffect(() => {
    if (!signedQueue.length || !data || filing.current) return;
    filing.current = true;
    void (async () => {
      let folderId = data.folders.find((f) => f.name === DOCU_SIGN_FOLDER_NAME)?.id;
      for (const q of signedQueue) {
        const blob = await fetch(q.fileUrl).then((r) => r.blob());
        const file = new File([blob], `${q.name}.${q.fileType}`, { type: blob.type });
        const used = await actions.fileSigned(
          {
            name: q.name,
            fileType: q.fileType,
            category: "other",
            fileSize: q.fileSize,
            description: "Signed via Docu-Sign.",
          },
          file,
          DOCU_SIGN_FOLDER_NAME,
          folderId,
        );
        if (!used) break;
        // Created on the first filing; later ones in this batch reuse it.
        folderId = used;
        dispatch(dequeueSignedDocument(q.id));
      }
      filing.current = false;
    })();
  }, [signedQueue, data, actions, dispatch]);

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

  async function handleUploadSave(data: NewDocument, file: File) {
    if (!(await actions.upload(data, file))) return;
    toast.success("Document uploaded");
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

  async function handleShareSave(docId: string, data: NewShare) {
    if (await actions.share(docId, data)) toast.success("Document shared");
  }

  async function handleRevokeShare(docId: string, shareId: string) {
    if (await actions.revokeShare(docId, shareId)) toast.success("Access revoked");
  }

  async function handleArchive(id: string) {
    const doc = documents.find((d) => d.id === id);
    if (!doc || !(await actions.toggleArchive(doc))) return;
    toast.success(doc.isArchived ? "Document restored" : "Document archived");
    setDetailModalOpen(false);
  }

  async function handleDelete(id: string) {
    if (!(await actions.trash(id))) return;
    toast.success("Moved to trash");
    setDetailModalOpen(false);
  }

  async function handleRestore(id: string) {
    if (await actions.restore(id)) toast.success("Document restored");
  }

  /** The API keeps trashed documents; there is no permanent delete. */
  function handlePermanentDelete() {
    notifyNotIntegrated("Permanent delete");
  }

  async function handleCreateFolder(name: string, parentId?: string) {
    if (!(await actions.createFolder(name, parentId))) return;
    toast.success("Folder created");
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
          {/* The self-service review queue has no endpoint yet. */}
          <NotIntegrated label="Self-service document review">
            <MyDocumentsTab onApprove={() => {}} />
          </NotIntegrated>
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
