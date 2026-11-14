import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Annual tax certificate" };

const TaxCertificatePage = dynamic(() => import("@/src/components/shared/payslip/tax-certificate").then((m) => m.TaxCertificatePage));

export default async function EmployeeTaxCertificateRoute({ params }: { params: Promise<{ id: string; year: string }> }) {
  const { id, year } = await params;
  return <TaxCertificatePage employeeId={decodeURIComponent(id)} year={Number(year)} backHref={`/organization/employees/${id}`} backLabel="Back to employee" />;
}
