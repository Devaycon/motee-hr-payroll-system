"use client";

import { SicknessShell } from "@/src/components/hr/sickness/shell";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";

export default function SicknessApprovalChainRoute() {
  return (
    <SicknessShell>
      <ApprovalChainTab documentType="sickness_absence" />
    </SicknessShell>
  );
}
