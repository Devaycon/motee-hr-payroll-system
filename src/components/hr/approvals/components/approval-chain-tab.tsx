"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Pencil, Plus, Trash2, Workflow } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  deleteTemplate,
  setDefaultTemplate,
} from "@/src/lib/stores/approvals-slice";
import type {
  ApprovalChainTemplate,
  ApprovalDocumentType,
  ApproverResolver,
} from "@/src/lib/types/approvals";
import type { LocaleRole } from "@/src/lib/types/locale";
import { ApprovalChainBuilderModal } from "./approval-chain-builder-modal";

function approverLabel(resolver: ApproverResolver, roles: LocaleRole[]): string {
  if (resolver === "LINE_MANAGER") return "Line Manager";
  if (resolver === "DEPARTMENT_HEAD") return "Department Head";
  if (resolver.startsWith("ROLE:")) {
    const roleId = resolver.slice(5);
    return roles.find((r) => r.id === roleId)?.name ?? roleId;
  }
  return resolver;
}

interface ApprovalChainTabProps {
  documentType: ApprovalDocumentType;
}

export function ApprovalChainTab({ documentType }: ApprovalChainTabProps) {
  const dispatch = useAppDispatch();
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
  const templates = useAppSelector((s) => s.approvals.templates);

  const chains = useMemo(
    () => templates.filter((t) => t.documentType === documentType),
    [templates, documentType],
  );

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalChainTemplate | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [pendingDelete, setPendingDelete] =
    useState<ApprovalChainTemplate | null>(null);

  function openCreate() {
    setEditing(null);
    setReadOnly(false);
    setBuilderOpen(true);
  }

  function openEdit(chain: ApprovalChainTemplate) {
    setEditing(chain);
    setReadOnly(chain.kind === "system");
    setBuilderOpen(true);
  }

  function handleSetActive(chain: ApprovalChainTemplate) {
    dispatch(setDefaultTemplate({ documentType, id: chain.id }));
    toast.success(`"${chain.name}" is now the active chain`);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    dispatch(deleteTemplate(pendingDelete.id));
    toast.success("Approval chain deleted");
    setPendingDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Define how a request moves from submission through each approval stage
          to the final approver. The <strong>active</strong> chain is used for
          all new requests — create your own chains and switch the active one at
          any time.
        </p>
        <Button className="gap-1.5 shrink-0" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Create chain
        </Button>
      </div>

      {chains.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Workflow className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No approval chains yet
          </p>
          <Button variant="outline" size="sm" onClick={openCreate}>
            Create the first chain
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {chains.map((chain) => (
            <Card
              key={chain.id}
              className={
                chain.isDefault ? "border-[#ff8b2d]/50" : "border-border/60"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {chain.name}
                      </h3>
                      {chain.isDefault && (
                        <Badge className="bg-[#ff8b2d] text-white">
                          Active
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {chain.kind}
                      </Badge>
                    </div>
                    {chain.description && (
                      <p className="text-xs text-muted-foreground">
                        {chain.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!chain.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-[11px]"
                        onClick={() => handleSetActive(chain)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Set active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-[11px]"
                      onClick={() => openEdit(chain)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {chain.kind === "system" ? "View" : "Edit"}
                    </Button>
                    {chain.kind === "custom" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setPendingDelete(chain)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <ol className="mt-3 space-y-1.5">
                  {chain.steps.map((step) => (
                    <li
                      key={step.id}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                        {step.order}
                      </span>
                      <span className="text-foreground">{step.label}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="text-muted-foreground">
                        {approverLabel(step.approver, roles)}
                      </span>
                      {!step.required && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          optional
                        </Badge>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ApprovalChainBuilderModal
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        documentType={documentType}
        template={editing}
        readOnly={readOnly}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(v) => !v && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this approval chain?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.isDefault
                ? "This is the active chain. Deleting it will fall back to another chain for new requests. This cannot be undone."
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
