import dynamic from "next/dynamic";

const MyTeam = dynamic(() =>
  import("@/src/components/employee/team").then((m) => m.MyTeam),
);

export default function MyTeamPage() {
  return <MyTeam />;
}
