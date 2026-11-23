import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payslip simulation" };

const PayCalculatorPage = dynamic(() => import("@/src/components/hr/payroll/pay-calculator").then((m) => m.PayCalculatorPage));

export default function PayCalculatorRoute() {
  return <PayCalculatorPage />;
}
