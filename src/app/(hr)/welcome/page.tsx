import dynamic from "next/dynamic";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome — Motee HR",
  description: "",
};

const WelcomePage = dynamic(() =>
  import("@/src/components/hr/welcome").then((m) => m.WelcomePage),
);

export default function WelcomePageRoute() {
  return <WelcomePage />;
}
