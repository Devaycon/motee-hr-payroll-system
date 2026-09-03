import { BranchDetailPage } from "@/src/components/hr/branches/components/branch-detail-page";

export default async function BranchDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BranchDetailPage branchId={id} />;
}
