import { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Workforce Requests — Motee HR",
  description: "",
};

const WorkforceRequestsPage = dynamic(() =>
  import("@/src/components/hr/workforce-requests").then(
    (m) => m.WorkforceRequestsPage,
  ),
);

export default function WorkforceRequestsRoute() {
  // The page reads search params so the Gap Report can deep-link a prefilled
  // request (§6.36); that needs a Suspense boundary to stay prerenderable.
  return (
    <Suspense>
      <WorkforceRequestsPage />
    </Suspense>
  );
}
