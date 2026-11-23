import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll cost" };

const PayrollCostPage = dynamic(() => import("@/src/components/hr/payroll/payroll-cost").then((m) => m.PayrollCostPage));

export default function PayrollCostRoute() {
  return <PayrollCostPage />;
}
