import dynamic from "next/dynamic";

const TicketsPage = dynamic(() =>
  import("@/src/components/motee/support/tickets").then((m) => m.TicketsPage)
);

export default function Page() {
  return <TicketsPage />;
}