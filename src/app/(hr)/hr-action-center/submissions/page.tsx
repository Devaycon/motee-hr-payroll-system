import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Submissions & Approvals — Motee HR",
  description: "",
};

const SubmissionsPage = dynamic(() =>
  import("@/src/components/hr/approvals").then((m) => m.ApprovalsPage),
);

export default function HrSubmissionsRoute() {
  return <SubmissionsPage basePath="/hr-action-center/submissions" />;
}
