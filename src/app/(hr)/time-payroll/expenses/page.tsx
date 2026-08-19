import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Expense Claims" };

const ExpenseClaimsPage = dynamic(() =>
  import("@/src/components/hr/expenses").then((m) => m.ExpenseClaimsPage),
);

export default function ExpenseClaimsRoute() {
  return <ExpenseClaimsPage />;
}
