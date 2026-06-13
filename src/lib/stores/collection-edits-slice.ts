import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CollectionRecord = Record<string, unknown> & { id?: string };

export interface CollectionEditsState {
  added: Record<string, CollectionRecord[]>;
  edits: Record<string, Record<string, Record<string, unknown>>>;
  removed: Record<string, string[]>;
  status: "idle" | "ready";
}

const initialState: CollectionEditsState = {
  added: {},
  edits: {},
  removed: {},
  status: "ready",
};

const collectionEditsSlice = createSlice({
  name: "collectionEdits",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{
        added?: CollectionEditsState["added"];
        edits?: CollectionEditsState["edits"];
        removed?: CollectionEditsState["removed"];
      }>,
    ) {
      if (action.payload.added) state.added = action.payload.added;
      if (action.payload.edits) state.edits = action.payload.edits;
      if (action.payload.removed) state.removed = action.payload.removed;
      state.status = "ready";
    },

    addRecord(
      state,
      action: PayloadAction<{ key: string; record: CollectionRecord }>,
    ) {
      const { key, record } = action.payload;
      if (!state.added[key]) state.added[key] = [];
      state.added[key].unshift(record);
    },

    updateRecord(
      state,
      action: PayloadAction<{
        key: string;
        id: string;
        patch: Record<string, unknown>;
      }>,
    ) {
      const { key, id, patch } = action.payload;
      // If the record was added this session, patch it in place.
      const addedList = state.added[key];
      const addedRec = addedList?.find((r) => r.id === id);
      if (addedRec) {
        Object.assign(addedRec, patch);
        return;
      }
      if (!state.edits[key]) state.edits[key] = {};
      state.edits[key][id] = { ...state.edits[key][id], ...patch };
    },

    removeRecord(
      state,
      action: PayloadAction<{ key: string; id: string }>,
    ) {
      const { key, id } = action.payload;
      // Drop it from this session's additions if it was added here…
      const addedList = state.added[key];
      if (addedList) {
        state.added[key] = addedList.filter((r) => r.id !== id);
      }
      // …otherwise tombstone the base-bundle record so applyCollection hides it.
      if (!state.removed[key]) state.removed[key] = [];
      if (!state.removed[key].includes(id)) state.removed[key].push(id);
    },
  },
});

export const { hydrate, addRecord, updateRecord, removeRecord } =
  collectionEditsSlice.actions;
export default collectionEditsSlice.reducer;
