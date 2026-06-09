import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type {
  ApprovalAttachment,
  ApprovalChainStep,
  ApprovalChainTemplate,
  ApprovalDocumentType,
  ApprovalEvent,
  ApprovalRequest,
  ApprovalSignature,
  ApprovalSignaturePlacement,
  ApprovalStepInstance,
  ApprovalSubmitter,
  AttachmentRules,
  NewApprovalSubmission,
  SignatureRules,
  WorkflowEndDesk,
  WorkflowStartDesk,
  ApproverResolver,
  ApprovalCategory,
} from "@/src/lib/types/approvals";
import { BUILTIN_CATEGORIES } from "@/src/lib/types/approvals";
import { DEFAULT_APPROVAL_TEMPLATES } from "@/src/lib/permissions/approval-seeds";
import { resolveStepWithOnLeave } from "@/src/lib/permissions/approver-resolution";
import type { RootState } from "./store";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface ApprovalsState {
  templates: ApprovalChainTemplate[];
  requests: ApprovalRequest[];
  categories: ApprovalCategory[];
  status: "idle" | "ready";
}

const initialState: ApprovalsState = {
  templates: DEFAULT_APPROVAL_TEMPLATES,
  requests: [],
  categories: BUILTIN_CATEGORIES,
  status: "ready",
};

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const DEFAULT_ATTACHMENTS: AttachmentRules = { allowed: false, required: false };
const DEFAULT_SIGNATURES: SignatureRules = {
  submitterSigns: false,
  reviewerSigns: false,
  placeOnDocument: false,
};
const DEFAULT_START: WorkflowStartDesk = { kind: "submitter" };
const DEFAULT_END: WorkflowEndDesk = { kind: "approved" };

/**
 * Migrate cached / older-shape templates to the current model with sane
 * defaults for fields added later.
 */
function normalizeTemplate(t: ApprovalChainTemplate): ApprovalChainTemplate {
  return {
    ...t,
    startDesk: t.startDesk ?? DEFAULT_START,
    endDesk: t.endDesk ?? DEFAULT_END,
    attachments: t.attachments ?? DEFAULT_ATTACHMENTS,
    signatures: t.signatures ?? DEFAULT_SIGNATURES,
    steps: (t.steps ?? []).map((s) => ({
      ...s,
      onLeaveAction: s.onLeaveAction ?? { kind: "skip" },
    })),
  };
}

function normalizeRequest(r: ApprovalRequest): ApprovalRequest {
  return {
    ...r,
    attachments: r.attachments ?? [],
    signatures: r.signatures ?? [],
    steps: (r.steps ?? []).map((s) => ({
      ...s,
    })),
  };
}

/**
 * Build the steps for a new submission, honouring on-leave fallbacks
 * configured on the template. Steps whose primary approver is on leave
 * are skipped or rerouted according to the template's step configuration.
 */
function buildStepsForTemplate(
  template: ApprovalChainTemplate,
  submitter: ApprovalSubmitter,
  bundle: LocaleBundle | null,
): ApprovalStepInstance[] {
  return template.steps.map((s, i) => {
    const resolved = resolveStepWithOnLeave(s, submitter, bundle);
    const base: ApprovalStepInstance = {
      id: uid(`STEP-${i + 1}`),
      order: s.order,
      templateStepId: s.id,
      label: s.label,
      approver: s.approver,
      resolvedEmployeeId: resolved.approverEmployeeId,
      resolvedEmployeeName: resolved.approverName,
      status: resolved.skipped ? "skipped" : "pending",
    };
    if (resolved.skipped) {
      base.skippedReason = "on_leave";
      base.decidedAt = nowIso();
    }
    if (resolved.reassignedFromEmployeeId) {
      base.reassignedFromEmployeeId = resolved.reassignedFromEmployeeId;
      base.reassignedFromName = resolved.reassignedFromName;
    }
    return base;
  });
}

/** Pick the next non-skipped step starting at `from`, or null if none. */
function findNextActiveStep(
  steps: ApprovalStepInstance[],
  from: number,
): number {
  for (let i = from; i < steps.length; i += 1) {
    if (steps[i].status !== "skipped") return i;
  }
  return steps.length;
}

interface ActorPayload {
  requestId: string;
  actorEmployeeId: string;
  actorName: string;
  note?: string;
}

interface SignatureCapture {
  dataUrl: string;
  placement?: ApprovalSignaturePlacement | null;
}

const approvalsSlice = createSlice({
  name: "approvals",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{
        templates?: ApprovalChainTemplate[];
        requests?: ApprovalRequest[];
        categories?: ApprovalCategory[];
      }>,
    ) {
      const { templates, requests, categories } = action.payload;
      if (Array.isArray(templates) && templates.length > 0) {
        const migrated = templates.map(normalizeTemplate);
        const incomingIds = new Set(migrated.map((t) => t.id));
        const seedExtras = DEFAULT_APPROVAL_TEMPLATES.filter(
          (d) => !incomingIds.has(d.id),
        );
        state.templates = [...migrated, ...seedExtras];
      }
      if (Array.isArray(requests)) {
        state.requests = requests.map(normalizeRequest);
      }
      if (Array.isArray(categories) && categories.length > 0) {
        // Always keep the built-ins present, then merge any persisted custom ones.
        const customs = categories.filter(
          (c) => !BUILTIN_CATEGORIES.some((b) => b.id === c.id),
        );
        state.categories = [...BUILTIN_CATEGORIES, ...customs];
      }
      state.status = "ready";
    },

    addCategory(
      state,
      action: PayloadAction<{ label: string; description?: string }>,
    ) {
      const label = action.payload.label.trim();
      if (!label) return;
      const exists = state.categories.some(
        (c) => c.label.toLowerCase() === label.toLowerCase(),
      );
      if (exists) return;
      state.categories.push({
        id: uid("CAT"),
        label,
        builtIn: false,
        description: action.payload.description?.trim() || undefined,
      });
    },

    renameCategory(
      state,
      action: PayloadAction<{ id: string; label: string; description?: string }>,
    ) {
      const cat = state.categories.find((c) => c.id === action.payload.id);
      if (!cat || cat.builtIn) return;
      const label = action.payload.label.trim();
      if (label) cat.label = label;
      cat.description = action.payload.description?.trim() || undefined;
    },

    deleteCategory(state, action: PayloadAction<string>) {
      const id = action.payload;
      const cat = state.categories.find((c) => c.id === id);
      if (!cat || cat.builtIn) return;
      const inUse =
        state.templates.some((t) => t.documentType === id) ||
        state.requests.some((r) => r.documentType === id);
      if (inUse) return;
      state.categories = state.categories.filter((c) => c.id !== id);
    },

    seedRequests(state, action: PayloadAction<ApprovalRequest[]>) {
      if (state.requests.length === 0) {
        state.requests = action.payload.map(normalizeRequest);
      }
    },

    /**
     * Append demo requests for a document type, but only if none of that type
     * already exist. Lets a module seed its own requests idempotently without
     * clobbering requests seeded elsewhere.
     */
    seedRequestsForType(
      state,
      action: PayloadAction<{
        documentType: ApprovalDocumentType;
        requests: ApprovalRequest[];
      }>,
    ) {
      const { documentType, requests } = action.payload;
      const exists = state.requests.some(
        (r) => r.documentType === documentType,
      );
      if (exists) return;
      state.requests.push(...requests.map(normalizeRequest));
    },

    /**
     * Add specific demo requests by id — appends only those whose id isn't
     * already present. Unlike seedRequestsForType this is keyed on id, not
     * document type, so a module can guarantee its own linked approvals exist
     * even when other requests of the same type were seeded elsewhere.
     */
    upsertRequests(state, action: PayloadAction<ApprovalRequest[]>) {
      const existingIds = new Set(state.requests.map((r) => r.id));
      for (const request of action.payload) {
        if (!existingIds.has(request.id)) {
          state.requests.push(normalizeRequest(request));
        }
      }
    },

    submitApprovalInternal(
      state,
      action: PayloadAction<{
        submission: NewApprovalSubmission;
        steps: ApprovalStepInstance[];
        chainTemplateId: string;
      }>,
    ) {
      const { submission, steps, chainTemplateId } = action.payload;
      const id = uid("APR");
      const at = nowIso();
      const event: ApprovalEvent = {
        id: uid("EVT"),
        at,
        actorEmployeeId: submission.submitter.employeeId,
        actorName: submission.submitter.name,
        type: "submitted",
      };

      const attachments: ApprovalAttachment[] = submission.attachments ?? [];
      const signatures: ApprovalSignature[] = [];
      if (submission.submitterSignatureDataUrl) {
        signatures.push({
          id: uid("SIG"),
          signerEmployeeId: submission.submitter.employeeId,
          signerName: submission.submitter.name,
          dataUrl: submission.submitterSignatureDataUrl,
          placement: null,
          signedAt: at,
          role: "submitter",
        });
      }

      const firstActive = findNextActiveStep(steps, 0);
      const allSkipped = firstActive >= steps.length;
      state.requests.unshift({
        id,
        documentType: submission.documentType,
        documentId: submission.documentId,
        documentTitle: submission.documentTitle,
        documentSummary: submission.documentSummary,
        payloadSnapshot: submission.payloadSnapshot,
        submittedBy: submission.submitter,
        submittedAt: at,
        chainTemplateId,
        currentStepIndex: firstActive,
        status:
          steps.length === 0 || allSkipped ? "approved" : "in_progress",
        steps,
        history: [event],
        attachments,
        signatures,
      });
    },

    approveStep(
      state,
      action: PayloadAction<ActorPayload & { signature?: SignatureCapture }>,
    ) {
      const { requestId, actorEmployeeId, actorName, note, signature } =
        action.payload;
      const req = state.requests.find((r) => r.id === requestId);
      if (!req || req.status !== "in_progress") return;
      const step = req.steps[req.currentStepIndex];
      if (!step) return;
      step.status = "approved";
      step.decidedAt = nowIso();
      step.note = note;
      if (signature?.dataUrl) {
        const sig: ApprovalSignature = {
          id: uid("SIG"),
          signerEmployeeId: actorEmployeeId,
          signerName: actorName,
          dataUrl: signature.dataUrl,
          placement: signature.placement ?? null,
          signedAt: step.decidedAt,
          role: "reviewer",
          stepId: step.id,
        };
        req.signatures.push(sig);
        step.signatureId = sig.id;
      }
      req.history.push({
        id: uid("EVT"),
        at: step.decidedAt,
        actorEmployeeId,
        actorName,
        type: "approved",
        stepOrder: step.order,
        note,
      });
      const nextIndex = findNextActiveStep(
        req.steps,
        req.currentStepIndex + 1,
      );
      if (nextIndex >= req.steps.length) {
        req.status = "approved";
        req.currentStepIndex = req.steps.length;
      } else {
        req.currentStepIndex = nextIndex;
      }
    },

    rejectStep(state, action: PayloadAction<ActorPayload>) {
      const { requestId, actorEmployeeId, actorName, note } = action.payload;
      const req = state.requests.find((r) => r.id === requestId);
      if (!req || req.status !== "in_progress") return;
      const step = req.steps[req.currentStepIndex];
      if (!step) return;
      step.status = "rejected";
      step.decidedAt = nowIso();
      step.note = note;
      req.status = "rejected";
      req.history.push({
        id: uid("EVT"),
        at: step.decidedAt,
        actorEmployeeId,
        actorName,
        type: "rejected",
        stepOrder: step.order,
        note,
      });
    },

    returnToSender(state, action: PayloadAction<ActorPayload>) {
      const { requestId, actorEmployeeId, actorName, note } = action.payload;
      const req = state.requests.find((r) => r.id === requestId);
      if (!req || req.status !== "in_progress") return;
      const step = req.steps[req.currentStepIndex];
      if (!step) return;
      step.status = "returned";
      step.decidedAt = nowIso();
      step.note = note;
      req.status = "returned";
      req.history.push({
        id: uid("EVT"),
        at: step.decidedAt,
        actorEmployeeId,
        actorName,
        type: "returned",
        stepOrder: step.order,
        note,
      });
    },

    resubmit(
      state,
      action: PayloadAction<{
        requestId: string;
        actorEmployeeId: string;
        actorName: string;
        updatedTitle?: string;
        updatedSummary?: string;
        updatedPayload?: Record<string, unknown>;
        updatedAttachments?: ApprovalAttachment[];
        note?: string;
      }>,
    ) {
      const {
        requestId,
        actorEmployeeId,
        actorName,
        updatedTitle,
        updatedSummary,
        updatedPayload,
        updatedAttachments,
        note,
      } = action.payload;
      const req = state.requests.find((r) => r.id === requestId);
      if (!req || req.status !== "returned") return;
      if (updatedTitle) req.documentTitle = updatedTitle;
      if (updatedSummary) req.documentSummary = updatedSummary;
      if (updatedPayload) req.payloadSnapshot = updatedPayload;
      if (updatedAttachments) req.attachments = updatedAttachments;
      req.steps.forEach((s) => {
        if (s.status === "skipped") return; // preserve skipped steps
        s.status = "pending";
        s.decidedAt = undefined;
        s.note = undefined;
        s.signatureId = undefined;
      });
      req.currentStepIndex = findNextActiveStep(req.steps, 0);
      req.status = "in_progress";
      req.history.push({
        id: uid("EVT"),
        at: nowIso(),
        actorEmployeeId,
        actorName,
        type: "resubmitted",
        note,
      });
    },

    cancel(
      state,
      action: PayloadAction<{
        requestId: string;
        actorEmployeeId: string;
        actorName: string;
      }>,
    ) {
      const { requestId, actorEmployeeId, actorName } = action.payload;
      const req = state.requests.find((r) => r.id === requestId);
      if (!req) return;
      if (req.status === "approved" || req.status === "rejected") return;
      req.status = "cancelled";
      req.history.push({
        id: uid("EVT"),
        at: nowIso(),
        actorEmployeeId,
        actorName,
        type: "cancelled",
      });
    },

    addComment(state, action: PayloadAction<ActorPayload>) {
      const { requestId, actorEmployeeId, actorName, note } = action.payload;
      const req = state.requests.find((r) => r.id === requestId);
      if (!req) return;
      req.history.push({
        id: uid("EVT"),
        at: nowIso(),
        actorEmployeeId,
        actorName,
        type: "commented",
        note,
      });
    },

    // Chain template CRUD
    createTemplate(
      state,
      action: PayloadAction<{
        documentType: ApprovalDocumentType;
        name: string;
        description?: string;
        startDesk?: WorkflowStartDesk;
        endDesk?: WorkflowEndDesk;
        attachments?: AttachmentRules;
        signatures?: SignatureRules;
        steps: Omit<ApprovalChainStep, "id" | "order">[];
        actorName: string;
      }>,
    ) {
      const {
        documentType,
        name,
        description,
        startDesk,
        endDesk,
        attachments,
        signatures,
        steps,
        actorName,
      } = action.payload;
      const id = uid("ACT");
      state.templates.push({
        id,
        documentType,
        name,
        description,
        isDefault: false,
        kind: "custom",
        startDesk: startDesk ?? DEFAULT_START,
        endDesk: endDesk ?? DEFAULT_END,
        attachments: attachments ?? DEFAULT_ATTACHMENTS,
        signatures: signatures ?? DEFAULT_SIGNATURES,
        steps: steps.map((s, i) => ({
          ...s,
          id: uid(`STEP-${i + 1}`),
          order: i + 1,
          onLeaveAction: s.onLeaveAction ?? { kind: "skip" },
        })),
        lastModifiedBy: actorName,
        lastModifiedAt: nowIso().slice(0, 10),
      });
    },

    updateTemplate(
      state,
      action: PayloadAction<{
        id: string;
        name?: string;
        description?: string;
        startDesk?: WorkflowStartDesk;
        endDesk?: WorkflowEndDesk;
        attachments?: AttachmentRules;
        signatures?: SignatureRules;
        steps?: Omit<ApprovalChainStep, "id" | "order">[];
        actorName: string;
      }>,
    ) {
      const {
        id,
        name,
        description,
        startDesk,
        endDesk,
        attachments,
        signatures,
        steps,
        actorName,
      } = action.payload;
      const t = state.templates.find((x) => x.id === id);
      if (!t) return;
      // Document type is intentionally NOT accepted here — it's locked once set.
      if (name !== undefined) t.name = name;
      if (description !== undefined) t.description = description;
      if (startDesk !== undefined) t.startDesk = startDesk;
      if (endDesk !== undefined) t.endDesk = endDesk;
      if (attachments !== undefined) t.attachments = attachments;
      if (signatures !== undefined) t.signatures = signatures;
      if (steps !== undefined) {
        t.steps = steps.map((s, i) => ({
          ...s,
          id: uid(`STEP-${i + 1}`),
          order: i + 1,
          onLeaveAction: s.onLeaveAction ?? { kind: "skip" },
        }));
      }
      t.lastModifiedBy = actorName;
      t.lastModifiedAt = nowIso().slice(0, 10);
    },

    deleteTemplate(state, action: PayloadAction<string>) {
      const id = action.payload;
      const t = state.templates.find((x) => x.id === id);
      if (!t || t.kind === "system") return;
      state.templates = state.templates.filter((x) => x.id !== id);
    },

    setDefaultTemplate(
      state,
      action: PayloadAction<{ documentType: ApprovalDocumentType; id: string }>,
    ) {
      const { documentType, id } = action.payload;
      state.templates.forEach((t) => {
        if (t.documentType === documentType) {
          t.isDefault = t.id === id;
        }
      });
    },
  },
});

export const {
  hydrate,
  seedRequests,
  seedRequestsForType,
  upsertRequests,
  submitApprovalInternal,
  approveStep,
  rejectStep,
  returnToSender,
  resubmit,
  cancel,
  addComment,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  addCategory,
  renameCategory,
  deleteCategory,
} = approvalsSlice.actions;
export default approvalsSlice.reducer;

export const submitApproval = createAsyncThunk<
  void,
  NewApprovalSubmission,
  { state: RootState }
>("approvals/submit", async (submission, { getState, dispatch }) => {
  const state = getState();
  const bundle = state.locale.data;
  const templates = state.approvals.templates;
  let template: ApprovalChainTemplate | undefined;
  if (submission.chainTemplateId) {
    template = templates.find((t) => t.id === submission.chainTemplateId);
  }
  if (!template) {
    template = templates.find(
      (t) => t.documentType === submission.documentType && t.isDefault,
    );
  }
  if (!template) {
    template = templates.find(
      (t) => t.documentType === submission.documentType,
    );
  }
  if (!template) {
    throw new Error(
      `No approval chain template for documentType '${submission.documentType}'`,
    );
  }
  const steps = buildStepsForTemplate(template, submission.submitter, bundle);
  dispatch(
    submitApprovalInternal({
      submission,
      steps,
      chainTemplateId: template.id,
    }),
  );
});

export type { ApproverResolver };
