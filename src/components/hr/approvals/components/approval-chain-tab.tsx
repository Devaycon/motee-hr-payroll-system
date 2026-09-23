"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { ApprovalDocumentType } from "@/src/lib/types/approvals";
import { APPROVAL_CHAINS_PATH } from "@/src/lib/approvals/config";
import { ChainDetailCard } from "./chain-detail-card";

interface ApprovalChainTabProps {
  documentType: ApprovalDocumentType;
}

/**
 * The read-only Approval Chain tab a module shows once a chain exists for it.
 * Chains are created and changed only in Submissions & Approvals, so this
 * carries every detail but no edit, delete or activate controls.
 */
export function ApprovalChainTab({ documentType }: ApprovalChainTabProps) {
  const templates = useAppSelector((s) => s.approvals.templates);

  // The active chain first, then the rest in the order they were made.
  const chains = useMemo(
    () =>
      templates
        .filter((t) => t.documentType === documentType)
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
    [templates, documentType],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex max-w-2xl items-start gap-2.5">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            These chains route every new request for this module. The{" "}
            <strong>active</strong> chain is the one in use. They are read-only
            here — to create, edit or switch a chain, go to{" "}
            <strong>Submissions &amp; Approvals</strong>.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
          <Link href={APPROVAL_CHAINS_PATH}>
            Manage chains
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {chains.map((chain) => (
          <ChainDetailCard key={chain.id} chain={chain} />
        ))}
      </div>
    </div>
  );
}
