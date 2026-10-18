import dynamic from "next/dynamic";

const BradfordDashboard = dynamic(() =>
  import("@/src/components/hr/sickness/bradford-dashboard").then((m) => m.BradfordDashboard),
);

export default function BradfordRoute() {
  return <BradfordDashboard />;
}
