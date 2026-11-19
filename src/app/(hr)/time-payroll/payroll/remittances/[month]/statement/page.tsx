import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Remittance statement" };

const RemittanceStatementPage = dynamic(() => import("@/src/components/hr/payroll/remittance-statement").then((m) => m.RemittanceStatementPage));

export default async function RemittanceStatementRoute({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  return <RemittanceStatementPage month={decodeURIComponent(month)} />;
}
