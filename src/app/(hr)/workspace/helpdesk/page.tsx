import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HR Help Desk",
};

const HelpdeskPage = dynamic(() =>
  import("@/src/components/hr/helpdesk").then((m) => ({
    default: m.HelpdeskPage,
  })),
);

export default function Page() {
  return <HelpdeskPage />;
}
