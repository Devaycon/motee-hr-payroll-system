"use client";

import type { ReactNode } from "react";
import { Paperclip, PenLine } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  ApprovalChainTemplate,
  ApproverResolver,
  OnLeaveAction,
  FallbackHierarchyStep,
} from "@/src/lib/types/approvals";
import type { LocaleRole } from "@/src/lib/types/locale";

export function approverLabel(
  resolver: ApproverResolver,
  roles: LocaleRole[],
): string {
  if (resolver === "LINE_MANAGER") return "Line Manager";
  if (resolver === "DEPARTMENT_HEAD") return "Department Head";
  if (resolver.startsWith("ROLE:")) {
    const roleId = resolver.slice(5);
    return roles.find((r) => r.id === roleId)?.name ?? roleId;
  }
  return resolver;
}

const FALLBACK_HIERARCHY_LABELS: Record<FallbackHierarchyStep, string> = {
  delegate: "Designated delegate",
  managers_manager: "Manager's manager",
  hr: "HR",
};

function onLeaveLabel(action: OnLeaveAction, roles: LocaleRole[]): string {
  switch (action.kind) {
    case "skip":
      return "Skip this step";
    case "reassign_to_manager":
      return "Reassign to their manager";
    case "reassign_to_role":
      return `Reassign to ${approverLabel(action.approver, roles)}`;
    case "escalate_hierarchy":
      // §4.1 mechanism 2 — a pre-configured delegation (mechanism 1) is
      // always tried first; this is what happens when none is set.
      return `Escalate: ${action.order.map((s) => FALLBACK_HIERARCHY_LABELS[s]).join(" → ")}`;
  }
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface ChainDetailCardProps {
  chain: ApprovalChainTemplate;
  /** Shown as a badge — useful where chains from several modules are listed together. */
  moduleLabel?: string;
  /** Buttons for the top-right corner. Omit for a read-only card. */
  actions?: ReactNode;
}

/**
 * One approval chain with every detail: who can start it, each stage with its
 * approver and unavailable-approver fallback, where it ends, and the
 * attachment and signature rules. Shared by the management tab and the
 * read-only module tab so they can never show different things.
 */
export function ChainDetailCard({
  chain,
  moduleLabel,
  actions,
}: ChainDetailCardProps) {
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);

  const startsWith =
    chain.startDesk.kind === "submitter"
      ? "Anyone submitting"
      : `Only ${approverLabel(chain.startDesk.approver, roles)}`;
  const endsWith =
    chain.endDesk.kind === "approved"
      ? "Approved — request closes"
      : `Final desk: ${approverLabel(chain.endDesk.approver, roles)}`;

  const attachmentText = !chain.attachments.allowed
    ? "Not accepted"
    : chain.attachments.required
      ? "Required"
      : "Optional";

  const signatureParts = [
    chain.signatures.submitterSigns && "Submitter signs",
    chain.signatures.reviewerSigns && "Every reviewer signs",
    (chain.signatures.submitterSigns || chain.signatures.reviewerSigns) &&
      chain.signatures.placeOnDocument &&
      "Placed on the document",
  ].filter(Boolean) as string[];

  return (
    <Card
      className={chain.isDefault ? "border-[#FE8F44]/50" : "border-border/60"}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{chain.name}</h3>
              {chain.isDefault && (
                <Badge className="bg-[#FE8F44] text-white">Active</Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {chain.kind}
              </Badge>
              {moduleLabel && <Badge variant="secondary">{moduleLabel}</Badge>}
            </div>
            {chain.description && (
              <p className="text-xs text-muted-foreground">
                {chain.description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-24 shrink-0 font-medium uppercase tracking-wide">
              Starts with
            </span>
            <span className="text-foreground">{startsWith}</span>
          </div>

          <ol className="space-y-2">
            {chain.steps.map((step) => (
              <li key={step.id} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                  {step.order}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
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
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    If unavailable: {onLeaveLabel(step.onLeaveAction, roles)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-24 shrink-0 font-medium uppercase tracking-wide">
              Ends with
            </span>
            <span className="text-foreground">{endsWith}</span>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
          <div className="space-y-0.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              Attachments
            </p>
            <p className="text-sm text-foreground">{attachmentText}</p>
            {chain.attachments.allowed && chain.attachments.description && (
              <p className="text-[11px] text-muted-foreground">
                {chain.attachments.description}
              </p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <PenLine className="h-3.5 w-3.5" />
              Signatures
            </p>
            <p className="text-sm text-foreground">
              {signatureParts.length > 0
                ? signatureParts.join(" · ")
                : "None required"}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Last modified by {chain.lastModifiedBy} on{" "}
          {formatDate(chain.lastModifiedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
