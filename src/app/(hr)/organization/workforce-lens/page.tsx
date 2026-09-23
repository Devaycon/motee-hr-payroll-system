import dynamic from "next/dynamic";

export const metadata = { title: "Workforce Lens" };

const WorkforceLensPage = dynamic(() =>
  import("@/src/components/hr/workforce-lens").then((m) => m.WorkforceLensPage),
);

export default function WorkforceLensRoute() {
  return <WorkforceLensPage />;
}
