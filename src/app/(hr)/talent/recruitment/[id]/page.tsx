"use client";

import { useParams } from "next/navigation";
import { RequisitionDetail } from "@/src/components/hr/recruitment/detail/requisition-detail";

export default function RequisitionDetailRoute() {
  const params = useParams<{ id: string }>();
  return <RequisitionDetail requisitionId={params.id} />;
}
