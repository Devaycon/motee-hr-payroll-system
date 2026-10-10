import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Approval — Motee HR",
  description: "",
};

const LiveApprovalDetailPage = dynamic(() =>
  import("@/src/components/hr/approvals/live/detail-page").then(
    (m) => m.LiveApprovalDetailPage,
  ),
);

export default async function HrSubmissionDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <LiveApprovalDetailPage id={id} basePath="/hr-action-center/submissions" />
  );
}
