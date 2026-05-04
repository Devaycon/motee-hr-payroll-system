import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kudos & Recognition" };

const KudosPage = dynamic(() =>
  import("@/src/components/hr/kudos").then((m) => m.KudosPage),
);

export default function KudosRoute() {
  return <KudosPage />;
}
