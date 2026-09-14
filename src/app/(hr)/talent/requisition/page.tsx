import { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Requisition — Motee HR",
  description: "",
};

const RequisitionsPage = dynamic(() =>
  import("@/src/components/hr/requisitions").then((m) => m.RequisitionsPage),
);

export default function RequisitionRoute() {
  // The page reads a `workforceRequest` search param so the Workforce
  // Requests list can deep-link straight into "Create requisition" for a
  // specific approved request, instead of dropping the user on a blank list.
  return (
    <Suspense>
      <RequisitionsPage />
    </Suspense>
  );
}
