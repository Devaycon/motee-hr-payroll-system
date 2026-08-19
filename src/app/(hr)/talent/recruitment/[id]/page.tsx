"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { RequisitionDetail } from "@/src/components/hr/recruitment/detail/requisition-detail";

export default function RequisitionDetailRoute() {
  const params = useParams<{ id: string }>();
  // The detail view reads `?view=`, `?tab=` and `?candidate=` from the URL.
  return (
    <Suspense fallback={null}>
      <RequisitionDetail requisitionId={params.id} />
    </Suspense>
  );
}
