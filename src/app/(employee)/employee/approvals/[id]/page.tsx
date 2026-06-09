import { redirect } from "next/navigation";

export default async function EmployeeApprovalDetailLegacyRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/employee/submissions/${id}`);
}
