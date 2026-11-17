import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payslip" };

const PayslipViewPage = dynamic(() =>
  import("@/src/components/shared/payslip/payslip-view-page").then((m) => m.PayslipViewPage),
);

export default async function EmployeePayslipRoute({
  params,
}: {
  params: Promise<{ id: string; payslipId: string }>;
}) {
  const { id, payslipId } = await params;
  return (
    <PayslipViewPage
      payslipId={decodeURIComponent(payslipId)}
      mode="hr"
      backHref={`/organization/employees/${id}`}
      backLabel="Back to employee"
    />
  );
}
