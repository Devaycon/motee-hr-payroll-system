import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll budget & forecasting" };

const PayrollBudgetPage = dynamic(() => import("@/src/components/hr/payroll/budget-forecast").then((m) => m.PayrollBudgetPage));

export default function PayrollBudgetRoute() {
  return <PayrollBudgetPage />;
}
