import type { Metadata } from "next";
import { RequisitionBuilder } from "@/src/components/hr/recruitment/builder/requisition-builder";

export const metadata: Metadata = { title: "Create Recruitment" };

export default async function NewRecruitmentRoute({
  searchParams,
}: {
  searchParams: Promise<{ requisition?: string; req?: string }>;
}) {
  const sp = await searchParams;
  return (
    <RequisitionBuilder
      sourceRequisitionId={sp.requisition}
      requisitionId={sp.req}
    />
  );
}
