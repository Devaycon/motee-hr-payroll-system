import dynamic from "next/dynamic";

const MySicknessPage = dynamic(() =>
  import("@/src/components/employee/sickness").then((m) => m.MySicknessPage),
);

export default function Page() {
  return <MySicknessPage />;
}
