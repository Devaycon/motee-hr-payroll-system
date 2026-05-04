import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_TENANTS } from "@/src/data/motee-demo";
import { TenantDetailPage } from "@/src/components/motee/tenants/tenant-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tenant = DEMO_TENANTS.find((t) => t.id === id);
  return {
    title: tenant ? `${tenant.name} — Motee Admin` : "Tenant Not Found",
  };
}

export default async function TenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = DEMO_TENANTS.find((t) => t.id === id);

  if (!tenant) {
    notFound();
  }

  return <TenantDetailPage id={id} />;
}
