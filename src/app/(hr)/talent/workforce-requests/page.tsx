import { Metadata } from "next";
import dynamic from "next/dynamic";

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
  return <WorkforceRequestsPage />;
}
