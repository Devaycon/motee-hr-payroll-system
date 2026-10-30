import type {
  DocumentCategory as ApiCategory,
  DocumentDto,
  FolderDto,
} from "@/src/types/documents";
import type {
  DocumentCategory,
  DocumentFileType,
  Folder,
  HRDocument,
  NewDocument,
} from "@/src/lib/types/documents";
import { getInitials } from "@/src/lib/types/dashboard";

/**
 * The screens address a handful of folders by fixed id ("trash", "shared",
 * "arch" for the archive, "sys" and "per" for the two roots the sidebar opens
 * by default). Server folders of those kinds take the fixed id on the way in,
 * and requests translate back through `FolderIds`.
 */

export interface FolderIds {
  /** UI folder id → server folder id. */
  toServer: Map<string, string>;
  /** Server folder id → UI folder id. */
  toUi: Map<string, string>;
}

const FIXED_BY_TYPE: Partial<Record<FolderDto["type"], string>> = {
  trash: "trash",
  shared: "shared",
  archive: "arch",
};

export function mapFolders(dtos: FolderDto[]): {
  folders: Folder[];
  ids: FolderIds;
} {
  const toUi = new Map<string, string>();
  const taken = new Set<string>();
  const claim = (dto: FolderDto, uiId: string) => {
    if (taken.has(uiId)) return false;
    taken.add(uiId);
    toUi.set(dto.id, uiId);
    return true;
  };

  for (const dto of dtos) {
    const fixed = FIXED_BY_TYPE[dto.type];
    if (fixed && claim(dto, fixed)) continue;
    if (!dto.parentId && dto.type === "system" && claim(dto, "sys")) continue;
    if (!dto.parentId && dto.type === "personal" && claim(dto, "per")) continue;
    toUi.set(dto.id, dto.id);
  }

  const toServer = new Map([...toUi].map(([server, ui]) => [ui, server]));
  const folders: Folder[] = dtos.map((dto) => ({
    id: toUi.get(dto.id) ?? dto.id,
    name: dto.name,
    type: dto.type,
    parentId: dto.parentId ? (toUi.get(dto.parentId) ?? dto.parentId) : undefined,
    createdAt: "",
    createdBy: dto.type === "system" ? "System" : "HR Admin",
  }));

  return { folders, ids: { toServer, toUi } };
}

const CATEGORY_FROM_API: Record<ApiCategory, DocumentCategory> = {
  policy: "policy",
  contract: "contract",
  handbook: "policy",
  form: "other",
  certificate: "certificate",
  report: "report",
  other: "other",
};

/** ID cards and right-to-work have no category of their own on the API. */
export function categoryToApi(category: DocumentCategory): ApiCategory {
  switch (category) {
    case "policy":
    case "contract":
    case "certificate":
    case "report":
      return category;
    default:
      return "other";
  }
}

function fileTypeOf(name: string): DocumentFileType {
  const ext = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase();
  if (ext && /^(pdf|doc|docx|png|jpg|jpeg)$/.test(ext)) {
    return ext as DocumentFileType;
  }
  return "pdf";
}

export function toDocument(
  dto: DocumentDto,
  ids: FolderIds,
  departmentNameById: Map<string, string>,
  /**
   * The employee whose personal file this is, when it sits in a personal
   * folder and is shared with exactly one person. Those documents are shown
   * on that employee's folder in the Employee Documents tab.
   */
  personalFolderIds: Set<string>,
): HRDocument {
  const versions = [...dto.versions].sort((a, b) => a.version - b.version);
  const latest = versions[versions.length - 1];
  const uploadedAt = (latest?.uploadedAt ?? dto.createdAt).slice(0, 10);
  const owner =
    personalFolderIds.has(dto.folderId) && dto.shares.length === 1
      ? dto.shares[0].employeeId
      : null;

  return {
    id: dto.id,
    name: dto.name,
    fileType: fileTypeOf(dto.name),
    category: CATEGORY_FROM_API[dto.category],
    folderId: owner ? `emp-${owner}` : (ids.toUi.get(dto.folderId) ?? dto.folderId),
    description: dto.description ?? undefined,
    fileSize: latest?.sizeBytes ?? 0,
    expiryDate: dto.expiryDate ?? undefined,
    uploadedAt,
    uploadedBy: versions[0]?.uploadedByName ?? "HR Admin",
    isArchived: dto.isArchived,
    isTrashed: dto.isTrashed,
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      uploadedAt: v.uploadedAt.slice(0, 10),
      uploadedBy: v.uploadedByName ?? "HR Admin",
      fileSize: v.sizeBytes,
      notes: v.notes ?? undefined,
    })),
    shares: dto.shares.map((s) => ({
      id: s.employeeId,
      employeeId: s.employeeId,
      employeeName: s.employeeName,
      employeeInitials: getInitials(s.employeeName),
      permission: s.permission === "viewOnly" ? "view_only" : "download",
      sharedAt: s.sharedAt.slice(0, 10),
      sharedBy: "HR Admin",
    })),
    assignment: {
      scope: dto.assignment,
      departments: dto.assignedDepartmentIds
        .map((id) => departmentNameById.get(id))
        .filter((name): name is string => !!name),
    },
    requiresAcknowledgement: dto.requiresAcknowledgement,
    acknowledgements: [],
  };
}

/** The create/update body; department names on the form become ids. */
export function documentToRequest(
  input: NewDocument,
  ids: FolderIds,
  departmentIdByName: Map<string, string>,
) {
  const scope = input.assignment?.scope ?? "specific";
  return {
    name: input.name.trim(),
    category: categoryToApi(input.category),
    folderId: ids.toServer.get(input.folderId) ?? input.folderId,
    description: input.description?.trim() || null,
    expiryDate: input.expiryDate || null,
    assignment: scope,
    assignedDepartmentIds:
      scope === "department"
        ? (input.assignment?.departments ?? [])
            .map((name) => departmentIdByName.get(name))
            .filter((id): id is string => !!id)
        : null,
    requiresAcknowledgement: input.requiresAcknowledgement ?? false,
  };
}
