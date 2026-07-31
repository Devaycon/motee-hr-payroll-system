import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "People's Time Off" };

const LeaveTimelinePage = dynamic(() =>
  import("@/src/components/hr/leave/timeline-page").then(
    (m) => m.LeaveTimelinePage,
  ),
);

export default function LeaveTimelineRoute() {
  return <LeaveTimelinePage />;
}
