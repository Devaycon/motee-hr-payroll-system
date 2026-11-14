import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Annual tax certificate" };

const MyTaxCertificatePage = dynamic(() => import("@/src/components/employee/payslips").then((m) => m.MyTaxCertificatePage));

export default async function MyTaxCertificateRoute({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  return <MyTaxCertificatePage year={Number(year)} />;
}
