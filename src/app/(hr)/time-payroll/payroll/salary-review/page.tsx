import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bulk salary review" };

const SalaryReviewPage = dynamic(() => import("@/src/components/hr/payroll/salary-review").then((m) => m.SalaryReviewPage));

export default function SalaryReviewRoute() {
  return <SalaryReviewPage />;
}
