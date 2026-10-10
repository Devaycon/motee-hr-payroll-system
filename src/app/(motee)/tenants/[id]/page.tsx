import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Tenant — Motee Admin",
};

const PlatformTenantPage = dynamic(() =>
  import("@/src/components/motee/platform-live").then(
    (m) => m.PlatformTenantPage,
  ),
);

export default async function TenantDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlatformTenantPage id={id} />;
}
