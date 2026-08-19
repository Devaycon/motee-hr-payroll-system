import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Expense Claim — Motee",
  description: "",
};

const ExpenseClaimDetailPage = dynamic(() =>
  import("@/src/components/employee/expenses/detail").then(
    (m) => m.ExpenseClaimDetailPage,
  ),
);

export default async function EmployeeExpenseDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExpenseClaimDetailPage claimId={id} />;
}
