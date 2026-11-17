import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { ESS_PAYSLIPS_HREF } from "@/src/lib/payroll/constants";

export const metadata: Metadata = { title: "Payslip" };

const PayslipViewPage = dynamic(() =>
  import("@/src/components/shared/payslip/payslip-view-page").then((m) => m.PayslipViewPage),
);

export default async function MyPayslipRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PayslipViewPage payslipId={decodeURIComponent(id)} mode="ess" backHref={ESS_PAYSLIPS_HREF} backLabel="My payslips" />;
}
