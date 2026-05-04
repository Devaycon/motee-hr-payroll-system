import dynamic from "next/dynamic";

const FeatureFlagsPage = dynamic(() =>
  import("@/src/components/motee/platform/feature-flags").then(
    (m) => m.FeatureFlagsPage,
  ),
);

export default function Page() {
  return <FeatureFlagsPage />;
}
