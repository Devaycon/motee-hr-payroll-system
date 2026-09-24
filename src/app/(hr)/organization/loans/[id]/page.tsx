import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Loan" };

const HrLoanDetailPage = dynamic(() =>
  import("@/src/components/hr/loans/detail").then((m) => m.HrLoanDetailPage),
);

export default async function LoanDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HrLoanDetailPage loanId={id} />;
}
