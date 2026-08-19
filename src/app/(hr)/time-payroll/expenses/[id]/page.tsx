import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Expense Claim" };

const HrExpenseClaimDetailPage = dynamic(() =>
  import("@/src/components/hr/expenses/detail").then(
    (m) => m.HrExpenseClaimDetailPage,
  ),
);

export default async function HrExpenseDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HrExpenseClaimDetailPage claimId={id} />;
}
