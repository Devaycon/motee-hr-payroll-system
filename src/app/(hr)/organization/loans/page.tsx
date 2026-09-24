import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employee Loans" };

const LoansPage = dynamic(() =>
  import("@/src/components/hr/loans").then((m) => m.LoansPage),
);

export default function LoansRoute() {
  return <LoansPage />;
}
