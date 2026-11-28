import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pay equity & salary intelligence" };

const PayEquityPage = dynamic(() => import("@/src/components/hr/payroll/pay-equity").then((m) => m.PayEquityPage));

export default function PayEquityRoute() {
  return <PayEquityPage />;
}
