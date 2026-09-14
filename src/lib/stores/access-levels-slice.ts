import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  AccessLevel,
  ModulePermission,
  NewAccessLevel,
  RoleAssignmentEvent,
} from "@/src/lib/types/access-levels";
import {
  DEFAULT_ACCESS_LEVELS,
  DEFAULT_ACCESS_LEVEL_IDS,
  SYSTEM_AUTHOR,
} from "@/src/lib/permissions/seeds";

function clonePermissions(perms: ModulePermission[]): ModulePermission[] {
  return perms.map((p) => ({ ...p, actions: [...p.actions] }));
}

/**
 * Fill in fields added after a snapshot was taken (§1.4, §1.7, §1.8), so a
 * cached level from an older build doesn't render with holes in it.
 */
function withDefaults(level: AccessLevel): AccessLevel {
  return {
    ...level,
    status: level.status ?? "active",
    dataScope: level.dataScope ?? { kind: "all" },
    createdBy: level.createdBy ?? level.lastModifiedBy ?? SYSTEM_AUTHOR,
    createdAt: level.createdAt ?? level.lastModifiedAt ?? "2026-01-01",
  };
}

/**
 * Merge a cached access level with the latest seed default so newly-added
 * modules show up with their seeded permissions without overwriting any
 * existing entries the user customized. For levels whose id isn't in the
 * seed defaults (custom roles), missing modules default to `access:false`.
 */
function mergeWithSeed(cached: AccessLevel): AccessLevel {
  const seed = DEFAULT_ACCESS_LEVELS.find((d) => d.id === cached.id);
  const cachedMap = new Map(cached.permissions.map((p) => [p.module, p]));
  if (seed) {
    // A default level still stamped "System" has never been edited by a human,
    // so the cached copy holds no intent worth preserving — only whatever the
    // seed happened to say the day the snapshot was taken. Keeping it would
    // pin the level to that stale answer forever: a module the seed grants
    // today stays `access:false` because a (correct-at-the-time) `false` is
    // already on record, and the fill-in-missing pass below never touches it.
    // That is exactly how Employer of Record and Workflows vanished from the
    // sidebar. Re-derive from the seed instead; a real edit sets
    // `lastModifiedBy` to "You" and takes the preserving path.
    if (cached.lastModifiedBy === SYSTEM_AUTHOR) {
      // `dataScope` is re-derived for the same reason as the permissions, and
      // it is the same bug when it isn't: a snapshot taken while the scope was
      // still an inert placeholder would pin the role to it forever, so a
      // newly enforced restriction would silently never apply.
      return {
        ...cached,
        dataScope: seed.dataScope,
        permissions: clonePermissions(seed.permissions),
      };
    }
    const merged: ModulePermission[] = seed.permissions.map((seedPerm) => {
      const existing = cachedMap.get(seedPerm.module);
      return existing ?? seedPerm;
    });
    return { ...cached, permissions: clonePermissions(merged) };
  }
  // Custom level: preserve everything the user chose, add empty entries for
  // any modules they don't have yet (seeded from the first default level
  // so we know the canonical module ids).
  const canonical = DEFAULT_ACCESS_LEVELS[0]?.permissions ?? [];
  const merged: ModulePermission[] = canonical.map((c) => {
    const existing = cachedMap.get(c.module);
    return existing ?? { module: c.module, access: false, actions: [] };
  });
  return { ...cached, permissions: merged };
}

interface AccessLevelsState {
  levels: AccessLevel[];
  /** §1.6 — role assignment audit trail, newest first. */
  assignments: RoleAssignmentEvent[];
  /**
   * §1.10 — the role currently being previewed via "Test as Role", or null.
   * Deliberately absent from the persistence layer: a preview that survived a
   * refresh would leave an admin quietly locked out of their own app with no
   * memory of why.
   */
  previewLevelId: string | null;
  status: "idle" | "ready";
}

const initialState: AccessLevelsState = {
  levels: DEFAULT_ACCESS_LEVELS,
  assignments: [],
  previewLevelId: null,
  status: "ready",
};

function now(): string {
  return new Date().toISOString().slice(0, 10);
}

const accessLevelsSlice = createSlice({
  name: "accessLevels",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<AccessLevel[]>) {
      const incoming = action.payload;
      if (!Array.isArray(incoming) || incoming.length === 0) return;
      const migrated = incoming.map((l) => withDefaults(mergeWithSeed(l)));
      const incomingIds = new Set(migrated.map((l) => l.id));
      const seedExtras = DEFAULT_ACCESS_LEVELS.filter(
        (d) => !incomingIds.has(d.id),
      );
      state.levels = [...migrated, ...seedExtras];
      state.status = "ready";
    },
    createLevel(state, action: PayloadAction<NewAccessLevel>) {
      const data = action.payload;
      const id = `AL-CUSTOM-${Date.now()}`;
      const level: AccessLevel = {
        ...data,
        id,
        kind: "custom",
        employeeCount: 0,
        createdBy: "You",
        createdAt: now(),
        lastModifiedBy: "You",
        lastModifiedAt: now(),
      };
      state.levels.push(level);
    },
    updateLevel(state, action: PayloadAction<AccessLevel>) {
      const incoming = action.payload;
      const idx = state.levels.findIndex((l) => l.id === incoming.id);
      if (idx === -1) return;
      const existing = state.levels[idx];
      state.levels[idx] = {
        ...incoming,
        // Provenance is never rewritten by an edit (§1.8).
        createdBy: existing.createdBy,
        createdAt: existing.createdAt,
        lastUsedAt: existing.lastUsedAt,
        lastModifiedBy: "You",
        lastModifiedAt: now(),
      };
    },
    /** §1.7 — retire a role without deleting it, keeping its audit history. */
    setLevelStatus(
      state,
      action: PayloadAction<{ id: string; status: AccessLevel["status"] }>,
    ) {
      const level = state.levels.find((l) => l.id === action.payload.id);
      if (!level) return;
      level.status = action.payload.status;
      level.lastModifiedBy = "You";
      level.lastModifiedAt = now();
    },
    deleteLevel(state, action: PayloadAction<string>) {
      const id = action.payload;
      // §1.9 — system roles are locked. Guarded here as well as in the UI so
      // no other caller can delete one by mistake.
      if (DEFAULT_ACCESS_LEVEL_IDS.has(id)) return;
      state.levels = state.levels.filter((l) => l.id !== id);
    },
    /** §1.1 — clone any role, including a locked system one, as a new custom role. */
    duplicateLevel(state, action: PayloadAction<string>) {
      const sourceId = action.payload;
      const source = state.levels.find((l) => l.id === sourceId);
      if (!source) return;
      const copy: AccessLevel = {
        ...source,
        id: `AL-CUSTOM-${Date.now()}`,
        name: `${source.name} (Copy)`,
        kind: "custom",
        // A clone starts as a draft so it can be tuned before anyone holds it.
        status: "draft",
        employeeCount: 0,
        createdBy: "You",
        createdAt: now(),
        lastUsedAt: undefined,
        lastModifiedBy: "You",
        lastModifiedAt: now(),
        dataScope: {
          ...source.dataScope,
          departmentIds: source.dataScope.departmentIds
            ? [...source.dataScope.departmentIds]
            : undefined,
          businessUnits: source.dataScope.businessUnits
            ? [...source.dataScope.businessUnits]
            : undefined,
        },
        permissions: clonePermissions(source.permissions),
      };
      state.levels.push(copy);
    },
    /** §1.6 — record a role change against the audit trail. */
    recordRoleAssignment(
      state,
      action: PayloadAction<Omit<RoleAssignmentEvent, "id" | "changedAt">>,
    ) {
      const event: RoleAssignmentEvent = {
        ...action.payload,
        id: `RA-${Date.now()}`,
        changedAt: new Date().toISOString(),
      };
      state.assignments.unshift(event);

      // Keep the headline counts and "last used" honest (§1.8).
      const from = state.levels.find((l) => l.id === event.previousRoleId);
      if (from) from.employeeCount = Math.max(0, from.employeeCount - 1);
      const to = state.levels.find((l) => l.id === event.newRoleId);
      if (to) {
        to.employeeCount += 1;
        to.lastUsedAt = now();
      }
    },
    hydrateAssignments(state, action: PayloadAction<RoleAssignmentEvent[]>) {
      if (!Array.isArray(action.payload)) return;
      state.assignments = action.payload;
    },

    /** §1.10 — view the app as this role sees it. */
    startPreview(state, action: PayloadAction<string>) {
      if (!state.levels.some((l) => l.id === action.payload)) return;
      state.previewLevelId = action.payload;
    },
    exitPreview(state) {
      state.previewLevelId = null;
    },
  },
});

export const {
  hydrate,
  createLevel,
  updateLevel,
  setLevelStatus,
  deleteLevel,
  duplicateLevel,
  recordRoleAssignment,
  hydrateAssignments,
  startPreview,
  exitPreview,
} = accessLevelsSlice.actions;
export default accessLevelsSlice.reducer;
