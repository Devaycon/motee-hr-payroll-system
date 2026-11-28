import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Change Requests",
};

const ChangeRequestsPage = dynamic(() =>
  import("@/src/components/hr/change-requests").then(
    (m) => m.ChangeRequestsPage,
  ),
);

export default function ChangeRequestsRoute() {
  return <ChangeRequestsPage />;
}
