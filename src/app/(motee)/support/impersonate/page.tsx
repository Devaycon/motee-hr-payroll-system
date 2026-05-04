import dynamic from "next/dynamic";

const ImpersonatePage = dynamic(() =>
  import("@/src/components/motee/support/impersonate").then((m) => m.ImpersonatePage)
);

export default function Page() {
  return <ImpersonatePage />;
}