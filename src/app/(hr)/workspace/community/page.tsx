import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Community" };

const CommunityPage = dynamic(() =>
  import("@/src/components/hr/community").then((m) => ({
    default: m.CommunityPage,
  })),
);

export default function Page() {
  return <CommunityPage />;
}
