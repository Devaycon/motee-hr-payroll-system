import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings & Configuration" };

const SettingsPage = dynamic(() =>
  import("@/src/components/hr/settings").then((m) => ({
    default: m.SettingsPage,
  })),
);

export default function Page() {
  return <SettingsPage />;
}
