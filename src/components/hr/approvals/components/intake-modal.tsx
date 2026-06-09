"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { SignaturePad } from "@/src/components/shared/signature-pad";
import { FileDropzone } from "@/src/components/shared/file-dropzone";
import {
  categoryLabel,
  type ApprovalAttachment,
  type ApprovalChainTemplate,
  type ApprovalDocumentType,
} from "@/src/lib/types/approvals";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { submitApproval } from "@/src/lib/stores/approvals-slice";
import {
  DEPARTMENTS,
  URGENCY_LEVELS,
  LEAVE_TYPES,
  CONTRACT_TYPES,
  COUNTERPARTIES,
  OFFBOARDING_REASONS,
  ASSET_TYPES,
} from "@/src/config/system-data";

interface IntakeModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: ApprovalDocumentType;
}

interface ExtraField {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
  placeholder?: string;
  /** When set, the field renders as a dropdown of these options. */
  options?: string[];
}

const EXTRA_FIELDS: Record<ApprovalDocumentType, ExtraField[]> = {
  workforce_request: [
    { key: "department", label: "Department", options: DEPARTMENTS },
    { key: "numberOfHires", label: "Number of hires", type: "number" },
    { key: "reason", label: "Reason for hiring", placeholder: "Expansion / Backfill / ..." },
    { key: "budgetEstimate", label: "Budget estimate", type: "number" },
    { key: "urgency", label: "Urgency level", options: URGENCY_LEVELS },
    { key: "expectedStartDate", label: "Expected start date", type: "date" },
  ],
  leave_request: [
    { key: "leaveType", label: "Leave type", options: LEAVE_TYPES },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "totalDays", label: "Total days", type: "number" },
  ],
  job_requisition: [
    { key: "positionTitle", label: "Position title" },
    { key: "department", label: "Department", options: DEPARTMENTS },
    { key: "openings", label: "Openings", type: "number" },
    { key: "salaryRange", label: "Salary range" },
  ],
  contract: [
    { key: "counterparty", label: "Counterparty", options: COUNTERPARTIES },
    { key: "contractType", label: "Type", options: CONTRACT_TYPES },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
  ],
  offboarding_clearance: [
    { key: "lastDay", label: "Last working day", type: "date" },
    { key: "reason", label: "Reason", options: OFFBOARDING_REASONS },
  ],
  promotion_request: [
    { key: "newTitle", label: "Proposed new title" },
    { key: "newGrade", label: "Proposed grade" },
    { key: "newSalary", label: "Proposed salary", type: "number" },
    { key: "effectiveDate", label: "Effective from", type: "date" },
  ],
  training_request: [
    { key: "course", label: "Course / programme" },
    { key: "provider", label: "Provider" },
    { key: "cost", label: "Estimated cost", type: "number" },
    { key: "startDate", label: "Start date", type: "date" },
  ],
  asset_request: [
    { key: "assetType", label: "Asset type", options: ASSET_TYPES },
    { key: "model", label: "Preferred model" },
    { key: "justification", label: "Justification" },
  ],
  expense_claim: [
    { key: "category", label: "Category" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "incurredOn", label: "Incurred on", type: "date" },
    { key: "merchant", label: "Merchant" },
  ],
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Returns true if the active user is eligible to start a submission using
 * a workflow whose startDesk matches them.
 */
function isEligibleStarter(
  template: ApprovalChainTemplate,
  userRoleId: string | undefined,
): boolean {
  if (template.startDesk.kind === "submitter") return true;
  if (template.startDesk.kind === "resolver") {
    const a = template.startDesk.approver;
    if (a.startsWith("ROLE:")) {
      return userRoleId === a.slice(5);
    }
    // LINE_MANAGER / DEPARTMENT_HEAD don't make sense as start desk
    return false;
  }
  return false;
}

export function IntakeModal({
  open,
  onOpenChange,
  defaultType,
}: IntakeModalProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const templates = useAppSelector((s) => s.approvals.templates);
  const categories = useAppSelector((s) => s.approvals.categories);

  // Build the list of eligible (documentType, workflow) pairs
  const eligibleWorkflowsByType = useMemo(() => {
    const out = new Map<ApprovalDocumentType, ApprovalChainTemplate[]>();
    for (const t of templates) {
      if (!isEligibleStarter(t, user?.roleId)) continue;
      const arr = out.get(t.documentType) ?? [];
      arr.push(t);
      out.set(t.documentType, arr);
    }
    return out;
  }, [templates, user?.roleId]);

  // Category ids that have at least one eligible workflow, ordered by the
  // category registry (built-ins + custom) so new categories appear too.
  const eligibleTypes = useMemo(() => {
    const withWorkflows = new Set(
      Array.from(eligibleWorkflowsByType.entries())
        .filter(([, list]) => list.length > 0)
        .map(([id]) => id),
    );
    const ordered = categories
      .map((c) => c.id)
      .filter((id) => withWorkflows.has(id));
    // include any workflow categories not present in the registry (safety)
    for (const id of withWorkflows) {
      if (!ordered.includes(id)) ordered.push(id);
    }
    return ordered;
  }, [eligibleWorkflowsByType, categories]);

  const [documentType, setDocumentType] = useState<ApprovalDocumentType>(
    defaultType ?? "leave_request",
  );
  const [workflowId, setWorkflowId] = useState<string | "default">("default");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<ApprovalAttachment[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // When eligibility changes (e.g., role switch), re-anchor doc type
  if (
    open &&
    !eligibleWorkflowsByType.get(documentType)?.length &&
    eligibleTypes.length > 0
  ) {
    setDocumentType(eligibleTypes[0]);
    setWorkflowId("default");
  }

  const workflowsForType =
    eligibleWorkflowsByType.get(documentType) ?? [];
  const selectedWorkflow: ApprovalChainTemplate | null =
    workflowId === "default"
      ? (workflowsForType.find((w) => w.isDefault) ?? workflowsForType[0] ?? null)
      : (workflowsForType.find((w) => w.id === workflowId) ?? null);

  const allowsAttachments = selectedWorkflow?.attachments.allowed ?? false;
  const requiresAttachments = selectedWorkflow?.attachments.required ?? false;
  const requiresSignature = selectedWorkflow?.signatures.submitterSigns ?? false;

  function reset() {
    setDocumentType(defaultType ?? eligibleTypes[0] ?? "leave_request");
    setWorkflowId("default");
    setTitle("");
    setSummary("");
    setExtras({});
    setAttachments([]);
    setSignatureDataUrl(null);
    setErrors({});
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    if (!user) return;
    const added: ApprovalAttachment[] = [];
    for (const f of Array.from(list)) {
      if (f.size > MAX_FILE_BYTES) {
        toast.error(
          `"${f.name}" is ${formatBytes(f.size)} — files must be ≤ 2 MB.`,
        );
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(f);
        added.push({
          id: `ATT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: f.name,
          mimeType: f.type || "application/octet-stream",
          sizeBytes: f.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedByEmployeeId: user.employeeId,
        });
      } catch {
        toast.error(`Couldn't read "${f.name}".`);
      }
    }
    if (added.length) setAttachments((prev) => [...prev, ...added]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    if (title.trim().length < 3) errs.title = "Title is required";
    if (summary.trim().length < 5) errs.summary = "Summary is required";
    if (!user) errs._user = "You must be logged in to submit";
    if (requiresAttachments && attachments.length === 0) {
      errs.attachments = "At least one attachment is required";
    }
    if (requiresSignature && !signatureDataUrl) {
      errs.signature = "Please sign before submitting";
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const me = user!;
    const employee = employees.find((e) => e.id === me.employeeId);
    await dispatch(
      submitApproval({
        documentType,
        documentId: `EXT-${Date.now()}`,
        documentTitle: title.trim(),
        documentSummary: summary.trim(),
        payloadSnapshot: { ...extras },
        submitter: {
          employeeId: me.employeeId,
          name: me.name,
          initials: me.initials,
          departmentName: employee?.departmentName ?? me.departmentName,
        },
        chainTemplateId: selectedWorkflow?.id,
        attachments,
        submitterSignatureDataUrl: signatureDataUrl ?? undefined,
      }),
    );
    toast.success("Submitted for approval");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl p-0 gap-0 flex flex-col max-h-[92vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <DialogTitle>New submission</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Pick a document type and submit it through the central approval hub.
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          {eligibleTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workflow lets you submit from your current desk. Ask HR Admin
              to grant your role a starting desk on at least one workflow.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Document type</Label>
                <Select
                  value={documentType}
                  onValueChange={(v) => {
                    setDocumentType(v as ApprovalDocumentType);
                    setWorkflowId("default");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {categoryLabel(t, categories)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {workflowsForType.length > 1 && (
                <div className="space-y-1.5">
                  <Label>Workflow</Label>
                  <Select value={workflowId} onValueChange={setWorkflowId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      {workflowsForType.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  placeholder="Annual leave – 5 days"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Summary</Label>
                <Textarea
                  placeholder="One line reviewers will see in the queue"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                />
                {errors.summary && (
                  <p className="text-xs text-destructive">{errors.summary}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {(EXTRA_FIELDS[documentType] ?? []).map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label>{f.label}</Label>
                    {f.options ? (
                      <Select
                        value={extras[f.key] ?? ""}
                        onValueChange={(v) =>
                          setExtras((prev) => ({ ...prev, [f.key]: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {f.options.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={f.type ?? "text"}
                        placeholder={f.placeholder}
                        value={extras[f.key] ?? ""}
                        onChange={(e) =>
                          setExtras((prev) => ({
                            ...prev,
                            [f.key]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>

              {allowsAttachments && (
                <div className="space-y-2 pt-1">
                  <Label className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Attachments
                    {requiresAttachments && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  {selectedWorkflow?.attachments.description && (
                    <p className="text-[11px] text-muted-foreground">
                      {selectedWorkflow.attachments.description}
                    </p>
                  )}
                  <FileDropzone
                    multiple
                    hint="PDF, images or documents"
                    onFiles={handleFiles}
                  />
                  {attachments.length > 0 && (
                    <ul className="space-y-1.5">
                      {attachments.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate text-foreground">
                              {a.name}
                            </span>
                            <span className="text-muted-foreground shrink-0">
                              · {formatBytes(a.sizeBytes)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeAttachment(a.id)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.attachments && (
                    <p className="text-xs text-destructive">
                      {errors.attachments}
                    </p>
                  )}
                </div>
              )}

              {requiresSignature && (
                <div className="space-y-2 pt-1">
                  <Label>Your signature *</Label>
                  <SignaturePad
                    onChange={setSignatureDataUrl}
                    initialValue={signatureDataUrl ?? undefined}
                  />
                  {errors.signature && (
                    <p className="text-xs text-destructive">
                      {errors.signature}
                    </p>
                  )}
                </div>
              )}

              {errors._user && (
                <p className="text-xs text-destructive">{errors._user}</p>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={eligibleTypes.length === 0}
          >
            Submit for approval
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
