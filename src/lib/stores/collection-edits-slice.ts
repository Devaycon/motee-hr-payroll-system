import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CollectionRecord = Record<string, unknown> & { id?: string };

export interface CollectionEditsState {
  added: Record<string, CollectionRecord[]>;
  edits: Record<string, Record<string, Record<string, unknown>>>;
  status: "idle" | "ready";
}

const initialState: CollectionEditsState = {
  added: {},
  edits: {},
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
      }>,
    ) {
      if (action.payload.added) state.added = action.payload.added;
      if (action.payload.edits) state.edits = action.payload.edits;
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
  },
});

export const { hydrate, addRecord, updateRecord } = collectionEditsSlice.actions;
export default collectionEditsSlice.reducer;
