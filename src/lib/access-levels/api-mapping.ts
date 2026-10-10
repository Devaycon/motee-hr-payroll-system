import type {
  AccessLevel,
  DataScope,
  NewAccessLevel,
} from "@/src/lib/types/access-levels";
import type {
  AccessLevelDto,
  AccessLevelRequest,
  DataScope as ApiDataScope,
} from "@/src/types/access-levels";

/**
 * The API splits "own" from "assigned" scopes (`ownDepartment` vs
 * `department`); the UI expresses the same thing as one kind with an empty or
 * a filled list. `none` has no UI equivalent and reads as the narrowest scope.
 */
export function dataScopeFromApi(scope: ApiDataScope): DataScope {
  switch (scope.kind) {
    case "all":
      return { kind: "all" };
    case "businessUnit":
      return {
        kind: "business_unit",
        businessUnits: scope.businessUnitIds ?? [],
      };
    case "branch":
      return { kind: "branch", branchIds: scope.branchIds ?? [] };
    case "ownBranch":
      return { kind: "branch", branchIds: [] };
    case "department":
      return { kind: "department", departmentIds: scope.departmentIds ?? [] };
    case "ownDepartment":
      return { kind: "department", departmentIds: [] };
    case "directReports":
      return { kind: "direct_reports" };
    default:
      return { kind: "self" };
  }
}

export function dataScopeToApi(scope: DataScope): ApiDataScope {
  switch (scope.kind) {
    case "all":
      return { kind: "all" };
    case "business_unit":
      return { kind: "businessUnit", businessUnitIds: scope.businessUnits ?? [] };
    case "branch":
      return scope.branchIds?.length
        ? { kind: "branch", branchIds: scope.branchIds }
        : { kind: "ownBranch" };
    case "department":
      return scope.departmentIds?.length
        ? { kind: "department", departmentIds: scope.departmentIds }
        : { kind: "ownDepartment" };
    case "direct_reports":
      return { kind: "directReports" };
    default:
      return { kind: "self" };
  }
}

export function accessLevelFromApi(level: AccessLevelDto): AccessLevel {
  return {
    id: level.id,
    name: level.name,
    description: level.description ?? "",
    kind: level.kind,
    status: level.status,
    employeeCount: level.assignedCount,
    dataScope: dataScopeFromApi(level.scope),
    // Authorship is not exposed by the API.
    createdBy: level.kind === "default" ? "System" : "",
    createdAt: level.createdAt,
    lastUsedAt: level.lastUsedAt ?? undefined,
    lastModifiedBy: "",
    lastModifiedAt: level.updatedAt,
    permissions: level.permissions,
  };
}

export function accessLevelToRequest(
  level: NewAccessLevel | AccessLevel,
  copyFromId?: string,
): AccessLevelRequest {
  return {
    name: level.name,
    description: level.description || null,
    scope: dataScopeToApi(level.dataScope),
    permissions: level.permissions,
    copyFromId: copyFromId ?? null,
  };
}
