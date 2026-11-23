import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll Calculator" };

const PayrollCalculatorPage = dynamic(() => import("@/src/components/hr/payroll-calculator").then((m) => m.PayrollCalculatorPage));

export default function PayrollCalculatorRoute() {
  return <PayrollCalculatorPage />;
}
