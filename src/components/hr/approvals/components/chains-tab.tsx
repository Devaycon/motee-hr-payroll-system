"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Workflow,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  deleteTemplate,
  setDefaultTemplate,
} from "@/src/lib/stores/approvals-slice";
import {
  APPROVAL_CHAIN_MODULES,
  moduleForDocumentType,
} from "@/src/lib/approvals/config";
import { paginateGroups } from "@/src/lib/approvals/paginate-groups";
import {
  categoryLabel,
  type ApprovalChainTemplate,
} from "@/src/lib/types/approvals";
import { ListPagination } from "@/src/components/shared/list-pagination";
import { ApprovalChainBuilderModal } from "./approval-chain-builder-modal";
import { ChainDetailCard } from "./chain-detail-card";

/** Chain cards are tall (every stage and rule is spelled out), so keep pages short. */
const CHAINS_PER_PAGE = 4;

interface ApprovalChainsTabProps {
  /** Whether the user may create, edit, delete and activate chains. */
  canManage: boolean;
}

/**
 * Where approval chains are created and managed — the only place they can be
 * changed. Modules show a read-only copy once a chain exists for them.
 */
export function ApprovalChainsTab({ canManage }: ApprovalChainsTabProps) {
  const dispatch = useAppDispatch();
  const templates = useAppSelector((s) => s.approvals.templates);
  const categories = useAppSelector((s) => s.approvals.categories);

  const [moduleFilter, setModuleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalChainTemplate | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [pendingDelete, setPendingDelete] =
    useState<ApprovalChainTemplate | null>(null);

  /** One group per module, the registry's modules first (in their listed order). */
  const groups = useMemo(() => {
    const byType = new Map<string, ApprovalChainTemplate[]>();
    for (const t of templates) {
      byType.set(t.documentType, [...(byType.get(t.documentType) ?? []), t]);
    }
    const order = APPROVAL_CHAIN_MODULES.map((m) => m.documentType);
    return Array.from(byType.entries())
      .map(([documentType, chains]) => ({
        documentType,
        label:
          moduleForDocumentType(documentType)?.label ??
          categoryLabel(documentType, categories),
        // The active chain first.
        chains: [...chains].sort(
          (a, b) => Number(b.isDefault) - Number(a.isDefault),
        ),
      }))
      .sort((a, b) => {
        const ai = order.indexOf(a.documentType);
        const bi = order.indexOf(b.documentType);
        if (ai === -1 && bi === -1) return a.label.localeCompare(b.label);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
  }, [templates, categories]);

  const visibleGroups =
    moduleFilter === "all"
      ? groups
      : groups.filter((g) => g.documentType === moduleFilter);

  // A module with many chains carries on to the next page; each page's slice
  // is regrouped under its module heading. The page is clamped, so deleting
  // the last chain on a page never strands us on one that no longer exists.
  const {
    sections: pageSections,
    totalItems: totalChains,
    totalPages,
    currentPage,
    start: pageStart,
    end: pageEnd,
  } = paginateGroups(visibleGroups, page, CHAINS_PER_PAGE);

  function openCreate() {
    setEditing(null);
    setReadOnly(false);
    setBuilderOpen(true);
  }

  function openChain(chain: ApprovalChainTemplate) {
    setEditing(chain);
    // System chains are fixed, and non-admins can look but not change.
    setReadOnly(chain.kind === "system" || !canManage);
    setBuilderOpen(true);
  }

  function handleSetActive(chain: ApprovalChainTemplate) {
    dispatch(
      setDefaultTemplate({ documentType: chain.documentType, id: chain.id }),
    );
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
      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <Select
            value={moduleFilter}
            onValueChange={(v) => {
              setModuleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-48 text-xs">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.documentType} value={g.documentType}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && (
            <Button className="gap-1.5 shrink-0" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Create approval chain
            </Button>
          )}
        </div>
      </div>

      {visibleGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Workflow className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No approval chains yet
          </p>
          {canManage && (
            <Button variant="outline" size="sm" onClick={openCreate}>
              Create the first chain
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {pageSections.map(({ group, chains }) => {
            const host = moduleForDocumentType(group.documentType);
            return (
              <section key={group.documentType} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    {group.label}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({group.chains.length}{" "}
                      {group.chains.length === 1 ? "chain" : "chains"})
                    </span>
                  </h2>
                  {host && (
                    <Link
                      href={host.href}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Open {host.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                {chains.map((chain) => {
                  const editable = canManage && chain.kind === "custom";
                  return (
                    <ChainDetailCard
                      key={chain.id}
                      chain={chain}
                      actions={
                        <>
                          {canManage && !chain.isDefault && (
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
                            onClick={() => openChain(chain)}
                          >
                            {editable ? (
                              <Pencil className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            {editable ? "Edit" : "View"}
                          </Button>
                          {editable && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setPendingDelete(chain)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </>
                      }
                    />
                  );
                })}
              </section>
            );
          })}

          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            summary={`Showing ${pageStart + 1}–${pageEnd} of ${totalChains} chains`}
          />
        </div>
      )}

      <ApprovalChainBuilderModal
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        documentType={
          moduleFilter !== "all" && moduleForDocumentType(moduleFilter)
            ? moduleFilter
            : undefined
        }
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
