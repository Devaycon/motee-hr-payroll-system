import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll budgets" };

const PayrollBudgetEditor = dynamic(() => import("@/src/components/hr/payroll/budget-editor").then((m) => m.PayrollBudgetEditor));

export default function PayrollBudgetEditRoute() {
  return <PayrollBudgetEditor />;
}
