import dynamic from "next/dynamic";

const ActivityLogsPage = dynamic(() =>
  import("@/src/components/motee/support/activity-logs").then((m) => m.ActivityLogsPage)
);

export default function Page() {
  return <ActivityLogsPage />;
}