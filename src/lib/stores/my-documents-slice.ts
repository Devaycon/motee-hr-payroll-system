import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * §8.3 (Correction 2 feedback) — "My Documents" self-service: an employee
 * upload is routed to HR for review/approval rather than filed
 * automatically. Bridges the employee-side "My Documents" page
 * (src/components/employee/documents) to the HR-side Documents &
 * Compliance module's "My Documents" review tab, the same way
 * docu-sign-slice.ts bridges the standalone sign tool back into Documents
 * & Compliance.
 */
export interface SelfServiceDocumentSubmission {
  id: string;
  employeeId?: string;
  employeeName: string;
  employeeInitials: string;
  name: string;
  docType: string;
  ext: string;
  expiryDate?: string;
  submittedAt: string;
  status: "awaiting_review" | "approved" | "rejected";
  reviewedAt?: string;
  reviewNote?: string;
}

interface MyDocumentsState {
  submissions: SelfServiceDocumentSubmission[];
}

const initialState: MyDocumentsState = {
  submissions: [],
};

const myDocumentsSlice = createSlice({
  name: "myDocuments",
  initialState,
  reducers: {
    submitSelfServiceDocument(
      state,
      action: PayloadAction<
        Omit<SelfServiceDocumentSubmission, "id" | "submittedAt" | "status">
      >,
    ) {
      state.submissions.unshift({
        ...action.payload,
        id: `SSD-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: "awaiting_review",
      });
    },
    reviewSelfServiceDocument(
      state,
      action: PayloadAction<{
        id: string;
        status: "approved" | "rejected";
        note?: string;
      }>,
    ) {
      const s = state.submissions.find((x) => x.id === action.payload.id);
      if (!s) return;
      s.status = action.payload.status;
      s.reviewedAt = new Date().toISOString();
      s.reviewNote = action.payload.note;
    },
    /** Filed into a folder (e.g. Employee Documents) — no longer needed here. */
    dequeueSelfServiceDocument(state, action: PayloadAction<string>) {
      state.submissions = state.submissions.filter((s) => s.id !== action.payload);
    },
  },
});

export const {
  submitSelfServiceDocument,
  reviewSelfServiceDocument,
  dequeueSelfServiceDocument,
} = myDocumentsSlice.actions;
export default myDocumentsSlice.reducer;
