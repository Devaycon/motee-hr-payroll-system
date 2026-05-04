import dynamic from "next/dynamic";

const MyPerformancePage = dynamic(() =>
  import("@/src/components/employee/performance").then(
    (m) => m.MyPerformancePage,
  ),
);

export default function Page() {
  return <MyPerformancePage />;
}
