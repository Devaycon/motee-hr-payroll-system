import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Variance investigations" };

const InvestigationsRegisterPage = dynamic(() => import("@/src/components/hr/payroll/investigations").then((m) => m.InvestigationsRegisterPage));

export default function InvestigationsRoute() {
  return <InvestigationsRegisterPage />;
}
