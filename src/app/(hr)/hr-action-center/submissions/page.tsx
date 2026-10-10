import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Submissions & Approvals — Motee HR",
  description: "",
};

const LiveApprovalsPage = dynamic(() =>
  import("@/src/components/hr/approvals/live").then((m) => m.LiveApprovalsPage),
);

export default function HrSubmissionsRoute() {
  return <LiveApprovalsPage basePath="/hr-action-center/submissions" />;
}
