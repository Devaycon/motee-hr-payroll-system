import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Announcements" };

const AnnouncementsPage = dynamic(() =>
  import("@/src/components/hr/announcements").then((m) => m.AnnouncementsPage),
);

export default function AnnouncementsRoute() {
  return <AnnouncementsPage />;
}
