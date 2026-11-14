import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll" };

const PayrollPage = dynamic(() => import("@/src/components/hr/payroll").then((m) => m.PayrollPage));

export default function PayrollRoute() {
  return <PayrollPage />;
}
