import dynamic from "next/dynamic";

const EventsPage = dynamic(() =>
  import("@/src/components/hr/calendar").then((m) => m.EventsPage),
);

export default function EventsRoute() {
  return <EventsPage />;
}
