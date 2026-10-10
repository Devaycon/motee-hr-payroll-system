import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Platform — Motee Admin",
};

const PlatformPage = dynamic(() =>
  import("@/src/components/motee/platform-live").then((m) => m.PlatformPage),
);

export default function TenantsPage() {
  return <PlatformPage />;
}
