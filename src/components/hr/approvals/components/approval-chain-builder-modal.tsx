"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  createTemplate,
  setDefaultTemplate,
  updateTemplate,
} from "@/src/lib/stores/approvals-slice";
import {
  APPROVAL_CHAIN_MODULES,
  moduleForDocumentType,
} from "@/src/lib/approvals/config";
import {
  categoryLabel,
  type ApprovalChainTemplate,
  type ApprovalDocumentType,
  type ApproverResolver,
  type OnLeaveAction,
  type FallbackHierarchyStep,
} from "@/src/lib/types/approvals";

interface StageDraft {
  label: string;
  approver: ApproverResolver;
  required: boolean;
  onLeaveAction: OnLeaveAction;
}

/** The fallback choices shown in the "If approver is unavailable" selector. */
type FallbackKey =
  | "skip"
  | "reassign_to_manager"
  | "auto_assign_hr"
  | "reassign_to_role"
  | "escalate_hierarchy";

const FALLBACK_OPTIONS: { value: FallbackKey; label: string }[] = [
  { value: "skip", label: "Skip this step" },
  { value: "reassign_to_manager", label: "Reassign to their manager" },
  { value: "auto_assign_hr", label: "Auto-assign to HR" },
  { value: "reassign_to_role", label: "Reassign to chosen role" },
  // §4.1 mechanism 2 — a configurable ordered chain, not a single fixed
  // fallback. Client's rationale: "more robust than simply sending
  // everything to HR, because it preserves the organisational hierarchy."
  { value: "escalate_hierarchy", label: "Escalate through hierarchy" },
];

const DEFAULT_FALLBACK_ORDER: FallbackHierarchyStep[] = ["delegate", "managers_manager", "hr"];

const FALLBACK_HIERARCHY_LABELS: Record<FallbackHierarchyStep, string> = {
  delegate: "Designated delegate",
  managers_manager: "Manager's manager",
  hr: "HR",
};

interface ApprovalChainBuilderModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Pre-selects the module when creating. Ignored when a template is given. */
  documentType?: ApprovalDocumentType;
  /** When set, the modal edits/views this chain; otherwise it creates a new one. */
  template?: ApprovalChainTemplate | null;
  /** View-only (used for system chains, and for users who can't administer). */
  readOnly?: boolean;
}

function emptyStage(): StageDraft {
  return {
    label: "",
    approver: "LINE_MANAGER",
    required: true,
    onLeaveAction: { kind: "skip" },
  };
}

export function ApprovalChainBuilderModal({
  open,
  onOpenChange,
  documentType,
  template,
  readOnly = false,
}: ApprovalChainBuilderModalProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
  const categories = useAppSelector((s) => s.approvals.categories);
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR Admin";

  const approverOptions = useMemo(
    () => [
      { value: "LINE_MANAGER" as ApproverResolver, label: "Line Manager" },
      { value: "DEPARTMENT_HEAD" as ApproverResolver, label: "Department Head" },
      ...roles.map((r) => ({
        value: `ROLE:${r.id}` as ApproverResolver,
        label: r.name,
      })),
    ],
    [roles],
  );

  // Resolve an HR role so the "Auto-assign to HR" fallback can target it.
  const hrRoleResolver = useMemo<ApproverResolver | null>(() => {
    const hr = roles.find((r) => /\b(hr|human)\b/i.test(r.name));
    return hr ? (`ROLE:${hr.id}` as ApproverResolver) : null;
  }, [roles]);

  // Map a stored OnLeaveAction to the selector key shown in the UI.
  function fallbackKeyOf(action: OnLeaveAction): FallbackKey {
    if (action.kind === "skip") return "skip";
    if (action.kind === "reassign_to_manager") return "reassign_to_manager";
    if (action.kind === "escalate_hierarchy") return "escalate_hierarchy";
    if (hrRoleResolver && action.approver === hrRoleResolver) return "auto_assign_hr";
    return "reassign_to_role";
  }

  // Build an OnLeaveAction from a selector key, preserving any chosen role.
  function buildFallback(key: FallbackKey, current: OnLeaveAction): OnLeaveAction {
    if (key === "skip") return { kind: "skip" };
    if (key === "reassign_to_manager") return { kind: "reassign_to_manager" };
    if (key === "escalate_hierarchy") {
      return {
        kind: "escalate_hierarchy",
        order: current.kind === "escalate_hierarchy" ? current.order : DEFAULT_FALLBACK_ORDER,
      };
    }
    if (key === "auto_assign_hr") {
      // Fall back to a picked role when no HR role exists.
      const approver = hrRoleResolver ?? approverOptions[0]?.value ?? "LINE_MANAGER";
      return { kind: "reassign_to_role", approver };
    }
    const approver =
      current.kind === "reassign_to_role"
        ? current.approver
        : approverOptions[0]?.value ?? "LINE_MANAGER";
    return { kind: "reassign_to_role", approver };
  }

  const [moduleType, setModuleType] = useState<ApprovalDocumentType>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<StageDraft[]>([emptyStage()]);
  const [attachmentsAllowed, setAttachmentsAllowed] = useState(false);
  const [attachmentsRequired, setAttachmentsRequired] = useState(false);
  const [submitterSigns, setSubmitterSigns] = useState(false);
  const [reviewerSigns, setReviewerSigns] = useState(false);
  const [setActive, setSetActive] = useState(true);

  // Every module a chain can be set up for. A chain that already exists for a
  // category outside that list (e.g. Onboarding) is still shown, just locked.
  const moduleOptions = useMemo(() => {
    const options = APPROVAL_CHAIN_MODULES.map((m) => ({
      value: m.documentType,
      label: m.label,
    }));
    if (template && !options.some((o) => o.value === template.documentType)) {
      options.push({
        value: template.documentType,
        label: categoryLabel(template.documentType, categories),
      });
    }
    return options;
  }, [template, categories]);

  // Sync local form whenever the modal opens or the target chain changes.
  useEffect(() => {
    if (!open) return;
    if (template) {
      setModuleType(template.documentType);
      setName(template.name);
      setDescription(template.description ?? "");
      setStages(
        template.steps.map((s) => ({
          label: s.label,
          approver: s.approver,
          required: s.required,
          onLeaveAction: s.onLeaveAction ?? { kind: "skip" },
        })),
      );
      setAttachmentsAllowed(template.attachments.allowed);
      setAttachmentsRequired(template.attachments.required);
      setSubmitterSigns(template.signatures.submitterSigns);
      setReviewerSigns(template.signatures.reviewerSigns);
      setSetActive(template.isDefault);
    } else {
      setModuleType(documentType ?? "");
      setName("");
      setDescription("");
      setStages([emptyStage()]);
      setAttachmentsAllowed(false);
      setAttachmentsRequired(false);
      setSubmitterSigns(false);
      setReviewerSigns(false);
      setSetActive(true);
    }
  }, [open, template, documentType]);

  const isEdit = Boolean(template) && !readOnly;

  function updateStage(index: number, patch: Partial<StageDraft>) {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  function moveStage(index: number, dir: -1 | 1) {
    setStages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!moduleType) {
      toast.error("Choose the module this chain is for.");
      return;
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      toast.error("Give the chain a name (at least 3 characters).");
      return;
    }
    if (stages.length === 0) {
      toast.error("Add at least one approval stage.");
      return;
    }
    const cleaned = stages.map((s) => ({ ...s, label: s.label.trim() }));
    if (cleaned.some((s) => !s.label)) {
      toast.error("Every stage needs a task label.");
      return;
    }
    const steps = cleaned.map((s) => ({
      label: s.label,
      approver: s.approver,
      required: s.required,
      onLeaveAction: s.onLeaveAction,
    }));
    const anySigner = submitterSigns || reviewerSigns;

    if (template) {
      dispatch(
        updateTemplate({
          id: template.id,
          name: trimmedName,
          description: description.trim() || undefined,
          steps,
          // Spread the existing rules so fields this form doesn't expose
          // (guidance text, place-on-document) survive an edit.
          attachments: {
            ...template.attachments,
            allowed: attachmentsAllowed,
            required: attachmentsAllowed && attachmentsRequired,
          },
          signatures: {
            ...template.signatures,
            submitterSigns,
            reviewerSigns,
            placeOnDocument: anySigner && template.signatures.placeOnDocument,
          },
          actorName,
        }),
      );
      if (setActive && !template.isDefault) {
        dispatch(
          setDefaultTemplate({ documentType: template.documentType, id: template.id }),
        );
      }
      toast.success("Approval chain updated");
    } else {
      dispatch(
        createTemplate({
          documentType: moduleType,
          name: trimmedName,
          description: description.trim() || undefined,
          steps,
          attachments: {
            allowed: attachmentsAllowed,
            required: attachmentsAllowed && attachmentsRequired,
          },
          signatures: {
            submitterSigns,
            reviewerSigns,
            placeOnDocument: false,
          },
          makeActive: setActive,
          actorName,
        }),
      );
      const host = moduleForDocumentType(moduleType);
      toast.success("Approval chain created", {
        description: host
          ? `An Approval Chain tab is now available in ${host.label}.`
          : undefined,
        action: host
          ? { label: `Open ${host.label}`, onClick: () => router.push(host.href) }
          : undefined,
      });
    }
    onOpenChange(false);
  }

  const title = readOnly
    ? template?.name ?? "Approval chain"
    : isEdit
      ? "Edit approval chain"
      : "Create approval chain";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Module</Label>
            <Select
              value={moduleType}
              // The module is fixed once the chain exists — its stages and
              // requests all belong to it.
              disabled={readOnly || Boolean(template)}
              onValueChange={setModuleType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the module this chain is for" />
              </SelectTrigger>
              <SelectContent>
                {moduleOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!template && (
              <p className="text-[11px] text-muted-foreground">
                Once created, an Approval Chain tab is added to this module so
                everyone can see how its requests are routed. It can only be
                changed here.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Chain name</Label>
            <Input
              value={name}
              disabled={readOnly}
              placeholder="e.g. Fast-track asset approval"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={description}
              disabled={readOnly}
              placeholder="When should this chain be used?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Approval stages</Label>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => setStages((p) => [...p, emptyStage()])}
                >
                  <Plus className="w-3 h-3" />
                  Add stage
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {stages.map((stage, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5"
                >
                  <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={stage.label}
                      disabled={readOnly}
                      placeholder="Task to approve (e.g. Approve asset need)"
                      onChange={(e) =>
                        updateStage(i, { label: e.target.value })
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={stage.approver}
                        disabled={readOnly}
                        onValueChange={(v) =>
                          updateStage(i, { approver: v as ApproverResolver })
                        }
                      >
                        <SelectTrigger className="h-8 w-56">
                          <SelectValue placeholder="Approver" />
                        </SelectTrigger>
                        <SelectContent>
                          {approverOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Checkbox
                          checked={stage.required}
                          disabled={readOnly}
                          onCheckedChange={(v) =>
                            updateStage(i, { required: Boolean(v) })
                          }
                        />
                        Required
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        If approver is unavailable
                      </span>
                      <Select
                        value={fallbackKeyOf(stage.onLeaveAction)}
                        disabled={readOnly}
                        onValueChange={(v) =>
                          updateStage(i, {
                            onLeaveAction: buildFallback(
                              v as FallbackKey,
                              stage.onLeaveAction,
                            ),
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-52">
                          <SelectValue placeholder="Fallback action" />
                        </SelectTrigger>
                        <SelectContent>
                          {FALLBACK_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fallbackKeyOf(stage.onLeaveAction) === "reassign_to_role" && (
                        <Select
                          value={
                            stage.onLeaveAction.kind === "reassign_to_role"
                              ? stage.onLeaveAction.approver
                              : undefined
                          }
                          disabled={readOnly}
                          onValueChange={(v) =>
                            updateStage(i, {
                              onLeaveAction: {
                                kind: "reassign_to_role",
                                approver: v as ApproverResolver,
                              },
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-48">
                            <SelectValue placeholder="Pick a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {approverOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {fallbackKeyOf(stage.onLeaveAction) === "escalate_hierarchy" &&
                        stage.onLeaveAction.kind === "escalate_hierarchy" && (
                          <div className="flex flex-wrap items-center gap-1">
                            {stage.onLeaveAction.order.map((hop, hopIndex, arr) => (
                              <span
                                key={hop}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-1 text-[11px] text-foreground"
                              >
                                {hopIndex + 1}. {FALLBACK_HIERARCHY_LABELS[hop]}
                                {!readOnly && (
                                  <span className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      disabled={hopIndex === 0}
                                      className="disabled:opacity-30"
                                      onClick={() => {
                                        if (stage.onLeaveAction.kind !== "escalate_hierarchy") return;
                                        const next = [...stage.onLeaveAction.order];
                                        [next[hopIndex - 1], next[hopIndex]] = [next[hopIndex], next[hopIndex - 1]];
                                        updateStage(i, { onLeaveAction: { kind: "escalate_hierarchy", order: next } });
                                      }}
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      disabled={hopIndex === arr.length - 1}
                                      className="disabled:opacity-30"
                                      onClick={() => {
                                        if (stage.onLeaveAction.kind !== "escalate_hierarchy") return;
                                        const next = [...stage.onLeaveAction.order];
                                        [next[hopIndex], next[hopIndex + 1]] = [next[hopIndex + 1], next[hopIndex]];
                                        updateStage(i, { onLeaveAction: { kind: "escalate_hierarchy", order: next } });
                                      }}
                                    >
                                      ↓
                                    </button>
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex flex-col gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={i === 0}
                        onClick={() => moveStage(i, -1)}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={i === stages.length - 1}
                        onClick={() => moveStage(i, 1)}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        disabled={stages.length === 1}
                        onClick={() => removeStage(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Submission rules</Label>
            <div className="grid gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={attachmentsAllowed}
                  disabled={readOnly}
                  onCheckedChange={(v) => {
                    const on = Boolean(v);
                    setAttachmentsAllowed(on);
                    if (!on) setAttachmentsRequired(false);
                  }}
                />
                Allow attachments
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={submitterSigns}
                  disabled={readOnly}
                  onCheckedChange={(v) => setSubmitterSigns(Boolean(v))}
                />
                Submitter must sign
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={attachmentsAllowed && attachmentsRequired}
                  disabled={readOnly || !attachmentsAllowed}
                  onCheckedChange={(v) => setAttachmentsRequired(Boolean(v))}
                />
                Require at least one attachment
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={reviewerSigns}
                  disabled={readOnly}
                  onCheckedChange={(v) => setReviewerSigns(Boolean(v))}
                />
                Every reviewer must sign
              </label>
            </div>
          </div>

          {!readOnly && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={setActive}
                onCheckedChange={(v) => setSetActive(Boolean(v))}
              />
              Set as the active chain for new requests
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave}>
              {isEdit ? "Save changes" : "Create chain"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
