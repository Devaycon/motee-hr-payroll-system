import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Profile",
};

const CompanyProfilePage = dynamic(() =>
  import("@/src/components/hr/company-profile").then(
    (m) => m.CompanyProfilePage,
  ),
);

export default function CompanyProfileRoute() {
  return <CompanyProfilePage />;
}
