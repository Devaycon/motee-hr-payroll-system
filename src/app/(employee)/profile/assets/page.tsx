import dynamic from "next/dynamic";

const MyAssetsPage = dynamic(() =>
  import("@/src/components/employee/assets").then((m) => m.MyAssetsPage),
);

export default function Page() {
  return <MyAssetsPage />;
}
