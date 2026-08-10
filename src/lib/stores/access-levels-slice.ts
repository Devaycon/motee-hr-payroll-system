import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  AccessLevel,
  ModulePermission,
  NewAccessLevel,
} from "@/src/lib/types/access-levels";
import { DEFAULT_ACCESS_LEVELS, SYSTEM_AUTHOR } from "@/src/lib/permissions/seeds";

function clonePermissions(perms: ModulePermission[]): ModulePermission[] {
  return perms.map((p) => ({ ...p, actions: [...p.actions] }));
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
      return { ...cached, permissions: clonePermissions(seed.permissions) };
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
  status: "idle" | "ready";
}

const initialState: AccessLevelsState = {
  levels: DEFAULT_ACCESS_LEVELS,
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
      const migrated = incoming.map(mergeWithSeed);
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
        lastModifiedBy: "You",
        lastModifiedAt: now(),
      };
      state.levels.push(level);
    },
    updateLevel(state, action: PayloadAction<AccessLevel>) {
      const incoming = action.payload;
      const idx = state.levels.findIndex((l) => l.id === incoming.id);
      if (idx === -1) return;
      state.levels[idx] = {
        ...incoming,
        lastModifiedBy: "You",
        lastModifiedAt: now(),
      };
    },
    deleteLevel(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.levels = state.levels.filter((l) => l.id !== id);
    },
    duplicateLevel(state, action: PayloadAction<string>) {
      const sourceId = action.payload;
      const source = state.levels.find((l) => l.id === sourceId);
      if (!source) return;
      const copy: AccessLevel = {
        ...source,
        id: `AL-CUSTOM-${Date.now()}`,
        name: `${source.name} (Copy)`,
        kind: "custom",
        employeeCount: 0,
        lastModifiedBy: "You",
        lastModifiedAt: now(),
        permissions: source.permissions.map((p) => ({
          ...p,
          actions: [...p.actions],
        })),
      };
      state.levels.push(copy);
    },
  },
});

export const {
  hydrate,
  createLevel,
  updateLevel,
  deleteLevel,
  duplicateLevel,
} = accessLevelsSlice.actions;
export default accessLevelsSlice.reducer;
