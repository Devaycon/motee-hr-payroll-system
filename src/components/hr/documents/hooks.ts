"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  categoryToApi,
  documentToRequest,
  mapFolders,
  toDocument,
  type FolderIds,
} from "@/src/lib/documents/api-mapping";
import type {
  Folder,
  HRDocument,
  NewDocument,
  NewShare,
} from "@/src/lib/types/documents";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetAllDocumentsQuery } from "@/src/store/services/collections";
import {
  documentsApi,
  useAddDocumentVersionMutation,
  useDeleteDocumentFolderMutation,
  useRenameDocumentFolderMutation,
  useUpdateDocumentMutation,
  useArchiveDocumentMutation,
  useCreateDocumentFolderMutation,
  useCreateDocumentMutation,
  useGetDocumentFoldersQuery,
  useRestoreDocumentMutation,
  useShareDocumentMutation,
  useTrashDocumentMutation,
  useUnshareDocumentMutation,
} from "@/src/store/services/documents";
import { useUploadFileMutation } from "@/src/store/services/files";

interface DocumentsData {
  documents: HRDocument[];
  folders: Folder[];
}

function useDepartmentMaps() {
  const departments = useAppSelector((s) => s.locale.data?.departments);
  return useMemo(() => {
    const list = departments ?? [];
    return {
      idByName: new Map(list.map((d) => [d.name, d.id] as const)),
      nameById: new Map(list.map((d) => [d.id, d.name] as const)),
    };
  }, [departments]);
}

/** The library and its folders from the API, with the folder id mapping. */
export function useDocuments() {
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const documents = useGetAllDocumentsQuery(undefined, { skip });
  const folders = useGetDocumentFoldersQuery(undefined, { skip });
  const { nameById } = useDepartmentMaps();

  const mapped = useMemo(() => {
    if (!documents.data || !folders.data) return null;
    const folderDtos = folders.data.data ?? [];
    const { folders: uiFolders, ids } = mapFolders(folderDtos);
    const personal = new Set(
      folderDtos.filter((f) => f.type === "personal").map((f) => f.id),
    );
    const docs = documents.data
      .map((d) => toDocument(d, ids, nameById, personal))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return { data: { documents: docs, folders: uiFolders }, ids };
  }, [documents.data, folders.data, nameById]);

  const error = documents.error ?? folders.error;
  return {
    data: (mapped?.data ?? null) as DocumentsData | null,
    folderIds: mapped?.ids ?? null,
    loading: (documents.isLoading || folders.isLoading) && !mapped,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/** Each action resolves true once the server has accepted it. */
export function useDocumentActions(folderIds: FolderIds | null) {
  const { idByName } = useDepartmentMaps();
  const [upload] = useUploadFileMutation();
  const [createDocument] = useCreateDocumentMutation();
  const [createFolder] = useCreateDocumentFolderMutation();
  const [archive] = useArchiveDocumentMutation();
  const [trash] = useTrashDocumentMutation();
  const [restore] = useRestoreDocumentMutation();
  const [share] = useShareDocumentMutation();
  const [unshare] = useUnshareDocumentMutation();
  const [renameFolder] = useRenameDocumentFolderMutation();
  const [deleteFolder] = useDeleteDocumentFolderMutation();
  const [updateDocument] = useUpdateDocumentMutation();
  const [addVersion] = useAddDocumentVersionMutation();
  const dispatch = useAppDispatch();

  return useMemo(() => {
    const ids: FolderIds = folderIds ?? { toServer: new Map(), toUi: new Map() };
    const serverFolder = (uiId?: string) =>
      uiId ? (ids.toServer.get(uiId) ?? uiId) : undefined;
    const attempt = async (run: () => Promise<unknown>, fallback: string) => {
      try {
        await run();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
        return false;
      }
    };

    const uploadInto = async (input: NewDocument, file: File) => {
      const stored = await upload({ file, purpose: "companyDocument" }).unwrap();
      await createDocument({
        ...documentToRequest(input, ids, idByName),
        storedFileId: stored.data.id,
      }).unwrap();
    };

    return {
      upload(input: NewDocument, file: File) {
        return attempt(() => uploadInto(input, file), "Could not upload the document.");
      },

      /**
       * Files a document signed in the Docu-Sign tool, creating its folder the
       * first time one is filed. Resolves the folder used, or null on failure.
       */
      async fileSigned(
        input: Omit<NewDocument, "folderId">,
        file: File,
        folderName: string,
        existingFolderId?: string,
      ): Promise<string | null> {
        let folderId = existingFolderId ?? null;
        const ok = await attempt(async () => {
          folderId ??= (await createFolder({ name: folderName }).unwrap()).data.id;
          await uploadInto({ ...input, folderId }, file);
        }, "Could not file the signed document.");
        return ok ? folderId : null;
      },

      createFolder(name: string, parentId?: string) {
        return attempt(
          () =>
            createFolder({ name: name.trim(), parentId: serverFolder(parentId) ?? null }).unwrap(),
          "Could not create the folder.",
        );
      },

      /** Archiving is one-way on the API; restoring brings a document back. */
      toggleArchive(doc: HRDocument) {
        return attempt(
          () => (doc.isArchived ? restore(doc.id) : archive(doc.id)).unwrap(),
          doc.isArchived ? "Could not restore the document." : "Could not archive the document.",
        );
      },

      trash(id: string) {
        return attempt(() => trash(id).unwrap(), "Could not move the document to trash.");
      },

      restore(id: string) {
        return attempt(() => restore(id).unwrap(), "Could not restore the document.");
      },

      share(docId: string, input: NewShare) {
        if (!input.employeeId) {
          toast.error("Choose an employee to share with.");
          return Promise.resolve(false);
        }
        return attempt(
          () =>
            share({
              id: docId,
              body: {
                employeeId: input.employeeId as string,
                permission: input.permission === "view_only" ? "viewOnly" : "download",
              },
            }).unwrap(),
          "Could not share the document.",
        );
      },

      /** PUT /documents/folders/{id} */
      renameFolder(uiId: string, name: string) {
        const id = serverFolder(uiId) ?? uiId;
        return attempt(
          () => renameFolder({ id, body: { name: name.trim() } }).unwrap(),
          "Could not rename the folder.",
        );
      },

      /** DELETE /documents/folders/{id} */
      deleteFolder(uiId: string) {
        const id = serverFolder(uiId) ?? uiId;
        return attempt(() => deleteFolder(id).unwrap(), "Could not delete the folder.");
      },

      /**
       * PUT /documents/{id}. The update replaces every field, so the current
       * record is read first (GET /documents/{id}) and only the edited
       * details change.
       */
      updateDetails(
        id: string,
        patch: {
          name: string;
          category: HRDocument["category"];
          expiryDate?: string;
          description?: string;
        },
      ) {
        return attempt(async () => {
          const read = dispatch(
            documentsApi.endpoints.getDocument.initiate(id, { forceRefetch: true }),
          );
          let dto;
          try {
            dto = (await read.unwrap()).data;
          } finally {
            read.unsubscribe();
          }
          await updateDocument({
            id,
            body: {
              name: patch.name.trim(),
              category: categoryToApi(patch.category),
              folderId: dto.folderId,
              description: patch.description?.trim() || null,
              expiryDate: patch.expiryDate || null,
              assignment: dto.assignment,
              assignedDepartmentIds: dto.assignedDepartmentIds,
              requiresAcknowledgement: dto.requiresAcknowledgement,
            },
          }).unwrap();
        }, "Could not save the document.");
      },

      /** Uploads the file, then POST /documents/{id}/versions. */
      addVersion(id: string, file: File, notes?: string) {
        return attempt(async () => {
          const stored = await upload({ file, purpose: "companyDocument" }).unwrap();
          await addVersion({
            id,
            body: { storedFileId: stored.data.id, notes: notes?.trim() || null },
          }).unwrap();
        }, "Could not upload the new version.");
      },

      /** Share ids are the employee ids they were granted to. */
      revokeShare(docId: string, employeeId: string) {
        return attempt(
          () => unshare({ id: docId, employeeId }).unwrap(),
          "Could not revoke access.",
        );
      },
    };
  }, [
    folderIds,
    idByName,
    upload,
    createDocument,
    createFolder,
    archive,
    trash,
    restore,
    share,
    unshare,
    renameFolder,
    deleteFolder,
    updateDocument,
    addVersion,
    dispatch,
  ]);
}
