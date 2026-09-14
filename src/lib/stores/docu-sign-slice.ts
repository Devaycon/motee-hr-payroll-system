import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface QueuedSignedDocument {
  id: string;
  name: string;
  fileType: "pdf" | "png" | "jpg";
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  createdBy: string;
}

interface DocuSignState {
  /** Signed docs from the standalone tool, waiting to be filed into the
   * Documents & Compliance module's "docu-sign file" folder. */
  queue: QueuedSignedDocument[];
}

const initialState: DocuSignState = {
  queue: [],
};

const docuSignSlice = createSlice({
  name: "docuSign",
  initialState,
  reducers: {
    queueSignedDocument(state, action: PayloadAction<QueuedSignedDocument>) {
      state.queue.push(action.payload);
    },
    dequeueSignedDocument(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((d) => d.id !== action.payload);
    },
  },
});

export const { queueSignedDocument, dequeueSignedDocument } =
  docuSignSlice.actions;
export default docuSignSlice.reducer;
