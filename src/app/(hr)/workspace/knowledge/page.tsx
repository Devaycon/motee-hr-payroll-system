import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Knowledge Base" };

const KnowledgePage = dynamic(() =>
  import("@/src/components/hr/knowledge").then((m) => ({
    default: m.KnowledgePage,
  })),
);

export default function Page() {
  return <KnowledgePage />;
}
