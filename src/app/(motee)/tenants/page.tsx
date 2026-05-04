import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "All Tenants — Motee Admin",
};

const AllTenantsPage = dynamic(() =>
  import("@/src/components/motee/tenants/all-tenants").then(
    (m) => m.AllTenantsPage,
  ),
);

export default function TenantsPage() {
  return <AllTenantsPage />;
}
