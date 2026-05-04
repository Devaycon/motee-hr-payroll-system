import dynamic from "next/dynamic";

const NoticesPage = dynamic(() =>
  import("@/src/components/motee/platform/notices").then((m) => m.NoticesPage),
);

export default function Page() {
  return <NoticesPage />;
}
