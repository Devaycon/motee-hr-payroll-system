import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify a payslip" };

const VerifyPayslipPage = dynamic(() =>
  import("@/src/components/shared/payslip/verify-page").then((m) => m.VerifyPayslipPage),
);

export default function VerifyRoute() {
  return <VerifyPayslipPage />;
}
