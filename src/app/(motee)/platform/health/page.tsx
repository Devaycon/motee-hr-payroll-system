import dynamic from "next/dynamic";

const PlatformHealthPage = dynamic(() =>
  import("@/src/components/motee/platform/health").then(
    (m) => m.PlatformHealthPage,
  ),
);

export default function Page() {
  return <PlatformHealthPage />;
}
