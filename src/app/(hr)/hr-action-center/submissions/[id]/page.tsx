import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Submission — Motee HR",
  description: "",
};

const SubmissionDetailPage = dynamic(() =>
  import("@/src/components/hr/approvals/detail-page").then(
    (m) => m.ApprovalDetailPage,
  ),
);

export default async function HrSubmissionDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SubmissionDetailPage requestId={id} basePath="/hr-action-center/submissions" />
  );
}
