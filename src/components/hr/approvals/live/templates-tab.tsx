"use client";

import { useState } from "react";
import { GitBranch, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getApiErrorMessage } from "@/src/lib/utils";
import { approvalTemplateSchema } from "@/src/lib/validations/approvals";
import {
  useCreateApprovalTemplateMutation,
  useDeleteApprovalTemplateMutation,
  useGetApprovalTemplateCatalogueQuery,
  useGetApprovalTemplateQuery,
  useGetApprovalTemplatesQuery,
  useUpdateApprovalTemplateMutation,
} from "@/src/store/services/approval-templates";
import type {
  ApprovalTemplateDto,
  ApprovalTemplateStepRequest,
} from "@/src/types/approval-templates";
import type { ApproverResolver } from "@/src/types/common";
import { APPROVER_LABELS, humanise } from "./shared";

interface FormState {
  documentType: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  steps: ApprovalTemplateStepRequest[];
}

const EMPTY_STEP: ApprovalTemplateStepRequest = {
  label: "",
  approver: "lineManager",
  roleId: null,
  required: true,
};

const EMPTY_FORM: FormState = {
  documentType: "",
  name: "",
  description: "",
  isDefault: false,
  isActive: true,
  steps: [{ ...EMPTY_STEP }],
};

function toForm(template: ApprovalTemplateDto): FormState {
  return {
    documentType: template.documentType,
    name: template.name,
    description: template.description ?? "",
    isDefault: template.isDefault,
    isActive: template.isActive,
    steps: [...template.steps]
      .sort((a, b) => a.sequence - b.sequence)
      .map((step) => ({
        label: step.label,
        approver: step.approver,
        roleId: step.roleId ?? null,
        required: step.required,
      })),
  };
}

function TemplateDialog({
  editingId,
  documentTypes,
  onClose,
}: {
  /** `null` creates; an id edits. */
  editingId: string | null;
  documentTypes: string[];
  onClose: () => void;
}) {
  const { data: roles } = useGetApprovalTemplateCatalogueQuery();
  // The list row may be stale by the time it is opened; read the chain fresh.
  const { data: current, isLoading } = useGetApprovalTemplateQuery(
    editingId ?? "",
    { skip: !editingId },
  );
  const [createTemplate, creating] = useCreateApprovalTemplateMutation();
  const [updateTemplate, updating] = useUpdateApprovalTemplateMutation();
  const [draft, setDraft] = useState<FormState | null>(null);

  const loaded = editingId ? current?.data : undefined;
  const form = draft ?? (loaded ? toForm(loaded) : EMPTY_FORM);
  const set = (patch: Partial<FormState>) => setDraft({ ...form, ...patch });
  const setStep = (index: number, patch: Partial<ApprovalTemplateStepRequest>) =>
    set({
      steps: form.steps.map((step, i) =>
        i === index ? { ...step, ...patch } : step,
      ),
    });

  async function handleSave() {
    const parsed = approvalTemplateSchema.safeParse({
      ...form,
      description: form.description || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      if (editingId) {
        await updateTemplate({ id: editingId, body: parsed.data }).unwrap();
        toast.success(`${parsed.data.name} updated`);
      } else {
        await createTemplate(parsed.data).unwrap();
        toast.success(`${parsed.data.name} created`);
      }
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the approval chain."));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Edit approval chain" : "New approval chain"}
          </DialogTitle>
          <DialogDescription>
            The steps a request passes through, in order, before it is approved.
          </DialogDescription>
        </DialogHeader>

        {editingId && isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Standard leave approval"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Applies to</Label>
                <Input
                  value={form.documentType}
                  onChange={(e) => set({ documentType: e.target.value })}
                  placeholder="e.g. leaveRequest"
                  list="approval-document-types"
                  className="h-8 text-sm"
                />
                <datalist id="approval-document-types">
                  {documentTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-foreground">
                <Checkbox
                  checked={form.isDefault}
                  onCheckedChange={(v) => set({ isDefault: v === true })}
                />
                Default for this type
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(v) => set({ isActive: v === true })}
                />
                Active
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs">Steps</Label>
              {form.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2"
                >
                  <span className="w-5 text-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <Input
                    value={step.label}
                    onChange={(e) => setStep(index, { label: e.target.value })}
                    placeholder="Step name"
                    className="h-8 min-w-32 flex-1 text-sm"
                  />
                  <Select
                    value={step.approver}
                    onValueChange={(v) =>
                      setStep(index, {
                        approver: v as ApproverResolver,
                        roleId: v === "role" ? step.roleId : null,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(APPROVER_LABELS) as ApproverResolver[]).map(
                        (approver) => (
                          <SelectItem
                            key={approver}
                            value={approver}
                            className="text-sm"
                          >
                            {APPROVER_LABELS[approver]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  {step.approver === "role" && (
                    <Select
                      value={step.roleId ?? ""}
                      onValueChange={(v) => setStep(index, { roleId: v })}
                    >
                      <SelectTrigger className="h-8 w-44 text-sm">
                        <SelectValue placeholder="Choose role" />
                      </SelectTrigger>
                      <SelectContent>
                        {(roles?.data ?? []).map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.id}
                            className="text-sm"
                          >
                            {role.name} ({role.holders})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <label className="flex items-center gap-1.5 text-xs text-foreground">
                    <Checkbox
                      checked={step.required !== false}
                      onCheckedChange={(v) =>
                        setStep(index, { required: v === true })
                      }
                    />
                    Required
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label={`Remove step ${index + 1}`}
                    disabled={form.steps.length === 1}
                    onClick={() =>
                      set({ steps: form.steps.filter((_, i) => i !== index) })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-fit gap-1.5 text-xs"
                onClick={() => set({ steps: [...form.steps, { ...EMPTY_STEP }] })}
              >
                <Plus className="h-3.5 w-3.5" />
                Add step
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={creating.isLoading || updating.isLoading}
            onClick={handleSave}
          >
            Save chain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The approval chains each kind of request runs through. */
export function TemplatesTab() {
  const [typeFilter, setTypeFilter] = useState("all");
  const { data, isLoading } = useGetApprovalTemplatesQuery(
    typeFilter === "all" ? undefined : { documentType: typeFilter },
  );
  // Unfiltered, so the filter keeps every type even while narrowed to one.
  const { data: all } = useGetApprovalTemplatesQuery();
  const [deleteTemplate] = useDeleteApprovalTemplateMutation();
  /** `undefined` closed, `null` creating, an id editing. */
  const [dialog, setDialog] = useState<string | null | undefined>(undefined);

  const templates = data?.data ?? [];
  const documentTypes = [
    ...new Set((all?.data ?? []).map((t) => t.documentType)),
  ].sort();

  async function handleDelete(template: ApprovalTemplateDto) {
    try {
      await deleteTemplate(template.id).unwrap();
      toast.success(`${template.name} deleted`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete the approval chain."));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-56 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              All request types
            </SelectItem>
            {documentTypes.map((type) => (
              <SelectItem key={type} value={type} className="text-sm">
                {humanise(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setDialog(null)}
        >
          <Plus className="h-3.5 w-3.5" />
          New chain
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <GitBranch className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No approval chains yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="outline" className="text-[10px]">
                          Default
                        </Badge>
                      )}
                      {template.isSystem && (
                        <Badge variant="outline" className="text-[10px]">
                          System
                        </Badge>
                      )}
                      {!template.isActive && (
                        <Badge variant="outline" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {humanise(template.documentType)} ·{" "}
                      {[...template.steps]
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((s) => s.label)
                        .join(" → ")}
                      {template.runningInstances > 0
                        ? ` · ${template.runningInstances} in flight`
                        : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      aria-label={`Edit ${template.name}`}
                      onClick={() => setDialog(template.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      aria-label={`Delete ${template.name}`}
                      disabled={template.isSystem}
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {dialog !== undefined && (
        <TemplateDialog
          key={dialog ?? "new"}
          editingId={dialog}
          documentTypes={documentTypes}
          onClose={() => setDialog(undefined)}
        />
      )}
    </div>
  );
}
