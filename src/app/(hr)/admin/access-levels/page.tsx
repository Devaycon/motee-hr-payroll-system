import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Access Levels & Permissions" };

const AccessLevelsPage = dynamic(() =>
  import("@/src/components/hr/access-levels").then((m) => ({
    default: m.AccessLevelsPage,
  })),
);

export default function Page() {
  return <AccessLevelsPage />;
}
