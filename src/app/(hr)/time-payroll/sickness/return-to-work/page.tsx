import dynamic from "next/dynamic";

const ReturnToWorkPage = dynamic(() =>
  import("@/src/components/hr/sickness/return-to-work").then((m) => m.ReturnToWorkPage),
);

export default function ReturnToWorkRoute() {
  return <ReturnToWorkPage />;
}
