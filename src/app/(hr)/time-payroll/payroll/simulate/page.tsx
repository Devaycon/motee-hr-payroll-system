import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll simulation" };

const PayrollSimulationPage = dynamic(() => import("@/src/components/hr/payroll/simulation").then((m) => m.PayrollSimulationPage));

export default function PayrollSimulationRoute() {
  return <PayrollSimulationPage />;
}
