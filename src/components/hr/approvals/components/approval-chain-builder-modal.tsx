"use client";

import { useEffect, useMemo, useState } from "react";
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
import { store } from "@/src/lib/stores/store";
import {
  createTemplate,
  setDefaultTemplate,
  updateTemplate,
} from "@/src/lib/stores/approvals-slice";
import type {
  ApprovalChainTemplate,
  ApprovalDocumentType,
  ApproverResolver,
} from "@/src/lib/types/approvals";

interface StageDraft {
  label: string;
  approver: ApproverResolver;
  required: boolean;
}

interface ApprovalChainBuilderModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  documentType: ApprovalDocumentType;
  /** When set, the modal edits/views this chain; otherwise it creates a new one. */
  template?: ApprovalChainTemplate | null;
  /** View-only (used for system chains). */
  readOnly?: boolean;
}

function emptyStage(): StageDraft {
  return { label: "", approver: "LINE_MANAGER", required: true };
}

export function ApprovalChainBuilderModal({
  open,
  onOpenChange,
  documentType,
  template,
  readOnly = false,
}: ApprovalChainBuilderModalProps) {
  const dispatch = useAppDispatch();
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<StageDraft[]>([emptyStage()]);
  const [setActive, setSetActive] = useState(true);

  // Sync local form whenever the modal opens or the target chain changes.
  useEffect(() => {
    if (!open) return;
    if (template) {
      setName(template.name);
      setDescription(template.description ?? "");
      setStages(
        template.steps.map((s) => ({
          label: s.label,
          approver: s.approver,
          required: s.required,
        })),
      );
      setSetActive(template.isDefault);
    } else {
      setName("");
      setDescription("");
      setStages([emptyStage()]);
      setSetActive(true);
    }
  }, [open, template]);

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
      onLeaveAction: { kind: "skip" as const },
    }));

    if (template) {
      dispatch(
        updateTemplate({
          id: template.id,
          name: trimmedName,
          description: description.trim() || undefined,
          steps,
          actorName,
        }),
      );
      if (setActive && !template.isDefault) {
        dispatch(setDefaultTemplate({ documentType, id: template.id }));
      }
      toast.success("Approval chain updated");
    } else {
      dispatch(
        createTemplate({
          documentType,
          name: trimmedName,
          description: description.trim() || undefined,
          steps,
          actorName,
        }),
      );
      if (setActive) {
        // createTemplate appends the new chain; grab its id from the store.
        const created = [...store.getState().approvals.templates]
          .reverse()
          .find(
            (t) => t.documentType === documentType && t.name === trimmedName,
          );
        if (created) {
          dispatch(setDefaultTemplate({ documentType, id: created.id }));
        }
      }
      toast.success("Approval chain created");
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
