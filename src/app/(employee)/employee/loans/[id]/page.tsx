import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Loan" };

const MyLoanDetailPage = dynamic(() =>
  import("@/src/components/employee/loans").then((m) => m.MyLoanDetailPage),
);

export default async function MyLoanDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MyLoanDetailPage loanId={id} />;
}
