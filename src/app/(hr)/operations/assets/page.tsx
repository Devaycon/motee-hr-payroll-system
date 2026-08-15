import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Asset Management" };

const AssetsPage = dynamic(() =>
  import("@/src/components/hr/assets").then((m) => m.AssetsPage),
);

export default function AssetsRoute() {
  return <AssetsPage />;
}
